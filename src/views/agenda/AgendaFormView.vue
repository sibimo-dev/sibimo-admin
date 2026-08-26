<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'

import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import RadioButton from 'primevue/radiobutton'
import Card from 'primevue/card'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()

const agendaId = computed(() => route.params.id ?? null)
const isEditMode = computed(() => agendaId.value !== null)

const pageTitle = computed(() => (
  isEditMode.value ? 'Edit Agenda' : 'Tambah Agenda'
))

const mainButtonLabel = computed(() => (
  isEditMode.value ? 'Perbarui' : 'Terbitkan'
))

const monthOptions = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const selectedMonth = ref('Agustus')

const eventName = ref('')
const letterOrigin = ref('')
const place = ref('')
const attendees = ref('')
const eventDate = ref(new Date())
const startTime = ref(new Date())
const endTime = ref(new Date())

const attachmentPreview = ref(null)
const attachmentName = ref(null)
const attachmentFile = ref(null)

const status = ref('Draft')
const statusOpen = ref(true)
const visibility = ref('publik')

const statusOptions = [
  { label: 'Draft', value: 'Draft' },
  { label: 'Terbit', value: 'Published' },
]

const visibilityOptions = [
  { label: 'Publik', value: 'publik' },
  { label: 'Dilindungi kata sandi', value: 'password' },
  { label: 'Privat', value: 'privat' },
]

const statusDisplay = computed(() => (
  statusOptions.find(item => item.value === status.value)?.label ?? status.value
))

onMounted(() => {
  if (!isEditMode.value) return

  eventName.value = 'Pelatihan UMKM Kerajinan'
  letterOrigin.value = 'Dinas UMKM'
  place.value = 'Aula Balai Desa Bimomartani'
  attendees.value = 'Pelaku Usaha Lokal'
  eventDate.value = new Date('2026-08-04')
  startTime.value = createTime('09:00')
  endTime.value = createTime('09:00')
  status.value = 'Published'
})

function createTime(value) {
  const [hours, minutes] = value.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date
}

function goBack() {
  router.push({ name: 'agenda-list' })
}

function handleAttachmentSelect(event) {
  const file = event.files?.[0]
  if (!file) return

  attachmentFile.value = file
  attachmentName.value = file.name

  if (file.type.startsWith('image/')) {
    attachmentPreview.value = URL.createObjectURL(file)
  } else {
    attachmentPreview.value = null
  }
}

function removeAttachment() {
  if (attachmentPreview.value) {
    URL.revokeObjectURL(attachmentPreview.value)
  }

  attachmentPreview.value = null
  attachmentName.value = null
  attachmentFile.value = null
}

function previewAgenda() {
  window.open(`/agenda/preview/${agendaId.value ?? ''}`, '_blank')
}

function saveDraft() {
  status.value = 'Draft'
  router.push({ name: 'agenda-list' })
}

function saveMain() {
  status.value = 'Published'
  router.push({ name: 'agenda-list' })
}

function moveToTrash() {
  confirm.require({
    message: `Pindahkan agenda "${eventName.value || 'ini'}" ke sampah?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: () => {
      router.push({ name: 'agenda-list' })
    },
  })
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="m-0 text-2xl font-bold text-gray-800">
          {{ pageTitle }}
        </h1>
        <p class="m-0 mt-1 text-sm text-gray-500">
          Lengkapi detail agenda kegiatan desa.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <label for="month" class="text-[13px] font-medium text-gray-600">
          Bulan
        </label>

        <Select
          id="month"
          v-model="selectedMonth"
          :options="monthOptions"
          class="w-36"
        />

        <FileUpload
          mode="basic"
          name="agenda"
          accept=".csv,.xlsx,.xls"
          chooseLabel="Import Agenda dari File"
          chooseIcon="pi pi-upload"
          :auto="false"
          :customUpload="true"
          class="[&_input[type='file']]:hidden"
          @select="handleAttachmentSelect"
        />
      </div>
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

              <div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                <div
                  v-if="attachmentPreview"
                  class="relative overflow-hidden rounded-lg"
                >
                  <img
                    :src="attachmentPreview"
                    alt="Preview lampiran"
                    class="h-48 w-full object-cover"
                  />

                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    class="absolute right-2 top-2 bg-white/90"
                    aria-label="Hapus lampiran"
                    @click="removeAttachment"
                  />
                </div>

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

                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    aria-label="Hapus lampiran"
                    @click="removeAttachment"
                  />
                </div>

                <div v-else class="flex flex-col items-center gap-3 py-5 text-center">
                  <i class="pi pi-cloud-upload text-3xl text-gray-400" />
                  <span class="text-[13px] text-gray-400">
                    Pilih gambar atau lampiran untuk agenda
                  </span>

                  <FileUpload
                    mode="basic"
                    name="attachment"
                    accept="image/*,.pdf,.doc,.docx"
                    chooseLabel="Pilih Lampiran"
                    chooseIcon="pi pi-upload"
                    :auto="false"
                    :customUpload="true"
                    class="[&_input[type='file']]:hidden"
                    @select="handleAttachmentSelect"
                  />
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
                class="flex-1"
                @click="saveDraft"
              />

              <Button
                :label="mainButtonLabel"
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
              <button
                type="button"
                class="flex items-center justify-between text-left text-[13px] text-gray-700"
                @click="statusOpen = !statusOpen"
              >
                <span>
                  Status:
                  <strong>{{ statusDisplay }}</strong>
                </span>

                <i
                  class="pi pi-chevron-down text-xs text-gray-400 transition-transform"
                  :class="{ 'rotate-180': statusOpen }"
                />
              </button>

              <Select
                v-show="statusOpen"
                v-model="status"
                :options="statusOptions"
                optionLabel="label"
                optionValue="value"
                fluid
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