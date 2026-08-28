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
import { useAuthStore } from '@/stores/auth.store'
import { newsService, newsCategoryService } from '@/services/content.service'
import { updateListCache } from '@/services/list-cache'
import { mediaUrl } from '@/services/media'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()
const authStore = useAuthStore()

const newsId = computed(() => route.params.id ?? null)
const isEditMode = computed(() => route.name === 'news-edit' || Boolean(route.params.id))
const pageTitle = computed(() => (
  isEditMode.value ? 'Edit Berita' : 'Buat Berita Baru'
))

const imagePreview = ref(null)
const imageFile = ref(null)
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
  { id: 'infrastruktur', label: 'Infrastruktur', checked: false },
  { id: 'pertanian', label: 'Pertanian', checked: false },
  { id: 'kesehatan', label: 'Kesehatan', checked: false },
  { id: 'sosial', label: 'Sosial', checked: false },
  { id: 'keuangan', label: 'Keuangan', checked: false },
  { id: 'teknologi', label: 'Teknologi', checked: false },
])
const newsCategories = ref([])

const tags = ref(['Sosial', 'Keuangan'])
const tagInput = ref('')

const mainButtonLabel = computed(() => (
  isEditMode.value ? 'Perbarui' : 'Terbitkan'
))

const visibilityLabel = computed(() => (
  visibility.value === 'publik'
    ? 'Publik'
    : visibility.value === 'password'
      ? 'Dilindungi kata sandi'
      : 'Privat'
))

onMounted(async () => {
  newsCategories.value = await newsCategoryService.list()
  if (authStore.user) {
    authorOptions.value = [{ label: authStore.user.full_name, value: authStore.user.user_id }]
    author.value = authStore.user.user_id
  }
  if (!isEditMode.value) return

  const existing = await newsService.get(newsId.value)
  title.value = existing.title ?? ''
  content.value = existing.content ?? ''
  imagePreview.value = mediaUrl(existing.thumbnail)
  status.value = existing.status ?? 'Draft'
  categoryOptions.value.forEach(option => {
    const normalize = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
    option.checked = normalize(existing.category?.slug) === normalize(option.id) || normalize(existing.category?.category_name) === normalize(option.label)
  })
})

function handleImageSelect(event) {
  const file = event.files?.[0]
  if (!file) return
  imageFile.value = file
  const reader = new FileReader()
  reader.onload = () => {
    imagePreview.value = reader.result
  }
  reader.readAsDataURL(file)
}

function handleImageValidationError(event) {
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
  imagePreview.value = null
  imageFile.value = null
}

function addTagFromInput(event) {
  const value = tagInput.value.trim()
  if (!value || event.key !== 'Enter') return

  if (!tags.value.includes(value)) {
    tags.value.push(value)
  }

  tagInput.value = ''
}

function removeTag(tag) {
  tags.value = tags.value.filter(item => item !== tag)
}

function previewNews() {
  window.open(`/news/preview/${newsId.value ?? ''}`, '_blank')
}

function saveDraft() {
  status.value = 'Draft'
  router.push({ name: 'news-list' })
}

async function publishNews() {
  if (saving.value) return
  status.value = 'Published'
  const selected = categoryOptions.value.find(option => option.checked)
  if (!selected) { toast.add({ severity: 'warn', summary: 'Pilih kategori berita terlebih dahulu', life: 3000 }); return }
  const normalize = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const category = newsCategories.value.find(item => normalize(item.slug) === normalize(selected.id) || normalize(item.category_name) === normalize(selected.label))
  const payload = { category_id: category?.category_id, category_name: selected.label, title: title.value, slug: isEditMode.value ? undefined : `${title.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`, content: content.value, thumbnail: imageFile.value, status: 'Published', published_at: publishDate.value.toISOString() }

  saving.value = true
  try {
    const saved = isEditMode.value
      ? await newsService.update(newsId.value, payload)
      : await newsService.create(payload)

    updateListCache('news', items => {
      const cachedItem = {
        ...saved,
        category: { category_name: selected.label },
        author: { full_name: authStore.user?.full_name ?? authStore.user?.username ?? '-' },
      }

      if (isEditMode.value) {
        return items.map(item => item.news_id === Number(newsId.value)
          ? { ...item, ...cachedItem }
          : item)
      }

      return [cachedItem, ...items]
    })
    router.push({ name: 'news-list' })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: isEditMode.value ? 'Gagal memperbarui berita' : 'Gagal menerbitkan berita',
      detail: error.response?.data?.message ?? 'Periksa data dan koneksi backend.',
      life: 4000,
    })
  } finally {
    saving.value = false
  }
}

