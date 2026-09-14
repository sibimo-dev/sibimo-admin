<script setup>
/**
 * Dashboard - halaman utama admin SIBIMO.
 *
 * Statistik di halaman ini TIDAK lagi bergantung ke satu endpoint ringkasan
 * (/dashboard/summary) yang datanya sering tidak lengkap (mis. field jenis
 * layanan tidak pernah dikirim). Sebagai gantinya, setiap kartu statistik
 * konek LANGSUNG ke sumber data modul masing-masing:
 *   - Persuratan   -> useLetterStore (store yang sama dipakai halaman Surat)
 *   - Data Warga   -> citizen.service (getCitizens)
 *   - Pengaduan    -> complaint.service (getComplaints)
 *   - Perpustakaan -> library.service (getLoans)
 *   - Agenda       -> content.service (agendaService)
 *
 * Dengan begitu statistik selalu sinkron dengan data asli tiap layanan dan
 * otomatis berubah ketika ada aktivitas di halaman lain (mis. surat baru
 * diverifikasi, atau warga baru ditambahkan).
 *
 * Catatan: dropdown "Periode" dan tombol "Filter" pada tabel surat SUDAH
 * DIHAPUS. Semua angka statistik di sini adalah TOTAL keseluruhan data,
 * bukan angka yang dipotong per periode -- karena widget "Aduan Terbaru"
 * dan "Agenda Terdekat" pun dari awal memang hanya menampilkan item
 * ter-baru/ter-dekat (di-sort lalu diambil beberapa teratas), tidak pernah
 * benar-benar berubah walau ada filter periode. Supaya tidak membingungkan
 * dan tidak ada state yang tidak nyambung, filter periode dihapus total.
 */
import { ref, computed, onMounted, watch } from 'vue'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import { useAuthStore } from '@/stores/auth.store'
import AppButton from '@/components/common/AppButton.vue'
import { useLetterStore } from '@/stores/useLetterStore'
import { getCitizens } from '@/services/citizen.service'
import { getComplaints } from '@/services/complaint.service'
import { getLoans } from '@/services/library.service'
import { agendaService } from '@/services/content.service'

const authStore = useAuthStore()

const loading = ref(false)
const loadError = ref('')

