<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useAuthStore } from '@/stores/auth.store'
import { useGalleryStore } from '@/stores/gallery.store'
import { getGallery } from '@/services/gallery.service'
import { mediaUrl } from '@/services/media'

import Card from 'primevue/card'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import Editor from 'primevue/editor'
import AppInput from '@/components/common/AppInput.vue'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import DatePicker from 'primevue/datepicker'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()
const galleryStore = useGalleryStore()

const isEdit = computed(() => !!route.params.id)
const saving = ref(false)
const preview = ref(null)
const fileUploadRef = ref(null)

const form = reactive({
  title: '',
  description: '',
  category: 'kegiatan-sosial',
  location: '',
  event_date: new Date(),
  image_file: null,
  uploaded_at: null,
})

const errors = reactive({ title: '', category: '' })

/* ---------- Kelola Kategori ---------- */
const categoryOptions = computed(() => galleryStore.categoryOptions)
const newCategory = ref('')
const editingCategoryId = ref(null)
const editingCategoryLabel = ref('')

function errorToast(summary, error) {
  toast.add({
    severity: 'error',
    summary,
    detail: error.response?.data?.errors?.name?.[0] ?? error.response?.data?.message,
    life: 3000,
  })
}

async function addCategory() {
  const name = newCategory.value.trim()
  if (!name) return
  try {
    const created = await galleryStore.createCategory({ name })
    form.category = created.slug
    errors.category = ''
    newCategory.value = ''
  } catch (error) {
    errorToast('Gagal menambah kategori', error)
  }
}

function startEditCategory(category) {
  editingCategoryId.value = category.id
  editingCategoryLabel.value = category.label
}

function cancelEditCategory() {
  editingCategoryId.value = null
  editingCategoryLabel.value = ''
}

async function saveEditCategory(category) {
  const name = editingCategoryLabel.value.trim()
  if (!name) return
  try {
    await galleryStore.updateCategory(category.id, { name })
    cancelEditCategory()
  } catch (error) {
    errorToast('Gagal memperbarui kategori', error)
  }
}

