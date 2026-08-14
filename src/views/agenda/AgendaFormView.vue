<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'
import RadioButton from 'primevue/radiobutton'
import FileUpload from 'primevue/fileupload'
import Image from 'primevue/image'

const route = useRoute()
const router = useRouter()

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
const startTime = ref(new Date(new Date().setHours(9, 0, 0, 0)))
const endTime = ref(new Date(new Date().setHours(9, 0, 0, 0)))

const attachmentPreview = ref(null)
const attachmentName = ref(null)
const importFileInput = ref(null)

const status = ref('Draft')
const visibility = ref('publik')

const statusOptions = [
  { label: 'Draft', value: 'Draft' },
  { label: 'Terbit', value: 'Published' },
]

onMounted(() => {
  if (!isEditMode.value) return

  eventName.value = 'Pelatihan UMKM Kerajinan'
  letterOrigin.value = 'Dinas UMKM'
  place.value = 'Aula Balai Desa Bimomartani'
  attendees.value = 'Pelaku Usaha Lokal'
  eventDate.value = new Date('2026-08-04')
  startTime.value = new Date(new Date().setHours(9, 0, 0, 0))
  endTime.value = new Date(new Date().setHours(9, 0, 0, 0))
  status.value = 'Published'
})

function selectAttachment(event) {
  const file = event.files?.[0]

  if (!file) return

  attachmentName.value = file.name

  if (file.type.startsWith('image/')) {
    attachmentPreview.value = URL.createObjectURL(file)
  } else {
    attachmentPreview.value = null
  }
}

function removeAttachment() {
  attachmentPreview.value = null
  attachmentName.value = null
}

function triggerImportFile() {
  importFileInput.value?.click()
}

function handleImportFile(event) {
  const file = event.target.files?.[0]

  if (!file) return

  attachmentName.value = file.name
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
  router.push({ name: 'agenda-list' })
}
</script>

