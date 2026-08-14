<script setup>
/**
 * Dashboard - halaman utama admin SIBIMO.
 *
 * TODO: semua data dummy, sambungkan ke service masing-masing modul.
 */
import { ref, computed } from 'vue'
import Tag from 'primevue/tag'
import Avatar from 'primevue/avatar'
import Chart from 'primevue/chart'
import ProgressBar from 'primevue/progressbar'
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

const periodeOptions = [
  { label: 'Bulan Ini', value: 'bulan_ini' },
  { label: '3 Bulan Terakhir', value: '3_bulan' },
  { label: 'Tahun Ini', value: 'tahun_ini' },
]
const periode = ref('bulan_ini')

// === Ringkasan utama ===
const stats = [
  { label: 'Pengajuan Masuk', value: 120, delta: '+12 Surat', up: true, icon: 'pi pi-inbox' },
  { label: 'Menunggu Verifikasi', value: 40, delta: '-4 Surat', up: false, icon: 'pi pi-clock' },
  { label: 'Terverifikasi', value: 70, delta: '+8 Surat', up: true, icon: 'pi pi-check-circle' },
  { label: 'Tercetak', value: 200, delta: '+15 Surat', up: true, icon: 'pi pi-print' },
]

const targetVerifikasi = 85 // persen, dummy


// === Tabel pengajuan surat ===
const statusTabs = [
  { label: 'Semua', value: 'semua' },
  { label: 'Menunggu', value: 'Menunggu' },
  { label: 'Terverifikasi', value: 'Terverifikasi' },
  { label: 'Ditolak', value: 'Ditolak' },
]
const activeTab = ref('semua')

const allPengajuan = ref([
  { id: 1, nama: 'Ana Amelia Revalina', jenis: 'Surat Permohonan Nikah', tanggal: '26 Agu 2026', status: 'Menunggu' },
  { id: 2, nama: 'Budi Santoso', jenis: 'Surat Keterangan Domisili', tanggal: '25 Agu 2026', status: 'Terverifikasi' },
  { id: 3, nama: 'Siti Aminah', jenis: 'Surat Pengantar KTP', tanggal: '25 Agu 2026', status: 'Menunggu' },
  { id: 4, nama: 'Rudi Hartono', jenis: 'Surat Keterangan Usaha', tanggal: '24 Agu 2026', status: 'Ditolak' },
  { id: 5, nama: 'Wati Suryani', jenis: 'Surat Permohonan Nikah', tanggal: '23 Agu 2026', status: 'Terverifikasi' },
  { id: 6, nama: 'Agus Prasetyo', jenis: 'Surat Keterangan Domisili', tanggal: '22 Agu 2026', status: 'Menunggu' },
])

const statusSeverity = { Menunggu: 'warn', Terverifikasi: 'success', Ditolak: 'danger' }

const search = ref('')

const filteredPengajuan = computed(() => {
  let rows = allPengajuan.value
  if (activeTab.value !== 'semua') rows = rows.filter((r) => r.status === activeTab.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    rows = rows.filter((r) => r.nama.toLowerCase().includes(q) || r.jenis.toLowerCase().includes(q))
  }
  return rows
})

function initials(name) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

function handleApplyFilter(filter) {
  activeFilterCount.value = (filter.bulan ? 1 : 0) + filter.jenisSurat.length
}

// === Widget: Aduan terbaru ===
const aduanTerbaru = ref([
  { id: 1, judul: 'Jalan rusak di Dusun Kaliurang', pelapor: 'Rudi Hartono', waktu: '2 jam lalu', status: 'Baru' },
  { id: 2, judul: 'Lampu jalan mati 3 hari', pelapor: 'Wati Suryani', waktu: '5 jam lalu', status: 'Diproses' },
  { id: 3, judul: 'Sampah menumpuk di TPS RW 03', pelapor: 'Agus Prasetyo', waktu: '1 hari lalu', status: 'Baru' },
])
const aduanSeverity = { Baru: 'danger', Diproses: 'warn', Selesai: 'success' }

