<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import { useLetterTypeStore } from '@/stores/useLetterTypeStore'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const store = useLetterTypeStore()

const isNew = computed(() => route.params.id === 'new' || !route.params.id)
const isLoading = ref(false)
const isSaving = ref(false)
const requirements = ref([])

const form = reactive({
  letter_type_id: null,
  code: '',
  letter_name: '',
  category: '',
  number_prefix: '',
  classification_index: '',
  processing_time: '',
  signature_method: 'manual',
  signer_id: null,
  description: '',
  is_active: true,
})

const requirementForm = reactive({
  id: null,
  document_name: '',
  description: '',
  is_required: false,
})

const categoryOptions = ['Perintah', 'Keterangan', 'Pengantar', 'Permohonan', 'Pernyataan']
const signerOptions = computed(() =>
  store.signers.value.map((signer) => ({
    value: signer.staff_id,
    label: signer.name + ' - ' + signer.position,
  })),
)

// Mode edit: indeks klasifikasi, prefix lama (internal), dan deskripsi yang boleh diubah
const lockedFields = computed(() => !isNew.value)

const selectClass = [
  'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800',
  'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500',
  'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
].join(' ')

const textareaClass = [
  'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800',
  'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500',
].join(' ')

function resetRequirementForm() {
  Object.assign(requirementForm, {
    id: null,
    document_name: '',
    description: '',
    is_required: false,
  })
}

async function loadRelatedData() {
  if (isNew.value) return
  const type = await store.fetchById(route.params.id)
  Object.assign(form, type)
  requirements.value = await store.getDocuments(route.params.id)
  resetRequirementForm()
}

onMounted(async () => {
  isLoading.value = true
  try {
    await store.fetchSigners()
    await loadRelatedData()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal memuat tipe surat',
      detail: error.response?.data?.message ?? 'Periksa koneksi ke backend.',
      life: 3000,
    })
    if (!isNew.value) router.push({ name: 'letter-type-list' })
  } finally {
    isLoading.value = false
  }
})

async function handleSave() {
  if (!form.code || !form.letter_name || !form.category || !form.signature_method) {
    toast.add({ severity: 'warn', summary: 'Lengkapi field wajib', life: 2500 })
    return
  }

  isSaving.value = true
  try {
    const payload = {
      code: form.code,
      letter_name: form.letter_name,
      category: form.category,
      number_prefix: form.number_prefix || null,
      classification_index: form.classification_index || null,
      processing_time: form.processing_time || null,
      signature_method: form.signature_method,
      signer_id: form.signer_id || null,
      description: form.description || null,
      is_active: form.is_active,
    }
    const saved = isNew.value
      ? await store.addLetterType(payload)
      : await store.updateLetterType(form.letter_type_id, payload)

    toast.add({ severity: 'success', summary: 'Tipe surat berhasil disimpan', life: 2000 })
    if (isNew.value) {
      router.replace({ name: 'letter-type-manage', params: { id: saved.letter_type_id } })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal menyimpan tipe surat',
      detail: error.response?.data?.message ?? 'Periksa data yang dikirim.',
      life: 3000,
    })
  } finally {
    isSaving.value = false
  }
}

