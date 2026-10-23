<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useLegalProductStore, LEGAL_PRODUCT_STATUSES } from '@/stores/legal-product.store'
import { getLegalProduct } from '@/services/legal-product.service'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import AppInput from '@/components/common/AppInput.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const legalProductStore = useLegalProductStore()

const isEdit = computed(() => !!route.params.id)
const saving = ref(false)

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024

const form = reactive({
  title: '',
  category: null,
  status: 'berlaku',
  number: '',
  year: new Date().getFullYear(),
  description: '',
  document_file: null,
})

const existingDocument = ref(null)
const errors = reactive({ title: '', category: '', year: '', document: '' })

const pageTitle = computed(() => (isEdit.value ? 'Edit Produk Hukum' : 'Tambah Produk Hukum'))
const mainButtonLabel = computed(() => (isEdit.value ? 'Perbarui' : 'Simpan'))

/* ============ Helper notifikasi & error ============ */
// Ambil pesan error paling relevan dari respons backend (validasi 422 atau message umum).
function apiErrorMessage(error, fallback) {
  const errs = error?.response?.data?.errors
  if (errs) {
    const first = Object.values(errs).flat()?.[0]
    if (first) return first
  }
  return error?.response?.data?.message ?? fallback
}

function notifySuccess(summary, detail) {
  toast.add({ severity: 'success', summary, detail, life: 2500 })
}

function notifyError(summary, error, fallback = 'Periksa koneksi atau coba lagi.') {
  toast.add({
    severity: 'error',
    summary,
    detail: apiErrorMessage(error, fallback),
    life: 4500,
  })
}

/* ============ Kategori (dinamis, dikelola admin) ============ */
// Bawaan (Perkal, SK Lurah, Laporan) + kategori tambahan buatan admin.
const categoryOptions = computed(() => legalProductStore.allCategories)

const newCategoryName = ref('')
const addingCategory = ref(false)
const categoryError = ref('')
const editingCategoryId = ref(null)
const editingCategoryName = ref('')
const savingCategoryEdit = ref(false)

function isDuplicateCategory(name, exceptId = null) {
  const target = name.trim().toLowerCase()
  return categoryOptions.value.some(
    (o) => o.categoryId !== exceptId && o.label.trim().toLowerCase() === target,
  )
}

async function addCategory() {
  const name = newCategoryName.value.trim()
  if (!name || addingCategory.value) return

  if (isDuplicateCategory(name)) {
    categoryError.value = `Kategori "${name}" sudah ada.`
    return
  }

  addingCategory.value = true
  categoryError.value = ''
  try {
    const created = await legalProductStore.createCategory(name)
    form.category = created?.slug ?? form.category // langsung terpilih
    errors.category = ''
    newCategoryName.value = ''
    notifySuccess(`Kategori "${created?.category_name ?? name}" berhasil ditambahkan`)
  } catch (error) {
    categoryError.value = apiErrorMessage(error, 'Kategori gagal ditambahkan.')
    notifyError('Kategori gagal ditambahkan', error)
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
  if (savingCategoryEdit.value) return
  const name = editingCategoryName.value.trim()

  if (!name) {
    categoryError.value = 'Nama kategori tidak boleh kosong.'
    return
  }
  // Tidak ada perubahan: cukup tutup mode edit.
  if (name === option.label) {
    cancelEditCategory()
    return
  }
  if (isDuplicateCategory(name, option.categoryId)) {
    categoryError.value = `Kategori "${name}" sudah ada.`
    return
  }

  savingCategoryEdit.value = true
  categoryError.value = ''
  try {
    const updated = await legalProductStore.updateCategory(option.categoryId, name)
    // slug bisa ikut berubah; jaga agar pilihan form tetap menunjuk kategori ini
    if (form.category === option.value && updated?.slug) form.category = updated.slug
    cancelEditCategory()
    notifySuccess('Kategori berhasil diperbarui', `Nama kategori diubah menjadi "${name}".`)
  } catch (error) {
    categoryError.value = apiErrorMessage(error, 'Kategori gagal diperbarui.')
    notifyError('Kategori gagal diperbarui', error)
  } finally {
    savingCategoryEdit.value = false
  }
}

function removeCategory(option) {
  confirm.require({
    message: `Hapus kategori "${option.label}"? Kategori yang sudah dipakai produk hukum tidak dapat dihapus.`,
    header: 'Hapus Kategori',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      categoryError.value = ''
      try {
        await legalProductStore.removeCategory(option.categoryId)
        if (form.category === option.value) form.category = null
        notifySuccess(`Kategori "${option.label}" berhasil dihapus`)
      } catch (error) {
        categoryError.value = apiErrorMessage(error, 'Kategori gagal dihapus.')
        notifyError('Kategori gagal dihapus', error)
      }
    },
  })
}

