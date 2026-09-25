<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import { useLetterTypeStore } from '@/stores/useLetterTypeStore'
import { useLetterStore } from '@/stores/useLetterStore'

const router = useRouter()
const typeStore = useLetterTypeStore()
const letterStore = useLetterStore()

const step = ref(1)
const selectedCategory = ref('')
const selectedTypeId = ref(null)
const selectedType = ref(null)
const fields = ref([])
const documents = ref([])
const dynamicValues = reactive({})
const documentFiles = reactive({})
const form = reactive({
  applicant_name: '',
  applicant_nik: '',
  applicant_phone: '',
  applicant_address: '',
  notes: '',
})
const errors = ref({})
const isLoading = ref(false)
const isSubmitting = ref(false)
const submitted = ref(null)

const activeTypes = computed(() => typeStore.rows.value.filter((type) => type.is_active))
const categories = computed(() => [...new Set(activeTypes.value.map((type) => type.category))])
const typesInCategory = computed(() =>
  activeTypes.value.filter((type) => type.category === selectedCategory.value),
)

onMounted(async () => {
  isLoading.value = true
  try {
    await typeStore.fetchRows()
  } catch (error) {
    errors.value.general = error.response?.data?.message ?? 'Gagal memuat tipe surat.'
  } finally {
    isLoading.value = false
  }
})

function chooseCategory(category) {
  selectedCategory.value = category
  selectedTypeId.value = null
  selectedType.value = null
  step.value = 2
}

async function chooseType(id) {
  selectedTypeId.value = id
  selectedType.value = await typeStore.fetchById(id)
  fields.value = selectedType.value.fields?.length
    ? selectedType.value.fields
    : await typeStore.getFields(id)
  documents.value = selectedType.value.documents?.length
    ? selectedType.value.documents
    : await typeStore.getDocuments(id)
  Object.keys(dynamicValues).forEach((key) => delete dynamicValues[key])
  fields.value.forEach((field) => { dynamicValues[field.field_key] = '' })
  Object.keys(documentFiles).forEach((key) => delete documentFiles[key])
  errors.value = {}
  step.value = 3
}

function validate() {
  const nextErrors = {}
  if (!form.applicant_name.trim()) nextErrors.applicant_name = 'Nama pemohon wajib diisi.'
  if (!/^\d{16}$/.test(form.applicant_nik.trim())) nextErrors.applicant_nik = 'NIK harus 16 digit.'
  if (!form.applicant_address.trim()) nextErrors.applicant_address = 'Alamat wajib diisi.'

  fields.value.forEach((field) => {
    const value = dynamicValues[field.field_key]
    if (field.is_required && (value === undefined || value === null || value === '')) {
      nextErrors[field.field_key] = field.field_label + ' wajib diisi.'
    }
  })

  documents.value.forEach((document) => {
    if (document.is_required && !documentFiles[document.letter_type_document_id]) {
      nextErrors['document_' + document.letter_type_document_id] =
        document.document_name + ' wajib diunggah.'
    }
  })

  errors.value = nextErrors
  return Object.keys(nextErrors).length === 0
}

async function submitForm() {
  if (!validate() || !selectedType.value) return
  isSubmitting.value = true
  try {
    const created = await letterStore.addSurat({
      letter_type_id: selectedType.value.letter_type_id,
      applicant_name: form.applicant_name.trim(),
      applicant_nik: form.applicant_nik.trim(),
      applicant_phone: form.applicant_phone.trim() || null,
      applicant_address: form.applicant_address.trim(),
      notes: form.notes.trim() || null,
      source: 'Manual (Kelurahan)',
      form_data: { ...dynamicValues },
    })

    for (const document of documents.value) {
      const file = documentFiles[document.letter_type_document_id]
      if (!file) continue
      const payload = new FormData()
      payload.append('file', file)
      payload.append('letter_type_document_id', document.letter_type_document_id)
      await letterStore.uploadAttachment(created.id, payload)
    }

    submitted.value = await letterStore.fetchById(created.id)
  } catch (error) {
    errors.value = {
      general: error.response?.data?.message ?? 'Pengajuan surat gagal disimpan.',
    }
  } finally {
    isSubmitting.value = false
  }
}

