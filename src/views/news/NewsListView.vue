<script setup>

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'
import { useConfirm } from 'primevue/useconfirm'

import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { newsService } from '@/services/content.service'

const router = useRouter()
const confirm = useConfirm()

async function loadNews() {
  const data = await newsService.list()
  news.value = data.map(item => ({ id: item.news_id, title: item.title, author: item.author?.full_name ?? item.author?.name ?? '-', image: item.thumbnail, date: item.published_at ? new Date(item.published_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-', category: item.category?.category_name ?? item.category?.name ?? '-', status: item.status?.toUpperCase() }))
}
onMounted(loadNews)

/* const newsDummy = [
  {
    id: 1,
    title: 'Musyawarah Perencanaan Desa Tetapkan Prioritas Pembangunan 2027',
    author: 'Admin Desa',
    image: null,
    date: '18/03/2026',
    category: 'Infrastruktur',
    status: 'PUBLISHED',
  },
  {
    id: 2,
    title: 'Posyandu Melati Catat Peningkatan Kunjungan Balita Bulan Ini',
    author: 'Siti Rahayu',
    image: null,
    date: '27/07/2026',
    category: 'Kesehatan',
    status: 'PUBLISHED',
  },
  {
    id: 3,
    title: 'Rencana Perbaikan Jalan Penghubung Dusun Sukamaju Segera Dimulai',
    author: 'Budi Santoso',
    image: null,
    date: '25/07/2026',
    category: 'Infrastruktur',
    status: 'DRAFT',
  },
  {
    id: 4,
    title: 'Penyuluhan Pertanian Organik Diikuti Puluhan Petani Lokal',
    author: 'Agus Setiawan',
    image: null,
    date: '13/07/2026',
    category: 'Pertanian',
    status: 'PUBLISHED',
  },
  {
    id: 5,
    title: 'BUMDes Salurkan Bantuan Modal Usaha untuk 20 Pelaku UMKM',
    author: 'Dewi Lestari',
    image: null,
    date: '10/07/2026',
    category: 'Keuangan',
    status: 'PUBLISHED',
  },
  {
    id: 6,
    title: 'Pelatihan Digitalisasi Administrasi Desa Bersama Dinas Kominfo',
    author: 'Rudi Hartono',
    image: null,
    date: '07/07/2026',
    category: 'Teknologi',
    status: 'DRAFT',
  },
  {
    id: 7,
    title: 'Kerja Bakti Serentak Bersihkan Saluran Irigasi Menjelang Musim Hujan',
    author: 'Admin Desa',
    image: null,
    date: '04/07/2026',
    category: 'Sosial',
    status: 'PUBLISHED',
  },
  {
    id: 8,
    title: 'Vaksinasi Massal Hewan Ternak Cegah Penyebaran Penyakit Mulut dan Kuku',
    author: 'Ani Wulandari',
    image: null,
    date: '28/06/2026',
    category: 'Kesehatan',
    status: 'PUBLISHED',
  },
  {
    id: 9,
    title: 'Pembangunan Jembatan Gantung Dusun Kenanga Capai 70 Persen',
    author: 'Budi Santoso',
    image: null,
    date: '22/06/2026',
    category: 'Infrastruktur',
    status: 'PUBLISHED',
  },
  {
    id: 10,
    title: 'Sosialisasi Bantuan Sosial Tahap III Digelar di Balai Desa',
    author: 'Siti Rahayu',
    image: null,
    date: '15/06/2026',
    category: 'Sosial',
    status: 'PUBLISHED',
  },
  {
    id: 11,
    title: 'Panen Raya Jagung Hibrida Naikkan Pendapatan Petani Desa',
    author: 'Agus Setiawan',
    image: null,
    date: '09/06/2026',
    category: 'Pertanian',
    status: 'DRAFT',
  },
  {
    id: 12,
    title: 'Pelatihan Kerajinan Anyaman Bambu Buka Peluang Usaha Baru',
    author: 'Dewi Lestari',
    image: null,
    date: '02/06/2026',
    category: 'Sosial',
    status: 'PUBLISHED',
  },
]
*/
const news = ref([])

const selectedNews = ref([])
const rowsPerPage = ref(10)

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

function statusSeverity(status) {
  return status === 'PUBLISHED' ? 'info' : 'secondary'
}

function addNew() {
  router.push({ name: 'news-create' })
}

function editNews(id) {
  router.push({ name: 'news-edit', params: { id } })
}

function deleteNews(data) {
  confirm.require({
    message: `Hapus berita "${data.title}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await newsService.remove(data.id)
        news.value = news.value.filter(newsItem => newsItem.id !== data.id)
        selectedNews.value = selectedNews.value.filter(newsItem => newsItem.id !== data.id)
      } catch (error) {
        window.alert(error.response?.data?.message ?? 'Gagal menghapus berita.')
      }
    },
  })
}

function deleteSelected() {
  confirm.require({
    message: `Hapus ${selectedNews.value.length} berita terpilih?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      const idsToDelete = new Set(selectedNews.value.map(newsItem => newsItem.id))
      try {
        await Promise.all([...idsToDelete].map(id => newsService.remove(id)))
        news.value = news.value.filter(newsItem => !idsToDelete.has(newsItem.id))
        selectedNews.value = []
      } catch (error) {
        window.alert(error.response?.data?.message ?? 'Gagal menghapus sebagian berita.')
        await loadNews()
      }
    },
  })
}

function exportData() {
  const rows = selectedNews.value.length > 0 ? selectedNews.value : news.value

  if (rows.length === 0) return

  const headers = ['Judul', 'Penulis', 'Tanggal', 'Kategori', 'Status']

  const escapeCsv = (value) => {
    const stringValue = String(value ?? '')

    return /[",\n]/.test(stringValue)
      ? `"${stringValue.replace(/"/g, '""')}"`
      : stringValue
  }

  const csvLines = [
    headers.join(','),
    ...rows.map(newsItem =>
      [newsItem.title, newsItem.author, newsItem.date, newsItem.category, newsItem.status]
        .map(escapeCsv)
        .join(',')
    ),
  ]

  const csvContent = '\ufeff' + csvLines.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `news-${new Date().toISOString().slice(0, 10)}.csv`

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
</script>

<template>
  <div>

    <div class="mb-6">
      <h1 class="m-0 text-2xl font-bold text-primary-900">
        Berita Desa
      </h1>

      <p class="m-0 mt-1 text-sm text-neutral-500">
        Kelola daftar berita yang dimiliki desa.
      </p>
    </div>

    <Card>
      <template #content>

        <div class="mb-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <div class="flex items-center gap-2">

            <Button
              label="Baru"
              icon="pi pi-plus"
              class="rounded-lg border border-primary-700 bg-primary-700 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-primary-800"
              @click="addNew"
            />

            <Button
              label="Hapus"
              icon="pi pi-trash"
              severity="secondary"
              outlined
              :disabled="selectedNews.length === 0"
              class="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
              @click="deleteSelected"
            />

          </div>

          <div class="flex items-center gap-2">

            <IconField>
              <InputIcon class="pi pi-search text-neutral-400" />
              <InputText
                v-model="filters.global.value"
                placeholder="Cari judul, penulis, kategori"
                class="w-[220px] rounded-lg border border-neutral-300 bg-white py-2 pl-8 pr-3 text-[13px] text-neutral-800 outline-none transition focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
              />
            </IconField>

            <Button
              label="Export"
              icon="pi pi-download"
              severity="secondary"
              outlined
              class="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
              @click="exportData"
            />

          </div>
        </div>

        <DataTable
          v-model:selection="selectedNews"
          :value="news"
          :filters="filters"
          :paginator="true"
          :rows="rowsPerPage"
          :rowsPerPageOptions="[10, 25, 50]"
          currentPageReportTemplate="Menampilkan {first}–{last} dari {totalRecords} berita"
          paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          dataKey="id"
          removableSort
          stripedRows
          class="w-full overflow-hidden rounded-lg border border-neutral-200 text-[13px]"
          :pt="{
            header: { class: 'bg-neutral-50' },
            headerRow: { class: 'bg-neutral-50' },
            headerCell: { class: 'whitespace-nowrap border-b border-neutral-200 bg-neutral-50 px-3 py-2.5 text-left font-semibold text-neutral-500' },
            bodyRow: { class: 'border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/70' },
            bodyCell: { class: 'px-3 py-3 align-middle text-neutral-700' },
            paginator: { root: { class: 'flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-3 py-3 text-[13px] text-neutral-500' } },
          }"
        >
          <template #empty>
            <div class="px-3 py-8 text-center text-neutral-400">
              Tidak ada berita yang cocok dengan pencarian.
            </div>
          </template>

          <Column selectionMode="multiple" headerStyle="width: 2.5rem" />

          <Column field="title" header="Judul" sortable />
          <Column field="author" header="Penulis" sortable />

          <Column header="Gambar" headerStyle="width: 4rem">
            <template #body>
              <div class="h-7 w-10 rounded bg-neutral-200" />
            </template>
          </Column>

          <Column field="date" header="Tanggal" sortable />
          <Column field="category" header="Kategori" sortable />

          <Column field="status" header="Status" sortable>
            <template #body="{ data }">
              <Tag
                :value="data.status"
                :severity="statusSeverity(data.status)"
                class="rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em]"
              />
            </template>
          </Column>

          <Column header="Aksi" headerStyle="width: 6rem">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <Button
                  icon="pi pi-pencil"
                  text
                  rounded
                  severity="secondary"
                  class="h-8 w-8 text-neutral-500 hover:bg-neutral-100 hover:text-primary-700"
                  title="Edit"
                  @click="editNews(data.id)"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  class="h-8 w-8 text-neutral-500 hover:bg-danger-50 hover:text-danger-600"
                  title="Hapus"
                  @click="deleteNews(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>

      </template>
    </Card>
  </div>
</template>
