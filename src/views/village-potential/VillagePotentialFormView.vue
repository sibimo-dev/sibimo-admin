<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import RadioButton from 'primevue/radiobutton'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import Editor from 'primevue/editor'
import { potentialService } from '@/services/content.service'
import { useAuthStore } from '@/stores/auth.store'
import { updateListCache } from '@/services/list-cache'
import { mediaUrl } from '@/services/media'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()
const authStore = useAuthStore()

const potentialId = computed(() => route.params.id ?? null)
const isEditMode = computed(() => potentialId.value !== null)

const pageTitle = computed(() => (
  isEditMode.value ? 'Edit Potensi' : 'Buat Potensi Baru'
))

const mainButtonLabel = computed(() => (
  isEditMode.value ? 'Perbarui' : 'Terbitkan'
))

const photoPreview = ref(null)
const photoFile = ref(null)
const fileUploadRef = ref(null)
const saving = ref(false)
const title = ref('')
const content = ref('')

const status = ref('Draft')
const visibility = ref('publik')
const publishDate = ref(new Date())
const authorOptions = ref([])
const author = ref(null)

const categoryOptions = ref([
  { id: 'pertanian', label: 'Pertanian', checked: false },
  { id: 'bumdes', label: 'Bumdes', checked: false },
  { id: 'pariwisata', label: 'Pariwisata', checked: false },
  { id: 'umkm', label: 'UMKM', checked: false },
])

const visibilityLabel = computed(() => (
  visibility.value === 'publik'
    ? 'Publik'
    : visibility.value === 'password'
      ? 'Dilindungi kata sandi'
      : 'Privat'
))

onMounted(async () => {
  if (authStore.user) { authorOptions.value = [{ label: authStore.user.full_name, value: authStore.user.user_id }]; author.value = authStore.user.user_id }
  if (!isEditMode.value) return

  try {
    const existing = await potentialService.get(potentialId.value)
    title.value = existing.title ?? ''
    content.value = existing.description ?? ''
    photoPreview.value = mediaUrl(existing.image)
    const categoryMap = { Agriculture: 'pertanian', BUMDes: 'bumdes', Tourism: 'pariwisata', UMKM: 'umkm' }
    const selectedId = categoryMap[existing.category]
    categoryOptions.value.forEach(category => { category.checked = category.id === selectedId })
    status.value = existing.status ?? 'Published'
    visibility.value = 'publik'
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal memuat data potensi', detail: error.response?.data?.message ?? 'Coba lagi.', life: 3000 })
  }
})

function handlePhotoSelect(event) {
  const file = event.files?.[0]
  if (!file) return
  photoFile.value = file
  const reader = new FileReader()
  reader.onload = () => {
    photoPreview.value = reader.result
  }
  reader.readAsDataURL(file)
}

function handlePhotoValidationError(event) {
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
  photoFile.value = null
}

function previewPotential() {
  window.open(`/village-potential/preview/${potentialId.value ?? ''}`, '_blank')
}

function saveDraft() {
  status.value = 'Draft'
  router.push({ name: 'village-potential-list' })
}

async function saveMain() {
  if (saving.value) return
  status.value = 'Published'
  const selectedCategory = categoryOptions.value.find(category => category.checked)
  const categoryMap = { pertanian: 'Agriculture', bumdes: 'BUMDes', pariwisata: 'Tourism', umkm: 'UMKM' }
  if (!selectedCategory) { toast.add({ severity: 'warn', summary: 'Pilih kategori potensi terlebih dahulu', life: 3000 }); return }
  const payload = {
    category: categoryMap[selectedCategory.id],
    title: title.value,
    description: content.value,
    location: '',
    image: photoFile.value,
  }

  saving.value = true
  try {
    const saved = potentialId.value
      ? await potentialService.update(potentialId.value, payload)
      : await potentialService.create(payload)

    updateListCache('village-potentials', items => {
      const cachedItem = {
        ...payload,
        ...saved,
        image: saved?.image ?? null,
        status: saved?.status ?? 'Published',
      }

      if (potentialId.value) {
        return items.map(item => item.potential_id === Number(potentialId.value)
          ? { ...item, ...cachedItem, image: saved?.image ?? item.image }
          : item)
      }

      return [cachedItem, ...items]
    })
    router.push({ name: 'village-potential-list' })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: potentialId.value ? 'Gagal memperbarui potensi' : 'Gagal menerbitkan potensi',
      detail: error.response?.data?.message ?? 'Periksa data dan koneksi backend.',
      life: 4000,
    })
  } finally {
    saving.value = false
  }
}