async function saveRequirement() {
  if (!requirementForm.document_name || isNew.value) return
  try {
    const payload = {
      document_name: requirementForm.document_name,
      description: requirementForm.description || null,
      is_required: requirementForm.is_required,
    }
    if (requirementForm.id) await store.updateDocument(requirementForm.id, payload)
    else await store.createDocument(form.letter_type_id, payload)
    requirements.value = await store.getDocuments(form.letter_type_id)
    resetRequirementForm()
    toast.add({ severity: 'success', summary: 'Dokumen persyaratan disimpan', life: 1800 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal menyimpan dokumen persyaratan', life: 2500 })
  }
}

async function removeRequirement(item) {
  try {
    await store.deleteDocument(item.letter_type_document_id)
    requirements.value = await store.getDocuments(form.letter_type_id)
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal menghapus dokumen persyaratan', life: 2500 })
  }
}

function editRequirement(item) {
  Object.assign(requirementForm, {
    id: item.letter_type_document_id,
    document_name: item.document_name,
    description: item.description ?? '',
    is_required: Boolean(item.is_required),
  })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">{{ isNew ? 'Tambah' : 'Kelola' }} Tipe Surat</h1>
        <p class="text-sm text-gray-500 mt-1">Konfigurasi tipe surat dari backend.</p>
      </div>
      <AppButton label="Kembali" variant="outline" @click="router.push({ name: 'letter-type-list' })" />
    </div>

    <div v-if="isLoading" class="rounded-xl bg-white border p-6 text-sm text-gray-500">Memuat data...</div>

    <template v-else>
      <section class="rounded-xl bg-white border p-6 space-y-5">
        <div>
          <h2 class="font-semibold text-gray-800">Informasi Dasar</h2>
          <p v-if="!isNew" class="text-xs text-gray-500 mt-1">
            Hanya <span class="font-medium">Prefix Nomor Surat</span> dan
            <span class="font-medium">Deskripsi</span> yang dapat diubah.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
          <AppInput v-model="form.code" label="Kode Tipe Surat" required :disabled="lockedFields" />
          <AppInput v-model="form.letter_name" label="Nama Tipe Surat" required :disabled="lockedFields" />

          <label class="text-sm font-medium text-gray-600">
            Kategori <span v-if="isNew" class="text-red-500">*</span>
            <select v-model="form.category" :disabled="lockedFields" :class="selectClass">
              <option value="">Pilih kategori</option>
              <option v-for="item in categoryOptions" :key="item" :value="item">{{ item }}</option>
            </select>
          </label>

          <AppInput v-model="form.processing_time" label="Estimasi Proses" :disabled="lockedFields" />

          <label class="text-sm font-medium text-gray-600">
            Metode Tanda Tangan <span v-if="isNew" class="text-red-500">*</span>
            <select v-model="form.signature_method" :disabled="lockedFields" :class="selectClass">
              <option value="manual">Manual</option>
              <option value="digital">Digital</option>
            </select>
          </label>

          <label class="text-sm font-medium text-gray-600">
            Penandatangan
            <select v-model="form.signer_id" :disabled="lockedFields" :class="selectClass">
              <option :value="null">Pilih penandatangan</option>
              <option v-for="item in signerOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </label>

          <label
            class="flex items-center gap-2 text-sm text-gray-600 md:col-span-2"
            :class="lockedFields ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'"
          >
            <input v-model="form.is_active" type="checkbox" :disabled="lockedFields" class="rounded border-gray-300" />
            Aktif
          </label>

          <!-- Field yang bisa diedit -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
            <AppInput v-model="form.classification_index" label="Indeks Klasifikasi Arsip" placeholder="Contoh: 400.12" />
            <AppInput v-model="form.number_prefix" label="Prefix Lama (internal)" />
          </div>

          <label class="text-sm font-medium text-gray-600 md:col-span-2">
            Deskripsi
            <textarea v-model="form.description" rows="3" :class="textareaClass" placeholder="Deskripsi tipe surat" />
          </label>
        </div>

        <div class="flex justify-end border-t pt-4">
          <AppButton :label="isSaving ? 'Menyimpan...' : 'Simpan Tipe Surat'" :disabled="isSaving" @click="handleSave" />
        </div>
      </section>

      <section v-if="!isNew" class="rounded-xl bg-white border p-6 space-y-4">
        <h2 class="font-semibold text-gray-800">Dokumen Persyaratan</h2>
        <div class="space-y-2">
          <div
            v-for="item in requirements"
            :key="item.letter_type_document_id"
            class="flex items-center justify-between border rounded-lg p-3"
          >
            <div>
              <p class="text-sm font-medium">{{ item.document_name }}</p>
              <p class="text-xs text-gray-500">
                {{ item.description || 'Tanpa deskripsi' }} · {{ item.is_required ? 'Wajib' : 'Opsional' }}
              </p>
            </div>
            <div class="flex gap-2">
              <button class="text-xs text-blue-600" @click="editRequirement(item)">Edit</button>
              <button class="text-xs text-red-600" @click="removeRequirement(item)">Hapus</button>
            </div>
          </div>
        </div>
        <input v-model="requirementForm.document_name" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nama dokumen" />
        <input v-model="requirementForm.description" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Deskripsi" />
        <label class="flex items-center gap-2 text-sm"><input v-model="requirementForm.is_required" type="checkbox" /> Wajib</label>
        <div class="flex gap-2">
          <AppButton label="Simpan Dokumen" size="small" @click="saveRequirement" />
          <AppButton v-if="requirementForm.id" label="Batal" size="small" variant="outline" @click="resetRequirementForm" />
        </div>
      </section>
    </template>
  </div>
</template>
