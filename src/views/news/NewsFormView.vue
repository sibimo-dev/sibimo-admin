<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
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

const categoryOptions = ref([])
const newsCategories = ref([])
const newCategoryName = ref('')
const addingCategory = ref(false)
const categoryError = ref('')
const editingCategoryId = ref(null)
const editingCategoryName = ref('')
const savingCategoryEdit = ref(false)

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
  categoryOptions.value = newsCategories.value.map(item => ({
    categoryId: item.category_id,
    id: item.slug,
    label: item.category_name,
    checked: false,
  }))
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

// ---------- Kontrol gambar di rich editor (klik gambar -> atur ukuran / posisi / hapus) ----------
const hasSelectedImage = ref(false)
let quillInstance = null
let selectedImage = null

function handleEditorLoad({ instance }) {
  quillInstance = instance
  instance.root.addEventListener('click', onEditorClick)
  instance.root.addEventListener('keydown', onEditorKeydown)
}

onBeforeUnmount(() => {
  quillInstance?.root.removeEventListener('click', onEditorClick)
  quillInstance?.root.removeEventListener('keydown', onEditorKeydown)
})

function selectImage(img) {
  selectedImage?.classList.remove('img-selected')
  selectedImage = img
  img.classList.add('img-selected')
  hasSelectedImage.value = true
}

function clearImageSelection() {
  selectedImage?.classList.remove('img-selected')
  selectedImage = null
  hasSelectedImage.value = false
}

function onEditorClick(event) {
  if (event.target?.tagName === 'IMG') selectImage(event.target)
  else clearImageSelection()
}

function onEditorKeydown(event) {
  if (!selectedImage) return
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    deleteSelectedImage()
  } else if (!['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) {
    clearImageSelection()
  }
}

function getSelectedImageIndex() {
  if (!quillInstance || !selectedImage) return -1
  const blot = quillInstance.constructor.find(selectedImage)
  return blot ? quillInstance.getIndex(blot) : -1
}

// Setelah format diterapkan, node gambar bisa dibuat ulang oleh editor, jadi pilih ulang gambarnya.
function reselectImageAt(index) {
  nextTick(() => {
    const [leaf] = quillInstance.getLeaf(index)
    if (leaf?.domNode?.tagName === 'IMG') selectImage(leaf.domNode)
    else clearImageSelection()
  })
}

function resizeSelectedImage(width) {
  const index = getSelectedImageIndex()
  if (index < 0) return
  quillInstance.formatText(index, 1, { width, height: false }, 'user')
  reselectImageAt(index)
}

function alignSelectedImage(value) {
  const index = getSelectedImageIndex()
  if (index < 0) return
  quillInstance.formatLine(index, 1, 'align', value === 'left' ? false : value, 'user')
  reselectImageAt(index)
}

function deleteSelectedImage() {
  const index = getSelectedImageIndex()
  if (index < 0) return
  quillInstance.deleteText(index, 1, 'user')
  clearImageSelection()
}

function categoryErrorMessage(error) {
  const errors = error?.response?.data?.errors
  if (errors) {
    const first = Object.values(errors).flat()?.[0]
    if (first) return first
  }
  return error?.response?.data?.message ?? 'Kategori gagal ditambahkan.'
}

// Berita hanya punya satu kategori: mencentang satu kategori otomatis melepas yang lain.
function selectOnlyCategory(option) {
  categoryOptions.value.forEach((item) => {
    if (item !== option) item.checked = false
  })
}

