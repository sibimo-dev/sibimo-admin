<script setup>
/**
 * Halaman Pengelolaan Tipe Surat
 * Pola: AppDataTable (list custom via slot) + useConfirm (hapus)
 * Create/Edit dipindah ke halaman terpisah: ManageLetterType.vue (route: letter-type-manage)
 *
 * CATATAN PENTING:
 * Kolom `category` TIDAK ADA di tabel `letter_types` pada migrasi backend
 * saat ini (hanya ada: code, letter_name, description, blade_view,
 * number_prefix, is_active). Begitu juga kolom `processing_time`,
 * `document_count`, `signer_name`, `signature_method` pada wireframe ini —
 * semuanya masih dummy/placeholder di frontend. Perlu ditambahkan dulu ke
 * migrasi & ERD backend kalau memang mau dipakai sungguhan.
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import AppDataTable from '@/components/common/AppDataTable.vue'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

// ====== Table columns ======
const columns = [
  { field: 'letter_name', header: 'Nama Surat' },
  { field: 'category', header: 'Kategori' },
  { field: 'number_prefix', header: 'Kode Nomor' },
  { field: 'processing_time', header: 'Estimasi Proses' },
  { field: 'document_count', header: 'Dok. Syarat' },
  { field: 'signer_name', header: 'Penandatanganan' },
  { field: 'signature_method', header: 'Metode TTD' },
  { field: 'is_active', header: 'Status' },
]

// ====== Dummy data (replace with real API fetch later) ======
const rows = ref([
  {
    letter_type_id: 1,
    letter_name: 'Surat Keterangan Tidak Mampu Umum',
    category: 'Keterangan',
    number_prefix: '470/',
    processing_time: '15 menit',
    document_count: 2,
    signer_name: 'Rasyifa Anom S., AMd.Kes',
    signature_method: 'digital',
    is_active: true,
  },
  {
    letter_type_id: 2,
    letter_name: 'Surat Pengantar SKCK',
    category: 'Pengantar',
    number_prefix: '330/',
    processing_time: '15 menit',
    document_count: 2,
    signer_name: 'Rasyifa Anom S., AMd.Kes',
    signature_method: 'digital',
    is_active: true,
  },
  {
    letter_type_id: 3,
    letter_name: 'Surat Keterangan Usaha',
    category: 'Keterangan',
    number_prefix: '581/',
    processing_time: '15 menit',
    document_count: 2,
    signer_name: 'Rasyifa Anom S., AMd.Kes',
    signature_method: 'digital',
    is_active: true,
  },
])

// ====== Category (for filter & badge severity) ======
const categorySeverity = {
  Keterangan: 'info',
  Pengantar: 'warn',
  Permohonan: 'success',
  Rekomendasi: 'help',
}
function severityFor(category) {
  return categorySeverity[category] ?? 'secondary'
}

const categoryOptions = computed(() => {
  const unique = [...new Set(rows.value.map((r) => r.category))]
  return [{ label: 'Semua Kategori', value: null }, ...unique.map((c) => ({ label: c, value: c }))]
})

// ====== Search & filter ======
const searchQuery = ref('')
const selectedCategory = ref(null)

const filteredRows = computed(() => {
  return rows.value.filter((r) => {
    const matchSearch =
      !searchQuery.value ||
      r.letter_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      r.number_prefix.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCategory = !selectedCategory.value || r.category === selectedCategory.value
    return matchSearch && matchCategory
  })
})

// ====== Stats ======
const stats = computed(() => {
  const total = rows.value.length
  const active = rows.value.filter((r) => r.is_active).length
  const inactive = total - active
  const categoryCount = new Set(rows.value.map((r) => r.category)).size
  return { total, active, inactive, categoryCount }
})

// ====== Toggle active/inactive status ======
async function toggleStatus(data) {
  // TODO: call API here
  // await letterTypeService.updateStatus(data.letter_type_id, data.is_active)
  toast.add({
    severity: data.is_active ? 'success' : 'secondary',
    summary: `Status "${data.letter_name}" diubah menjadi ${data.is_active ? 'Aktif' : 'Nonaktif'}`,
    life: 2000,
  })
}

// ====== Navigate to create/manage page ======
function openCreate() {
  router.push({ name: 'letter-type-manage', params: { id: 'new' } })
}

function handleKelola(data) {
  router.push({ name: 'letter-type-manage', params: { id: data.letter_type_id } })
}

// ====== Delete ======
function handleDelete(data) {
  confirm.require({
    message: `Hapus tipe surat "${data.letter_name}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: () => {
      rows.value = rows.value.filter((r) => r.letter_type_id !== data.letter_type_id)
      toast.add({ severity: 'success', summary: 'Berhasil dihapus', life: 2000 })
    },
  })
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800 m-0">Pengelolaan Tipe Surat</h1>
      <p class="text-sm text-gray-500 mt-1 mb-0">
        Kelola daftar tipe surat yang tersedia untuk layanan administrasi desa.
      </p>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <template #content>
          <div class="text-sm text-gray-500 mb-2">Total Tipe Surat</div>
          <div class="text-3xl font-bold text-gray-800">{{ stats.total }}</div>
          <div class="text-xs text-gray-400 mt-1">Terdaftar di sistem</div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
            <span class="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
            Aktif
          </div>
          <div class="text-3xl font-bold text-gray-800">{{ stats.active }}</div>
          <div class="text-xs text-gray-400 mt-1">Dapat diajukan warga</div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
            <span class="w-2 h-2 rounded-full bg-gray-400 inline-block"></span>
            Nonaktif / Draft
          </div>
          <div class="text-3xl font-bold text-gray-800">{{ stats.inactive }}</div>
          <div class="text-xs text-gray-400 mt-1">Belum lengkap konfigurasi</div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="text-sm text-gray-500 mb-2">Kategori Layanan</div>
          <div class="text-3xl font-bold text-gray-800">{{ stats.categoryCount }}</div>
          <div class="text-xs text-gray-400 mt-1">Keterangan, Pengantar, dll.</div>
        </template>
      </Card>
    </div>

    <!-- Table Content -->
    <Card>
      <template #content>
        <!-- Toolbar: search + filter + add -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div class="flex flex-col sm:flex-row gap-3 flex-1">
            <IconField class="w-full sm:w-72">
              <InputIcon class="pi pi-search" />
              <InputText v-model="searchQuery" placeholder="Cari nama surat / kode..." class="w-full" />
            </IconField>

            <Select
              v-model="selectedCategory"
              :options="categoryOptions"
              option-label="label"
              option-value="value"
              placeholder="Semua Kategori"
              class="w-full sm:w-52"
            />
          </div>

          <AppButton
            label="Tambah Tipe Surat Baru"
            icon="pi pi-plus"
            variant="primary"
            @click="openCreate"
          />
        </div>

        <!-- Table -->
        <AppDataTable :columns="columns" :rows="filteredRows">
          <template #letter_name="{ data }">
            <span class="font-medium text-gray-800">{{ data.letter_name }}</span>
          </template>

          <template #category="{ data }">
            <Tag :value="data.category" :severity="severityFor(data.category)" rounded />
          </template>

          <template #document_count="{ data }">
            <span class="flex items-center gap-1.5 text-gray-600">
              <i class="pi pi-file text-gray-400"></i>
              {{ data.document_count }} dokumen
            </span>
          </template>

          <template #signer_name="{ data }">
            <span class="text-gray-700">{{ data.signer_name }}</span>
          </template>

          <template #signature_method="{ data }">
            <Tag value="Digital" severity="contrast" rounded />
          </template>

          <template #is_active="{ data }">
            <ToggleSwitch v-model="data.is_active" @change="toggleStatus(data)" />
          </template>

          <template #actions="{ data }">
            <button
              class="text-sm font-medium text-gray-700 hover:text-gray-900 inline-flex items-center gap-1"
              @click="handleKelola(data)"
            >
              Kelola <i class="pi pi-arrow-right text-xs"></i>
            </button>
            <AppButton icon="pi pi-trash" variant="ghost" size="small" @click="handleDelete(data)" />
          </template>
        </AppDataTable>
      </template>
    </Card>
  </div>
</template>