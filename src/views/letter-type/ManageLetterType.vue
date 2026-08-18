<script setup>
/**
 * Letter Type Form (Create / Edit)
 * Route name: letter-type-manage, path: letter-type/:id (id = 'new' for create mode)
 *
 * NOTE: Fields below are mapped to assumed ERD tables:
 * - letter_types: code, number_prefix, letter_name, category, processing_time,
 *   signature_method, description, is_active, signer_id, updated_at, updated_by
 * - letter_type_documents: id, letter_type_id, document_name, description, is_required
 *
 * Confirm actual column/table names against your ERD and rename accordingly.
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import Checkbox from 'primevue/checkbox'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppModal from '@/components/common/AppModal.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isNew = computed(() => route.params.id === 'new' || !route.params.id)
const isLoading = ref(false)
const isSaving = ref(false)

// ====== Dropdown options (replace with master data fetch later) ======
const categoryOptions = [
  { label: 'Keterangan', value: 'Keterangan' },
  { label: 'Pengantar', value: 'Pengantar' },
  { label: 'Permohonan', value: 'Permohonan' },
  { label: 'Rekomendasi', value: 'Rekomendasi' },
]

const signatureMethodOptions = [
  { label: 'Digital (TTE)', value: 'digital' },
  { label: 'Manual (Tanda Tangan Basah)', value: 'manual' },
]

const signerOptions = [
  { label: 'Ahmad Hidayat - Kepala Desa', value: 1 },
  { label: 'Rasyifa Anom S., AMd.Kes - Kasi Kesejahteraan', value: 2 },
  { label: 'Siti Aminah - Kasi Pemerintahan', value: 3 },
]

// ====== Main form ======
const form = reactive({
  letter_type_id: null,
  code: '',
  number_prefix: '',
  letter_name: '',
  category: null,
  processing_time: '',
  signature_method: null,
  description: '',
  is_active: true,
  signer_id: null,
})

const descriptionLength = computed(() => form.description.length)

// ====== Document requirements ======
const requirements = ref([
  { id: 1, document_name: 'Kartu Tanda Penduduk (KTP)', description: 'Fotokopi KTP pemohon', is_required: true },
  { id: 2, document_name: 'Kartu Keluarga (KK)', description: 'Fotokopi KK pemohon', is_required: true },
  { id: 3, document_name: 'Foto Tempat Usaha', description: 'Minimal 2 foto dari sisi berbeda', is_required: false },
])

const showRequirementModal = ref(false)
const requirementForm = reactive({ id: null, document_name: '', description: '', is_required: false })

function openAddRequirement() {
  requirementForm.id = null
  requirementForm.document_name = ''
  requirementForm.description = ''
  requirementForm.is_required = false
  showRequirementModal.value = true
}

function saveRequirement() {
  if (!requirementForm.document_name) {
    toast.add({ severity: 'warn', summary: 'Nama dokumen wajib diisi', life: 2000 })
    return
  }
  if (requirementForm.id) {
    const idx = requirements.value.findIndex((r) => r.id === requirementForm.id)
    requirements.value[idx] = { ...requirementForm }
  } else {
    requirements.value.push({ ...requirementForm, id: Date.now() })
  }
  showRequirementModal.value = false
}

function removeRequirement(requirement) {
  requirements.value = requirements.value.filter((r) => r.id !== requirement.id)
}

// ====== Meta info (last updated) ======
const meta = reactive({
  updated_at: '24 Okt 2023, 14:30 WIB',
  updated_by: 'Admin SIBIMO',
})

// ====== Load data on edit mode ======
onMounted(async () => {
  if (isNew.value) return
  isLoading.value = true
  try {
    // TODO: replace with real API call
    // const data = await letterTypeService.getById(route.params.id)
    const dummy = {
      letter_type_id: route.params.id,
      code: 'SKU-01',
      number_prefix: '581/SKU/',
      letter_name: 'Surat Keterangan Usaha',
      category: 'Keterangan',
      processing_time: '15 menit',
      signature_method: 'digital',
      description: 'Surat keterangan yang menyatakan bahwa pemohon memiliki usaha aktif di wilayah desa.',
      is_active: true,
      signer_id: 1,
    }
    Object.assign(form, dummy)
  } finally {
    isLoading.value = false
  }
})

// ====== Save / cancel ======
function handleCancel() {
  router.push({ name: 'letter-type-list' })
}

async function handleSave() {
  if (!form.code || !form.number_prefix || !form.letter_name || !form.category || !form.signature_method) {
    toast.add({ severity: 'warn', summary: 'Lengkapi field wajib (*) terlebih dahulu', life: 2500 })
    return
  }

  isSaving.value = true
  try {
    // TODO: replace with real API call
    // if (isNew.value) await letterTypeService.create({ ...form, requirements: requirements.value })
    // else await letterTypeService.update(form.letter_type_id, { ...form, requirements: requirements.value })
    await new Promise((resolve) => setTimeout(resolve, 600))
    toast.add({ severity: 'success', summary: 'Perubahan berhasil disimpan', life: 2000 })
    router.push({ name: 'letter-type-list' })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800 m-0">Kelola Tipe Surat</h1>
      <p class="text-sm text-gray-500 mt-1 mb-0">
        Tambahkan atau edit konfigurasi tipe layanan surat. Pastikan kode unik dan template view sesuai.
      </p>
    </div>

    <!--
      Informasi Dasar & Penandatangan: SENGAJA full-width, TIDAK di dalam
      grid 2 kolom. Sebelumnya kedua section ini ada di kolom kiri (1fr)
      sementara sidebar (Terakhir Diubah + tombol) ada di kolom kanan
      (320px) untuk SELURUH tinggi halaman -- karena sidebar didorong ke
      bawah (justify-end), area kanan jadi kosong melompong pas sejajar
      dengan section ini. Wireframe-nya split 2 kolom cuma di baris
      Persyaratan Dokumen (lihat di bawah), bukan dari atas.
    -->
    <div class="flex flex-col gap-5 mb-5">
      <!-- Basic Info -->
      <Card>
        <template #content>
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-base font-semibold text-gray-800 m-0">Informasi Dasar</h2>
            <div class="flex items-center gap-2">
              <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Status:</span>
              <ToggleSwitch v-model="form.is_active" />
              <span class="text-sm font-medium text-gray-700">
                {{ form.is_active ? 'Aktif' : 'Nonaktif' }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppInput v-model="form.code" label="Kode Tipe Surat" placeholder="e.g., SKU-01" required />
            <AppInput v-model="form.number_prefix" label="Prefix Penomoran" placeholder="e.g., 400/SKU/" required />
          </div>

          <div class="mt-4">
            <AppInput
              v-model="form.letter_name"
              label="Nama Layanan Surat"
              placeholder="e.g., Surat Keterangan Usaha"
              required
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Kategori Layanan <span class="text-red-500">*</span>
              </label>
              <Select
                v-model="form.category"
                :options="categoryOptions"
                option-label="label"
                option-value="value"
                placeholder="Pilih Kategori"
                class="w-full"
              />
            </div>
            <AppInput v-model="form.processing_time" label="Estimasi Proses" placeholder="e.g., 15 menit" />
          </div>

          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Metode Tanda Tangan <span class="text-red-500">*</span>
            </label>
            <Select
              v-model="form.signature_method"
              :options="signatureMethodOptions"
              option-label="label"
              option-value="value"
              placeholder="Pilih Metode"
              class="w-full"
            />
          </div>

          <div class="mt-4">
            <div class="flex items-center justify-between mb-1">
              <label class="block text-sm font-medium text-gray-700">Deskripsi</label>
              <span class="text-xs text-gray-400">{{ descriptionLength }}/255</span>
            </div>
            <Textarea
              v-model="form.description"
              :maxlength="255"
              rows="3"
              class="w-full"
              placeholder="Jelaskan kegunaan dan informasi singkat mengenai layanan surat ini..."
            />
          </div>
        </template>
      </Card>

      <!-- Signer -->
      <Card>
        <template #content>
          <h2 class="text-base font-semibold text-gray-800 mb-5">Penandatangan</h2>

          <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-4 items-start">
            <label class="text-sm font-medium text-gray-700 pt-2 sm:text-right">
              Pilih Pejabat Penandatangan <span class="text-red-500">*</span>
            </label>
            <Select
              v-model="form.signer_id"
              :options="signerOptions"
              option-label="label"
              option-value="value"
              placeholder="Pilih Pejabat"
              class="w-full"
            />
          </div>
        </template>
      </Card>
    </div>

    <!--
      Baris terakhir: split 2 kolom SEKARANG mulai di sini saja --
      Persyaratan Dokumen (kiri, lebar) + Terakhir Diubah & tombol
      (kanan, sempit) -- sesuai wireframe.
    -->
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
      <!-- Document Requirements -->
      <Card>
        <template #content>
          <div class="flex items-center justify-between mb-4">
            <h2 class="flex items-center gap-2 text-base font-semibold text-gray-800 m-0">
              <i class="pi pi-folder text-gray-500"></i> Persyaratan Dokumen
            </h2>
            <AppButton
              label="Tambah Dokumen"
              icon="pi pi-plus"
              size="small"
              variant="secondary"
              @click="openAddRequirement"
            />
          </div>

          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wide text-gray-400 border-b border-gray-200">
                <th class="py-2 font-medium">Nama Dokumen</th>
                <th class="py-2 font-medium">Deskripsi Singkat</th>
                <th class="py-2 font-medium text-center w-20">Wajib</th>
                <th class="py-2 font-medium text-center w-16">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="requirement in requirements"
                :key="requirement.id"
                class="border-b border-gray-100 last:border-0"
              >
                <td class="py-3 pr-2 font-medium text-gray-800">{{ requirement.document_name }}</td>
                <td class="py-3 pr-2 text-gray-500">{{ requirement.description }}</td>
                <td class="py-3 text-center">
                  <Checkbox v-model="requirement.is_required" :binary="true" />
                </td>
                <td class="py-3 text-center">
                  <button class="text-gray-400 hover:text-red-500" @click="removeRequirement(requirement)">
                    <i class="pi pi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="requirements.length === 0">
                <td colspan="4" class="py-6 text-center text-gray-400 text-sm">
                  Belum ada persyaratan dokumen.
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </Card>

      <!-- Sidebar: meta info + tombol -->
      <div class="flex flex-col gap-4">
        <Card v-if="!isNew">
          <template #content>
            <div class="flex items-start gap-3">
              <i class="pi pi-history text-gray-400 mt-0.5"></i>
              <div class="text-sm">
                <div class="text-gray-500">Terakhir Diubah</div>
                <div class="font-medium text-gray-800">{{ meta.updated_at }}</div>
                <div class="text-gray-500">Oleh: {{ meta.updated_by }}</div>
              </div>
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-2">
              <AppButton
                label="Simpan Perubahan"
                icon="pi pi-save"
                variant="primary"
                class="w-full"
                :loading="isSaving"
                @click="handleSave"
              />
              <AppButton label="Batal" variant="secondary" outlined class="w-full" @click="handleCancel" />
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Add/Edit Document Requirement Modal -->
    <AppModal
      v-model="showRequirementModal"
      :title="requirementForm.id ? 'Edit Dokumen Syarat' : 'Tambah Dokumen Syarat'"
      @save="saveRequirement"
    >
      <AppInput v-model="requirementForm.document_name" label="Nama Dokumen" required />
      <AppInput v-model="requirementForm.description" label="Deskripsi Singkat" />
      <div class="flex items-center gap-2 mt-2">
        <Checkbox v-model="requirementForm.is_required" :binary="true" input-id="requirementRequired" />
        <label for="requirementRequired" class="text-sm text-gray-700">Wajib diunggah</label>
      </div>
    </AppModal>
  </div>
</template>