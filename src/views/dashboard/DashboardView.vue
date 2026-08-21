<script setup>
/**
 * Dashboard - halaman utama admin SIBIMO.
 *
 * TODO: semua data dummy, sambungkan ke service masing-masing modul.
 */
import { ref, computed } from 'vue'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import { useAuthStore } from '@/stores/auth.store'
import AppButton from '@/components/common/AppButton.vue'
import FilterPopover from '@/components/dashboard/FilterPopover.vue'

const authStore = useAuthStore()
const filterPopoverRef = ref()
const activeFilterCount = ref(0)

const periodOptions = [
  { label: 'Bulan Ini', value: 'this_month' },
  { label: '3 Bulan Terakhir', value: 'last_3_months' },
  { label: 'Tahun Ini', value: 'this_year' },
]
const period = ref('this_month')

// === Ringkasan utama ===
const stats = [
  { label: 'Pengajuan Masuk', value: 120, delta: '+12 Surat', up: true, icon: 'pi pi-inbox', bg: 'bg-primary-500' },
  { label: 'Menunggu Verifikasi', value: 40, delta: '-4 Surat', up: false, icon: 'pi pi-clock', bg: 'bg-amber-500' },
  { label: 'Terverifikasi', value: 70, delta: '+8 Surat', up: true, icon: 'pi pi-check-circle', bg: 'bg-success-600' },
  { label: 'Tercetak', value: 200, delta: '+15 Surat', up: true, icon: 'pi pi-print', bg: 'bg-secondary-600' },
]

// === Tabel pengajuan surat terbaru ===
const statusTabs = [
  { label: 'Semua', value: 'semua' },
  { label: 'Menunggu', value: 'Menunggu' },
  { label: 'Terverifikasi', value: 'Terverifikasi' },
  { label: 'Ditolak', value: 'Ditolak' },
]
const activeTab = ref('semua')


const allSubmissions = ref([
  {
    id: 1,
    requestId: 'REQ-2026-0812',
    citizenId: '3404xxxxxxxx0001',
    purpose: 'Surat Permohonan Nikah',
    status: 'Menunggu',
    date: '2026-08-26T09:15:00',
  },
  {
    id: 2,
    requestId: 'REQ-2026-0811',
    citizenId: '3404xxxxxxxx0002',
    purpose: 'Surat Keterangan Domisili',
    status: 'Terverifikasi',
    date: '2026-08-25T13:40:00',
  },
  {
    id: 3,
    requestId: 'REQ-2026-0810',
    citizenId: '3404xxxxxxxx0003',
    purpose: 'Surat Pengantar KTP',
    status: 'Menunggu',
    date: '2026-08-25T08:05:00',
  },
  {
    id: 4,
    requestId: 'REQ-2026-0809',
    citizenId: '3404xxxxxxxx0004',
    purpose: 'Surat Keterangan Usaha',
    status: 'Ditolak',
    date: '2026-08-24T16:20:00',
  },
  {
    id: 5,
    requestId: 'REQ-2026-0808',
    citizenId: '3404xxxxxxxx0005',
    purpose: 'Surat Permohonan Nikah',
    status: 'Terverifikasi',
    date: '2026-08-23T10:50:00',
  },
  {
    id: 6,
    requestId: 'REQ-2026-0807',
    citizenId: '3404xxxxxxxx0006',
    purpose: 'Surat Keterangan Domisili',
    status: 'Menunggu',
    date: '2026-08-22T07:30:00',
  },
  {
    id: 7,
    requestId: 'REQ-2026-0806',
    citizenId: '3404xxxxxxxx0007',
    purpose: 'Surat Keterangan Tidak Mampu',
    status: 'Terverifikasi',
    date: '2026-08-21T11:10:00',
  },
  {
    id: 8,
    requestId: 'REQ-2026-0805',
    citizenId: '3404xxxxxxxx0008',
    purpose: 'Surat Pengantar SKCK',
    status: 'Ditolak',
    date: '2026-08-20T15:45:00',
  },
  {
    id: 9,
    requestId: 'REQ-2026-0804',
    citizenId: '3404xxxxxxxx0009',
    purpose: 'Surat Keterangan Kelahiran',
    status: 'Menunggu',
    date: '2026-08-19T09:00:00',
  },
])

