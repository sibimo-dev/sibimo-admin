<script setup>
import { ref, reactive, computed } from 'vue'
import { useToast } from 'primevue/usetoast'

import InputText from 'primevue/inputtext'
import Editor from 'primevue/editor'
import Select from 'primevue/select'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import Card from 'primevue/card'

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

const form = reactive({
  profile_content_id: historyContent.value?.profile_content_id ?? null,
  title: historyContent.value?.title ?? '',
  content: historyContent.value?.content ?? '',
  status: historyContent.value?.status ?? 'Draft',
  published_at: historyContent.value?.published_at ?? null,
  photo_file: null,
})

const statusOpen = ref(true)
const statusDisplay = computed(() => (
  statusOptions.find((item) => item.value === form.status)?.label ?? form.status
))

const photoPreview = ref(historyContent.value?.thumbnail || null)
const fileUploadRef = ref(null)

function handleFileSelect(event) {
  const file = event.files?.[0]
  if (!file) return
  form.photo_file = file
  const reader = new FileReader()
  reader.onload = () => {
    photoPreview.value = reader.result
  }
  reader.readAsDataURL(file)
}

function handleValidationError(event) {
  const message = event.files?.[0]?.name
    ? `File "${event.files[0].name}" tidak valid (format/ukuran tidak sesuai)`
    : 'File tidak valid'
  toast.add({ severity: 'error', summary: message, life: 3000 })
}

function changePhoto(removeFileCallback) {
  removeFileCallback?.(0)
  fileUploadRef.value?.choose()
}

function removePhoto(removeFileCallback) {
  removeFileCallback?.(0)
  photoPreview.value = null
  form.photo_file = null
}

async function persist(nextStatus) {
  if (!form.title.trim()) {
    toast.add({ severity: 'error', summary: 'Judul wajib diisi', life: 2500 })
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
      title: form.title,
      content: form.content,
      thumbnail: photoPreview.value ?? '',
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
                Isi Sejarah
              </label>

              <Editor
                v-model="form.content"
                editorStyle="height: 220px"
                placeholder="Tulis isi sejarah desa di sini"
              />
            </div>

            <div class="flex flex-col gap-2">
              <span class="text-[13px] font-semibold text-slate-700">
                Foto (opsional)
              </span>

              <FileUpload
                ref="fileUploadRef"
                mode="advanced"
                accept="image/*"
                :maxFileSize="5000000"
                :multiple="false"
                :auto="false"
                :showUploadButton="false"
                :showCancelButton="false"
                customUpload
                :pt="{
                  root: { class: 'border-none bg-transparent p-0' },
                  header: { class: 'hidden' },
                  content: { class: 'border-none bg-transparent p-0' },
                }"
                @select="handleFileSelect"
                @file-validation-failed="handleValidationError"
              >
                <template #empty>
                  <div
                    v-if="!photoPreview"
                    class="rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/40 flex flex-col items-center justify-center py-10 cursor-pointer hover:bg-primary-50 transition-colors"
                    @click="fileUploadRef?.choose()"
                  >
                    <i class="pi pi-cloud-upload text-3xl text-primary-400 mb-2" />
                    <p class="text-sm text-slate-600 m-0">
                      <span class="text-primary-600 font-medium">Klik untuk unggah</span> atau seret foto ke sini
                    </p>
                    <p class="text-xs text-slate-400 mt-1">PNG, JPG, maks. 5MB</p>
                  </div>
                </template>

                <template #content="{ removeFileCallback }">
                  <div v-if="photoPreview" class="relative overflow-hidden rounded-xl border border-slate-200 group">
                    <img :src="photoPreview" alt="Preview foto" class="h-48 w-full object-cover" />
                    <div
                      class="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100"
                    >
                      <Button
                        icon="pi pi-refresh"
                        severity="secondary"
                        rounded
                        aria-label="Ganti foto"
                        @click="changePhoto(removeFileCallback)"
                      />
                      <Button
                        icon="pi pi-trash"
                        severity="danger"
                        rounded
                        aria-label="Hapus foto"
                        @click="removePhoto(removeFileCallback)"
                      />
                    </div>
                  </div>
                </template>
              </FileUpload>
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