<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import AppDataTable from '@/components/common/AppDataTable.vue'
import AppButton from '@/components/common/AppButton.vue'
import { getComplaints } from '@/services/complaint.service'
import { getListCache, setListCache } from '@/services/list-cache'
const router = useRouter()
const cachedRows = getListCache('complaints')
const rows = ref(cachedRows ?? [])
const loading = ref(!cachedRows)
const loadError = ref('')
const searchQuery = ref('')
const selectedCategory = ref(null)
const selectedStatus = ref(null)
const columns = [{ field: 'complaint_code', header: 'ID / Tanggal' }, { field: 'reporter_name', header: 'Pelapor & Topik' }, { field: 'category', header: 'Kategori' }, { field: 'status', header: 'Status' }]
const statusMeta = { Submitted: { label: 'Menunggu Verifikasi', severity: 'warn' }, 'In Progress': { label: 'Sedang Diproses', severity: 'info' }, Resolved: { label: 'Selesai', severity: 'success' }, Rejected: { label: 'Ditolak', severity: 'danger' } }
const categoryMeta = { Infrastructure: 'Infrastruktur', 'Public Service': 'Pelayanan Publik', Environment: 'Lingkungan', Security: 'Keamanan', Other: 'Lainnya' }
const statusOptions = [{ label: 'Status: Semua', value: null }, ...Object.entries(statusMeta).map(([value, meta]) => ({ label: meta.label, value }))]
const categoryOptions = computed(() => [{ label: 'Kategori: Semua', value: null }, ...[...new Set(rows.value.map(r => r.category))].map(value => ({ label: categoryMeta[value] ?? value, value }))])
const filteredRows = computed(() => { const q = searchQuery.value.toLowerCase(); return rows.value.filter(r => (!q || `${r.complaint_id} ${r.reporter_name} ${r.title}`.toLowerCase().includes(q)) && (!selectedCategory.value || r.category === selectedCategory.value) && (!selectedStatus.value || r.status === selectedStatus.value)) })
const stats = computed(() => ({ total: rows.value.length, submitted: rows.value.filter(r => r.status === 'Submitted').length, progress: rows.value.filter(r => r.status === 'In Progress').length, resolved: rows.value.filter(r => r.status === 'Resolved').length }))
function mapComplaint(item) { return { ...item, complaint_code: `#AD-${String(item.submitted_at ?? '').slice(0, 10)}-${item.complaint_id}`, reporter_name: item.citizen?.full_name ?? '-', nik: item.citizen?.national_id ?? '-', phone: item.citizen?.phone_number ?? '-', address: item.citizen?.address ?? '-', submitted_at: item.submitted_at ? new Date(item.submitted_at).toLocaleString('id-ID') : '-' } }
async function loadComplaints({ background = false } = {}) {
  if (!background) loading.value = true
  try {
    const data = (await getComplaints()).map(mapComplaint)
    setListCache('complaints', data)
    rows.value = data
    loadError.value = ''
  } catch (error) {
    loadError.value = error.response?.data?.message ?? 'Gagal memuat pengaduan.'
    if (!background) rows.value = []
  } finally {
    if (!background) loading.value = false
  }
}
onMounted(() => loadComplaints({ background: Boolean(cachedRows) }))
</script>
<template><div><h1 class="text-2xl font-bold text-gray-800 m-0">Kelola Pengaduan</h1><p class="text-sm text-gray-500 mb-6">Kelola laporan pengaduan masyarakat.</p><p v-if="loadError" class="text-sm text-red-600">{{ loadError }}</p><div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"><Card><template #content><div class="text-xs text-gray-500">TOTAL ADUAN</div><div class="text-3xl font-bold mt-2">{{ stats.total }}</div></template></Card><Card><template #content><div class="text-xs text-gray-500">MENUNGGU VERIFIKASI</div><div class="text-3xl font-bold mt-2">{{ stats.submitted }}</div></template></Card><Card><template #content><div class="text-xs text-gray-500">SEDANG DIPROSES</div><div class="text-3xl font-bold mt-2">{{ stats.progress }}</div></template></Card><Card><template #content><div class="text-xs text-gray-500">SELESAI</div><div class="text-3xl font-bold mt-2">{{ stats.resolved }}</div></template></Card></div><Card><template #content><div class="flex flex-wrap gap-3 mb-4"><InputText v-model="searchQuery" placeholder="Cari ID, pelapor, atau topik..." /><Select v-model="selectedCategory" :options="categoryOptions" option-label="label" option-value="value" /><Select v-model="selectedStatus" :options="statusOptions" option-label="label" option-value="value" /></div><AppDataTable :columns="columns" :rows="filteredRows" :loading="loading" data-key="complaint_id"><template #complaint_code="{ data }"><strong>{{ data.complaint_code }}</strong><div class="text-xs text-gray-400">{{ data.submitted_at }}</div></template><template #reporter_name="{ data }"><div class="font-medium">{{ data.reporter_name }}</div><div class="text-sm font-semibold">{{ data.title }}</div><div class="text-xs text-gray-500">{{ data.description }}</div></template><template #category="{ data }"><Tag :value="categoryMeta[data.category] ?? data.category" severity="secondary" /></template><template #status="{ data }"><Tag :value="statusMeta[data.status]?.label ?? data.status" :severity="statusMeta[data.status]?.severity" /></template><template #actions="{ data }"><AppButton label="Detail" variant="secondary" outlined size="small" @click="router.push({ name: 'complaint-response', params: { id: data.complaint_id } })" /></template></AppDataTable></template></Card></div></template>
