<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const berita = ref([
  { id: 1, judul: 'Judul berita', penulis: 'User Name', gambar: null, tanggal: '3/18/2026', kategori: 'Kategori', status: 'PUBLISHED' },
  { id: 2, judul: 'Judul berita', penulis: 'User Name', gambar: null, tanggal: '27/07/2026', kategori: 'Kategori', status: 'PUBLISHED' },
  { id: 3, judul: 'Judul berita', penulis: 'User Name', gambar: null, tanggal: '25/07/2026', kategori: 'Kategori', status: 'DRAFT' },
  { id: 4, judul: 'Judul berita', penulis: 'User Name', gambar: null, tanggal: '13/07/2026', kategori: 'Kategori', status: 'PUBLISHED' },
  { id: 5, judul: 'Judul berita', penulis: 'User Name', gambar: null, tanggal: '10/07/2026', kategori: 'Kategori', status: 'PUBLISHED' },
  { id: 6, judul: 'Judul berita', penulis: 'User Name', gambar: null, tanggal: '7/07/2026', kategori: 'Kategori', status: 'DRAFT' },
  { id: 7, judul: 'Judul berita', penulis: 'User Name', gambar: null, tanggal: '4/07/2026', kategori: 'Kategori', status: 'PUBLISHED' },
  { id: 8, judul: 'Judul berita', penulis: 'User Name', gambar: null, tanggal: '28/06/2026', kategori: 'Kategori', status: 'PUBLISHED' },
])

const search = ref('')
const selected = ref([])
const currentPage = ref(1)
const perPage = ref(10)

const filtered = computed(() => {
  if (!search.value.trim()) return berita.value
  const q = search.value.toLowerCase()
  return berita.value.filter(b =>
    b.judul.toLowerCase().includes(q) ||
    b.penulis.toLowerCase().includes(q) ||
    b.kategori.toLowerCase().includes(q)
  )
})

const allSelected = computed(() =>
  filtered.value.length > 0 && selected.value.length === filtered.value.length
)

function toggleAll(e) {
  selected.value = e.target.checked ? filtered.value.map(b => b.id) : []
}

function toggleOne(id) {
  const i = selected.value.indexOf(id)
  if (i === -1) selected.value.push(id)
  else selected.value.splice(i, 1)
}

function tambahBaru() {
  router.push({ name: 'berita-tambah' })
}

function hapusTerpilih() {
  berita.value = berita.value.filter(b => !selected.value.includes(b.id))
  selected.value = []
}

function editBerita(id) {
  router.push({ name: 'berita-edit', params: { id } })
}

function hapusBerita(id) {
  berita.value = berita.value.filter(b => b.id !== id)
}

