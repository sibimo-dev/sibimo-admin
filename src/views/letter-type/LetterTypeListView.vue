<script setup>
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
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import AppButton from '@/components/common/AppButton.vue'
import { useLetterTypeStore } from '@/stores/useLetterTypeStore'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()
const { rows, removeLetterType, updateLetterType } = useLetterTypeStore()

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

function formatCreatedAt(isoString) {
  if (!isoString) return '-'
  return new Date(isoString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

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
  updateLetterType(data.letter_type_id, { is_active: data.is_active })
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
      removeLetterType(data.letter_type_id)
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

        <!-- Table: DataTable/Column PrimeVue langsung, semua kolom sortable.
             Default sort: created_at terbaru dulu (sortOrder -1). -->
        <DataTable
          :value="filteredRows"
          data-key="letter_type_id"
          sort-field="created_at"
          :sort-order="-1"
          removable-sort
          paginator
          :rows="10"
          :rows-per-page-options="[10, 20, 50]"
          class="p-datatable-sm"
          responsive-layout="scroll"
        >
          <Column field="letter_name" header="Nama Surat" sortable>
            <template #body="{ data }">
              <span class="font-medium text-gray-800">{{ data.letter_name }}</span>
            </template>
          </Column>

          <Column field="category" header="Kategori" sortable>
            <template #body="{ data }">
              <Tag :value="data.category" :severity="severityFor(data.category)" rounded />
            </template>
          </Column>

          <Column field="number_prefix" header="Kode Nomor" sortable></Column>

          <Column field="processing_time" header="Estimasi Proses" sortable></Column>

          <Column field="document_count" header="Dok. Syarat" sortable>
            <template #body="{ data }">
              <span class="flex items-center gap-1.5 text-gray-600">
                <i class="pi pi-file text-gray-400"></i>
                {{ data.document_count }} dokumen
              </span>
            </template>
          </Column>

          <Column field="signer_name" header="Penandatanganan" sortable>
            <template #body="{ data }">
              <span class="text-gray-700">{{ data.signer_name }}</span>
            </template>
          </Column>

          <Column field="signature_method" header="Metode TTD" sortable>
            <template #body>
              <Tag value="Digital" severity="contrast" rounded />
            </template>
          </Column>

          <!-- Kolom baru: Tanggal Dibuat, dasar sorting yang diminta -->
          <Column field="created_at" header="Tanggal Dibuat" sortable>
            <template #body="{ data }">
              <span class="text-gray-600">{{ formatCreatedAt(data.created_at) }}</span>
            </template>
          </Column>

          <Column field="is_active" header="Status" sortable>
            <template #body="{ data }">
              <ToggleSwitch v-model="data.is_active" @change="toggleStatus(data)" />
            </template>
          </Column>

          <Column header="Aksi">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <button
                  class="text-sm font-medium text-gray-700 hover:text-gray-900 inline-flex items-center gap-1"
                  @click="handleKelola(data)"
                >
                  Kelola <i class="pi pi-arrow-right text-xs"></i>
                </button>
                <AppButton icon="pi pi-trash" variant="ghost" size="small" @click="handleDelete(data)" />
              </div>
            </template>
          </Column>

          <template #empty>
            <p class="text-center text-gray-400 py-10 text-sm">
              Tidak ada tipe surat yang cocok dengan pencarian/filter.
            </p>
          </template>
        </DataTable>
      </template>
    </Card>
  </div>
</template>