async function addCategory() {
  const categoryName = newCategoryName.value.trim()
  if (!categoryName || addingCategory.value) return

  const duplicate = categoryOptions.value.some(
    option => option.label.trim().toLowerCase() === categoryName.toLowerCase(),
  )
  if (duplicate) {
    categoryError.value = `Kategori "${categoryName}" sudah ada.`
    return
  }

  addingCategory.value = true
  categoryError.value = ''
  try {
    const created = await newsCategoryService.create({ category_name: categoryName })
    newsCategories.value = [...newsCategories.value, created]
    categoryOptions.value = [
      ...categoryOptions.value,
      { categoryId: created.category_id, id: created.slug, label: created.category_name, checked: true },
    ]
    categoryOptions.value.forEach((option) => {
      if (option.id !== created.slug) option.checked = false
    })
    newCategoryName.value = ''
    toast.add({
      severity: 'success',
      summary: `Kategori "${created.category_name}" ditambahkan`,
      detail: 'Kategori tampil di halaman publik setelah ada berita terbit di dalamnya.',
      life: 3500,
    })
  } catch (error) {
    categoryError.value = categoryErrorMessage(error)
  } finally {
    addingCategory.value = false
  }
}

function startEditCategory(option) {
  editingCategoryId.value = option.categoryId
  editingCategoryName.value = option.label
  categoryError.value = ''
}

function cancelEditCategory() {
  editingCategoryId.value = null
  editingCategoryName.value = ''
}

async function saveCategoryEdit(option) {
  const categoryName = editingCategoryName.value.trim()
  if (!categoryName || savingCategoryEdit.value) return

  savingCategoryEdit.value = true
  categoryError.value = ''
  try {
    const updated = await newsCategoryService.update(option.categoryId, { category_name: categoryName })
    const categoryIndex = newsCategories.value.findIndex(item => item.category_id === option.categoryId)
    if (categoryIndex >= 0) newsCategories.value[categoryIndex] = updated
    option.id = updated.slug
    option.label = updated.category_name
    cancelEditCategory()
  } catch (error) {
    categoryError.value = categoryErrorMessage(error)
  } finally {
    savingCategoryEdit.value = false
  }
}

function removeCategory(option) {
  confirm.require({
    message: `Hapus kategori "${option.label}"? Kategori yang sudah dipakai berita tidak dapat dihapus.`,
    header: 'Hapus Kategori',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      categoryError.value = ''
      try {
        await newsCategoryService.remove(option.categoryId)
        newsCategories.value = newsCategories.value.filter(item => item.category_id !== option.categoryId)
        categoryOptions.value = categoryOptions.value.filter(item => item.categoryId !== option.categoryId)
      } catch (error) {
        categoryError.value = categoryErrorMessage(error)
      }
    },
  })
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

