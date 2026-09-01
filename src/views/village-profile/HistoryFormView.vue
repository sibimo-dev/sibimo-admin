<script setup>
import { ref, reactive, computed } from 'vue'
import { useToast } from 'primevue/usetoast'

import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Editor from 'primevue/editor'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Card from 'primevue/card'
import FileUpload from 'primevue/fileupload'

import { historyContent } from './villageProfileData'

const toast = useToast()
const saving = ref(false)

const isEdit = computed(() => historyContent.value !== null)

const pageTitle = computed(() => (isEdit.value ? 'Edit Sejarah' : 'Tambah Sejarah'))
const mainButtonLabel = computed(() => (isEdit.value ? 'Perbarui' : 'Terbitkan'))

const statusOptions = [
  { label: 'Draft', value: 'Draft' },
  { label: 'Terbit', value: 'Published' },
]

// Ambil 3 poin dari data lama (jika ada), fallback string kosong
const existingPoints = historyContent.value?.points ?? ['', '', '']

const form = reactive({
  profile_content_id: historyContent.value?.profile_content_id ?? null,
  year_founded: historyContent.value?.year_founded ?? null,
  title: historyContent.value?.title ?? '',
  point_1: existingPoints[0] ?? '',
  point_2: existingPoints[1] ?? '',
  point_3: existingPoints[2] ?? '',
  status: historyContent.value?.status ?? 'Draft',
  published_at: historyContent.value?.published_at ?? null,
})

const statusOpen = ref(true)
const statusDisplay = computed(() => (
  statusOptions.find((item) => item.value === form.status)?.label ?? form.status
))

// Galeri foto: dukung banyak file. Setiap item = { id, file, preview }
// Kalau data lama sudah ada foto (array url), tampilkan dulu sebagai preview tanpa file asli.
const photos = ref(
  (historyContent.value?.photos ?? []).map((url, index) => ({
    id: `existing-${index}`,
    file: null,
    preview: url,
  }))
)
const fileUploadRef = ref(null)

function handleFilesSelect(event) {
  const files = event.files ?? []
  files.forEach((file) => {
    const reader = new FileReader()
    reader.onload = () => {
      photos.value.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        preview: reader.result,
      })
    }
    reader.readAsDataURL(file)
  })
  fileUploadRef.value?.clear()
}

function handleValidationError(event) {
  const message = event.files?.[0]?.name
    ? `File "${event.files[0].name}" tidak valid (format/ukuran tidak sesuai)`
    : 'File tidak valid'
  toast.add({ severity: 'error', summary: message, life: 3000 })
}

function removePhoto(photoId) {
  photos.value = photos.value.filter((photo) => photo.id !== photoId)
}

async function persist(nextStatus) {
  if (!form.year_founded) {
    toast.add({ severity: 'error', summary: 'Tahun berdiri wajib diisi', life: 2500 })
    return
  }

  if (!form.title.trim()) {
    toast.add({ severity: 'error', summary: 'Judul wajib diisi', life: 2500 })
    return
  }

  if (!form.point_1.trim() && !form.point_2.trim() && !form.point_3.trim()) {
    toast.add({ severity: 'error', summary: 'Minimal isi salah satu poin sejarah', life: 2500 })
    return
  }

  form.status = nextStatus
  saving.value = true
  try {
    if (form.status === 'Published' && !form.published_at) {
      form.published_at = new Date().toISOString().slice(0, 10)
    }

    historyContent.value = {
      profile_content_id: form.profile_content_id ?? Date.now(),
      year_founded: form.year_founded,
      title: form.title,
      points: [form.point_1, form.point_2, form.point_3],
      photos: photos.value.map((photo) => photo.preview),
      status: form.status,
      published_at: form.published_at,
    }
    form.profile_content_id = historyContent.value.profile_content_id

    toast.add({ severity: 'success', summary: 'Berhasil disimpan', life: 2000 })
  } finally {
    saving.value = false
  }
}

function saveDraft() {
  persist('Draft')
}

function saveMain() {
  persist(isEdit.value ? form.status : 'Published')
}
</script>

