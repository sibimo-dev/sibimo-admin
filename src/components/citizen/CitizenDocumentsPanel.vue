<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import {
  deleteCitizenDocument,
  downloadCitizenDocument,
  getCitizenDocuments,
  updateCitizenDocument,
  uploadCitizenDocument,
} from '@/services/citizen.service'

const props = defineProps({
  citizenId: { type: [Number, String], required: true },
  letterTypeCode: { type: String, default: '' },
  manage: { type: Boolean, default: false },
  title: { type: String, default: 'Dokumen Warga Tersimpan' },
})

const documents = ref([])
const loading = ref(false)
const error = ref('')
const dialogVisible = ref(false)
const saving = ref(false)
const editing = ref(null)
const fileInput = ref(null)
const selectedFile = ref(null)
const form = ref({ document_type: '' })

const documentTypeLabel = (type) => {
  const labels = {
    ktp: 'KTP', kk: 'Kartu Keluarga', pas_foto: 'Pas foto',
    paspor: 'Paspor', akta_kelahiran: 'Akta kelahiran', akta_perkawinan: 'Akta perkawinan',
    akta_perceraian: 'Akta perceraian', surat_kematian: 'Surat kematian',
    pbb: 'PBB', letter_c: 'Letter C', surat_rt_rw: 'Surat RT/RW',
  }
  const base = String(type ?? '').split(':')[0]
  const fallback = String(type ?? '').replace(/^lainnya:/, '')
  return labels[base] ?? (fallback || 'Dokumen lainnya')
}

const formatSize = (size) => {
  const value = Number(size ?? 0)
  if (!value) return '-'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

const emptyMessage = computed(() => props.manage
  ? 'Belum ada dokumen tersimpan untuk warga ini.'
  : 'Belum ada dokumen warga yang tersimpan untuk NIK ini.')

async function load() {
  if (!props.citizenId) return
  loading.value = true
  error.value = ''
  try {
    documents.value = await getCitizenDocuments(props.citizenId, props.letterTypeCode ? { letter_type_code: props.letterTypeCode } : {})
  } catch (err) {
    error.value = err.response?.data?.message || 'Gagal memuat dokumen warga.'
  } finally {
    loading.value = false
  }
}

function chooseNew() {
  editing.value = null
  form.value = { document_type: '' }
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
  dialogVisible.value = true
}

function chooseEdit(document) {
  editing.value = document
  form.value = { document_type: document.document_type }
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
  dialogVisible.value = true
}

function onFileChange(event) {
  selectedFile.value = event.target.files?.[0] ?? null
}

async function save() {
  if (!form.value.document_type || (!editing.value && !selectedFile.value)) return
  saving.value = true
  error.value = ''
  try {
    const data = new FormData()
    data.append('document_type', form.value.document_type)
    if (selectedFile.value) data.append('file', selectedFile.value)
    if (editing.value) await updateCitizenDocument(props.citizenId, editing.value.citizen_document_id, data)
    else await uploadCitizenDocument(props.citizenId, data)
    dialogVisible.value = false
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || 'Gagal menyimpan dokumen warga.'
  } finally {
    saving.value = false
  }
}

async function remove(document) {
  if (!window.confirm(`Hapus dokumen "${document.file_name}" dari daftar warga?`)) return
  error.value = ''
  try {
    await deleteCitizenDocument(props.citizenId, document.citizen_document_id)
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || 'Gagal menghapus dokumen warga.'
  }
}

async function view(document) {
  try {
    const blob = await downloadCitizenDocument(props.citizenId, document.citizen_document_id)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Gagal membuka dokumen warga.'
  }
}

watch(() => props.citizenId, load)
onMounted(load)
</script>

<template>
  <section class="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div>
        <h3 class="m-0 flex items-center gap-2 text-[14px] font-semibold text-neutral-800">
          <i class="pi pi-folder-open text-emerald-600" />
          {{ title }}
        </h3>
        <p class="mt-1 text-[12px] text-neutral-500">
          {{ manage ? 'Dokumen dari pengajuan sebelumnya dapat dikelola di sini.' : 'Dokumen ini dapat digunakan kembali untuk pengajuan warga.' }}
        </p>
      </div>
      <Button v-if="manage" label="Tambah Dokumen" icon="pi pi-plus" size="small" class="rounded-lg" @click="chooseNew" />
    </div>

    <Message v-if="error" severity="error" :closable="false" class="mb-3">{{ error }}</Message>
    <div v-if="loading" class="py-4 text-center text-sm text-neutral-500">Memuat dokumen...</div>
    <div v-else-if="!documents.length" class="rounded-xl border border-dashed border-emerald-200 bg-white px-4 py-5 text-center text-sm text-neutral-500">
      {{ emptyMessage }}
    </div>
    <div v-else class="flex flex-col gap-2">
      <div v-for="document in documents" :key="document.citizen_document_id" class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-white px-3 py-3">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700"><i class="pi pi-file" /></div>
          <div class="min-w-0">
            <p class="m-0 truncate text-[13px] font-medium text-neutral-800">{{ document.file_name }}</p>
            <p class="m-0 mt-0.5 text-[11px] text-neutral-500">{{ documentTypeLabel(document.document_type) }} · {{ formatSize(document.file_size) }}</p>
          </div>
        </div>
        <div class="flex shrink-0 gap-1.5">
          <Button label="Lihat" icon="pi pi-eye" text size="small" @click="view(document)" />
          <Button v-if="manage" icon="pi pi-pencil" text size="small" severity="secondary" aria-label="Edit dokumen" @click="chooseEdit(document)" />
          <Button v-if="manage" icon="pi pi-trash" text size="small" severity="danger" aria-label="Hapus dokumen" @click="remove(document)" />
        </div>
      </div>
    </div>
  </section>

  <Dialog v-model:visible="dialogVisible" modal :header="editing ? 'Edit Dokumen Warga' : 'Tambah Dokumen Warga'" :style="{ width: '30rem' }">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-neutral-700">Jenis dokumen</label>
        <InputText v-model="form.document_type" placeholder="Contoh: ktp, kk, pas_foto" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-neutral-700">File {{ editing ? '(opsional)' : '' }}</label>
        <input ref="fileInput" type="file" accept=".jpg,.jpeg,.png,.pdf" class="block w-full rounded-lg border border-neutral-300 p-2 text-sm" @change="onFileChange">
        <small class="text-neutral-500">JPG, PNG, atau PDF maksimal 5 MB.</small>
      </div>
      <div class="flex justify-end gap-2">
        <Button label="Batal" severity="secondary" outlined @click="dialogVisible = false" />
        <Button label="Simpan" :loading="saving" :disabled="!form.document_type || (!editing && !selectedFile)" @click="save" />
      </div>
    </div>
  </Dialog>
</template>