// === Widget: Agenda terdekat (Timeline) ===
const agendaTerdekat = ref([
  { id: 1, judul: 'Musyawarah Desa', tanggal: '18 Agustus', waktu: '09:00 WIB', tempat: 'Balai Desa' },
  { id: 2, judul: 'Posyandu Balita', tanggal: '20 Agustus', waktu: '08:00 WIB', tempat: 'Pos RW 02' },
  { id: 3, judul: 'Kerja Bakti Lingkungan', tanggal: '23 Agustus', waktu: '07:00 WIB', tempat: 'Dusun Kaliurang' },
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
        <Select v-model="periode" :options="periodeOptions" optionLabel="label" optionValue="value" class="!text-sm" />
        <AppButton icon="pi pi-refresh" variant="ghost" aria-label="Muat ulang" />
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
            class="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0"
          >
            <i :class="s.icon" class="text-base" />
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

          <!--
            Tab status: gaya "segmented" (kapsul abu-abu, tab aktif jadi
            kotak putih rounded + shadow tipis) -- radius rounded-lg, BUKAN
            rounded-full, biar nggak jadi pill kapsul penuh. Pakai unstyled
            + pt (Tailwind), bukan CSS.
          -->
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <Tabs v-model:value="activeTab" unstyled :pt="{ root: { class: 'w-fit' } }">
              <TabList
                unstyled
                :pt="{
                  root: { class: 'inline-flex items-center gap-1 bg-neutral-100 rounded-lg p-1 w-fit' },
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
                        'px-4 py-1.5 rounded-lg text-sm outline-none transition-colors cursor-pointer',
                        context.active
                          ? 'bg-white text-neutral-900 font-semibold shadow-sm'
                          : 'text-neutral-500 font-medium hover:text-neutral-700',
                      ],
                    }),
                  }"
                >
                  {{ t.label }}
                </Tab>
              </TabList>
            </Tabs>

            <div class="flex items-center gap-2">
              <IconField>
                <InputIcon class="pi pi-search" />
                <InputText v-model="search" placeholder="Cari nama / jenis surat" class="!text-sm w-48" />
              </IconField>
              <AppButton
                icon="pi pi-sliders-h"
                variant="ghost"
                :label="activeFilterCount ? `Filter (${activeFilterCount})` : 'Filter Lanjutan'"
                @click="filterPopoverRef.toggle($event)"
              />
              <FilterPopover ref="filterPopoverRef" @apply="handleApplyFilter" />
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-t border-neutral-100 text-left text-xs text-neutral-400 uppercase tracking-wide">
                <th class="px-5 py-3 font-medium">Pengaju</th>
                <th class="px-5 py-3 font-medium">Jenis Surat</th>
                <th class="px-5 py-3 font-medium">Tanggal</th>
                <th class="px-5 py-3 font-medium">Status</th>
                <th class="px-5 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in filteredPengajuan"
                :key="row.id"
                class="border-t border-neutral-100 hover:bg-primary-50/40 transition-colors"
              >
                <td class="px-5 py-3">
                  <div class="flex items-center gap-2.5">
                    <Avatar :label="initials(row.nama)" shape="circle" class="!bg-primary-100 !text-primary-700 !text-xs !w-8 !h-8" />
                    <span class="text-neutral-800 font-medium">{{ row.nama }}</span>
                  </div>
                </td>
                <td class="px-5 py-3 text-neutral-600">{{ row.jenis }}</td>
                <td class="px-5 py-3 text-neutral-500">{{ row.tanggal }}</td>
                <td class="px-5 py-3">
                  <Tag :value="row.status" :severity="statusSeverity[row.status]" />
                </td>
                <td class="px-5 py-3">
                  <div class="flex justify-end gap-1">
                    <AppButton icon="pi pi-eye" variant="ghost" size="small" :aria-label="`Lihat ${row.nama}`" />
                    <AppButton icon="pi pi-print" variant="ghost" size="small" :aria-label="`Cetak ${row.nama}`" />
                  </div>
                </td>
              </tr>
              <tr v-if="filteredPengajuan.length === 0">
                <td colspan="5" class="px-5 py-10 text-center text-neutral-400 text-sm">
                  Tidak ada pengajuan yang cocok.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Widget kanan -->
      <div class="flex flex-col gap-4">
        <!-- Aduan terbaru -->
        <div class="bg-white rounded-xl border border-neutral-200 p-5">
          <div class="flex items-center justify-between mb-4">
            <p class="text-sm font-semibold text-neutral-900">Aduan Terbaru</p>
            <router-link to="/aduan" class="text-xs text-primary-600 hover:underline">Lihat semua</router-link>
          </div>
          <div class="flex flex-col gap-4">
            <div v-for="a in aduanTerbaru" :key="a.id" class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-sm text-neutral-800 truncate">{{ a.judul }}</p>
                <p class="text-xs text-neutral-400 mt-0.5">{{ a.pelapor }} &middot; {{ a.waktu }}</p>
              </div>
              <Tag :value="a.status" :severity="aduanSeverity[a.status]" class="shrink-0 !text-[10px]" />
            </div>
          </div>
        </div>

        <!-- Agenda terdekat -->
        <div class="bg-white rounded-xl border border-neutral-200 p-5">
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-semibold text-neutral-900">Agenda Terdekat</p>
            <router-link to="/agenda" class="text-xs text-primary-600 hover:underline">Lihat semua</router-link>
          </div>
          <div class="flex flex-col">
            <div v-for="(item, idx) in agendaTerdekat" :key="item.id" class="flex gap-3">
              <!-- Dot + garis penghubung -->
              <div class="flex flex-col items-center">
                <span class="w-2.5 h-2.5 rounded-full bg-primary-500 border-2 border-white shadow shrink-0 mt-1" />
                <span
                  v-if="idx < agendaTerdekat.length - 1"
                  class="w-px flex-1 bg-neutral-200 my-1"
                />
              </div>
              <div :class="idx < agendaTerdekat.length - 1 ? 'pb-4' : ''">
                <p class="text-sm text-neutral-800 font-medium">{{ item.judul }}</p>
                <p class="text-xs text-neutral-400">
                  {{ item.tanggal }} &middot; {{ item.waktu }} &middot; {{ item.tempat }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>