function moveToTrash() {
  confirm.require({
    message: `Pindahkan berita "${title.value || 'ini'}" ke sampah?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: () => {
      router.push({ name: 'news-list' })
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

    <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">

      <Card>
        <template #content>
          <div class="flex flex-col gap-5">

            <div class="flex flex-col gap-2">
              <span class="text-[13px] font-semibold text-neutral-700">
                Gambar
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
                @select="handleImageSelect"
                @file-validation-failed="handleImageValidationError"
              >
                <template #empty>
                  <div
                    v-if="!imagePreview"
                    class="rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/40 flex flex-col items-center justify-center py-10 cursor-pointer hover:bg-primary-50 transition-colors"
                    @click="fileUploadRef?.choose()"
                  >
                    <i class="pi pi-cloud-upload text-3xl text-primary-400 mb-2" />
                    <p class="text-sm text-neutral-600 m-0">
                      <span class="text-primary-700 font-medium">Klik untuk unggah</span> atau seret gambar ke sini
                    </p>
                    <p class="text-xs text-neutral-400 mt-1">PNG, JPG, maks. 5MB</p>
                  </div>
                </template>

                <template #content="{ removeFileCallback }">
                  <div v-if="imagePreview" class="relative overflow-hidden rounded-xl border border-neutral-200 group">
                    <img :src="imagePreview" alt="Preview gambar" class="h-48 w-full object-cover" />
                    <div
                      class="absolute inset-0 bg-neutral-900/0 group-hover:bg-neutral-900/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100"
                    >
                      <Button
                        type="button"
                        icon="pi pi-refresh"
                        severity="secondary"
                        rounded
                        aria-label="Ganti gambar"
                        @click="changeImage(removeFileCallback)"
                      />
                      <Button
                        type="button"
                        icon="pi pi-trash"
                        severity="danger"
                        rounded
                        aria-label="Hapus gambar"
                        @click="removeImage(removeFileCallback)"
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
                placeholder="Judul berita"
                class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none transition focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-[13px] font-semibold text-neutral-700">
                Isi Konten
              </label>

              <Editor
                v-model="content"
                editorStyle="height: 220px"
                placeholder="Tulis isi berita di sini..."
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
                class="flex-1 rounded-lg border border-primary-700 bg-primary-700 px-3.5 py-2.5 text-[13px] font-medium text-white hover:bg-primary-800"
                @click="publishNews"
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
                class="min-w-0 p-0 text-[13px] font-medium text-primary-700 hover:underline"
                @click="previewNews"
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
                  <RadioButton v-model="visibility" value="publik" class="accent-primary-700" />
                  Publik
                </label>

                <label class="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-700">
                  <RadioButton v-model="visibility" value="password" class="accent-primary-700" />
                  Dilindungi kata sandi
                </label>

                <label class="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-700">
                  <RadioButton v-model="visibility" value="privat" class="accent-primary-700" />
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
                class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
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
                class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
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
                  v-for="option in categoryOptions"
                  :key="option.id"
                  class="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-700"
                >
                  <Checkbox v-model="option.checked" binary class="accent-primary-700" />
                  {{ option.label }}
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