const statusSeverity = { Menunggu: 'warn', Terverifikasi: 'success', Ditolak: 'danger' }

const search = ref('')

const filteredSubmissions = computed(() => {
  let rows = allSubmissions.value
  if (activeTab.value !== 'semua') rows = rows.filter((r) => r.status === activeTab.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    rows = rows.filter(
      (r) =>
        r.requestId.toLowerCase().includes(q) ||
        r.citizenId.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q)
    )
  }
  return rows
})

function formatDate(isoString) {
  const d = new Date(isoString)
  const tanggal = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  return `${tanggal} · ${jam}`
}

function handleApplyFilter(filter) {
  activeFilterCount.value = (filter.bulan ? 1 : 0) + filter.letterType.length
}

// === Widget: Aduan terbaru ===
const recentComplaints = ref([
  { id: 1, title: 'Jalan rusak di Dusun Kaliurang', reporter: 'Rudi Hartono', time: '2 jam lalu', status: 'Baru' },
  { id: 2, title: 'Lampu jalan mati 3 hari', reporter: 'Wati Suryani', time: '5 jam lalu', status: 'Diproses' },
  { id: 3, title: 'Sampah menumpuk di TPS RW 03', reporter: 'Agus Prasetyo', time: '1 hari lalu', status: 'Baru' },
])
const complaintBadge = {
  Baru: 'bg-white text-primary-700',
  Diproses: 'bg-white/25 text-white',
  Selesai: 'bg-white/15 text-white/90',
}