function exportData() {
  const rows = selected.value.length > 0
    ? berita.value.filter(b => selected.value.includes(b.id))
    : filtered.value

  if (rows.length === 0) return

  const headers = ['Judul', 'Penulis', 'Tanggal', 'Kategori', 'Status']
  const escapeCsv = (val) => {
    const str = String(val ?? '')
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
  }

  const csvLines = [
    headers.join(','),
    ...rows.map(b => [b.judul, b.penulis, b.tanggal, b.kategori, b.status].map(escapeCsv).join(',')),
  ]

  const csvContent = '\ufeff' + csvLines.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `berita-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="min-h-full px-6 py-6 text-slate-800 lg:px-8">
    <h1 class="m-0 mb-1 text-[22px] font-bold text-[#0f2540]">Berita Desa</h1>
    <p class="mb-5 text-sm text-slate-500">Kelola daftar berita yang dimiliki desa.</p>

    <div class="rounded-xl border border-slate-200 bg-white px-6 pb-3 pt-5 shadow-sm">
      <div class="mb-4">
        <h2 class="m-0 text-base font-semibold text-[#0f2540]">Kelola Berita Desa</h2>
      </div>

      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <button
            class="inline-flex items-center gap-1.5 rounded-lg border border-blue-700 bg-blue-700 px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-blue-800"
            @click="tambahBaru"
          >
            <span class="font-bold">+</span> Baru
          </button>

          <button
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="selected.length === 0"
            @click="hapusTerpilih"
          >
            <svg class="h-[15px] w-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Hapus
          </button>
        </div>

        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-400">
            <svg class="h-[15px] w-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" stroke-linecap="round" />
            </svg>
            <input
              v-model="search"
              type="text"
              placeholder="Cari"
              class="w-[140px] border-0 bg-transparent text-[13px] text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>

          <button
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
            @click="exportData"
          >
            <svg class="h-[15px] w-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th class="w-9 border-b border-slate-200 px-3 py-2.5 text-left font-semibold text-slate-500">
                <input type="checkbox" :checked="allSelected" @change="toggleAll" class="accent-blue-700" />
              </th>
              <th class="whitespace-nowrap border-b border-slate-200 px-3 py-2.5 text-left font-semibold text-slate-500">
                Judul <span class="ml-0.5 text-[11px] text-slate-300">↕</span>
              </th>
              <th class="whitespace-nowrap border-b border-slate-200 px-3 py-2.5 text-left font-semibold text-slate-500">Penulis</th>
              <th class="whitespace-nowrap border-b border-slate-200 px-3 py-2.5 text-left font-semibold text-slate-500">Gambar</th>
              <th class="whitespace-nowrap border-b border-slate-200 px-3 py-2.5 text-left font-semibold text-slate-500">
                Tanggal <span class="ml-0.5 text-[11px] text-slate-300">↕</span>
              </th>
              <th class="whitespace-nowrap border-b border-slate-200 px-3 py-2.5 text-left font-semibold text-slate-500">
                Kategori <span class="ml-0.5 text-[11px] text-slate-300">↕</span>
              </th>
              <th class="whitespace-nowrap border-b border-slate-200 px-3 py-2.5 text-left font-semibold text-slate-500">
                Status <span class="ml-0.5 text-[11px] text-slate-300">↕</span>
              </th>
              <th class="w-20 whitespace-nowrap border-b border-slate-200 px-3 py-2.5 text-left font-semibold text-slate-500">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="p in filtered" :key="b.id" class="transition hover:bg-slate-50/70">
              <td class="border-b border-slate-100 px-3 py-3 align-middle">
                <input
                  type="checkbox"
                  :checked="selected.includes(b.id)"
                  @change="toggleOne(b.id)"
                  class="accent-blue-700"
                />
              </td>
              <td class="border-b border-slate-100 px-3 py-3 align-middle text-slate-700">{{ b.judul }}</td>
              <td class="border-b border-slate-100 px-3 py-3 align-middle text-slate-700">{{ b.penulis }}</td>
              <td class="border-b border-slate-100 px-3 py-3 align-middle">
                <div class="h-7 w-10 rounded bg-slate-200"></div>
              </td>
              <td class="border-b border-slate-100 px-3 py-3 align-middle text-slate-700">{{ b.tanggal }}</td>
              <td class="border-b border-slate-100 px-3 py-3 align-middle text-slate-700">{{ b.kategori }}</td>
              <td class="border-b border-slate-100 px-3 py-3 align-middle">
                <span
                  class="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em]"
                  :class="b.status === 'PUBLISHED' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'"
                >
                  {{ b.status }}
                </span>
              </td>
              <td class="whitespace-nowrap border-b border-slate-100 px-3 py-3 align-middle">
                <button
                  class="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-blue-700"
                  title="Edit"
                  @click="editBerita(b.id)"
                >
                  <svg class="h-[15px] w-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>

                <button
                  class="rounded-md p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                  title="Hapus"
                  @click="hapusBerita(b.id)"
                >
                  <svg class="h-[15px] w-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </td>
            </tr>

            <tr v-if="filtered.length === 0">
              <td colspan="8" class="px-3 py-6 text-center text-slate-400">
                Tidak ada berita yang cocok dengan pencarian.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 px-1 py-3.5 text-[13px] text-slate-500">
        <span>Menampilkan 1–{{ filtered.length }} dari {{ berita.length }}</span>

        <div class="flex items-center gap-1.5">
          <button
            class="h-7 min-w-7 rounded-md border border-slate-200 bg-white px-2 text-[13px] text-slate-700 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            ‹
          </button>
          <button class="h-7 min-w-7 rounded-md border border-blue-700 bg-blue-700 px-2 text-[13px] text-white">1</button>
          <button class="h-7 min-w-7 rounded-md border border-slate-200 bg-white px-2 text-[13px] text-slate-700 hover:border-slate-400">2</button>
          <button class="h-7 min-w-7 rounded-md border border-slate-200 bg-white px-2 text-[13px] text-slate-700 hover:border-slate-400">3</button>
          <button
            class="h-7 min-w-7 rounded-md border border-slate-200 bg-white px-2 text-[13px] text-slate-700 hover:border-slate-400"
            @click="currentPage++"
          >
            ›
          </button>

          <select
            v-model="perPage"
            class="ml-1.5 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[13px] text-slate-700 outline-none focus:border-blue-700"
          >
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>
