<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

import InputText from 'primevue/inputtext'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'
import RadioButton from 'primevue/radiobutton'
import Card from 'primevue/card'
import api from '@/services/api'
import { agendaService } from '@/services/content.service'
import { updateListCache } from '@/services/list-cache'
import { agendaPeriod, setAgendaPeriod } from '@/services/agenda.period'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

const agendaId = computed(() => route.params.id ?? null)
const isEditMode = computed(() => agendaId.value !== null)

const pageTitle = computed(() => (
  isEditMode.value ? 'Edit Agenda' : 'Tambah Agenda'
))

const mainButtonLabel = computed(() => (
  isEditMode.value ? 'Perbarui' : 'Terbitkan'
))

// Tanggal awal untuk agenda baru: hari ini jika masih di bulan yang sedang
// dilihat di list, kalau tidak tanggal 1 bulan tersebut.
function defaultEventDate() {
  const today = new Date()
  if (today.getMonth() === agendaPeriod.month && today.getFullYear() === agendaPeriod.year) {
    return today
  }
  return new Date(agendaPeriod.year, agendaPeriod.month, 1)
}

// Format YYYY-MM-DD memakai waktu lokal (toISOString bisa mundur 1 hari di WIB)
function toLocalIso(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mm}-${dd}`
}

const eventName = ref('')
const letterOrigin = ref('')
const place = ref('')
const attendees = ref('')
const eventDate = ref(defaultEventDate())
const startTime = ref(new Date())
const endTime = ref(new Date())

/* ---------- Lampiran ---------- */
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024 // 5 MB

const attachmentInput = ref(null)
const attachmentPreview = ref(null) // blob: (file baru) atau URL (lampiran lama)
const attachmentName = ref(null)
const attachmentFile = ref(null)
const removeExisting = ref(false) // lampiran lama dihapus saat edit
const saving = ref(false)

const isImageName = name => /\.(png|jpe?g|gif|webp|avif)(\?.*)?$/i.test(name ?? '')

// Jika backend mengembalikan path relatif (/storage/...), tambahkan origin API
function resolveFileUrl(url) {
  if (!url) return null
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url
  try {
    const origin = new URL(api.defaults.baseURL, window.location.origin).origin
    return origin + (url.startsWith('/') ? url : `/${url}`)
  } catch {
    return url
  }
}

function revokePreview() {
  if (attachmentPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(attachmentPreview.value)
  }
}

function pickAttachment() {
  attachmentInput.value?.click()
}

function handleAttachmentSelect(event) {
  const file = event.target.files?.[0]
  event.target.value = '' // supaya file yang sama bisa dipilih ulang
  if (!file) return

  if (file.size > MAX_ATTACHMENT_SIZE) {
    toast.add({
      severity: 'warn',
      summary: 'File terlalu besar',
      detail: 'Ukuran lampiran maksimal 5 MB.',
      life: 3500,
    })
    return
  }

  revokePreview()

  attachmentFile.value = file
  attachmentName.value = file.name
  removeExisting.value = false
  attachmentPreview.value = file.type.startsWith('image/')
    ? URL.createObjectURL(file)
    : null
}

function removeAttachment() {
  revokePreview()

  attachmentPreview.value = null
  attachmentName.value = null
  attachmentFile.value = null
  removeExisting.value = true
}

onBeforeUnmount(revokePreview)

const visibility = ref('publik')

const visibilityOptions = [
  { label: 'Publik', value: 'publik' },
  { label: 'Dilindungi kata sandi', value: 'password' },
  { label: 'Privat', value: 'privat' },
]

onMounted(async () => {
  if (!isEditMode.value) return

  try {
    const existing = await agendaService.get(agendaId.value)
    eventName.value = existing.title ?? ''
    attendees.value = existing.attendee ?? ''
    place.value = existing.location ?? ''
    eventDate.value = parseDateValue(existing.event_date)
    startTime.value = createTime(existing.start_time)
    endTime.value = createTime(existing.end_time)

    if (existing.attachment_url) {
      const url = resolveFileUrl(existing.attachment_url)
      attachmentName.value = existing.attachment_name ?? existing.attachment_url.split('/').pop()
      attachmentPreview.value = isImageName(existing.attachment_url) ? url : null
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal memuat agenda',
      detail: error.response?.data?.message ?? 'Periksa koneksi backend.',
      life: 4000,
    })
  }
})

function parseDateValue(value) {
  if (!value) return new Date()
  const rawDate = String(value).slice(0, 10)
  const date = new Date(`${rawDate}T00:00:00`)
  return Number.isNaN(date.getTime()) ? new Date() : date
}

function createTime(value) {
  const [hours, minutes] = String(value ?? '00:00').split(':').map(Number)
  const date = new Date()
  date.setHours(Number.isNaN(hours) ? 0 : hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0)
  return date
}

// Kembali ke list pada bulan & tahun yang tadi sedang dilihat
// (state bulan/tahun disimpan di agenda-period, jadi tidak reset ke bulan ini)
function goBack() {
  router.push({ name: 'agenda-list' })
}

function previewAgenda() {
  window.open(`/agenda/preview/${agendaId.value ?? ''}`, '_blank')
}

async function persistAgenda(targetStatus) {
  if (saving.value) return

  const payload = {
    title: eventName.value,
    attendee: attendees.value,
    event_date: toLocalIso(eventDate.value),
    start_time: startTime.value.toTimeString().slice(0, 5),
    end_time: endTime.value.toTimeString().slice(0, 5),
    location: place.value,
    status: targetStatus,
  }

  // Tambahkan letter_origin hanya jika tabel backend punya kolomnya:
  // payload.letter_origin = letterOrigin.value

  if (attachmentFile.value) payload.attachment = attachmentFile.value
  else if (removeExisting.value) payload.remove_attachment = true

  saving.value = true
  try {
    const saved = agendaId.value
      ? await agendaService.update(agendaId.value, payload)
      : await agendaService.create(payload)

    updateListCache('agendas', items => {
      const cachedItem = { ...saved, status: saved?.status ?? targetStatus }

      if (agendaId.value) {
        return items.map(item => item.agenda_id === Number(agendaId.value)
          ? { ...item, ...cachedItem }
          : item)
      }

      return [cachedItem, ...items]
    })

    // Buka list pada bulan dari agenda yang baru disimpan
    setAgendaPeriod(eventDate.value)
    router.push({ name: 'agenda-list' })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: targetStatus === 'Draft'
        ? 'Gagal menyimpan draft agenda'
        : agendaId.value ? 'Gagal memperbarui agenda' : 'Gagal menerbitkan agenda',
      detail: error.response?.data?.message ?? 'Periksa data dan koneksi backend.',
      life: 4000,
    })
  } finally {
    saving.value = false
  }
}

function saveDraft() {
  persistAgenda('Draft')
}

function saveMain() {
  persistAgenda('Published')
}

function moveToTrash() {
  if (!agendaId.value) {
    router.push({ name: 'agenda-list' })
    return
  }

  confirm.require({
    message: `Pindahkan agenda "${eventName.value || 'ini'}" ke sampah?`,
    header: 'Pindahkan ke Sampah',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Pindahkan',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      saving.value = true
      try {
        const archived = await agendaService.update(agendaId.value, { status: 'Archived' })
        updateListCache('agendas', items => items.map(item => (
          item.agenda_id === Number(agendaId.value)
            ? { ...item, ...archived, status: 'Archived' }
            : item
        )))
        toast.add({
          severity: 'success',
          summary: 'Agenda dipindahkan ke sampah',
          detail: 'Agenda tidak akan tampil di halaman publik.',
          life: 3500,
        })
        router.push({ name: 'agenda-list' })
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Gagal memindahkan agenda',
          detail: error.response?.data?.message ?? 'Periksa koneksi backend.',
          life: 4000,
        })
      } finally {
        saving.value = false
      }
    },
  })
}
</script>

<template>
  <div>
    <!-- Header: judul + tombol Kembali -->
    <div class="mb-6 flex items-center justify-between gap-3">
      <div class="min-w-0">
        <h1 class="m-0 text-2xl font-bold text-gray-800">
          {{ pageTitle }}
        </h1>
        <p class="m-0 mt-1 text-sm text-gray-500">
          Lengkapi detail agenda kegiatan desa.
        </p>
      </div>

      <Button
        label="Kembali"
        outlined
        type="button"
        class="shrink-0"
        @click="goBack"
      />
    </div>

    <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Card>
        <template #content>
          <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-2">
              <label for="eventName" class="text-[13px] font-semibold text-gray-700">
                Nama Acara
              </label>
              <InputText
                id="eventName"
                v-model="eventName"
                placeholder="Nama acara"
                fluid
              />
            </div>

            <div class="flex flex-col gap-2">
              <label for="letterOrigin" class="text-[13px] font-semibold text-gray-700">
                Asal Surat
              </label>
              <InputText
                id="letterOrigin"
                v-model="letterOrigin"
                placeholder="Asal surat"
                fluid
              />
            </div>

            <div class="flex flex-col gap-2">
              <label for="place" class="text-[13px] font-semibold text-gray-700">
                Tempat
              </label>
              <InputText
                id="place"
                v-model="place"
                placeholder="Tempat kegiatan"
                fluid
              />
            </div>

            <div class="flex flex-col gap-2">
              <label for="attendees" class="text-[13px] font-semibold text-gray-700">
                Yang Menghadiri/Keterangan
              </label>
              <InputText
                id="attendees"
                v-model="attendees"
                placeholder="Pihak yang menghadiri"
                fluid
              />
            </div>

            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label for="eventDate" class="text-[13px] font-semibold text-gray-700">
                  Tanggal
                </label>
                <DatePicker
                  id="eventDate"
                  v-model="eventDate"
                  dateFormat="dd/mm/yy"
                  showIcon
                  iconDisplay="input"
                  fluid
                />
              </div>

              <div class="flex flex-col gap-2">
                <span class="text-[13px] font-semibold text-gray-700">
                  Waktu
                </span>

                <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <DatePicker
                    v-model="startTime"
                    timeOnly
                    hourFormat="24"
                    fluid
                  />
                  <span class="text-[13px] text-gray-500">s/d</span>
                  <DatePicker
                    v-model="endTime"
                    timeOnly
                    hourFormat="24"
                    fluid
                  />
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <span class="text-[13px] font-semibold text-gray-700">
                Gambar/Lampiran
              </span>

              <!-- Input file asli disembunyikan; dibuka lewat tombol -->
              <input
                ref="attachmentInput"
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                class="hidden"
                @change="handleAttachmentSelect"
              />

              <div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                <!-- Preview gambar -->
                <div
                  v-if="attachmentPreview"
                  class="relative overflow-hidden rounded-lg"
                >
                  <img
                    :src="attachmentPreview"
                    alt="Preview lampiran"
                    class="h-48 w-full object-cover"
                  />

                  <div class="absolute right-2 top-2 flex gap-1">
                    <Button
                      icon="pi pi-refresh"
                      severity="secondary"
                      text
                      rounded
                      class="bg-white/90"
                      aria-label="Ganti lampiran"
                      @click="pickAttachment"
                    />
                    <Button
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      rounded
                      class="bg-white/90"
                      aria-label="Hapus lampiran"
                      @click="removeAttachment"
                    />
                  </div>
                </div>

                <!-- File non-gambar (PDF / Word) -->
                <div
                  v-else-if="attachmentName"
                  class="flex items-center justify-between gap-3 rounded-lg bg-white p-4"
                >
                  <div class="flex min-w-0 items-center gap-3">
                    <i class="pi pi-file text-xl text-gray-500" />
                    <span class="truncate text-[13px] text-gray-700">
                      {{ attachmentName }}
                    </span>
                  </div>

                  <div class="flex shrink-0 gap-1">
                    <Button
                      icon="pi pi-refresh"
                      severity="secondary"
                      text
                      rounded
                      aria-label="Ganti lampiran"
                      @click="pickAttachment"
                    />
                    <Button
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      rounded
                      aria-label="Hapus lampiran"
                      @click="removeAttachment"
                    />
                  </div>
                </div>

                <!-- Belum ada lampiran -->
                <div v-else class="flex flex-col items-center gap-3 py-5 text-center">
                  <i class="pi pi-cloud-upload text-3xl text-gray-400" />
                  <span class="text-[13px] text-gray-400">
                    Pilih gambar atau lampiran untuk agenda
                  </span>

                  <Button
                    type="button"
                    label="Pilih Lampiran"
                    icon="pi pi-upload"
                    @click="pickAttachment"
                  />

                  <span class="text-xs text-gray-400">
                    Gambar, PDF, atau Word. Maksimal 5 MB.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <aside class="flex flex-col gap-5">
        <Card>
          <template #content>
            <div class="flex gap-2.5">
              <Button
                label="Simpan Draft"
                severity="secondary"
                outlined
                :disabled="saving"
                class="flex-1"
                @click="saveDraft"
              />

              <Button
                :label="mainButtonLabel"
                :loading="saving"
                :disabled="saving"
                class="flex-1"
                @click="saveMain"
              />
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex items-center justify-between text-[13px] text-gray-700">
              <span>Terbit</span>

              <Button
                label="Pratinjau"
                text
                size="small"
                @click="previewAgenda"
              />
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-2.5">
              <span class="text-[13px] text-gray-700">
                Keterlihatan:
                <strong>
                  {{ visibilityOptions.find(item => item.value === visibility)?.label }}
                </strong>
              </span>

              <div class="flex flex-col gap-2">
                <div
                  v-for="option in visibilityOptions"
                  :key="option.value"
                  class="flex items-center gap-2"
                >
                  <RadioButton
                    v-model="visibility"
                    :inputId="`visibility-${option.value}`"
                    name="visibility"
                    :value="option.value"
                  />
                  <label
                    :for="`visibility-${option.value}`"
                    class="cursor-pointer text-[13px] text-gray-700"
                  >
                    {{ option.label }}
                  </label>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <Button
          v-if="isEditMode"
          label="Pindahkan ke sampah"
          icon="pi pi-trash"
          severity="secondary"
          outlined
          class="w-full"
          @click="moveToTrash"
        />
      </aside>
    </div>
  </div>
</template>