/* ============ Load data ============ */
onMounted(async () => {
  try {
    await legalProductStore.fetchCategories()
  } catch (error) {
    notifyError('Kategori tambahan gagal dimuat', error, 'Periksa koneksi backend.')
  }

  if (!isEdit.value) return

  try {
    const existing = await getLegalProduct(route.params.id)
    if (!existing) return

    form.title = existing.title
    form.category = existing.category ?? null
    form.status = existing.status ?? 'berlaku'
    form.number = existing.number ?? ''
    form.year = existing.year ?? new Date().getFullYear()
    form.description = existing.description ?? ''
    existingDocument.value = existing.document ?? null
  } catch (error) {
    notifyError('Data produk hukum gagal dimuat', error)
  }
})

/* ============ Dokumen ============ */
function handleDocumentFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  if (file.type !== 'application/pdf') {
    toast.add({ severity: 'error', summary: 'Dokumen harus berformat PDF', life: 3000 })
    return
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    toast.add({ severity: 'error', summary: 'Ukuran dokumen maksimal 10MB', life: 3000 })
    return
  }

  form.document_file = file
  errors.document = ''
}

function removeDocumentFile() {
  form.document_file = null
}

function validate() {
  errors.title = form.title.trim() ? '' : 'Judul produk hukum wajib diisi'
  errors.category = form.category ? '' : 'Kategori wajib dipilih'
  errors.year = form.year ? '' : 'Tahun penerbitan wajib diisi'
  // A document is required when creating; when editing, the current one is kept.
  errors.document =
    form.document_file || existingDocument.value ? '' : 'Dokumen PDF wajib diunggah'
  return !errors.title && !errors.category && !errors.year && !errors.document
}

// Tampilkan error validasi dari backend (422) di bawah field yang sesuai.
function applyServerErrors(error) {
  const serverErrors = error?.response?.data?.errors
  if (!serverErrors) return
  if (serverErrors.title) errors.title = serverErrors.title[0]
  if (serverErrors.category) errors.category = serverErrors.category[0]
  if (serverErrors.year) errors.year = serverErrors.year[0]
  if (serverErrors.document) errors.document = serverErrors.document[0]
}