<template>
  <div class="min-h-full text-slate-800">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 class="m-0 text-[22px] font-bold text-slate-900">
        {{ pageTitle }}
      </h1>
    </div>

    <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Card>
        <template #content>
          <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-2">
              <label for="year_founded" class="text-[13px] font-semibold text-slate-700">
                Tahun Berdiri
              </label>
              <InputNumber
                id="year_founded"
                v-model="form.year_founded"
                placeholder="Contoh: 1946"
                :useGrouping="false"
                :min="1000"
                :max="9999"
                class="max-w-[160px]"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label for="title" class="text-[13px] font-semibold text-slate-700">
                Judul
              </label>
              <InputText
                id="title"
                v-model="form.title"
                placeholder="Judul"
                fluid
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-[13px] font-semibold text-slate-700">
                Poin Sejarah 1
              </label>
              <Editor
                v-model="form.point_1"
                editorStyle="height: 140px"
                placeholder="Tulis poin pertama sejarah desa di sini"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-[13px] font-semibold text-slate-700">
                Poin Sejarah 2
              </label>
              <Editor
                v-model="form.point_2"
                editorStyle="height: 140px"
                placeholder="Tulis poin kedua sejarah desa di sini"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-[13px] font-semibold text-slate-700">
                Poin Sejarah 3
              </label>
              <Editor
                v-model="form.point_3"
                editorStyle="height: 140px"
                placeholder="Tulis poin ketiga sejarah desa di sini"
              />
            </div>

            <div class="flex flex-col gap-2">
              <span class="text-[13px] font-semibold text-slate-700">
                Foto (opsional, bisa lebih dari satu)
              </span>

              <FileUpload
                ref="fileUploadRef"
                mode="advanced"
                accept="image/*"
                :maxFileSize="5000000"
                multiple
                :auto="false"
                :showUploadButton="false"
                :showCancelButton="false"
                customUpload
                :pt="{
                  root: { class: 'border-none bg-transparent p-0' },
                  header: { class: 'hidden' },
                  content: { class: 'border-none bg-transparent p-0' },
                }"
                @select="handleFilesSelect"
                @file-validation-failed="handleValidationError"
              >
                <template #empty>
                  <div
                    class="rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/40 flex flex-col items-center justify-center py-10 cursor-pointer hover:bg-primary-50 transition-colors"
                    @click="fileUploadRef?.choose()"
                  >
                    <i class="pi pi-cloud-upload text-3xl text-primary-400 mb-2" />
                    <p class="text-sm text-slate-600 m-0">
                      <span class="text-primary-600 font-medium">Klik untuk unggah</span> atau seret foto ke sini
                    </p>
                    <p class="text-xs text-slate-400 mt-1">PNG, JPG, maks. 5MB per foto, bisa pilih banyak sekaligus</p>
                  </div>
                </template>
              </FileUpload>

              <div v-if="photos.length" class="grid grid-cols-3 gap-3 sm:grid-cols-4">
                <div
                  v-for="photo in photos"
                  :key="photo.id"
                  class="relative overflow-hidden rounded-xl border border-slate-200 group aspect-square"
                >
                  <img :src="photo.preview" alt="Foto sejarah" class="h-full w-full object-cover" />
                  <div
                    class="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    <Button
                      icon="pi pi-trash"
                      severity="danger"
                      rounded
                      size="small"
                      aria-label="Hapus foto"
                      @click="removePhoto(photo.id)"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  class="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-primary-200 text-primary-400 hover:bg-primary-50 transition-colors"
                  @click="fileUploadRef?.choose()"
                >
                  <i class="pi pi-plus text-xl" />
                </button>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <aside class="flex flex-col gap-3.5">
        <Card>
          <template #content>
            <div class="flex gap-2.5">
              <Button
                label="Simpan Draft"
                severity="secondary"
                outlined
                class="flex-1"
                :loading="saving"
                @click="saveDraft"
              />

              <Button
                :label="mainButtonLabel"
                class="flex-1"
                :loading="saving"
                @click="saveMain"
              />
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-3">
              <button
                type="button"
                class="flex items-center justify-between text-left text-[13px] text-slate-700"
                @click="statusOpen = !statusOpen"
              >
                <span>
                  Status:
                  <strong>{{ statusDisplay }}</strong>
                </span>

                <i
                  class="pi pi-chevron-down text-xs text-slate-400 transition-transform"
                  :class="{ 'rotate-180': statusOpen }"
                />
              </button>

              <Select
                v-show="statusOpen"
                v-model="form.status"
                :options="statusOptions"
                optionLabel="label"
                optionValue="value"
                fluid
              />
            </div>
          </template>
        </Card>
      </aside>
    </div>
  </div>
</template>