// === Angka berjalan (count-up) supaya perpindahan angka terasa hidup ===
function useAnimatedNumber(source) {
  const display = ref(0)
  let raf = null
  watch(
    source,
    (next, prev) => {
      const start = prev ?? 0
      const startedAt = performance.now()
      const duration = 650
      cancelAnimationFrame(raf)
      const step = (now) => {
        const progress = Math.min(1, (now - startedAt) / duration)
        const eased = 1 - Math.pow(1 - progress, 3)
        display.value = Math.round(start + (next - start) * eased)
        if (progress < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    },
    { immediate: true },
  )
  return display
}

// === Tema warna per kartu (kelas Tailwind ditulis literal agar ke-detect JIT) ===
const THEME = {
  primary: {
    bar: 'bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600',
    iconBg: 'bg-gradient-to-br from-primary-400 to-primary-600',
    blob: 'bg-primary-500',
    ringHover: 'hover:ring-2 hover:ring-primary-300/60',
    link: 'text-primary-600 hover:text-primary-700',
  },
  accent: {
    bar: 'bg-gradient-to-r from-accent-400 via-accent-500 to-accent-600',
    iconBg: 'bg-gradient-to-br from-accent-400 to-accent-600',
    blob: 'bg-accent-500',
    ringHover: 'hover:ring-2 hover:ring-accent-300/60',
    link: 'text-accent-600 hover:text-accent-700',
  },
  danger: {
    bar: 'bg-gradient-to-r from-danger-400 via-danger-500 to-danger-600',
    iconBg: 'bg-gradient-to-br from-danger-400 to-danger-600',
    blob: 'bg-danger-500',
    ringHover: 'hover:ring-2 hover:ring-danger-300/60',
    link: 'text-danger-600 hover:text-danger-700',
  },
  success: {
    bar: 'bg-gradient-to-r from-success-400 via-success-500 to-success-600',
    iconBg: 'bg-gradient-to-br from-success-400 to-success-600',
    blob: 'bg-success-500',
    ringHover: 'hover:ring-2 hover:ring-success-300/60',
    link: 'text-success-600 hover:text-success-700',
  },
}
const TONE = {
  warn: 'bg-warning-50 text-warning-700',
  success: 'bg-success-50 text-success-700',
  danger: 'bg-danger-50 text-danger-700',
  info: 'bg-primary-50 text-primary-700',
}

// === Sumber data mentah tiap layanan ===
const { rows: letterRows } = useLetterStore()
const citizens = ref([])
const complaints = ref([])
const loans = ref([])
const agendas = ref([])

// --- Statistik per layanan: TOTAL keseluruhan data, tidak dipotong periode ---
const letterStats = computed(() => ({
  total: letterRows.value.length,
  pending: letterRows.value.filter((r) => r.status === 'Pending').length,
  verified: letterRows.value.filter((r) => r.status === 'Diverifikasi' || r.status === 'Disetujui').length,
  rejected: letterRows.value.filter((r) => r.status === 'Ditolak').length,
}))

const citizenStats = computed(() => ({
  total: citizens.value.length,
  active: citizens.value.filter((c) => c.status === 'Active').length,
}))

const complaintStats = computed(() => ({
  total: complaints.value.length,
  pending: complaints.value.filter((c) => c.status === 'Submitted').length,
  resolved: complaints.value.filter((c) => c.status === 'Resolved').length,
}))

const loanStats = computed(() => ({
  total: loans.value.length,
  active: loans.value.filter((l) => l.status === 'Borrowed').length,
  late: loans.value.filter((l) => l.status === 'Late').length,
}))

const letterDisplay = useAnimatedNumber(computed(() => letterStats.value.total))
const citizenDisplay = useAnimatedNumber(computed(() => citizenStats.value.total))
const complaintDisplay = useAnimatedNumber(computed(() => complaintStats.value.total))
const loanDisplay = useAnimatedNumber(computed(() => loanStats.value.active))

// Persuratan cukup 1 kartu (rincian status ditampilkan sebagai badge kecil di
// dalamnya) -- sebelumnya ada 4 kartu terpisah khusus persuratan saja.
const statCards = computed(() => [
  {
    key: 'letters',
    label: 'Pengajuan Surat',
    hint: 'Total keseluruhan',
    value: letterDisplay.value,
    icon: 'pi pi-file-edit',
    theme: 'primary',
    to: '/letter',
    badges: [
      { text: `${letterStats.value.pending} Menunggu`, tone: 'warn' },
      { text: `${letterStats.value.verified} Terverifikasi`, tone: 'success' },
      { text: `${letterStats.value.rejected} Ditolak`, tone: 'danger' },
    ],
  },
  {
    key: 'citizens',
    label: 'Data Warga Terdaftar',
    hint: 'Total keseluruhan',
    value: citizenDisplay.value,
    icon: 'pi pi-users',
    theme: 'accent',
    to: '/citizen',
    badges: [{ text: `${citizenStats.value.active} Aktif`, tone: 'success' }],
  },
  {
    key: 'complaints',
    label: 'Pengaduan Warga',
    hint: 'Total keseluruhan',
    value: complaintDisplay.value,
    icon: 'pi pi-megaphone',
    theme: 'danger',
    to: '/complaint',
    badges: [
      { text: `${complaintStats.value.pending} Menunggu`, tone: 'warn' },
      { text: `${complaintStats.value.resolved} Selesai`, tone: 'success' },
    ],
  },
  {
    key: 'loans',
    label: 'Peminjaman Buku Aktif',
    hint: 'Saat ini',
    value: loanDisplay.value,
    icon: 'pi pi-book',
    theme: 'success',
    to: '/library/return',
    badges: [
      { text: `${loanStats.value.late} Terlambat`, tone: 'danger' },
      { text: `${loanStats.value.total} Total dipinjam`, tone: 'info' },
    ],
  },
])

// === Tabel pengajuan surat terbaru -- diambil langsung dari useLetterStore ===
// Tidak ada lagi filter periode; hanya tab status + kolom cari.
const statusTabs = [
  { label: 'Semua', value: 'semua' },
  { label: 'Menunggu', value: 'Pending' },
  { label: 'Diverifikasi', value: 'Diverifikasi' },
  { label: 'Disetujui', value: 'Disetujui' },
  { label: 'Ditolak', value: 'Ditolak' },
]
const activeTab = ref('semua')
const statusSeverity = { Pending: 'warn', Diverifikasi: 'info', Disetujui: 'success', Ditolak: 'danger' }
const search = ref('')

const letterSubmissions = computed(() =>
  [...letterRows.value]
    .sort((a, b) => new Date(b.dateValue) - new Date(a.dateValue))
    .map((r) => ({
      id: r.id,
      requestId: r.requestId,
      citizenId: r.citizenId,
      serviceType: r.purpose,
      date: r.dateValue,
      status: r.status,
    })),
)

const filteredSubmissions = computed(() => {
  let rows = letterSubmissions.value

  if (activeTab.value !== 'semua') rows = rows.filter((r) => r.status === activeTab.value)

  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    rows = rows.filter(
      (r) =>
        String(r.requestId ?? '').toLowerCase().includes(q) ||
        String(r.citizenId ?? '').toLowerCase().includes(q) ||
        String(r.serviceType ?? '').toLowerCase().includes(q),
    )
  }
  return rows
})

function formatLetterDate(dateValue) {
  const d = new Date(`${dateValue}T00:00:00`)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatRelativeTime(isoString) {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return '-'

  const minutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000))
  if (minutes < 60) return `${minutes} menit lalu`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`

  const days = Math.floor(hours / 24)
  return `${days} hari lalu`
}

// === Widget: Aduan terbaru -- selalu 4 aduan TERBARU dari seluruh data
// (bukan hasil filter periode apa pun, sesuai perilaku yang memang sudah
// berjalan sebelumnya). ===
const complaintStatusLabel = { Submitted: 'Baru', 'In Progress': 'Diproses', Resolved: 'Selesai', Rejected: 'Ditolak' }
const complaintBadge = {
  Baru: 'bg-white text-primary-700',
  Diproses: 'bg-white/25 text-white',
  Selesai: 'bg-white/15 text-white/90',
  Ditolak: 'bg-danger-100/25 text-white',
}
const recentComplaints = computed(() =>
  [...complaints.value]
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
    .slice(0, 4)
    .map((c) => ({
      id: c.complaint_id,
      title: c.title,
      reporter: c.reporter_name?.trim() ? c.reporter_name : 'Anonim',
      status: complaintStatusLabel[c.status] ?? c.status,
      time: formatRelativeTime(c.submitted_at),
    })),
)

// === Widget: Agenda terdekat -- selalu 4 agenda TERDEKAT ke depan dari
// seluruh data (bukan hasil filter periode apa pun). ===
function formatAgendaDate(dateString) {
  const date = new Date(`${String(dateString ?? '').slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long' })
}
function formatAgendaTime(startTime, endTime) {
  const start = startTime?.slice(0, 5) ?? ''
  const end = endTime?.slice(0, 5) ?? ''
  if (!start && !end) return '-'
  return `${start}${end ? ` - ${end}` : ''} WIB`
}
const upcomingAgenda = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return [...agendas.value]
    .filter((a) => {
      const raw = a.event_date ?? a.date
      const d = new Date(`${String(raw ?? '').slice(0, 10)}T00:00:00`)
      return !Number.isNaN(d.getTime()) && d >= today
    })
    .sort((a, b) => new Date(a.event_date ?? a.date) - new Date(b.event_date ?? b.date))
    .slice(0, 4)
    .map((a) => ({
      id: a.agenda_id,
      name: a.title,
      date: formatAgendaDate(a.event_date ?? a.date),
      time: formatAgendaTime(a.start_time, a.end_time),
      location: a.location ?? '-',
    }))
})

