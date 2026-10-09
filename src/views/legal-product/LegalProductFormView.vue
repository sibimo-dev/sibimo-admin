<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import {
  useLegalProductStore,
  LEGAL_PRODUCT_CATEGORIES,
  LEGAL_PRODUCT_STATUSES,
} from '@/stores/legal-product.store'
import { getLegalProduct } from '@/services/legal-product.service'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import AppInput from '@/components/common/AppInput.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
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

onMounted(async () => {
  if (!isEdit.value) return

  const existing = await getLegalProduct(route.params.id)
  if (!existing) return

  form.title = existing.title
  form.category = existing.category ?? null
  form.status = existing.status ?? 'berlaku'
  form.number = existing.number ?? ''
  form.year = existing.year ?? new Date().getFullYear()
  form.description = existing.description ?? ''
  existingDocument.value = existing.document ?? null
})

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

async function handleSubmit() {
  if (!validate()) return
  saving.value = true
  try {
    const payload = {
      title: form.title,
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

    toast.add({
      severity: 'success',
      summary: isEdit.value
        ? 'Produk hukum berhasil diperbarui'
        : 'Produk hukum berhasil ditambahkan',
      life: 2000,
    })
    router.push({ name: 'legal-product-list' })
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
                  :options="LEGAL_PRODUCT_CATEGORIES"
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