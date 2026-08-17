<script setup>

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const router = useRouter()

const news = ref([
  {
    id: 1,
    title: 'Judul berita',
    author: 'User Name',
    image: null,
    date: '3/18/2026',
    category: 'Kategori',
    status: 'PUBLISHED',
  },
  {
    id: 2,
    title: 'Judul berita',
    author: 'User Name',
    image: null,
    date: '27/07/2026',
    category: 'Kategori',
    status: 'PUBLISHED',
  },
  {
    id: 3,
    title: 'Judul berita',
    author: 'User Name',
    image: null,
    date: '25/07/2026',
    category: 'Kategori',
    status: 'DRAFT',
  },
  {
    id: 4,
    title: 'Judul berita',
    author: 'User Name',
    image: null,
    date: '13/07/2026',
    category: 'Kategori',
    status: 'PUBLISHED',
  },
  {
    id: 5,
    title: 'Judul berita',
    author: 'User Name',
    image: null,
    date: '10/07/2026',
    category: 'Kategori',
    status: 'PUBLISHED',
  },
  {
    id: 6,
    title: 'Judul berita',
    author: 'User Name',
    image: null,
    date: '7/07/2026',
    category: 'Kategori',
    status: 'DRAFT',
  },
  {
    id: 7,
    title: 'Judul berita',
    author: 'User Name',
    image: null,
    date: '4/07/2026',
    category: 'Kategori',
    status: 'PUBLISHED',
  },
  {
    id: 8,
    title: 'Judul berita',
    author: 'User Name',
    image: null,
    date: '28/06/2026',
    category: 'Kategori',
    status: 'PUBLISHED',
  },
])

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

function deleteNews(id) {
  news.value = news.value.filter(newsItem => newsItem.id !== id)
  selectedNews.value = selectedNews.value.filter(newsItem => newsItem.id !== id)
}

function deleteSelected() {
  const idsToDelete = new Set(selectedNews.value.map(newsItem => newsItem.id))
  news.value = news.value.filter(newsItem => !idsToDelete.has(newsItem.id))
  selectedNews.value = []
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
  <div class="min-h-full px-6 py-6 text-neutral-800 lg:px-8">

    <h1 class="m-0 mb-1 text-[22px] font-bold text-primary-900">
      Berita Desa
    </h1>

    <p class="mb-5 text-sm text-neutral-500">
      Kelola daftar berita yang dimiliki desa.
    </p>

    <div class="rounded-xl border border-neutral-200 bg-white shadow-sm">

      <div class="border-b border-neutral-100 px-6 py-4">
        <h2 class="m-0 text-base font-semibold text-primary-900">
          Kelola Berita Desa
        </h2>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-4">

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

      <div class="px-6 pb-4">
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
                  @click="deleteNews(data.id)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

    </div>
  </div>
</template>