// === Widget: Agenda terdekat (Timeline) ===
const upcomingAgenda = ref([
  { id: 1, name: 'Musyawarah Desa', date: '18 Agustus', time: '09:00 WIB', location: 'Balai Desa' },
  { id: 2, name: 'Posyandu Balita', date: '20 Agustus', time: '08:00 WIB', location: 'Pos RW 02' },
  { id: 3, name: 'Kerja Bakti Lingkungan', date: '23 Agustus', time: '07:00 WIB', location: 'Dusun Kaliurang' },
])
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900">
          Halo, {{ authStore.user?.nama || 'Super Admin' }}
        </h1>
        <p class="text-sm text-neutral-500">Berikut ringkasan aktivitas SIBIMO.</p>
      </div>
      <div class="flex items-center gap-2">
        <Select v-model="period" :options="periodOptions" optionLabel="label" optionValue="value" class="!text-sm" />
        <AppButton
          icon="pi pi-refresh"
          variant="ghost"
          aria-label="Muat ulang"
          class="!w-10 !h-10 !rounded-full !bg-primary-50 !text-primary-600 hover:!bg-primary-100"
        />
      </div>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="s in stats"
        :key="s.label"
        class="bg-white rounded-xl border border-neutral-200 p-5 relative overflow-hidden"
      >
        <div class="flex items-start justify-between mb-3">
          <p class="text-sm text-neutral-500">{{ s.label }}</p>
          <div
            class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md"
            :class="s.bg"
          >
            <i :class="s.icon" class="text-lg" />
          </div>
        </div>
        <p class="text-3xl font-bold text-neutral-900">{{ s.value }}</p>
        <div class="flex justify-end mt-4">
          <span
            class="text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
            :class="s.up ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'"
          >
            <i :class="s.up ? 'pi pi-arrow-up' : 'pi pi-arrow-down'" class="text-[10px]" />
            {{ s.delta }}
          </span>
        </div>
      </div>
    </div>

    <!-- Tabel + widget samping -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
      <!-- Pengajuan surat -->
      <div class="bg-white rounded-xl border border-neutral-200 xl:col-span-2 overflow-hidden">
        <div class="p-5 pb-4">
          <p class="text-base font-semibold text-neutral-900 mb-3">Pengajuan Surat Terbaru</p>

         
          <div class="flex items-center justify-between gap-2 flex-nowrap overflow-x-auto pb-0.5">
            <Tabs v-model:value="activeTab" unstyled :pt="{ root: { class: 'w-fit shrink-0' } }">
              <TabList
                unstyled
                :pt="{
                  root: { class: 'inline-flex items-center gap-1 bg-primary-50 rounded-lg p-1 w-fit' },
                  content: { class: 'flex items-center gap-1' },
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

            <div class="flex items-center gap-2 shrink-0">
              <IconField>
                <InputIcon class="pi pi-search" />
                <InputText
                  v-model="search"
                  placeholder="Cari request ID / NIK / keperluan"
                  class="!text-sm w-36 lg:w-52 min-w-0"
                />
              </IconField>
              <AppButton
                icon="pi pi-sliders-h"
                variant="ghost"
                :label="activeFilterCount ? `Filter (${activeFilterCount})` : 'Filter'"
                class="!bg-primary-50 !text-primary-700 hover:!bg-primary-100 !rounded-lg !font-medium whitespace-nowrap shrink-0"
                @click="filterPopoverRef.toggle($event)"
              />
              <FilterPopover ref="filterPopoverRef" @apply="handleApplyFilter" />
            </div>
          </div>
        </div>

        <DataTable
          :value="filteredSubmissions"
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

          <Column field="requestId" header="Request ID" sortable />

          <Column field="citizenId" header="Citizen ID" sortable />

          <Column field="purpose" header="Purpose / Service Type" sortable />

          <Column field="date" header="Date" sortable>
            <template #body="{ data }">
              <span class="text-neutral-600">{{ formatDate(data.date) }}</span>
            </template>
          </Column>

          <Column field="status" header="Status" sortable>
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

      <!-- Widget kanan -->
      <div class="flex flex-col gap-4">
        <!-- Aduan terbaru -->
        <div class="bg-primary-600 rounded-xl p-5 text-white shadow-md flex flex-col">
          <p class="text-sm font-semibold flex items-center gap-2 mb-4">
            <i class="pi pi-megaphone text-base" />
            Aduan Terbaru
          </p>
          <div class="flex flex-col gap-4">
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

          <router-link
            to="/complaint"
            class="mt-4 flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-medium rounded-lg py-2 transition-colors"
          >
            Lihat semua
            <i class="pi pi-arrow-right text-xs" />
          </router-link>
        </div>

        <!-- Agenda terdekat -->
        <div class="bg-secondary-600 rounded-xl p-5 text-white shadow-md flex flex-col">
          <p class="text-sm font-semibold flex items-center gap-2 mb-3">
            <i class="pi pi-calendar text-base" />
            Agenda Terdekat
          </p>
          <div class="flex flex-col">
            <div v-for="(item, idx) in upcomingAgenda" :key="item.id" class="flex gap-3">
              <!-- Dot + garis penghubung -->
              <div class="flex flex-col items-center">
                <span class="w-2.5 h-2.5 rounded-full bg-white border-2 border-white/40 shrink-0 mt-1" />
                <span
                  v-if="idx < upcomingAgenda.length - 1"
                  class="w-px flex-1 bg-white/30 my-1"
                />
              </div>
              <div :class="idx < upcomingAgenda.length - 1 ? 'pb-4' : ''">
                <p class="text-sm text-white font-medium">{{ item.name }}</p>
                <p class="text-xs text-white/70">
                  {{ item.date }} &middot; {{ item.time }} &middot; {{ item.location }}
                </p>
              </div>
            </div>
          </div>

          <router-link
            to="/agenda"
            class="mt-4 flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-medium rounded-lg py-2 transition-colors"
          >
            Lihat semua
            <i class="pi pi-arrow-right text-xs" />
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>