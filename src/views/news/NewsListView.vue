<script setup>

import { ref, computed, watch, onMounted } from 'vue'
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
import Menu from 'primevue/menu'
import SelectButton from 'primevue/selectbutton'
import Tag from 'primevue/tag'
import { newsService } from '@/services/content.service'
import { getListCache, setListCache } from '@/services/list-cache'
import { mediaUrl } from '@/services/media'
import AnnouncementFormDialog from './AnnouncementFormDialog.vue'
import ServiceHoursFormDialog from '../service-hours/ServiceHoursFormDialog.vue'

const router = useRouter()
const confirm = useConfirm()
const cachedNews = getListCache('news')
const loading = ref(!cachedNews)
const loadError = ref('')
const news = ref((cachedNews ?? []).map(mapNewsItem))

function formatDate(value) {
  return value
    ? new Date(value).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '-'
}

function isExpired(validUntil) {
  if (!validUntil) return false
  const end = new Date(validUntil)
  end.setHours(23, 59, 59, 999)
  return end < new Date()
}

function mapNewsItem(item) {
  const categoryName = item.category?.category_name ?? item.category?.name ?? '-'
  // An item is an announcement when its category is "Pengumuman"
  const isAnnouncement = categoryName.trim().toLowerCase() === 'pengumuman'

  return {
    id: item.news_id,
    type: isAnnouncement ? 'announcement' : 'news',
    title: item.title,
    author: item.author?.full_name ?? item.author?.name ?? '-',
    image: mediaUrl(item.thumbnail),
    date: formatDate(item.published_at),
    validUntil: isAnnouncement ? formatDate(item.valid_until) : '-',
    expired: isAnnouncement && isExpired(item.valid_until),
    category: categoryName,
    status: item.status?.toUpperCase() ?? '-',
  }
}

async function loadNews({ background = false } = {}) {
  if (!background) loading.value = true
  try {
    const data = await newsService.list()
    const normalized = Array.isArray(data) ? data : []
    setListCache('news', normalized)
    news.value = normalized.map(mapNewsItem)
    loadError.value = ''
  } catch (error) {
    loadError.value = 'Data berita belum dapat dimuat.'
    if (!background) news.value = []
    console.error('Gagal memuat berita:', error)
  } finally {
    if (!background) loading.value = false
  }
}
onMounted(() => loadNews({ background: Boolean(cachedNews) }))

const selectedNews = ref([])
const rowsPerPage = ref(10)

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

/* Type filter tabs: All / News / Announcement */
const activeTab = ref('all')
const tabOptions = [
  { label: 'Semua', value: 'all' },
  { label: 'Berita', value: 'news' },
  { label: 'Pengumuman', value: 'announcement' },
]

const filteredNews = computed(() =>
  activeTab.value === 'all'
    ? news.value
    : news.value.filter(item => item.type === activeTab.value)
)

// SelectButton can emit null when the active option is clicked again
watch(activeTab, (value) => {
  if (!value) activeTab.value = 'all'
  selectedNews.value = []
})

function typeLabel(type) {
  return type === 'announcement' ? 'Pengumuman' : 'Berita'
}

function typeSeverity(type) {
  return type === 'announcement' ? 'warn' : 'success'
}

function statusSeverity(status) {
  return status === 'PUBLISHED' ? 'info' : 'secondary'
}

/* Dialogs: announcement form and service hours form */
const announcementDialogVisible = ref(false)
const editingAnnouncementId = ref(null)
const serviceHoursDialogVisible = ref(false)

function openAnnouncementDialog(id = null) {
  editingAnnouncementId.value = id
  announcementDialogVisible.value = true
}

function openServiceHoursDialog() {
  serviceHoursDialogVisible.value = true
}

/* "New" button menu: News opens its page, the others open dialogs */
const addMenu = ref()

const addItems = [
  {
    label: 'Berita',
    icon: 'pi pi-file',
    command: () => router.push({ name: 'news-create' }),
  },
  {
    label: 'Pengumuman',
    icon: 'pi pi-megaphone',
    command: () => openAnnouncementDialog(),
  },
  { separator: true },
  {
    label: 'Jam Pelayanan',
    icon: 'pi pi-clock',
    command: () => openServiceHoursDialog(),
  },
]

function toggleAddMenu(event) {
  addMenu.value.toggle(event)
}

function editNews(data) {
  if (data.type === 'announcement') {
    openAnnouncementDialog(data.id)
    return
  }
  router.push({ name: 'news-edit', params: { id: data.id } })
}