function goBack() {
  router.push({ name: 'news-list' })
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
  <div class="min-w-0">

    <div class="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
      <h1 class="m-0 text-xl font-bold text-primary-900 sm:text-2xl">
        {{ pageTitle }}
      </h1>

      <Button
        label="Kembali"
        outlined
        type="button"
        @click="goBack"
      />
    </div>

    <!--
      items-start: kolom kanan tidak dipaksa setinggi kolom kiri.
      min-w-0 pada kedua kolom: mencegah isi (mis. toolbar editor) mendorong layout keluar layar di HP.
    -->
    <div class="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">

      <!--
        Tidak memakai :pt di Card ini, karena pt root/body/content menimpa class bawaan
        PrimeVue (p-card, p-card-body) sehingga latar putih, bayangan, dan padding kartu hilang.
      -->
      <Card class="min-w-0 [&>.p-card-body]:min-w-0">
        <template #content>
          <div class="flex min-w-0 flex-col gap-5">

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
                    class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/40 px-4 py-8 text-center transition-colors hover:bg-primary-50 sm:py-10"
                    @click="fileUploadRef?.choose()"
                  >
                    <i class="pi pi-cloud-upload mb-2 text-3xl text-primary-400" />
                    <p class="m-0 text-sm text-neutral-600">
                      <span class="font-medium text-primary-700">Klik untuk unggah</span>
                      <span class="hidden sm:inline"> atau seret gambar ke sini</span>
                    </p>
                    <p class="mt-1 text-xs text-neutral-400">PNG, JPG, maks. 5MB</p>
                  </div>
                </template>

                <template #content="{ removeFileCallback }">
                  <div v-if="imagePreview" class="group relative overflow-hidden rounded-xl border border-neutral-200">
                    <img :src="imagePreview" alt="Preview gambar" class="h-40 w-full object-cover sm:h-48" />
                    <!--
                      HP tidak punya "hover", jadi di layar kecil tombolnya selalu tampil di pojok kanan atas.
                      Di layar >= md, kembali ke overlay yang muncul saat di-hover.
                    -->
                    <div
                      class="absolute right-2 top-2 flex gap-2 md:inset-0 md:items-center md:justify-center md:bg-neutral-900/0 md:opacity-0 md:transition-colors md:group-hover:bg-neutral-900/40 md:group-hover:opacity-100"
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

            <div class="flex min-w-0 flex-col gap-2">
              <label class="text-[13px] font-semibold text-neutral-700">
                Isi Konten
              </label>

              <!--
                Editor memakai alur layout normal (tanpa position absolute):
                tinggi minimum 220px, tumbuh mengikuti isi sampai batas maksimum,
                lalu scroll di dalam editor sehingga tidak menimpa elemen lain.
                Tanda "!" dipakai untuk menimpa style bawaan Quill (height: 100%).
              -->
              <Editor
                v-model="content"
                placeholder="Tulis isi berita di sini..."
                @load="handleEditorLoad"
                class="news-editor w-full min-w-0 max-w-full
                       [&_.ql-toolbar]:flex [&_.ql-toolbar]:flex-wrap
                       [&_.ql-container]:!h-auto
                       [&_.ql-editor]:!h-auto
                       [&_.ql-editor]:!min-h-[220px]
                       [&_.ql-editor]:!max-h-[50vh]
                       [&_.ql-editor]:overflow-y-auto
                       [&_.ql-editor]:break-words
                       md:[&_.ql-editor]:!max-h-[60vh]"
              />

              <!-- Muncul saat sebuah gambar di dalam editor diklik. mousedown.prevent menjaga fokus tetap di editor. -->
              <div
                v-if="hasSelectedImage"
                class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-primary-200 bg-primary-50/60 px-3 py-2 text-[12px] text-neutral-700"
              >
                <span class="font-medium">Gambar dipilih</span>

                <div class="flex flex-wrap items-center gap-1">
                  <span class="mr-1 text-neutral-500">Ukuran:</span>
                  <Button type="button" label="25%" size="small" severity="secondary" outlined @mousedown.prevent @click="resizeSelectedImage('25%')" />
                  <Button type="button" label="50%" size="small" severity="secondary" outlined @mousedown.prevent @click="resizeSelectedImage('50%')" />
                  <Button type="button" label="75%" size="small" severity="secondary" outlined @mousedown.prevent @click="resizeSelectedImage('75%')" />
                  <Button type="button" label="100%" size="small" severity="secondary" outlined @mousedown.prevent @click="resizeSelectedImage('100%')" />
                </div>

                <div class="flex items-center gap-1">
                  <span class="mr-1 text-neutral-500">Posisi:</span>
                  <Button type="button" icon="pi pi-align-left" size="small" severity="secondary" outlined aria-label="Rata kiri" @mousedown.prevent @click="alignSelectedImage('left')" />
                  <Button type="button" icon="pi pi-align-center" size="small" severity="secondary" outlined aria-label="Rata tengah" @mousedown.prevent @click="alignSelectedImage('center')" />
                  <Button type="button" icon="pi pi-align-right" size="small" severity="secondary" outlined aria-label="Rata kanan" @mousedown.prevent @click="alignSelectedImage('right')" />
                </div>

                <Button type="button" icon="pi pi-trash" label="Hapus" size="small" severity="danger" outlined @mousedown.prevent @click="deleteSelectedImage" />
              </div>
              <small v-else class="text-[11px] text-neutral-400">
                Tip: klik gambar di dalam editor untuk mengatur ukuran, posisi, atau menghapusnya.
              </small>
            </div>
          </div>
        </template>
      </Card>

      <aside class="flex min-w-0 flex-col gap-4 sm:gap-5">

        <!-- Di layar kecil kartu ini menempel di bawah layar agar tombol selalu mudah dijangkau -->
        <Card class="max-lg:sticky max-lg:bottom-2 max-lg:z-10 max-lg:shadow-lg">
          <template #content>
            <div class="flex flex-wrap gap-2.5">
              <Button
                label="Simpan Draft"
                severity="secondary"
                outlined
                :disabled="saving"
                class="min-w-[120px] flex-1 whitespace-nowrap rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
                @click="saveDraft"
              />

              <Button
                :label="mainButtonLabel"
                :loading="saving"
                :disabled="saving"
                class="min-w-[120px] flex-1 whitespace-nowrap rounded-lg border border-primary-700 bg-primary-700 px-3.5 py-2.5 text-[13px] font-medium text-white hover:bg-primary-800"
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
                appendTo="body"
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
                appendTo="body"
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

              <div class="flex gap-2">
                <InputText
                  v-model="newCategoryName"
                  placeholder="Tambah kategori baru"
                  class="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-[13px]"
                  @keyup.enter="addCategory"
                />
                <Button
                  icon="pi pi-plus"
                  label="Tambah"
                  :loading="addingCategory"
                  :disabled="!newCategoryName.trim() || addingCategory"
                  class="shrink-0 rounded-lg border border-primary-700 bg-primary-700 px-3 py-2 text-[12px] text-white"
                  @click="addCategory"
                />
              </div>
              <small v-if="categoryError" class="text-xs text-red-600">{{ categoryError }}</small>

              <!-- Daftar kategori bisa di-scroll agar sidebar tidak memanjang bila kategori makin banyak -->
              <div class="flex max-h-56 flex-col gap-2 overflow-y-auto pr-1">
                <div
                  v-for="option in categoryOptions"
                  :key="option.categoryId"
                  class="flex items-center justify-between gap-2 text-[13px] text-neutral-700"
                >
                  <div v-if="editingCategoryId !== option.categoryId" class="flex min-w-0 flex-1 items-center gap-2">
                    <Checkbox
                      v-model="option.checked"
                      binary
                      class="accent-primary-700"
                      @update:modelValue="(value) => value && selectOnlyCategory(option)"
                    />
                    <span class="truncate">{{ option.label }}</span>
                  </div>
                  <InputText
                    v-else
                    v-model="editingCategoryName"
                    class="min-w-0 flex-1 rounded-md border border-neutral-300 px-2 py-1 text-[12px]"
                    @keyup.enter="saveCategoryEdit(option)"
                  />
                  <div class="flex shrink-0 items-center gap-1">
                    <template v-if="editingCategoryId === option.categoryId">
                      <Button icon="pi pi-check" text rounded size="small" :loading="savingCategoryEdit" aria-label="Simpan kategori" @click="saveCategoryEdit(option)" />
                      <Button icon="pi pi-times" text rounded size="small" severity="secondary" aria-label="Batal edit kategori" @click="cancelEditCategory" />
                    </template>
                    <template v-else>
                      <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" aria-label="Edit kategori" @click="startEditCategory(option)" />
                      <Button icon="pi pi-trash" text rounded size="small" severity="danger" aria-label="Hapus kategori" @click="removeCategory(option)" />
                    </template>
                  </div>
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
          class="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
          @click="moveToTrash"
        />

      </aside>
    </div>
  </div>
</template>

<style>
/* Gambar di dalam rich editor: bisa diklik dan tidak pernah melebihi lebar editor */
.news-editor .ql-editor img {
  max-width: 100%;
  height: auto;
  cursor: pointer;
}

.news-editor .ql-editor img.img-selected {
  outline: 3px solid #0284c7;
  outline-offset: 2px;
}
</style>