<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Tag from 'primevue/tag'
import AppDataTable from '@/components/common/AppDataTable.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import { useLetterStore } from '@/stores/useLetterStore'

const router = useRouter()
const { rows } = useLetterStore()

// sortable: true -> kolom ini bisa diklik headernya untuk sort (seperti tabel Berita).
// Kolom seperti Signature Type/Verified By/Authorized By/Sumber tidak sortable,
// mengikuti pola "Gambar" & "Aksi" di tabel Berita yang juga tidak diberi ikon sort.
const columns = [
  { field: 'requestId', header: 'Request ID', sortable: true },
  { field: 'citizenId', header: 'Citizen ID', sortable: true },
  { field: 'purpose', header: 'Purpose / Service Type', sortable: true },
  { field: 'status', header: 'Status', sortable: true },
  { field: 'signatureType', header: 'Signature Type' },
  { field: 'verifiedBy', header: 'Verified By' },
  { field: 'authorizedBy', header: 'Authorized By' },
  { field: 'date', header: 'Date', sortable: true },
  { field: 'source', header: 'Sumber' },
]

// --- Filter status ---
const statusFilters = ['Semua Status', 'Pending', 'Diverifikasi', 'Disetujui', 'Ditolak']
const activeFilter = ref('Semua Status')

// --- Search ---
const searchQuery = ref('')

// --- Sort (klik header kolom, mengikuti gaya tabel Berita) ---
// sortOrder: 1 = ascending (A-Z / terlama dulu), -1 = descending (Z-A / terbaru dulu)
const sortField = ref('dateValue')
const sortOrder = ref(-1)

function handleSort(field) {
  if (sortField.value === field) {
    sortOrder.value *= -1
  } else {
    sortField.value = field
    sortOrder.value = 1
  }
  resetPage()
}

// Untuk kolom "date" kita sebenarnya sort berdasarkan dateValue (objek Date asli),
// bukan teks tanggal yang sudah diformat.
function sortValue(row, field) {
  if (field === 'date') return new Date(row.dateValue).getTime()
  return row[field]
}

// --- Gabungan filter status + search + sort ---
const filteredRows = computed(() => {
  let result = [...rows.value]

  if (activeFilter.value !== 'Semua Status') {
    result = result.filter((r) => r.status === activeFilter.value)
  }

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter(
      (r) =>
        r.requestId.toLowerCase().includes(query) ||
        r.citizenId.toLowerCase().includes(query) ||
        r.purpose.toLowerCase().includes(query),
    )
  }

  const field = sortField.value === 'date' ? 'date' : sortField.value
  result.sort((a, b) => {
    const aVal = sortValue(a, field)
    const bVal = sortValue(b, field)
    if (aVal < bVal) return -1 * sortOrder.value
    if (aVal > bVal) return 1 * sortOrder.value
    return 0
  })

  return result
})

// --- Status badge color ---
const statusColor = {
  Pending: 'warn',
  Diverifikasi: 'info',
  Disetujui: 'success',
  Ditolak: 'danger',
}

// --- Tombol aksi hanya untuk status yang butuh tindakan lanjutan.
// Disetujui/Ditolak tidak ada aksi -- notif WA sudah otomatis terkirim
// begitu proses verifikasi/otorisasi selesai. ---
const actionLabel = {
  Pending: 'Verifikasi',
  Diverifikasi: 'Otorisasi',
}

// Route tujuan per status -- disertai highlight query supaya baris surat
// yang diklik langsung ditunjukkan (kedip 5 detik) di halaman tujuan.
const actionRoute = {
  Pending: { name: 'letter-verification' },
  Diverifikasi: { name: 'letter-authorization' },
}

function handleAction(data) {
  const target = actionRoute[data.status]
  if (!target) return
  router.push({
    ...target,
    query: { highlight: data.requestId },
  })
}

// --- Pagination ---
const currentPage = ref(1)
const pageSize = ref(4)
const totalData = computed(() => filteredRows.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalData.value / pageSize.value)))

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const showingFrom = computed(() =>
  totalData.value === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1,
)
const showingTo = computed(() =>
  Math.min(currentPage.value * pageSize.value, totalData.value),
)

function resetPage() {
  currentPage.value = 1
}

function goToTambahSurat() {
  router.push('/letter/create')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="mb-6 flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-slate-800">Pengelolaan Layanan Surat</h1>
        <p class="text-sm text-slate-500 mt-1">Kelola permintaan surat warga secara terpusat.</p>
      </div>
      <AppButton
        label="+ Tambah Surat"
        variant="primary"
        @click="goToTambahSurat"
      />
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <!-- Toolbar: filter status di kiri, search di kanan (gaya toolbar tabel Berita) -->
      <div class="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div class="flex items-center gap-2 flex-wrap">
          <AppButton
            v-for="filter in statusFilters"
            :key="filter"
            :label="filter"
            size="small"
            :variant="activeFilter === filter ? 'primary' : 'outline'"
            @click="activeFilter = filter; resetPage()"
          />
        </div>

        <AppInput
          v-model="searchQuery"
          placeholder="Cari Ticket ID atau Nama..."
          icon="pi pi-search"
          class="w-72"
          @update:model-value="resetPage"
        />
      </div>

      <!-- Table: sort dilakukan lewat klik header kolom, bukan dropdown -->
      <div class="rounded-xl border border-slate-100 overflow-hidden">
        <AppDataTable
          :columns="columns"
          :rows="paginatedRows"
          :sort-field="sortField"
          :sort-order="sortOrder"
          @sort="handleSort"
        >
          <template #status="{ data }">
            <Tag :value="data.status" :severity="statusColor[data.status]" />
          </template>
          <template #actions="{ data }">
            <AppButton
              v-if="actionLabel[data.status]"
              :label="actionLabel[data.status]"
              variant="primary"
              size="small"
              @click="handleAction(data)"
            />
            <span v-else class="text-slate-300 text-sm">—</span>
          </template>
        </AppDataTable>
      </div>

      <!-- Empty state -->
      <p v-if="totalData === 0" class="text-center text-slate-400 py-10 text-sm">
        Tidak ada data yang cocok dengan pencarian/filter.
      </p>

      <!-- Pagination -->
      <div v-else class="flex items-center justify-between mt-6">
        <p class="text-sm text-slate-500">
          Menampilkan
          <span class="font-medium text-slate-700">{{ showingFrom }}</span>
          -
          <span class="font-medium text-slate-700">{{ showingTo }}</span>
          dari
          <span class="font-medium text-slate-700">{{ totalData }}</span>
          data
        </p>

        <div class="flex items-center gap-1">
          <button
            class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            :disabled="currentPage === 1"
            @click="currentPage > 1 && currentPage--"
          >
            <i class="pi pi-chevron-left text-xs"></i>
          </button>

          <button
            v-for="page in totalPages"
            :key="page"
            class="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors"
            :class="currentPage === page
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'"
            @click="currentPage = page"
          >
            {{ page }}
          </button>

          <button
            class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            :disabled="currentPage === totalPages"
            @click="currentPage < totalPages && currentPage++"
          >
            <i class="pi pi-chevron-right text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>