async function handleSubmit() {
  if (saving.value) return

  if (!validate()) {
    toast.add({
      severity: 'warn',
      summary: 'Data belum lengkap',
      detail: 'Periksa kembali isian yang ditandai merah.',
      life: 3000,
    })
    return
  }

  saving.value = true
  try {
    const payload = {
      title: form.title.trim(),
      category: form.category,
      status: form.status,
      number: form.number,
      year: form.year,
      description: form.description,
      document_file: form.document_file,
    }

    if (isEdit.value) {
      await legalProductStore.update(route.params.id, payload)
    } else {
      await legalProductStore.create(payload)
    }

    notifySuccess(
      isEdit.value ? 'Produk hukum berhasil diperbarui' : 'Produk hukum berhasil ditambahkan',
      `"${payload.title}" sudah tersimpan.`,
    )
    router.push({ name: 'legal-product-list' })
  } catch (error) {
    applyServerErrors(error)
    notifyError(
      isEdit.value ? 'Produk hukum gagal diperbarui' : 'Produk hukum gagal disimpan',
      error,
    )
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  router.push({ name: 'legal-product-list' })
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
                Judul Produk Hukum <span class="text-danger-500">*</span>
              </label>
              <AppInput
                id="title"
                v-model="form.title"
                placeholder="Contoh: Anggaran Pendapatan dan Belanja Kalurahan (APBKal) Tahun Anggaran 2026"
                :error="errors.title"
                required
              />
            </div>

            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
              </div>

              <div class="flex flex-col gap-2">
                <label for="status" class="text-[13px] font-semibold text-slate-700">
                  Status <span class="text-danger-500">*</span>
                </label>
                <Select
                  id="status"
                  v-model="form.status"
                  :options="LEGAL_PRODUCT_STATUSES"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label for="number" class="text-[13px] font-semibold text-slate-700">
                  Nomor
                </label>
                <AppInput
                  id="number"
                  v-model="form.number"
                  placeholder="Contoh: Nomor 05 Tahun 2026 (opsional)"
                />
              </div>

              <div class="flex flex-col gap-2">
                <label for="year" class="text-[13px] font-semibold text-slate-700">
                  Tahun Penerbitan <span class="text-danger-500">*</span>
                </label>
                <InputNumber
                  id="year"
                  v-model="form.year"
                  :useGrouping="false"
                  :min="1945"
                  :max="2100"
                  :invalid="!!errors.year"
                  class="w-full"
                  inputClass="w-full"
                />
                <small v-if="errors.year" class="text-danger-500">{{ errors.year }}</small>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <label for="description" class="text-[13px] font-semibold text-slate-700">
                Deskripsi
              </label>
              <Textarea
                id="description"
                v-model="form.description"
                rows="4"
                autoResize
                placeholder="Ringkasan atau kata kunci untuk memudahkan pencarian (opsional)"
                class="w-full"
              />
            </div>

            <div class="flex flex-col gap-3">
              <span class="text-[13px] font-semibold text-slate-700">
                Dokumen <span class="text-danger-500">*</span>
              </span>

              <div
                v-if="form.document_file"
                class="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <span class="flex items-center gap-2 truncate text-sm text-slate-700">
                  <i class="pi pi-file-pdf text-red-500" />
                  {{ form.document_file.name }}
                </span>
                <Button
                  icon="pi pi-times"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  type="button"
                  aria-label="Batalkan dokumen"
                  @click="removeDocumentFile"
                />
              </div>

              <a
                v-else-if="existingDocument"
                :href="existingDocument"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-primary-700 hover:underline"
              >
                <i class="pi pi-file-pdf text-red-500" />
                Lihat dokumen saat ini
              </a>

              <label
                class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-primary-50/40 py-8 transition-colors hover:bg-primary-50"
                :class="errors.document ? 'border-danger-300' : 'border-primary-200'"
              >
                <i class="pi pi-cloud-upload mb-2 text-3xl text-primary-400" />
                <p class="m-0 text-sm text-slate-600">
                  <span class="font-medium text-primary-600">
                    {{ existingDocument || form.document_file ? 'Ganti dokumen' : 'Klik untuk unggah dokumen' }}
                  </span>
                </p>
                <p class="mt-1 text-xs text-slate-400">
                  PDF, maks. 10MB. Dipakai untuk pratinjau dan unduhan di halaman publik.
                </p>
                <input
                  type="file"
                  accept="application/pdf"
                  class="hidden"
                  @change="handleDocumentFile"
                />
              </label>
              <small v-if="errors.document" class="text-danger-500">{{ errors.document }}</small>
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
                :disabled="saving"
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

        <!-- Kelola kategori: tambah (mis. Laporan), ubah nama, hapus -->
        <Card>
          <template #content>
            <div class="flex flex-col gap-2.5">
              <label class="text-xs text-slate-500">Kelola Kategori</label>

              <div class="flex gap-2">
                <InputText
                  v-model="newCategoryName"
                  placeholder="Contoh: Laporan"
                  class="min-w-0 flex-1"
                  @keyup.enter="addCategory"
                />
                <Button
                  icon="pi pi-plus"
                  label="Tambah"
                  type="button"
                  :loading="addingCategory"
                  :disabled="!newCategoryName.trim() || addingCategory"
                  class="shrink-0"
                  @click="addCategory"
                />
              </div>
              <small v-if="categoryError" class="text-xs text-danger-500">{{ categoryError }}</small>

              <div class="flex max-h-56 flex-col gap-2 overflow-y-auto pr-1">
                <div
                  v-for="option in categoryOptions"
                  :key="option.categoryId"
                  class="flex items-center justify-between gap-2 text-[13px] text-slate-700"
                >
                  <span
                    v-if="editingCategoryId !== option.categoryId"
                    class="min-w-0 flex-1 truncate"
                  >
                    {{ option.label }}
                  </span>
                  <InputText
                    v-else
                    v-model="editingCategoryName"
                    class="min-w-0 flex-1"
                    size="small"
                    @keyup.enter="saveCategoryEdit(option)"
                    @keyup.esc="cancelEditCategory"
                  />

                  <div v-if="!option.builtin" class="flex shrink-0 items-center gap-1">
                    <template v-if="editingCategoryId === option.categoryId">
                      <Button
                        icon="pi pi-check"
                        text
                        rounded
                        size="small"
                        type="button"
                        :loading="savingCategoryEdit"
                        aria-label="Simpan kategori"
                        @click="saveCategoryEdit(option)"
                      />
                      <Button
                        icon="pi pi-times"
                        text
                        rounded
                        size="small"
                        type="button"
                        severity="secondary"
                        aria-label="Batal edit kategori"
                        @click="cancelEditCategory"
                      />
                    </template>
                    <template v-else>
                      <Button
                        icon="pi pi-pencil"
                        text
                        rounded
                        size="small"
                        type="button"
                        severity="secondary"
                        aria-label="Edit kategori"
                        @click="startEditCategory(option)"
                      />
                      <Button
                        icon="pi pi-trash"
                        text
                        rounded
                        size="small"
                        type="button"
                        severity="danger"
                        aria-label="Hapus kategori"
                        @click="removeCategory(option)"
                      />
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </aside>
    </div>
  </div>
</template>