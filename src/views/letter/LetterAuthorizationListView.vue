<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Tag from 'primevue/tag'
import AppDataTable from '@/components/common/AppDataTable.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import { useLetterStore } from '@/stores/useLetterStore'

const router = useRouter()
const route = useRoute()
const { rows } = useLetterStore()

const columns = [
  { field: 'requestId', header: 'Request ID', sortable: true },
  { field: 'citizenId', header: 'Citizen ID', sortable: true },
  { field: 'purpose', header: 'Purpose / Jenis Surat' },
  { field: 'verifiedBy', header: 'Diverifikasi Oleh', sortable: true },
  { field: 'status', header: 'Status', sortable: true },
  { field: 'authorizedBy', header: 'Authorized By', sortable: true },
  { field: 'date', header: 'Tanggal', sortable: true },
]

const tabs = [
  { key: 'Diverifikasi', label: 'Menunggu Otorisasi' },
  { key: 'Disetujui', label: 'Disetujui' },
  { key: 'Ditolak', label: 'Ditolak' },
]
const activeTab = ref('Diverifikasi')

const searchQuery = ref('')

const filteredRows = computed(() => {
  let result = rows.value.filter((r) => r.status === activeTab.value)

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter(
      (r) =>
        r.requestId.toLowerCase().includes(query) ||
        r.citizenId.toLowerCase().includes(query) ||
        r.purpose.toLowerCase().includes(query),
    )
  }

  // Default sort (dipakai saat user belum klik header manapun).
  // Setelah header diklik, DataTable PrimeVue yang ambil alih sorting-nya.
  return [...result].sort((a, b) => new Date(b.dateValue) - new Date(a.dateValue))
})

const statusColor = {
  Diverifikasi: 'info',
  Disetujui: 'success',
  Ditolak: 'danger',
}

function goToDetail(row) {
  router.push({ name: 'letter-authorization-detail', params: { id: row.id } })
}

// ====== Highlight baris dari query ?highlight=REQ-xxx (dikirim dari halaman
// Pengelolaan Surat). Nyala berkedip 5 detik lalu hilang otomatis. ======
const highlightedId = ref(route.query.highlight ?? null)
let highlightTimer = null

function scrollToHighlighted() {
  const el = document.querySelector('.row-highlight')
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function syncTabWithHighlight(id) {
  if (!id) return
  const target = rows.value.find((r) => r.requestId === id)
  if (target) activeTab.value = target.status
}

watch(
  () => route.query.highlight,
  (val) => {
    clearTimeout(highlightTimer)
    highlightedId.value = val ?? null
    if (val) {
      syncTabWithHighlight(val)
      nextTick(scrollToHighlighted)
      highlightTimer = setTimeout(() => {
        highlightedId.value = null
      }, 5000)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => clearTimeout(highlightTimer))
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-800">Otorisasi Surat</h1>
      <p class="text-sm text-slate-500 mt-1">
        Surat yang sudah diverifikasi dan menunggu penandatanganan / otorisasi.
      </p>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div class="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div class="flex items-center gap-2 flex-wrap">
          <AppButton
            v-for="tab in tabs"
            :key="tab.key"
            :label="tab.label"
            size="small"
            :variant="activeTab === tab.key ? 'primary' : 'outline'"
            @click="activeTab = tab.key"
          />
        </div>

        <AppInput
          v-model="searchQuery"
          placeholder="Cari Ticket ID atau NIK..."
          icon="pi pi-search"
        />
      </div>

      <div class="rounded-xl border border-slate-100 overflow-hidden">
        <AppDataTable
          :columns="columns"
          :rows="filteredRows"
          data-key="requestId"
          highlight-field="requestId"
          :highlight-value="highlightedId"
        >
          <template #status="{ data }">
            <Tag :value="data.status" :severity="statusColor[data.status]" />
          </template>
          <template #actions="{ data }">
            <AppButton
              :label="data.status === 'Diverifikasi' ? 'Proses Otorisasi' : 'Lihat Detail'"
              variant="primary"
              size="small"
              @click="goToDetail(data)"
            />
          </template>
        </AppDataTable>
      </div>

      <p v-if="filteredRows.length === 0" class="text-center text-slate-400 py-10 text-sm">
        Tidak ada surat pada kategori ini.
      </p>
    </div>
  </div>
</template>