<template>
  <div class="min-h-full px-6 py-6 text-neutral-800 lg:px-8">

    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 class="m-0 text-[22px] font-bold text-primary-900">
        {{ pageTitle }}
      </h1>

      <div class="flex items-center gap-2">
        <label class="text-[13px] font-medium text-neutral-600">
          Bulan
        </label>

        <Select
          v-model="selectedMonth"
          :options="monthOptions"
          class="w-40 text-[13px]"
        />

        <Button
          label="Import Agenda dari File"
          icon="pi pi-upload"
          severity="primary"
          size="small"
          @click="triggerImportFile"
        />

        <input
          ref="importFileInput"
          type="file"
          accept=".csv,.xlsx,.xls"
          class="hidden"
          @change="handleImportFile"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">

      <div class="flex flex-col gap-5 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">

        <div class="flex flex-col gap-2">
          <label class="text-[13px] font-semibold text-neutral-700" for="eventName">
            Nama Acara
          </label>

          <InputText
            id="eventName"
            v-model="eventName"
            class="w-full text-[13px]"
            placeholder="Nama acara"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-[13px] font-semibold text-neutral-700" for="letterOrigin">
            Asal Surat
          </label>

          <InputText
            id="letterOrigin"
            v-model="letterOrigin"
            class="w-full text-[13px]"
            placeholder="Asal surat"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-[13px] font-semibold text-neutral-700" for="place">
            Tempat
          </label>

          <InputText
            id="place"
            v-model="place"
            class="w-full text-[13px]"
            placeholder="Tempat kegiatan"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-[13px] font-semibold text-neutral-700" for="attendees">
            Yang Menghadiri/Keterangan
          </label>

          <InputText
            id="attendees"
            v-model="attendees"
            class="w-full text-[13px]"
            placeholder="Pihak yang menghadiri"
          />
        </div>

        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">

          <div class="flex flex-col gap-2">
            <label class="text-[13px] font-semibold text-neutral-700" for="eventDate">
              Tanggal
            </label>

            <DatePicker
              id="eventDate"
              v-model="eventDate"
              dateFormat="dd/mm/yy"
              showIcon
              class="w-full text-[13px]"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-[13px] font-semibold text-neutral-700">
              Waktu
            </label>

            <div class="flex items-center gap-2">
              <DatePicker
                v-model="startTime"
                timeOnly
                hourFormat="24"
                class="w-full text-[13px]"
              />

              <span class="text-[13px] text-neutral-500">s/d</span>

              <DatePicker
                v-model="endTime"
                timeOnly
                hourFormat="24"
                class="w-full text-[13px]"
              />
            </div>
          </div>

        </div>

        <div class="flex flex-col gap-2">
          <label class="text-[13px] font-semibold text-neutral-700">
            Gambar/Lampiran
          </label>

          <div
            v-if="!attachmentPreview && !attachmentName"
            class="rounded-[10px] border-[1.5px] border-dashed border-neutral-300 bg-neutral-100 p-4"
          >
            <FileUpload
              mode="basic"
              accept="image/*,.pdf,.doc,.docx"
              :auto="false"
              chooseLabel="Klik atau seret gambar/lampiran ke sini"
              class="w-full [&_.p-button]:w-full [&_.p-button]:justify-center"
              @select="selectAttachment"
            />
          </div>

          <div
            v-else
            class="relative flex h-[180px] items-center justify-center overflow-hidden rounded-[10px] border border-solid border-neutral-300 bg-neutral-100"
          >
            <Image
              v-if="attachmentPreview"
              :src="attachmentPreview"
              alt="Preview lampiran"
              imageClass="h-full w-full object-cover"
              class="h-full w-full"
            />

            <span v-else class="px-4 text-center text-[13px] text-neutral-600">
              {{ attachmentName }}
            </span>

            <Button
              icon="pi pi-times"
              severity="danger"
              text
              rounded
              size="small"
              class="absolute right-2.5 top-2.5 bg-white shadow"
              @click="removeAttachment"
            />
          </div>
        </div>

      </div>

      <aside class="flex flex-col gap-3.5">

        <div class="flex gap-2.5 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
          <Button
            label="Simpan Draft"
            severity="secondary"
            outlined
            class="flex-1 text-[13px]"
            @click="saveDraft"
          />

          <Button
            :label="mainButtonLabel"
            severity="primary"
            class="flex-1 text-[13px]"
            @click="saveMain"
          />
        </div>

        <div class="flex flex-col gap-2.5 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
          <div class="flex items-center justify-between text-[13px] text-neutral-700">
            <span>Terbit</span>

            <Button
              label="Pratinjau"
              link
              size="small"
              class="p-0 text-[13px] font-medium"
              @click="previewAgenda"
            />
          </div>
        </div>

        <div class="flex flex-col gap-2.5 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
          <label class="text-xs text-neutral-500">
            Status
          </label>

          <Select
            v-model="status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full text-[13px]"
          />
        </div>

        <div class="flex flex-col gap-2.5 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">

          <div class="text-[13px] text-neutral-700">
            Keterlihatan:
            <strong>
              {{
                visibility === 'publik'
                  ? 'Publik'
                  : visibility === 'password'
                    ? 'Dilindungi kata sandi'
                    : 'Privat'
              }}
            </strong>
          </div>

          <div class="flex flex-col gap-2">
            <label class="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-700">
              <RadioButton v-model="visibility" value="publik" name="visibility" />
              Publik
            </label>

            <label class="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-700">
              <RadioButton v-model="visibility" value="password" name="visibility" />
              Dilindungi kata sandi
            </label>

            <label class="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-700">
              <RadioButton v-model="visibility" value="privat" name="visibility" />
              Privat
            </label>
          </div>
        </div>

        <Button
          label="Pindahkan ke sampah"
          icon="pi pi-trash"
          severity="secondary"
          outlined
          class="w-full text-[13px]"
          @click="moveToTrash"
        />

      </aside>
    </div>
  </div>
</template>