function moveToTrash() {
  confirm.require({
    message: `Pindahkan potensi "${title.value || 'ini'}" ke sampah?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: () => {
      router.push({ name: 'village-potential-list' })
    },
  })
}
</script>

<template>
  <div>

    <div class="mb-6">
      <h1 class="m-0 text-2xl font-bold text-primary-900">
        {{ pageTitle }}
      </h1>
    </div>

    <div class="grid grid-cols-1 items-start gap-5 md:grid-cols-[1fr_300px]">

      <Card>
        <template #content>
          <div class="flex flex-col gap-5">

            <div class="flex flex-col gap-2">
              <span class="text-[13px] font-semibold text-neutral-700">
                Foto
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
                @select="handlePhotoSelect"
                @file-validation-failed="handlePhotoValidationError"
              >
                <template #empty>
                  <div
                    v-if="!photoPreview"
                    class="rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/40 flex flex-col items-center justify-center py-10 cursor-pointer hover:bg-primary-50 transition-colors"
                    @click="fileUploadRef?.choose()"
                  >
                    <i class="pi pi-cloud-upload text-3xl text-primary-400 mb-2" />
                    <p class="text-sm text-neutral-600 m-0">
                      <span class="text-primary-600 font-medium">Klik untuk unggah</span> atau seret foto ke sini
                    </p>
                    <p class="text-xs text-neutral-400 mt-1">PNG, JPG, maks. 5MB</p>
                  </div>
                </template>

                <template #content="{ removeFileCallback }">
                  <div v-if="photoPreview" class="relative overflow-hidden rounded-xl border border-neutral-200 group">
                    <img :src="photoPreview" alt="Preview foto" class="h-48 w-full object-cover" />
                    <div
                      class="absolute inset-0 bg-neutral-900/0 group-hover:bg-neutral-900/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100"
                    >
                      <Button
                        type="button"
                        icon="pi pi-refresh"
                        severity="secondary"
                        rounded
                        aria-label="Ganti foto"
                        @click="changePhoto(removeFileCallback)"
                      />
                      <Button
                        type="button"
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

            <div class="flex flex-col gap-2">
              <label class="text-[13px] font-semibold text-neutral-700" for="title">
                Judul
              </label>

              <InputText
                id="title"
                v-model="title"
                placeholder="Judul potensi desa"
                class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-[13px] font-semibold text-neutral-700">
                Isi Konten
              </label>

              <Editor
                v-model="content"
                editorStyle="height: 220px"
                placeholder="Tulis deskripsi potensi desa di sini..."
              />
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
                class="flex-1 rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
                @click="saveDraft"
              />

              <Button
                :label="mainButtonLabel"
                :loading="saving"
                :disabled="saving"
                class="flex-1 rounded-lg border border-transparent bg-primary-600 px-3.5 py-2.5 text-[13px] font-medium text-white hover:bg-primary-700"
                @click="saveMain"
              />
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex items-center justify-between text-[13px] text-neutral-700">
              <span>Terbit</span>

              <Button
                label="Pratinjau"
                text
                class="min-w-0 p-0 text-[13px] font-medium text-primary-600 hover:underline"
                @click="previewPotential"
              />
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-2.5">
              <div class="text-[13px] text-neutral-700">
                Keterlihatan:
                <strong>{{ visibilityLabel }}</strong>
              </div>

              <div class="flex flex-col gap-2">
                <label class="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-700">
                  <RadioButton v-model="visibility" value="publik" class="accent-primary-600" />
                  Publik
                </label>

                <label class="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-700">
                  <RadioButton v-model="visibility" value="password" class="accent-primary-600" />
                  Dilindungi kata sandi
                </label>

                <label class="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-700">
                  <RadioButton v-model="visibility" value="privat" class="accent-primary-600" />
                  Privat
                </label>
              </div>
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-2.5">
              <label class="text-xs text-neutral-500" for="publishDate">
                Terbit:
              </label>

              <DatePicker
                id="publishDate"
                v-model="publishDate"
                dateFormat="yy-mm-dd"
                showIcon
                iconDisplay="input"
                class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
                :pt="{ pcInputText: { root: { class: 'w-full px-3 py-2.5' } } }"
              />
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-2.5">
              <label class="text-xs text-neutral-500">
                Penulis
              </label>

              <Select
                v-model="author"
                :options="authorOptions"
                optionLabel="label"
                optionValue="value"
                class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
                :pt="{ label: { class: 'px-3 py-2.5' } }"
              />
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-2.5">
              <label class="text-xs text-neutral-500">
                Kategori
              </label>

              <div class="flex flex-col gap-2">
                <label
                  v-for="category in categoryOptions"
                  :key="category.id"
                  class="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-700"
                >
                  <Checkbox v-model="category.checked" binary class="accent-primary-600" />
                  {{ category.label }}
                </label>
              </div>
            </div>
          </template>
        </Card>

        <Button
          label="Pindahkan ke sampah"
          icon="pi pi-trash"
          severity="secondary"
          outlined
          class="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
          @click="moveToTrash"
        />

      </aside>
    </div>
  </div>
</template>