function resetForm() {
  step.value = 1
  selectedCategory.value = ''
  selectedTypeId.value = null
  selectedType.value = null
  fields.value = []
  documents.value = []
  submitted.value = null
  Object.assign(form, {
    applicant_name: '',
    applicant_nik: '',
    applicant_phone: '',
    applicant_address: '',
    notes: '',
  })
  Object.keys(dynamicValues).forEach((key) => delete dynamicValues[key])
  Object.keys(documentFiles).forEach((key) => delete documentFiles[key])
  errors.value = {}
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="mb-6 flex items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-slate-800">Tambah Pengajuan Surat</h1>
        <p class="text-sm text-slate-500 mt-1">Data akan disimpan langsung ke backend.</p>
      </div>
      <AppButton label="Kembali" variant="outline" @click="router.push('/letter')" />
    </div>

    <div v-if="isLoading" class="bg-white rounded-xl border p-6 text-sm text-slate-500">Memuat tipe surat...</div>
    <div v-else-if="submitted" class="bg-white rounded-xl border p-6 space-y-4">
      <p class="text-green-700 font-semibold">Pengajuan berhasil dibuat.</p>
      <p class="text-sm">Request ID: <strong>{{ submitted.requestId }}</strong></p>
      <p class="text-sm">Jenis surat: {{ submitted.purpose }}</p>
      <div class="flex gap-3">
        <AppButton label="Lihat Pengelolaan Surat" @click="router.push('/letter')" />
        <AppButton label="Tambah Lagi" variant="outline" @click="resetForm" />
      </div>
    </div>

    <div v-else class="bg-white rounded-xl border p-6">
      <p v-if="errors.general" class="mb-4 text-sm text-red-600">{{ errors.general }}</p>

      <div v-if="step === 1" class="space-y-4">
        <h2 class="font-semibold text-slate-800">Pilih Kategori</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button v-for="category in categories" :key="category" class="border rounded-xl p-4 text-left hover:border-blue-500" @click="chooseCategory(category)">
            <span class="font-medium">{{ category }}</span>
            <span class="block text-xs text-slate-500 mt-1">{{ activeTypes.filter((type) => type.category === category).length }} tipe surat</span>
          </button>
        </div>
      </div>

      <div v-else-if="step === 2" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-slate-800">Pilih Tipe Surat</h2>
          <AppButton label="Kembali" size="small" variant="outline" @click="step = 1" />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button v-for="type in typesInCategory" :key="type.letter_type_id" class="border rounded-xl p-4 text-left hover:border-blue-500" @click="chooseType(type.letter_type_id)">
            <span class="font-medium">{{ type.letter_name }}</span>
            <span class="block text-xs text-slate-500 mt-1">{{ type.code }} · {{ type.processing_time || '-' }}</span>
          </button>
        </div>
      </div>

      <div v-else class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-semibold text-slate-800">{{ selectedType?.letter_name }}</h2>
            <p class="text-xs text-slate-500">{{ selectedType?.code }} · {{ selectedType?.signer_name }}</p>
          </div>
          <AppButton label="Kembali" size="small" variant="outline" @click="step = 2" />
        </div>

        <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <AppInput v-model="form.applicant_name" label="Nama Pemohon" required />
            <p v-if="errors.applicant_name" class="text-xs text-red-600 mt-1">{{ errors.applicant_name }}</p>
          </div>
          <div>
            <AppInput v-model="form.applicant_nik" label="NIK" maxlength="16" required />
            <p v-if="errors.applicant_nik" class="text-xs text-red-600 mt-1">{{ errors.applicant_nik }}</p>
          </div>
          <AppInput v-model="form.applicant_phone" label="Nomor Telepon" />
          <div>
            <AppInput v-model="form.applicant_address" label="Alamat" required />
            <p v-if="errors.applicant_address" class="text-xs text-red-600 mt-1">{{ errors.applicant_address }}</p>
          </div>
          <AppInput v-model="form.notes" label="Catatan" />
        </section>

        <section v-if="fields.length" class="space-y-4 border-t pt-5">
          <h3 class="font-semibold text-slate-800">Data Tambahan Surat</h3>
          <div v-for="field in fields" :key="field.field_id">
            <label class="block text-sm text-slate-600">{{ field.field_label }} <span v-if="field.is_required" class="text-red-500">*</span></label>
            <select v-if="field.field_type === 'select'" v-model="dynamicValues[field.field_key]" class="mt-1 w-full border rounded-lg px-3 py-2">
              <option value="">Pilih {{ field.field_label }}</option>
              <option v-for="option in field.options || []" :key="option" :value="option">{{ option }}</option>
            </select>
            <textarea v-else-if="field.field_type === 'textarea'" v-model="dynamicValues[field.field_key]" rows="3" class="mt-1 w-full border rounded-lg px-3 py-2" />
            <input v-else v-model="dynamicValues[field.field_key]" :type="field.field_type === 'number' ? 'number' : field.field_type" class="mt-1 w-full border rounded-lg px-3 py-2" />
            <p v-if="errors[field.field_key]" class="text-xs text-red-600 mt-1">{{ errors[field.field_key] }}</p>
          </div>
        </section>

        <section v-if="documents.length" class="space-y-4 border-t pt-5">
          <h3 class="font-semibold text-slate-800">Dokumen Persyaratan</h3>
          <div v-for="document in documents" :key="document.letter_type_document_id" class="border rounded-lg p-3">
            <label class="block text-sm text-slate-600">{{ document.document_name }} <span v-if="document.is_required" class="text-red-500">*</span></label>
            <input type="file" accept=".jpg,.jpeg,.png,.pdf" class="mt-2 text-sm" @change="documentFiles[document.letter_type_document_id] = $event.target.files[0]" />
            <p v-if="errors['document_' + document.letter_type_document_id]" class="text-xs text-red-600 mt-1">{{ errors['document_' + document.letter_type_document_id] }}</p>
          </div>
        </section>

        <AppButton :label="isSubmitting ? 'Menyimpan...' : 'Simpan Pengajuan'" :disabled="isSubmitting" @click="submitForm" />
      </div>
    </div>
  </div>
</template>
