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
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import Editor from 'primevue/editor'
import { potentialService, potentialCategoryService } from '@/services/content.service'
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
const shortDesc = ref('')
const location = ref('')
const contact = ref('')
const extraFields = ref([{ label: '', value: '' }]) // list key-value dinamis

const status = ref('Draft')
const visibility = ref('publik')
const publishDate = ref(new Date())
const authorOptions = ref([])
const author = ref(null)

/* ---------- Kelola Kategori ---------- */
const categoryOptions = ref([])
const selectedCategoryId = ref(null)
const newCategory = ref('')
const editingCategoryId = ref(null)
const editingCategoryLabel = ref('')

// id = category_id (dipakai RadioButton), value = slug (dikirim ke backend)
const toOption = (c) => ({ id: c.category_id, label: c.name, value: c.slug })

function errorToast(summary, error) {
  toast.add({
    severity: 'error',
    summary,
    detail: error.response?.data?.errors?.name?.[0] ?? error.response?.data?.message,
    life: 3000,
  })
}

async function fetchCategories() {
  try {
    categoryOptions.value = (await potentialCategoryService.list()).map(toOption)
  } catch (error) {
    errorToast('Gagal memuat kategori', error)
  }
}

async function addCategory() {
  const name = newCategory.value.trim()
  if (!name) return
  try {
    const created = toOption(await potentialCategoryService.create({ name }))
    categoryOptions.value.push(created)
    selectedCategoryId.value = created.id
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
    const updated = await potentialCategoryService.update(category.id, { name })
    category.label = updated.name
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
        await potentialCategoryService.remove(category.id)
        categoryOptions.value = categoryOptions.value.filter((c) => c.id !== category.id)
        if (selectedCategoryId.value === category.id) selectedCategoryId.value = null
      } catch (error) {
        errorToast('Gagal menghapus kategori', error)
      }
    },
  })
}
/* ---------- /Kelola Kategori ---------- */

const visibilityLabel = computed(() => (
  visibility.value === 'publik'
    ? 'Publik'
    : visibility.value === 'password'
      ? 'Dilindungi kata sandi'
      : 'Privat'
))

onMounted(async () => {
  await fetchCategories()

  if (authStore.user) { authorOptions.value = [{ label: authStore.user.full_name, value: authStore.user.user_id }]; author.value = authStore.user.user_id }
  if (!isEditMode.value) return

  try {
    const existing = await potentialService.get(potentialId.value)
    title.value = existing.title ?? ''
    content.value = existing.description ?? ''
    photoPreview.value = mediaUrl(existing.image)

    selectedCategoryId.value =
      categoryOptions.value.find((c) => c.value === existing.category)?.id ?? null

    status.value = existing.status ?? 'Published'
    visibility.value = 'publik'
    shortDesc.value = existing.short_desc ?? ''
    location.value = existing.location ?? ''
    contact.value = existing.contact ?? ''
    extraFields.value = existing.extra_info && Object.keys(existing.extra_info).length
      ? Object.entries(existing.extra_info).map(([label, value]) => ({ label, value }))
      : [{ label: '', value: '' }]
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal memuat data potensi', detail: error.response?.data?.message ?? 'Coba lagi.', life: 3000 })
  }
})

function addExtraField() {
  extraFields.value.push({ label: '', value: '' })
}
function removeExtraField(index) {
  extraFields.value.splice(index, 1)
}

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
  const selectedCategory = categoryOptions.value.find(c => c.id === selectedCategoryId.value)
  if (!selectedCategory) {
    toast.add({ severity: 'warn', summary: 'Pilih kategori potensi terlebih dahulu', life: 3000 })
    return
  }
  const extraInfoObject = Object.fromEntries(
    extraFields.value.filter((f) => f.label.trim()).map((f) => [f.label, f.value]))
  const payload = {
    category: selectedCategory.value,
    title: title.value,
    short_desc: shortDesc.value,
    description: content.value,
    location: location.value,
    contact: contact.value,
    extra_info: extraInfoObject,
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
              <label class="text-[13px] font-semibold text-neutral-700" for="shortDesc">
                Ringkasan Singkat
              </label>
              <InputText
                id="shortDesc"
                v-model="shortDesc"
                placeholder="Ringkasan 1-2 kalimat untuk kartu preview"
                class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-[13px] font-semibold text-neutral-700" for="location">
                Lokasi
              </label>
              <InputText
                id="location"
                v-model="location"
                placeholder="Contoh: Padukuhan Sorasan, Bimomartani"
                class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-[13px] font-semibold text-neutral-700" for="contact">
                Kontak
              </label>
              <InputText
                id="contact"
                v-model="contact"
                placeholder="Contoh: 0812-xxxx-xxxx (Ibu Siti, Ketua Kelompok)"
                class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
              />
            </div>

            <div class="flex flex-col gap-2">
              <span class="text-[13px] font-semibold text-neutral-700">
                Informasi Tambahan
              </span>
              <div v-for="(field, index) in extraFields" :key="index" class="flex gap-2">
                <InputText
                  v-model="field.label"
                  placeholder="Label (mis. Jam Operasional)"
                  class="w-1/3 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13px]"
                />
                <InputText
                  v-model="field.value"
                  placeholder="Nilai (mis. 08.00 - 17.00 WIB)"
                  class="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13px]"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  aria-label="Hapus baris"
                  @click="removeExtraField(index)"
                />
              </div>
              <Button
                label="Tambah Info"
                icon="pi pi-plus"
                text
                size="small"
                class="self-start"
                @click="addExtraField"
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
            <div class="flex flex-col gap-3">
              <label class="text-xs text-neutral-500">Kelola Kategori</label>

              <div class="flex gap-2">
                <InputText
                  v-model="newCategory"
                  placeholder="Contoh: Laporan"
                  class="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]"
                  @keyup.enter="addCategory"
                />
                <Button
                  label="Tambah"
                  icon="pi pi-plus"
                  class="rounded-lg"
                  @click="addCategory"
                />
              </div>

              <div class="flex flex-col gap-1">
                <div
                  v-for="category in categoryOptions"
                  :key="category.id"
                  class="flex items-center justify-between gap-2 py-1.5"
                >
                  <!-- Mode edit -->
                  <template v-if="editingCategoryId === category.id">
                    <InputText
                      v-model="editingCategoryLabel"
                      class="min-w-0 flex-1 rounded-lg border border-neutral-300 px-2 py-1.5 text-[13px]"
                      @keyup.enter="saveEditCategory(category)"
                      @keyup.esc="cancelEditCategory"
                    />
                    <div class="flex shrink-0 items-center">
                      <Button icon="pi pi-check" text rounded size="small" aria-label="Simpan" @click="saveEditCategory(category)" />
                      <Button icon="pi pi-times" text rounded size="small" severity="secondary" aria-label="Batal" @click="cancelEditCategory" />
                    </div>
                  </template>

                  <!-- Mode tampil -->
                  <template v-else>
                    <label class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-[13px] text-neutral-700">
                      <RadioButton v-model="selectedCategoryId" :value="category.id" />
                      <span class="truncate">{{ category.label }}</span>
                    </label>
                    <div class="flex shrink-0 items-center">
                      <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" aria-label="Edit kategori" @click="startEditCategory(category)" />
                      <Button icon="pi pi-trash" text rounded size="small" severity="danger" aria-label="Hapus kategori" @click="removeCategory(category)" />
                    </div>
                  </template>
                </div>

                <p v-if="!categoryOptions.length" class="m-0 text-xs text-neutral-400">
                  Belum ada kategori. Tambahkan di atas.
                </p>
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
