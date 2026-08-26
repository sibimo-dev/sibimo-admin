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
  { field: 'requestId', header: 'Request ID' },
  { field: 'citizenName', header: 'Nama Pemohon' },
  { field: 'citizenId', header: 'NIK' },
  { field: 'purpose', header: 'Jenis Layanan' },
  { field: 'category', header: 'Kategori' },
  { field: 'date', header: 'Tanggal Pengajuan' },
  { field: 'source', header: 'Sumber' },
]

const searchQuery = ref('')

const pendingRows = computed(() => {
  let result = rows.value.filter((r) => r.status === 'Pending')

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter(
      (r) =>
        r.requestId.toLowerCase().includes(query) ||
        (r.citizenName || '').toLowerCase().includes(query) ||
        r.citizenId.toLowerCase().includes(query),
    )
  }

  return result.sort((a, b) => new Date(a.dateValue) - new Date(b.dateValue))
})

function openVerification(data) {
  router.push(`/letter/verification/${data.requestId}`)
}

// ====== Highlight baris dari query ?highlight=REQ-xxx (dikirim dari halaman
// Pengelolaan Surat). Nyala 5 detik lalu hilang otomatis. ======
const highlightedId = ref(route.query.highlight ?? null)
let highlightTimer = null

// Lompat otomatis ke halaman paginator yang berisi baris highlight
const highlightFirst = computed(() => {
  if (!highlightedId.value) return 0
  const index = pendingRows.value.findIndex((r) => r.requestId === highlightedId.value)
  if (index === -1) return 0
  return Math.floor(index / 10) * 10
})

function scrollToHighlighted() {
  const el = document.querySelector('.row-highlight')
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

watch(
  () => route.query.highlight,
  (val) => {
    clearTimeout(highlightTimer)
    highlightedId.value = val ?? null
    if (val) {
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
      <h1 class="text-2xl font-semibold text-slate-800">Verifikasi Surat</h1>
      <p class="text-sm text-slate-500 mt-1">
        Daftar pengajuan surat yang menunggu tindakan verifikasi.
      </p>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div class="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <p class="text-sm text-slate-500">
          <span class="font-semibold text-slate-800">{{ pendingRows.length }}</span>
          surat menunggu verifikasi
        </p>
        <AppInput
          v-model="searchQuery"
          placeholder="Cari Request ID, nama, atau NIK..."
          icon="pi pi-search"
        />
      </div>

      <div class="rounded-xl border border-slate-100 overflow-hidden">
        <AppDataTable
          :columns="columns"
          :rows="pendingRows"
          data-key="requestId"
          highlight-field="requestId"
          :highlight-value="highlightedId"
          :first="highlightFirst"
        >
          <template #category="{ data }">
            <Tag :value="data.category" severity="info" />
          </template>
          <template #actions="{ data }">
            <AppButton
              label="Verifikasi"
              variant="primary"
              size="small"
              @click="openVerification(data)"
            />
          </template>
        </AppDataTable>
      </div>

      <p v-if="pendingRows.length === 0" class="text-center text-slate-400 py-10 text-sm">
        Tidak ada surat yang menunggu verifikasi saat ini.
      </p>
    </div>
  </div>
</template>