function removeCategory(category) {
  confirm.require({
    message: `Hapus kategori "${category.label}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await galleryStore.removeCategory(category.id)
        if (form.category === category.value) form.category = null
      } catch (error) {
        errorToast('Gagal menghapus kategori', error)
      }
    },
  })
}
/* ---------- /Kelola Kategori ---------- */

/* ---------- Rich Editor: gambar ---------- */
const MAX_EDITOR_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_EDITOR_IMAGE_WIDTH = 1280
const IMAGE_SIZES = [25, 50, 75, 100]

const editorWrapRef = ref(null)
let quill = null
let selectedImg = null

const imageTool = reactive({
  visible: false,
  top: 0,
  left: 0,
  width: 0,
  height: 0,
  currentSize: null,
})

function hideImageTool() {
  imageTool.visible = false
  selectedImg = null
}

function positionImageTool() {
  if (!selectedImg || !selectedImg.isConnected || !editorWrapRef.value || !quill) {
    hideImageTool()
    return
  }
  const wrapRect = editorWrapRef.value.getBoundingClientRect()
  const imgRect = selectedImg.getBoundingClientRect()
  const boxRect = quill.root.getBoundingClientRect()

  // sembunyikan jika gambar sepenuhnya keluar dari area editor (ter-scroll)
  if (imgRect.bottom < boxRect.top || imgRect.top > boxRect.bottom) {
    imageTool.visible = false
    return
  }

  imageTool.top = imgRect.top - wrapRect.top
  imageTool.left = imgRect.left - wrapRect.left
  imageTool.width = imgRect.width
  imageTool.height = imgRect.height

  const widthAttr = selectedImg.getAttribute('width')
  imageTool.currentSize = widthAttr && widthAttr.endsWith('%') ? parseInt(widthAttr, 10) : null
  imageTool.visible = true
}

function getImageIndex() {
  if (!quill || !selectedImg) return null
  const blot = quill.constructor.find(selectedImg)
  return blot ? quill.getIndex(blot) : null
}

function selectImage(img) {
  selectedImg = img
  const index = getImageIndex()
  if (index !== null) quill.setSelection(index, 1, 'silent')
  positionImageTool()
}

function setImageSize(percent) {
  const index = getImageIndex()
  if (index === null) return
  quill.formatText(index, 1, 'width', `${percent}%`, 'user')
  nextTick(() => requestAnimationFrame(positionImageTool))
}

function setImageAlign(align) {
  const index = getImageIndex()
  if (index === null) return
  quill.formatLine(index, 1, 'align', align === 'left' ? false : align, 'user')
  nextTick(() => requestAnimationFrame(positionImageTool))
}

function deleteImage() {
  const index = getImageIndex()
  if (index === null) return
  quill.deleteText(index, 1, 'user')
  hideImageTool()
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      // GIF/SVG dipakai apa adanya agar animasi/vektor tidak rusak
      if (/gif|svg/.test(file.type)) {
        resolve(reader.result)
        return
      }
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const ratio = Math.min(1, MAX_EDITOR_IMAGE_WIDTH / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

function openImagePicker() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    if (file.size > MAX_EDITOR_IMAGE_BYTES) {
      toast.add({ severity: 'error', summary: 'Ukuran gambar maksimal 5MB', life: 3000 })
      return
    }
    try {
      const dataUrl = await compressImage(file)
      const range = quill.getSelection(true)
      quill.insertEmbed(range.index, 'image', dataUrl, 'user')
      quill.setSelection(range.index + 1, 0, 'silent')
    } catch {
      toast.add({ severity: 'error', summary: 'Gagal memuat gambar', life: 3000 })
    }
  }
  input.click()
}

function onEditorLoad({ instance }) {
  quill = instance

  // Ganti handler gambar bawaan dengan versi yang mengecilkan ukuran gambar
  quill.getModule('toolbar')?.addHandler('image', openImagePicker)

  // Klik gambar -> pilih gambar & tampilkan toolbar. Klik di tempat lain -> sembunyikan
  quill.root.addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG') {
      selectImage(e.target)
    } else {
      hideImageTool()
    }
  })

  quill.root.addEventListener('scroll', positionImageTool)
  quill.on('text-change', () => {
    if (selectedImg) nextTick(() => requestAnimationFrame(positionImageTool))
  })
  quill.on('selection-change', (range) => {
    if (!range) return
    // pindah kursor ke teks -> sembunyikan toolbar gambar
    if (selectedImg && !(range.length === 1 && getImageIndex() === range.index)) {
      hideImageTool()
    }
  })
}

function onDocumentPointerDown(e) {
  if (editorWrapRef.value && !editorWrapRef.value.contains(e.target)) hideImageTool()
}
/* ---------- /Rich Editor: gambar ---------- */

const pageTitle = computed(() => (isEdit.value ? 'Edit Foto' : 'Tambah Foto'))
const mainButtonLabel = computed(() => (isEdit.value ? 'Perbarui' : 'Tambah Foto'))

onMounted(async () => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  window.addEventListener('resize', positionImageTool)

  try {
    await galleryStore.fetchCategories()
  } catch (error) {
    errorToast('Gagal memuat kategori', error)
  }

  // Default 'kegiatan-sosial' bisa saja sudah dihapus
  if (!categoryOptions.value.some((c) => c.value === form.category)) {
    form.category = null
  }

  if (isEdit.value) {
    const existing = await getGallery(route.params.id)
    if (existing) {
      form.title = existing.title
      form.description = existing.description
      form.category = existing.category ?? null
      form.location = existing.location ?? ''
      form.uploaded_at = existing.uploaded_at
      preview.value = existing.image ? mediaUrl(existing.image) : null
      form.event_date = existing.event_date
        ? new Date(`${existing.event_date.slice(0, 10)}T00:00:00`)
        : new Date()
    }
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  window.removeEventListener('resize', positionImageTool)
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

function toDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
  errors.category = form.category ? '' : 'Kategori wajib dipilih'
  return !errors.title && !errors.category
}

async function handleSubmit() {
  if (!validate()) return
  saving.value = true
  try {
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      location: form.location,
      event_date: toDateInputValue(form.event_date),
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

      <Button
        label="Kembali"
        outlined
        type="button"
        @click="handleCancel"
      />
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

            <div class="flex flex-col gap-2">
              <label for="category" class="text-[13px] font-semibold text-slate-700">
                Kategori <span class="text-danger-500">*</span>
              </label>
              <Select
                id="category"
                v-model="form.category"
                :options="categoryOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Pilih kategori"
                :invalid="!!errors.category"
                class="w-full"
              />
              <small v-if="errors.category" class="text-danger-500">{{ errors.category }}</small>
              <small class="text-xs text-slate-400">
                Ingin kategori baru? Tambahkan lewat "Kelola Kategori" di samping.
              </small>
            </div>

            <div class="flex flex-col gap-2">
              <label for="location" class="text-[13px] font-semibold text-slate-700">
                Lokasi
              </label>
              <AppInput
                id="location"
                v-model="form.location"
                placeholder="Contoh: Balai Kalurahan Bimomartani"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label for="event_date" class="text-[13px] font-semibold text-slate-700">
                Tanggal Kegiatan
              </label>
              <DatePicker
                id="event_date"
                v-model="form.event_date"
                dateFormat="dd/mm/yy"
                showIcon
                iconDisplay="input"
                class="w-full"
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

              <div ref="editorWrapRef" class="relative">
                <Editor
                  v-model="form.description"
                  editorStyle="height: 160px"
                  placeholder="Deskripsi atau keterangan singkat dari foto (opsional)"
                  @load="onEditorLoad"
                />

                <!-- Toolbar melayang untuk gambar yang dipilih -->
                <div
                  v-if="imageTool.visible"
                  class="image-tool"
                  :style="{
                    top: imageTool.top + 'px',
                    left: imageTool.left + 'px',
                    width: imageTool.width + 'px',
                    height: imageTool.height + 'px',
                  }"
                >
                  <div class="image-tool__bar" @mousedown.prevent>
                    <button
                      v-for="size in IMAGE_SIZES"
                      :key="size"
                      type="button"
                      class="image-tool__btn"
                      :class="{ 'is-active': imageTool.currentSize === size }"
                      :aria-label="`Ukuran ${size}%`"
                      @click="setImageSize(size)"
                    >
                      {{ size }}%
                    </button>

                    <span class="image-tool__sep" />

                    <button type="button" class="image-tool__btn" aria-label="Rata kiri" @click="setImageAlign('left')">
                      <i class="pi pi-align-left" />
                    </button>
                    <button type="button" class="image-tool__btn" aria-label="Rata tengah" @click="setImageAlign('center')">
                      <i class="pi pi-align-center" />
                    </button>
                    <button type="button" class="image-tool__btn" aria-label="Rata kanan" @click="setImageAlign('right')">
                      <i class="pi pi-align-right" />
                    </button>

                    <span class="image-tool__sep" />

                    <button
                      type="button"
                      class="image-tool__btn image-tool__btn--danger"
                      aria-label="Hapus gambar"
                      @click="deleteImage"
                    >
                      <i class="pi pi-trash" />
                    </button>
                  </div>
                </div>
              </div>

              <small class="text-xs text-slate-400">
                Klik gambar di dalam deskripsi untuk mengatur ukuran, posisi, atau menghapusnya.
              </small>
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

        <Card>
          <template #content>
            <div class="flex flex-col gap-3">
              <label class="text-xs text-slate-500">Kelola Kategori</label>

              <div class="flex gap-2">
                <InputText
                  v-model="newCategory"
                  placeholder="Contoh: Laporan"
                  class="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px]"
                  @keyup.enter="addCategory"
                />
                <Button label="Tambah" icon="pi pi-plus" class="rounded-lg" type="button" @click="addCategory" />
              </div>

              <div class="flex flex-col gap-1">
                <div
                  v-for="category in categoryOptions"
                  :key="category.id"
                  class="flex items-center justify-between gap-2 py-1.5"
                >
                  <template v-if="editingCategoryId === category.id">
                    <InputText
                      v-model="editingCategoryLabel"
                      class="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-[13px]"
                      @keyup.enter="saveEditCategory(category)"
                      @keyup.esc="cancelEditCategory"
                    />
                    <div class="flex shrink-0 items-center">
                      <Button icon="pi pi-check" text rounded size="small" type="button" aria-label="Simpan" @click="saveEditCategory(category)" />
                      <Button icon="pi pi-times" text rounded size="small" severity="secondary" type="button" aria-label="Batal" @click="cancelEditCategory" />
                    </div>
                  </template>

                  <template v-else>
                    <span class="min-w-0 flex-1 truncate text-[13px] text-slate-700">{{ category.label }}</span>
                    <div class="flex shrink-0 items-center">
                      <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" type="button" aria-label="Edit kategori" @click="startEditCategory(category)" />
                      <Button icon="pi pi-trash" text rounded size="small" severity="danger" type="button" aria-label="Hapus kategori" @click="removeCategory(category)" />
                    </div>
                  </template>
                </div>

                <p v-if="!categoryOptions.length" class="m-0 text-xs text-slate-400">
                  Belum ada kategori. Tambahkan di atas.
                </p>
              </div>
            </div>
          </template>
        </Card>
      </aside>
    </div>
  </div>
</template>

<style>
/* Gambar tidak boleh melebihi lebar editor */
.p-editor .ql-editor img {
  max-width: 100%;
  height: auto;
  cursor: pointer;
}

/* Rata gambar (Quill menyimpan sebagai class pada paragraf) */
.p-editor .ql-editor .ql-align-center {
  text-align: center;
}
.p-editor .ql-editor .ql-align-right {
  text-align: right;
}
.p-editor .ql-editor .ql-align-justify {
  text-align: justify;
}

/* Bingkai + toolbar gambar terpilih */
.image-tool {
  position: absolute;
  z-index: 20;
  pointer-events: none;
  border: 2px solid var(--p-primary-500, #2a8fc7);
  border-radius: 4px;
  box-sizing: border-box;
}

.image-tool__bar {
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 2px;
  max-width: calc(100% - 8px);
  padding: 3px;
  overflow-x: auto;
  pointer-events: auto;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(15 23 42 / 0.18);
}

.image-tool__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}
.image-tool__btn:hover {
  background: #f1f5f9;
}
.image-tool__btn.is-active {
  color: #fff;
  background: var(--p-primary-500, #2a8fc7);
}
.image-tool__btn--danger {
  color: #dc2626;
}
.image-tool__btn--danger:hover {
  background: #fee2e2;
}
.image-tool__sep {
  width: 1px;
  height: 18px;
  margin: 0 3px;
  background: #e2e8f0;
}
</style>