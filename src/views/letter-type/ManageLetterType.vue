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
const fields = ref([])

const form = reactive({
  letter_type_id: null,
  code: '',
  letter_name: '',
  category: '',
  number_prefix: '',
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

const fieldForm = reactive({
  id: null,
  field_label: '',
  field_key: '',
  field_type: 'text',
  is_required: false,
  optionsText: '',
  sort_order: 0,
})

const categoryOptions = ['Perintah', 'Keterangan', 'Pengantar', 'Permohonan', 'Pernyataan']
const fieldTypeOptions = ['text', 'textarea', 'number', 'date', 'select']
const signerOptions = computed(() =>
  store.signers.value.map((signer) => ({
    value: signer.staff_id,
    label: signer.name + ' - ' + signer.position,
  })),
)

function resetRequirementForm() {
  Object.assign(requirementForm, {
    id: null,
    document_name: '',
    description: '',
    is_required: false,
  })
}

function resetFieldForm() {
  Object.assign(fieldForm, {
    id: null,
    field_label: '',
    field_key: '',
    field_type: 'text',
    is_required: false,
    optionsText: '',
    sort_order: fields.value.length,
  })
}

async function loadRelatedData() {
  if (isNew.value) return
  const type = await store.fetchById(route.params.id)
  Object.assign(form, type)
  requirements.value = await store.getDocuments(route.params.id)
  fields.value = await store.getFields(route.params.id)
  resetRequirementForm()
  resetFieldForm()
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

async function saveField() {
  if (!fieldForm.field_label || !fieldForm.field_key || isNew.value) return
  try {
    const options = fieldForm.optionsText
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean)
    const payload = {
      field_label: fieldForm.field_label,
      field_key: fieldForm.field_key,
      field_type: fieldForm.field_type,
      is_required: fieldForm.is_required,
      options: fieldForm.field_type === 'select' ? options : null,
      sort_order: Number(fieldForm.sort_order) || 0,
    }
    if (fieldForm.id) await store.updateField(fieldForm.id, payload)
    else await store.createField(form.letter_type_id, payload)
    fields.value = await store.getFields(form.letter_type_id)
    resetFieldForm()
    toast.add({ severity: 'success', summary: 'Field dinamis disimpan', life: 1800 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal menyimpan field dinamis', life: 2500 })
  }
}

async function removeField(item) {
  try {
    await store.deleteField(item.field_id)
    fields.value = await store.getFields(form.letter_type_id)
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal menghapus field dinamis', life: 2500 })
  }
}

function editField(item) {
  Object.assign(fieldForm, {
    id: item.field_id,
    field_label: item.field_label,
    field_key: item.field_key,
    field_type: item.field_type,
    is_required: Boolean(item.is_required),
    optionsText: (item.options ?? []).join('\n'),
    sort_order: item.sort_order ?? 0,
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
      <section class="rounded-xl bg-white border p-6 space-y-4">
        <h2 class="font-semibold text-gray-800">Informasi Dasar</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppInput v-model="form.code" label="Kode Tipe Surat" required />
          <AppInput v-model="form.letter_name" label="Nama Tipe Surat" required />
          <label class="text-sm text-gray-600">Kategori
            <select v-model="form.category" class="mt-1 w-full border rounded-lg px-3 py-2">
              <option value="">Pilih kategori</option>
              <option v-for="item in categoryOptions" :key="item" :value="item">{{ item }}</option>
            </select>
          </label>
          <AppInput v-model="form.number_prefix" label="Prefix Nomor Surat" />
          <AppInput v-model="form.processing_time" label="Estimasi Proses" />
          <label class="text-sm text-gray-600">Metode Tanda Tangan
            <select v-model="form.signature_method" class="mt-1 w-full border rounded-lg px-3 py-2">
              <option value="manual">Manual</option>
              <option value="digital">Digital</option>
            </select>
          </label>
          <label class="text-sm text-gray-600 md:col-span-2">Penandatangan
            <select v-model="form.signer_id" class="mt-1 w-full border rounded-lg px-3 py-2">
              <option :value="null">Pilih penandatangan</option>
              <option v-for="item in signerOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </label>
          <label class="text-sm text-gray-600 md:col-span-2">Deskripsi
            <textarea v-model="form.description" rows="3" class="mt-1 w-full border rounded-lg px-3 py-2" />
          </label>
          <label class="flex items-center gap-2 text-sm text-gray-600">
            <input v-model="form.is_active" type="checkbox" /> Aktif
          </label>
        </div>
        <AppButton :label="isSaving ? 'Menyimpan...' : 'Simpan Tipe Surat'" :disabled="isSaving" @click="handleSave" />
      </section>

      <section v-if="!isNew" class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div class="rounded-xl bg-white border p-6 space-y-4">
          <h2 class="font-semibold text-gray-800">Dokumen Persyaratan</h2>
          <div class="space-y-2">
            <div v-for="item in requirements" :key="item.letter_type_document_id" class="flex items-center justify-between border rounded-lg p-3">
              <div>
                <p class="text-sm font-medium">{{ item.document_name }}</p>
                <p class="text-xs text-gray-500">{{ item.description || 'Tanpa deskripsi' }} · {{ item.is_required ? 'Wajib' : 'Opsional' }}</p>
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
        </div>

        <div class="rounded-xl bg-white border p-6 space-y-4">
          <h2 class="font-semibold text-gray-800">Field Dinamis</h2>
          <div class="space-y-2 max-h-96 overflow-auto">
            <div v-for="item in fields" :key="item.field_id" class="flex items-center justify-between border rounded-lg p-3">
              <div>
                <p class="text-sm font-medium">{{ item.field_label }}</p>
                <p class="text-xs text-gray-500">{{ item.field_key }} · {{ item.field_type }} · {{ item.is_required ? 'Wajib' : 'Opsional' }}</p>
              </div>
              <div class="flex gap-2">
                <button class="text-xs text-blue-600" @click="editField(item)">Edit</button>
                <button class="text-xs text-red-600" @click="removeField(item)">Hapus</button>
              </div>
            </div>
          </div>
          <input v-model="fieldForm.field_label" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Label field" />
          <input v-model="fieldForm.field_key" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="field_key" />
          <div class="grid grid-cols-2 gap-2">
            <select v-model="fieldForm.field_type" class="border rounded-lg px-3 py-2 text-sm">
              <option v-for="item in fieldTypeOptions" :key="item" :value="item">{{ item }}</option>
            </select>
            <input v-model.number="fieldForm.sort_order" type="number" class="border rounded-lg px-3 py-2 text-sm" placeholder="Urutan" />
          </div>
          <textarea v-if="fieldForm.field_type === 'select'" v-model="fieldForm.optionsText" rows="3" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Satu opsi per baris" />
          <label class="flex items-center gap-2 text-sm"><input v-model="fieldForm.is_required" type="checkbox" /> Wajib</label>
          <div class="flex gap-2">
            <AppButton label="Simpan Field" size="small" @click="saveField" />
            <AppButton v-if="fieldForm.id" label="Batal" size="small" variant="outline" @click="resetFieldForm" />
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
