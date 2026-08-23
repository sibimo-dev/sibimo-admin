<script setup>
/**
 * Halaman Pengelolaan Layanan Surat.
 * rows berasal dari useLetterStore (dummy, module-level state) supaya
 * surat yang dibuat manual lewat LetterCreateView.vue langsung tampil di sini.
 * Ganti useLetterStore dengan surat.service.js begitu backend siap.
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Tag from 'primevue/tag'
import Select from 'primevue/select'
import AppDataTable from '@/components/common/AppDataTable.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import { useLetterStore } from '@/stores/useLetterStore'

const router = useRouter()
const { rows } = useLetterStore()

const columns = [
  { field: 'requestId', header: 'Request ID' },
  { field: 'citizenId', header: 'Citizen ID' },
  { field: 'purpose', header: 'Purpose / Service Type' },
  { field: 'status', header: 'Status' },
  { field: 'signatureType', header: 'Signature Type' },
  { field: 'verifiedBy', header: 'Verified By' },
  { field: 'authorizedBy', header: 'Authorized By' },
  { field: 'date', header: 'Date' },
  { field: 'source', header: 'Sumber' },
]

// --- Filter status ---
const statusFilters = ['Semua Status', 'Pending', 'Diverifikasi', 'Disetujui', 'Ditolak']
const activeFilter = ref('Semua Status')

// --- Sort dropdown ---
const sortOptions = [
  { label: 'Sort by Date: 7 hari', value: '7d' },
  { label: 'Sort by Date: 30 hari', value: '30d' },
  { label: 'Sort by Date: Terbaru', value: 'newest' },
  { label: 'Sort by Date: Terlama', value: 'oldest' },
]
// Default "newest" -- filter "7 hari"/"30 hari" dihitung dari tanggal sistem berjalan,
// jadi dummy data lama gampang ke-filter habis kalau dipakai sebagai default.
const selectedSort = ref('newest')

// --- Search ---
const searchQuery = ref('')

// --- Gabungan filter status + search + sort/filter tanggal ---
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

  const now = new Date()
  if (selectedSort.value === '7d') {
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)
    result = result.filter((r) => new Date(r.dateValue) >= sevenDaysAgo)
    result.sort((a, b) => new Date(b.dateValue) - new Date(a.dateValue))
  } else if (selectedSort.value === '30d') {
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 30)
    result = result.filter((r) => new Date(r.dateValue) >= thirtyDaysAgo)
    result.sort((a, b) => new Date(b.dateValue) - new Date(a.dateValue))
  } else if (selectedSort.value === 'newest') {
    result.sort((a, b) => new Date(b.dateValue) - new Date(a.dateValue))
  } else if (selectedSort.value === 'oldest') {
    result.sort((a, b) => new Date(a.dateValue) - new Date(b.dateValue))
  }

  return result
})

// --- Status badge color ---
const statusColor = {
  Pending: 'warn',
  Diverifikasi: 'info',
  Disetujui: 'success',
  Ditolak: 'danger',
}

// --- Tombol aksi dinamis sesuai status ---
const actionLabel = {
  Pending: 'Verifikasi',
  Diverifikasi: 'Otorisasi',
  Disetujui: 'Kirim Notif',
  Ditolak: 'Kirim Notif',
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
      <!-- Filter, sort, search -->
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

        <div class="flex items-center gap-3">
          <Select
            v-model="selectedSort"
            :options="sortOptions"
            option-label="label"
            option-value="value"
            class="w-56"
            @change="resetPage"
          />
          <AppInput
            v-model="searchQuery"
            placeholder="Cari Ticket ID atau Nama..."
            icon="pi pi-search"
            @update:model-value="resetPage"
          />
        </div>
      </div>

      <!-- Table -->
      <div class="rounded-xl border border-slate-100 overflow-hidden">
        <AppDataTable :columns="columns" :rows="paginatedRows">
          <template #status="{ data }">
            <Tag :value="data.status" :severity="statusColor[data.status]" />
          </template>
          <template #actions="{ data }">
            <AppButton
              :label="actionLabel[data.status]"
              variant="link"
              size="small"
              class="text-blue-600 hover:text-blue-700"
            />
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