function deleteNews(data) {
  confirm.require({
    message: `Hapus ${typeLabel(data.type).toLowerCase()} "${data.title}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await newsService.remove(data.id)
        await loadNews()
        selectedNews.value = selectedNews.value.filter(newsItem => newsItem.id !== data.id)
      } catch (error) {
        window.alert(error.response?.data?.message ?? 'Gagal menghapus data.')
      }
    },
  })
}

function deleteSelected() {
  confirm.require({
    message: `Hapus ${selectedNews.value.length} data terpilih?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      const idsToDelete = new Set(selectedNews.value.map(newsItem => newsItem.id))
      try {
        await Promise.all([...idsToDelete].map(id => newsService.remove(id)))
        await loadNews()
        selectedNews.value = []
      } catch (error) {
        window.alert(error.response?.data?.message ?? 'Gagal menghapus sebagian data.')
        await loadNews()
      }
    },
  })
}

function exportData() {
  const rows = selectedNews.value.length > 0 ? selectedNews.value : filteredNews.value

  if (rows.length === 0) return

  const headers = ['Judul', 'Tipe', 'Penulis', 'Tanggal', 'Berlaku Sampai', 'Kategori', 'Status']

  const escapeCsv = (value) => {
    const stringValue = String(value ?? '')

    return /[",\n]/.test(stringValue)
      ? `"${stringValue.replace(/"/g, '""')}"`
      : stringValue
  }

  const csvLines = [
    headers.join(','),
    ...rows.map(newsItem =>
      [
        newsItem.title,
        typeLabel(newsItem.type),
        newsItem.author,
        newsItem.date,
        newsItem.validUntil,
        newsItem.category,
        newsItem.status,
      ]
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
        Berita &amp; Pengumuman
      </h1>

      <p class="m-0 mt-1 text-sm text-neutral-500">
        Kelola berita, pengumuman, dan jam pelayanan desa.
      </p>
    </div>

    <Card>
      <template #content>

        <div class="mb-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <div class="flex items-center gap-2">

            <Button
              label="Baru"
              icon="pi pi-plus"
              iconPos="left"
              aria-haspopup="true"
              aria-controls="add_menu"
              class="rounded-lg border border-primary-700 bg-primary-700 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-primary-800"
              @click="toggleAddMenu"
            />
            <Menu id="add_menu" ref="addMenu" :model="addItems" :popup="true" />

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

        <div class="mb-3">
          <SelectButton
            v-model="activeTab"
            :options="tabOptions"
            optionLabel="label"
            optionValue="value"
            :allowEmpty="false"
            class="text-[13px]"
          />
        </div>

        <DataTable
          v-model:selection="selectedNews"
          :value="filteredNews"
          :loading="loading"
          :filters="filters"
          :paginator="true"
          :rows="rowsPerPage"
          :rowsPerPageOptions="[10, 25, 50]"
          currentPageReportTemplate="Menampilkan {first}–{last} dari {totalRecords} data"
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
              {{ loadError || 'Tidak ada data yang cocok dengan pencarian.' }}
            </div>
          </template>

          <Column selectionMode="multiple" headerStyle="width: 2.5rem" />

          <Column field="title" header="Judul" sortable />

          <Column field="type" header="Tipe" sortable>
            <template #body="{ data }">
              <Tag
                :value="typeLabel(data.type)"
                :severity="typeSeverity(data.type)"
                class="rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em]"
              />
            </template>
          </Column>

          <Column field="author" header="Penulis" sortable />

          <Column header="Gambar" headerStyle="width: 4rem">
            <template #body="{ data }">
              <div class="flex h-7 w-10 items-center justify-center overflow-hidden rounded bg-neutral-200">
                <img
                  v-if="data.image"
                  :src="data.image"
                  :alt="data.title"
                  class="h-full w-full object-cover"
                />
              </div>
            </template>
          </Column>

          <Column field="date" header="Tanggal" sortable />

          <Column field="validUntil" header="Berlaku Sampai">
            <template #body="{ data }">
              <span :class="data.expired ? 'font-semibold text-danger-600' : ''">
                {{ data.validUntil }}
              </span>
              <span v-if="data.expired" class="ml-1 text-[11px] text-danger-600">(berakhir)</span>
            </template>
          </Column>

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
                  @click="editNews(data)"
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

    <AnnouncementFormDialog
      v-model:visible="announcementDialogVisible"
      :announcement-id="editingAnnouncementId"
      @saved="loadNews()"
    />

    <ServiceHoursFormDialog v-model:visible="serviceHoursDialogVisible" />
  </div>
</template>