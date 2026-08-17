<script setup>
/**
 * Complaint List View
 * Field mengikuti tabel `complaints`: complaint_id, citizen_id, category
 * (Infrastructure/Public Service/Environment/Security/Other), title,
 * description, status (Submitted/In Progress/Resolved/Rejected),
 * submitted_at, resolved_at.
 *
 * NOTE: Field `reporter_name`, `rt_rw`, `priority` pada wireframe ini
 * belum tentu ada langsung di tabel `complaints` -- kemungkinan reporter_name
 * & rt_rw berasal dari join ke tabel `citizens`, dan `priority` mungkin
 * kolom tambahan yang belum ada di ERD. Perlu dikonfirmasi & disesuaikan
 * saat integrasi API.
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import AppDataTable from '@/components/common/AppDataTable.vue'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()

// ====== Table columns ======
const columns = [
  { field: 'complaint_code', header: 'ID / Tanggal' },
  { field: 'reporter_name', header: 'Pelapor & Topik' },
  { field: 'category', header: 'Kategori' },
  { field: 'priority', header: 'Prioritas' },
  { field: 'status', header: 'Status' },
]

// ====== Dummy data (replace with real API fetch later) ======
const rows = ref([
  {
    complaint_id: 89,
    complaint_code: '#AD-2410-089',
    submitted_at: '12 Okt 2024, 08:45 WIB',
    reporter_name: 'Ghiska',
    rt_rw: 'RT 03 / RW 01',
    title: 'Lampu Jalan Mati di Jl. Merdeka',
    description: 'Lampu penerangan jalan utama mati total sejak 3 hari lalu, membahayakan pengendara saat malam hari.',
    category: 'Infrastructure',
    priority: 'high',
    status: 'submitted',
  },
  {
    complaint_id: 88,
    complaint_code: '#AD-2410-088',
    submitted_at: '11 Okt 2024, 14:20 WIB',
    reporter_name: 'Namira',
    rt_rw: 'RT 01 / RW 02',
    title: 'Bantuan Sosial Belum Merata',
    description: 'Beberapa warga lansia di RT 01 belum terdata untuk penerimaan bansos bulan ini mohon dicek kembali.',
    category: 'Public Service',
    priority: 'medium',
    status: 'in_progress',
  },
  {
    complaint_id: 85,
    complaint_code: '#AD-2410-085',
    submitted_at: '10 Okt 2024, 09:15 WIB',
    reporter_name: 'Heru Susanto',
    rt_rw: 'Disembunyikan',
    title: 'Pembuangan Sampah Liar',
    description: 'Ada oknum yang membuang sampah sembarangan di lahan kosong dekat batas desa sebelah utara.',
    category: 'Environment',
    priority: 'medium',
    status: 'resolved',
  },
  {
    complaint_id: 82,
    complaint_code: '#AD-2410-082',
    submitted_at: '08 Okt 2024, 21:30 WIB',
    reporter_name: 'Mentari UMKM',
    rt_rw: 'Instansi',
    title: 'Keamanan Pasar Malam',
    description: 'Membutuhkan tambahan personel linmas untuk pengamanan acara pasar rakyat akhir pekan ini.',
    category: 'Security',
    priority: 'low',
    status: 'resolved',
  },
])

// ====== Category & status meta ======
const categoryMeta = {
  Infrastructure: { label: 'Infrastruktur', icon: 'pi-wrench', severity: 'info' },
  'Public Service': { label: 'Sosial', icon: 'pi-users', severity: 'help' },
  Environment: { label: 'Lingkungan', icon: 'pi-refresh', severity: 'success' },
  Security: { label: 'Keamanan', icon: 'pi-shield', severity: 'warn' },
  Other: { label: 'Lainnya', icon: 'pi-ellipsis-h', severity: 'secondary' },
}

const statusMeta = {
  submitted: { label: 'Menunggu Verifikasi', severity: 'warn' },
  in_progress: { label: 'Sedang Diproses', severity: 'info' },
  resolved: { label: 'Selesai', severity: 'success' },
  rejected: { label: 'Ditolak', severity: 'danger' },
}

const priorityMeta = {
  high: { label: 'Tinggi', icon: 'pi-exclamation-triangle', class: 'text-red-500' },
  medium: { label: 'Sedang', icon: 'pi-minus', class: 'text-gray-400' },
  low: { label: 'Rendah', icon: 'pi-arrow-down', class: 'text-gray-400' },
}

const categoryOptions = computed(() => {
  const unique = [...new Set(rows.value.map((r) => r.category))]
  return [
    { label: 'Kategori: Semua', value: null },
    ...unique.map((c) => ({ label: categoryMeta[c]?.label ?? c, value: c })),
  ]
})

const statusOptions = [
  { label: 'Status: Semua', value: null },
  { label: 'Menunggu Verifikasi', value: 'submitted' },
  { label: 'Sedang Diproses', value: 'in_progress' },
  { label: 'Selesai', value: 'resolved' },
  { label: 'Ditolak', value: 'rejected' },
]

// ====== Search & filter ======
const searchQuery = ref('')
const selectedCategory = ref(null)
const selectedStatus = ref(null)

const filteredRows = computed(() => {
  return rows.value.filter((r) => {
    const q = searchQuery.value.toLowerCase()
    const matchSearch =
      !q ||
      r.complaint_code.toLowerCase().includes(q) ||
      r.reporter_name.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q)
    const matchCategory = !selectedCategory.value || r.category === selectedCategory.value
    const matchStatus = !selectedStatus.value || r.status === selectedStatus.value
    return matchSearch && matchCategory && matchStatus
  })
})

// ====== Stats ======
const stats = computed(() => ({
  totalThisMonth: 124, // TODO: replace with real aggregate from API
  waitingVerification: rows.value.filter((r) => r.status === 'submitted').length + 24, // dummy offset to match wireframe
  inProgress: rows.value.filter((r) => r.status === 'in_progress').length + 44,
  resolvedLast30Days: rows.value.filter((r) => r.status === 'resolved').length + 50,
}))

// ====== Navigate to detail ======
function handleDetail(data) {
  router.push({ name: 'complaint-response', params: { id: data.complaint_id } })
}
</script>

<template>
  <div>
    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <template #content>
          <div class="flex items-start justify-between">
            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total Aduan Bulan Ini
            </div>
            <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <i class="pi pi-file text-gray-500 text-sm"></i>
            </div>
          </div>
          <div class="text-3xl font-bold text-gray-800 mt-3">{{ stats.totalThisMonth }}</div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="flex items-start justify-between">
            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Menunggu Verifikasi
            </div>
            <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <i class="pi pi-inbox text-gray-500 text-sm"></i>
            </div>
          </div>
          <div class="text-3xl font-bold text-gray-800 mt-3">{{ stats.waitingVerification }}</div>
          <div class="text-xs text-gray-400 mt-1">Perlu Tindakan</div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="flex items-start justify-between">
            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Sedang Diproses
            </div>
            <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <i class="pi pi-sync text-gray-500 text-sm"></i>
            </div>
          </div>
          <div class="text-3xl font-bold text-gray-800 mt-3">{{ stats.inProgress }}</div>
          <div class="text-xs text-gray-400 mt-1">Dalam Pengerjaan</div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="flex items-start justify-between">
            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Selesai (30 Hari)
            </div>
            <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <i class="pi pi-check-circle text-gray-500 text-sm"></i>
            </div>
          </div>
          <div class="text-3xl font-bold text-gray-800 mt-3">{{ stats.resolvedLast30Days }}</div>
        </template>
      </Card>
    </div>

    <!-- Table Content -->
    <Card>
      <template #content>
        <!-- Toolbar -->
        <div class="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-4">
          <IconField class="w-full lg:w-80">
            <InputIcon class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="Cari ID, Pelapor, atau Topik..." class="w-full" />
          </IconField>

          <Select
            v-model="selectedCategory"
            :options="categoryOptions"
            option-label="label"
            option-value="value"
            placeholder="Kategori: Semua"
            class="w-full lg:w-52"
          />

          <Select
            v-model="selectedStatus"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="Status: Semua"
            class="w-full lg:w-52"
          />

          <div class="flex items-center gap-2 text-sm text-gray-400 lg:ml-auto whitespace-nowrap">
            <i class="pi pi-filter"></i>
            Menampilkan 1-{{ filteredRows.length }} dari {{ rows.length }}
          </div>
        </div>

        <!-- Table -->
        <AppDataTable :columns="columns" :rows="filteredRows">
          <template #complaint_code="{ data }">
            <div class="font-semibold text-gray-800">{{ data.complaint_code }}</div>
            <div class="text-xs text-gray-400">{{ data.submitted_at }}</div>
          </template>

          <template #reporter_name="{ data }">
            <div class="font-medium text-gray-800">{{ data.reporter_name }}</div>
            <div class="text-xs text-gray-400 mb-1">{{ data.rt_rw }}</div>
            <div class="text-sm font-semibold text-gray-800">{{ data.title }}</div>
            <div class="text-xs text-gray-500 max-w-md">{{ data.description }}</div>
          </template>

          <template #category="{ data }">
            <Tag
              :value="categoryMeta[data.category]?.label ?? data.category"
              :severity="categoryMeta[data.category]?.severity"
              rounded
            >
              <template #icon>
                <i :class="['pi', categoryMeta[data.category]?.icon, 'text-xs mr-1']"></i>
              </template>
            </Tag>
          </template>

          <template #priority="{ data }">
            <span class="flex items-center gap-1 text-sm" :class="priorityMeta[data.priority]?.class">
              <i :class="['pi', priorityMeta[data.priority]?.icon, 'text-xs']"></i>
              {{ priorityMeta[data.priority]?.label }}
            </span>
          </template>

          <template #status="{ data }">
            <Tag :value="statusMeta[data.status]?.label" :severity="statusMeta[data.status]?.severity" rounded />
          </template>

          <template #actions="{ data }">
            <AppButton label="Detail" variant="secondary" outlined size="small" @click="handleDetail(data)" />
          </template>
        </AppDataTable>
      </template>
    </Card>
  </div>
</template>