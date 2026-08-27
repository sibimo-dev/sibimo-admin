<script setup>

import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth.store'
import { useGalleryStore } from '@/stores/gallery.store'
import { getGallery } from '@/services/gallery.service'

import Card from 'primevue/card'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import Editor from 'primevue/editor'
import AppInput from '@/components/common/AppInput.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const galleryStore = useGalleryStore()

const isEdit = computed(() => !!route.params.id)
const saving = ref(false)
const preview = ref(null)
const fileUploadRef = ref(null)

const form = reactive({
  title: '',
  description: '',
  image_file: null,
  uploaded_at: null,
})

const errors = reactive({ title: '' })

const pageTitle = computed(() => (isEdit.value ? 'Edit Foto' : 'Tambah Foto'))
const mainButtonLabel = computed(() => (isEdit.value ? 'Perbarui' : 'Tambah Foto'))

onMounted(async () => {
  if (isEdit.value) {
    const existing = await getGallery(route.params.id)
    if (existing) {
      form.title = existing.title
      form.description = existing.description
      form.uploaded_at = existing.uploaded_at
      preview.value = existing.image
    }
  }
})

function handleFileSelect(event) {
  const file = event.files?.[0]
  if (!file) return
  form.image_file = file
  const reader = new FileReader()
  reader.onload = () => {
    preview.value = reader.result
  }
  reader.readAsDataURL(file)
}

function handleValidationError(event) {
  const message = event.files?.[0]?.name
    ? `File "${event.files[0].name}" tidak valid (format/ukuran tidak sesuai)`
    : 'File tidak valid'
  toast.add({ severity: 'error', summary: message, life: 3000 })
}

function changeImage(removeFileCallback) {
  removeFileCallback?.(0)
  fileUploadRef.value?.choose()
}

function removeImage(removeFileCallback) {
  removeFileCallback?.(0)
  preview.value = null
  form.image_file = null
}

function validate() {
  errors.title = form.title.trim() ? '' : 'Judul foto wajib diisi'
  return !errors.title
}

async function handleSubmit() {
  if (!validate()) return
  saving.value = true
  try {

    const payload = {
      title: form.title,
      description: form.description,
      uploaded_by: authStore.user?.id ?? '',
      image_file: form.image_file,
    }

    if (isEdit.value) {
      await galleryStore.update(route.params.id, payload)
    } else {
      await galleryStore.create(payload)
    }

    toast.add({
      severity: 'success',
      summary: isEdit.value ? 'Foto berhasil diperbarui' : 'Foto berhasil ditambahkan',
      life: 2000,
    })
    router.push({ name: 'gallery-list' })
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  router.push({ name: 'gallery-list' })
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
              <span class="text-[13px] font-semibold text-slate-700">
                Foto <span class="text-danger-500">*</span>
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
                    v-if="!preview"
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
                  <div v-if="preview" class="relative overflow-hidden rounded-xl border border-slate-200 group">
                    <img :src="preview" alt="Preview foto" class="h-48 w-full object-cover" />
                    <div
                      class="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100"
                    >
                      <Button
                        type="button"
                        icon="pi pi-refresh"
                        severity="secondary"
                        rounded
                        aria-label="Ganti foto"
                        @click="changeImage(removeFileCallback)"
                      />
                      <Button
                        type="button"
                        icon="pi pi-trash"
                        severity="danger"
                        rounded
                        aria-label="Hapus foto"
                        @click="removeImage(removeFileCallback)"
                      />
                    </div>
                  </div>
                </template>
              </FileUpload>
            </div>

            <div class="flex flex-col gap-2">
              <label for="title" class="text-[13px] font-semibold text-slate-700">
                Judul
              </label>
              <AppInput
                id="title"
                v-model="form.title"
                placeholder="Contoh: Kerja Bakti Balai Desa"
                :error="errors.title"
                required
              />
            </div>

            <div v-if="isEdit" class="flex flex-col gap-2">
              <label class="text-[13px] font-semibold text-slate-700">
                Diunggah Pada
              </label>
              <AppInput
                :model-value="new Date(form.uploaded_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })"
                disabled
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-[13px] font-semibold text-slate-700">
                Deskripsi
              </label>
              <Editor
                v-model="form.description"
                editorStyle="height: 160px"
                placeholder="Deskripsi atau keterangan singkat dari foto (opsional)"
              />
            </div>
          </div>
        </template>
      </Card>

      <aside class="flex flex-col gap-3.5">
        <Card>
          <template #content>
            <div class="flex gap-2.5">
              <Button
                label="Batal"
                severity="secondary"
                outlined
                class="flex-1"
                type="button"
                @click="handleCancel"
              />

              <Button
                :label="mainButtonLabel"
                class="flex-1"
                type="button"
                :loading="saving"
                @click="handleSubmit"
              />
            </div>
          </template>
        </Card>
      </aside>
    </div>
  </div>
</template>