// === Muat semua sumber data layanan secara paralel ===
async function loadDashboard() {
  loading.value = true
  loadError.value = ''

  const results = await Promise.allSettled([getCitizens(), getComplaints(), getLoans(), agendaService.list()])
  const [citizensRes, complaintsRes, loansRes, agendasRes] = results

  citizens.value = citizensRes.status === 'fulfilled' && Array.isArray(citizensRes.value) ? citizensRes.value : []
  complaints.value = complaintsRes.status === 'fulfilled' && Array.isArray(complaintsRes.value) ? complaintsRes.value : []
  loans.value = loansRes.status === 'fulfilled' && Array.isArray(loansRes.value) ? loansRes.value : []
  agendas.value = agendasRes.status === 'fulfilled' && Array.isArray(agendasRes.value) ? agendasRes.value : []

  const failedCount = results.filter((r) => r.status === 'rejected').length
  loadError.value = failedCount
    ? `${failedCount} dari ${results.length} sumber data layanan belum bisa dimuat. Statistik yang tampil hanya dari layanan yang berhasil terhubung.`
    : ''

  loading.value = false
}

onMounted(loadDashboard)
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Header: dropdown "Periode" sudah dihapus, statistik selalu total keseluruhan -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900">
          Halo, {{ authStore.user?.full_name || authStore.user?.nama || 'Super Admin' }}
        </h1>
        <p class="text-sm text-neutral-500">Berikut ringkasan aktivitas seluruh layanan SIBIMO.</p>
      </div>
      <div class="flex items-center gap-2">
        <AppButton
          icon="pi pi-refresh"
          variant="ghost"
          aria-label="Muat ulang"
          class="!w-10 !h-10 !rounded-full !bg-primary-50 !text-primary-600 hover:!bg-primary-100"
          :loading="loading"
          @click="loadDashboard"
        />
      </div>
    </div>

    <p
      v-if="loadError"
      class="m-0 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ loadError }}
    </p>

    <!-- Stat cards: masing-masing konek langsung ke data asli modul terkait -->
    <TransitionGroup
      tag="div"
      appear
      enter-active-class="transition duration-500 ease-out motion-reduce:transition-none"
      enter-from-class="opacity-0 -translate-y-2 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      :class="['grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', loading ? 'animate-pulse' : '']"
    >
      <router-link
        v-for="(card, idx) in statCards"
        :key="card.key"
        :to="card.to"
        class="group relative block bg-white rounded-2xl border border-neutral-200 p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-transparent"
        :class="THEME[card.theme].ringHover"
        :style="{ transitionDelay: `${idx * 90}ms` }"
      >
        <!-- garis aksen warna di atas kartu (outline berwarna) -->
        <span class="absolute inset-x-0 top-0 h-1.5 rounded-t-2xl" :class="THEME[card.theme].bar" />
        <!-- blob dekoratif -->
        <span
          class="pointer-events-none absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-20"
          :class="THEME[card.theme].blob"
        />

        <div class="relative flex items-start justify-between mb-3">
          <div>
            <p class="text-sm text-neutral-500 font-medium">{{ card.label }}</p>
            <p class="text-[11px] text-neutral-400 mt-0.5">{{ card.hint }}</p>
          </div>
          <div
            class="relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
            :class="THEME[card.theme].iconBg"
          >
            <i :class="card.icon" class="text-lg" />
            <!-- Live dot: pakai animate-ping bawaan Tailwind, bukan keyframes custom -->
            <span class="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span class="absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75 animate-ping motion-reduce:animate-none" />
              <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-success-500 border-2 border-white" />
            </span>
          </div>
        </div>

        <p class="relative text-3xl font-bold text-neutral-900 tabular-nums">{{ card.value }}</p>

        <div class="relative flex flex-wrap gap-1.5 mt-4 min-h-[22px]">
          <span
            v-for="(b, bi) in card.badges"
            :key="bi"
            class="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            :class="TONE[b.tone]"
          >
            {{ b.text }}
          </span>
        </div>

        <span class="relative mt-4 flex items-center gap-1 text-xs font-medium transition-colors" :class="THEME[card.theme].link">
          Lihat detail
          <i class="pi pi-arrow-right text-[10px] transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </router-link>
    </TransitionGroup>

    <!-- Tabel + widget samping.
         Dipakai grid 4-kolom yang SAMA persis dengan grid stat card di atas
         (lg:grid-cols-4), lalu list surat mengambil 3 kolom dan widget
         kanan mengambil 1 kolom -- jadi lebar & posisi widget kanan otomatis
         sejajar/pas dengan kartu "Peminjaman Buku Aktif" di atasnya. -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
      <!-- Pengajuan surat -->
      <div class="bg-white rounded-xl border border-neutral-200 overflow-hidden min-w-0 lg:col-span-3">
        <div class="p-5 pb-4">
          <p class="text-base font-semibold text-neutral-900 mb-3">Pengajuan Surat Terbaru</p>

          <!-- Tidak ada lagi tombol Filter/periode: cuma tab status (kiri,
               boleh scroll sendiri) + kolom cari (kanan, shrink-0). -->
          <div class="flex flex-nowrap items-center justify-between gap-2">
            <div class="min-w-0 overflow-x-auto">
              <Tabs v-model:value="activeTab" unstyled :pt="{ root: { class: 'w-fit' } }">
                <TabList
                  unstyled
                  :pt="{
                    root: { class: 'inline-flex items-center gap-1 bg-primary-50 rounded-lg p-1 w-fit flex-nowrap' },
                    content: { class: 'flex items-center gap-1 flex-nowrap' },
                    activeBar: { class: 'hidden' },
                  }"
                >
                  <Tab
                    v-for="t in statusTabs"
                    :key="t.value"
                    :value="t.value"
                    unstyled
                    :pt="{
                      root: ({ context }) => ({
                        class: [
                          'px-4 py-1.5 rounded-lg text-sm outline-none transition-colors cursor-pointer whitespace-nowrap',
                          context.active
                            ? 'bg-primary-500 text-white font-semibold shadow-sm'
                            : 'text-primary-700/70 font-medium hover:text-primary-700',
                        ],
                      }),
                    }"
                  >
                    {{ t.label }}
                  </Tab>
                </TabList>
              </Tabs>
            </div>

            <div class="shrink-0">
              <IconField>
                <InputIcon class="pi pi-search" />
                <InputText
                  v-model="search"
                  placeholder="Cari Request ID / NIK / jenis layanan"
                  class="!text-sm w-36 sm:w-48 md:w-56 lg:w-64 min-w-0"
                />
              </IconField>
            </div>
          </div>
        </div>

        <DataTable
          :value="filteredSubmissions"
          :loading="loading"
          dataKey="id"
          sortField="date"
          :sortOrder="-1"
          removableSort
          class="p-datatable-sm"
          :pt="{
            header: { class: '!border-none' },
            thead: { class: '!bg-neutral-50' },
            headerCell: { class: '!text-neutral-500 !text-xs !font-semibold !uppercase !tracking-wide !border-neutral-100' },
            bodyRow: { class: 'hover:!bg-primary-50/40 !border-neutral-100' },
          }"
        >
          <template #empty>
            <div class="text-center text-sm text-neutral-400 py-8">Tidak ada pengajuan yang cocok.</div>
          </template>

          <Column field="requestId" header="Request ID" />

          <Column field="citizenId" header="NIK" />

          <Column field="serviceType" header="Jenis Layanan" />

          <Column field="date" header="Tanggal" sortable>
            <template #body="{ data }">
              <span class="text-neutral-600">{{ formatLetterDate(data.date) }}</span>
            </template>
          </Column>

          <Column field="status" header="Status">
            <template #body="{ data }">
              <Tag
                :value="data.status"
                :severity="statusSeverity[data.status]"
                :pt="{ root: { class: '!inline-flex !justify-center !w-28' } }"
              />
            </template>
          </Column>

          <Column header="Aksi">
            <template #body="{ data }">
              <div class="flex justify-end">
                <router-link
                  :to="{ path: '/letter', query: { requestId: data.requestId } }"
                  :aria-label="`Lihat ${data.requestId}`"
                  class="w-8 h-8 rounded-full flex items-center justify-center bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                >
                  <i class="pi pi-eye" />
                </router-link>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Widget kanan: col-span-1 dari grid 4-kolom yang sama dengan stat
           card di atas, jadi lebarnya otomatis identik dan sejajar dengan
           kolom "Peminjaman Buku Aktif" persis di atasnya. -->
      <div class="flex flex-col gap-3 min-w-0 lg:col-span-1">
        <!-- Aduan terbaru -->
        <div class="bg-primary-600 rounded-xl p-4 text-white shadow-md flex flex-col">
          <p class="text-sm font-semibold flex items-center gap-2 mb-3">
            <i class="pi pi-megaphone text-base" />
            Aduan Terbaru
          </p>
          <div v-if="recentComplaints.length" class="flex flex-col gap-3">
            <div v-for="c in recentComplaints" :key="c.id" class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-sm text-white truncate">{{ c.title }}</p>
                <p class="text-xs text-white/65 mt-0.5">{{ c.reporter }} &middot; {{ c.time }}</p>
              </div>
              <span
                class="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                :class="complaintBadge[c.status]"
              >
                {{ c.status }}
              </span>
            </div>
          </div>
          <p v-else class="text-sm text-white/70">Belum ada pengaduan masuk.</p>

          <router-link
            to="/complaint"
            class="mt-3 flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-medium rounded-lg py-1.5 transition-colors"
          >
            Lihat semua
            <i class="pi pi-arrow-right text-xs" />
          </router-link>
        </div>

        <!-- Agenda terdekat -->
        <div class="bg-gradient-to-br from-primary-700 to-primary-950 rounded-xl p-4 text-white shadow-md flex flex-col">
          <p class="text-sm font-semibold flex items-center gap-2 mb-3">
            <i class="pi pi-calendar text-base" />
            Agenda Terdekat
          </p>
          <div v-if="upcomingAgenda.length" class="flex flex-col">
            <div v-for="(item, idx) in upcomingAgenda" :key="item.id" class="flex gap-3">
              <!-- Dot + garis penghubung -->
              <div class="flex flex-col items-center">
                <span class="w-2.5 h-2.5 rounded-full bg-white border-2 border-white/40 shrink-0 mt-1" />
                <span
                  v-if="idx < upcomingAgenda.length - 1"
                  class="w-px flex-1 bg-white/30 my-1"
                />
              </div>
              <div :class="idx < upcomingAgenda.length - 1 ? 'pb-3' : ''">
                <p class="text-sm text-white font-medium">{{ item.name }}</p>
                <p class="text-xs text-white/70">
                  {{ item.date }} &middot; {{ item.time }} &middot; {{ item.location }}
                </p>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-white/70">Belum ada agenda mendatang.</p>

          <router-link
            to="/agenda"
            class="mt-3 flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-medium rounded-lg py-1.5 transition-colors"
          >
            Lihat semua
            <i class="pi pi-arrow-right text-xs" />
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>