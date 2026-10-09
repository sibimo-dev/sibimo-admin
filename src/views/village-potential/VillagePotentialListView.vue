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
import { potentialService } from '@/services/content.service'
import { getListCache, setListCache } from '@/services/list-cache'
import { mediaUrl } from '@/services/media'

const router = useRouter()
const confirm = useConfirm()
const cachedPotentials = getListCache('village-potentials')
const loading = ref(!cachedPotentials)
const loadError = ref('')

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
}

const potentials = ref((cachedPotentials ?? []).map(mapPotentialItem))

function mapPotentialItem(item) {
  return {
    id: item.potential_id,
    title: item.title,
    image: mediaUrl(item.image),
    date: formatDate(item.created_at ?? item.updated_at),
    category: item.category ?? '-',
    status: item.status?.toUpperCase() ?? 'PUBLISHED',
  }
}

async function loadPotentials({ background = false } = {}) {
  if (!background) loading.value = true
  try {
    const data = await potentialService.list()
    const normalized = Array.isArray(data) ? data : []
    setListCache('village-potentials', normalized)
    potentials.value = normalized.map(mapPotentialItem)
    loadError.value = ''
  } catch (error) {
    loadError.value = 'Data potensi belum dapat dimuat.'
    if (!background) potentials.value = []
    console.error('Gagal memuat potensi:', error)
  } finally {
    if (!background) loading.value = false
  }
}
onMounted(() => loadPotentials({ background: Boolean(cachedPotentials) }))

/* const potentialsDummy = [
  { id: 1, title: 'Sentra Kerajinan Anyaman Bambu Desa Sukamaju', image: null, date: '9/08/2026', category: 'UMKM', status: 'PUBLISHED' },
  { id: 2, title: 'Budidaya Ikan Nila Air Tawar Desa Mekarsari', image: null, date: '7/08/2026', category: 'Perikanan', status: 'PUBLISHED' },
  { id: 3, title: 'Pengembangan Lahan Pertanian Jagung Unggul', image: null, date: '5/08/2026', category: 'Pertanian', status: 'DRAFT' },
  { id: 4, title: 'BUMDes Maju Bersama Unit Simpan Pinjam', image: null, date: '3/08/2026', category: 'Bumdes', status: 'PUBLISHED' },
  { id: 5, title: 'Wisata Alam Air Terjun Curug Lestari', image: null, date: '1/08/2026', category: 'Pariwisata', status: 'PUBLISHED' },
  { id: 6, title: 'Produksi Keripik Pisang Khas Desa', image: null, date: '29/07/2026', category: 'UMKM', status: 'PUBLISHED' },
  { id: 7, title: 'Tambak Udang Vaname Berkelanjutan', image: null, date: '27/07/2026', category: 'Perikanan', status: 'PUBLISHED' },
  { id: 8, title: 'Perkebunan Kopi Arabika Desa Sejahtera', image: null, date: '25/07/2026', category: 'Pertanian', status: 'DRAFT' },
  { id: 9, title: 'BUMDes Sumber Rezeki Pengelolaan Pasar Desa', image: null, date: '23/07/2026', category: 'Bumdes', status: 'PUBLISHED' },
  { id: 10, title: 'Kampung Wisata Budaya dan Kuliner Tradisional', image: null, date: '20/07/2026', category: 'Pariwisata', status: 'PUBLISHED' },
  { id: 11, title: 'Usaha Olahan Singkong dan Tepung Mocaf', image: null, date: '18/07/2026', category: 'UMKM', status: 'PUBLISHED' },
  { id: 12, title: 'Budidaya Lele Sistem Bioflok', image: null, date: '16/07/2026', category: 'Perikanan', status: 'PUBLISHED' },
  { id: 13, title: 'Pengembangan Hortikultura Cabai dan Tomat', image: null, date: '14/07/2026', category: 'Pertanian', status: 'DRAFT' },
  { id: 14, title: 'BUMDes Tirta Mandiri Pengelolaan Air Bersih', image: null, date: '12/07/2026', category: 'Bumdes', status: 'PUBLISHED' },
  { id: 15, title: 'Desa Wisata Bukit Panorama Alam', image: null, date: '10/07/2026', category: 'Pariwisata', status: 'PUBLISHED' },
  { id: 16, title: 'Industri Rumahan Batik Motif Khas Daerah', image: null, date: '8/07/2026', category: 'UMKM', status: 'PUBLISHED' },
  { id: 17, title: 'Pengolahan Hasil Laut Menjadi Produk Frozen Food', image: null, date: '6/07/2026', category: 'Perikanan', status: 'DRAFT' },
  { id: 18, title: 'Lahan Produktif Padi Organik Desa Makmur', image: null, date: '4/07/2026', category: 'Pertanian', status: 'PUBLISHED' },
  { id: 19, title: 'BUMDes Harapan Jaya Unit Pengelolaan Sampah', image: null, date: '2/07/2026', category: 'Bumdes', status: 'PUBLISHED' },
  { id: 20, title: 'Wisata Sungai dan Susur Alam Desa Lestari', image: null, date: '30/06/2026', category: 'Pariwisata', status: 'PUBLISHED' },
]
*/
const selectedPotentials = ref([])
const rowsPerPage = ref(10)

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

function statusSeverity(status) {
  return status === 'PUBLISHED' ? 'info' : 'secondary'
}

function addNew() {
  router.push({ name: 'village-potential-create' })
}

function editPotential(id) {
  router.push({ name: 'village-potential-edit', params: { id } })
}

function deletePotential(data) {
  confirm.require({
    message: `Hapus potensi "${data.title}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await potentialService.remove(data.id)
        await loadPotentials()
        selectedPotentials.value = selectedPotentials.value.filter(potential => potential.id !== data.id)
      } catch (error) {
        window.alert(error.response?.data?.message ?? 'Gagal menghapus potensi.')
      }
    },
  })
}

function deleteSelected() {
  confirm.require({
    message: `Hapus ${selectedPotentials.value.length} potensi terpilih?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      const idsToDelete = new Set(selectedPotentials.value.map(potential => potential.id))

      try {
        await Promise.all([...idsToDelete].map(id => potentialService.remove(id)))
        await loadPotentials()
        selectedPotentials.value = []
      } catch (error) {
        window.alert(error.response?.data?.message ?? 'Gagal menghapus sebagian potensi.')
        await loadPotentials()
      }
    },
  })
}

function exportData() {
  const rows = selectedPotentials.value.length > 0
    ? selectedPotentials.value
    : potentials.value

  if (rows.length === 0) return

  const headers = ['Judul', 'Tanggal', 'Kategori', 'Status']

  const escapeCsv = (value) => {
    const stringValue = String(value ?? '')
    return /[",\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue
  }

  const csvLines = [
    headers.join(','),
    ...rows.map(potential =>
      [potential.title, potential.date, potential.category, potential.status]
        .map(escapeCsv)
        .join(',')
    ),
  ]

  const csvContent = '\ufeff' + csvLines.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `village-potential-${new Date().toISOString().slice(0, 10)}.csv`

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
        Potensi Desa
      </h1>

      <p class="m-0 mt-1 text-sm text-neutral-500">
        Kelola daftar potensi yang dimiliki desa.
      </p>
    </div>

    <Card>
      <template #content>

        <div class="mb-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <div class="flex items-center gap-2">

            <Button
              label="Baru"
              icon="pi pi-plus"
              class="rounded-lg border border-transparent bg-primary-700 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-primary-800"
              @click="addNew"
            />

            <Button
              label="Hapus"
              icon="pi pi-trash"
              severity="secondary"
              outlined
              :disabled="selectedPotentials.length === 0"
              class="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
              @click="deleteSelected"
            />

          </div>

          <div class="flex items-center gap-2">

            <IconField>
              <InputIcon class="pi pi-search text-neutral-400" />
              <InputText
                v-model="filters.global.value"
                placeholder="Cari judul atau kategori"
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
          v-model:selection="selectedPotentials"
          :value="potentials"
          :loading="loading"
          :filters="filters"
          :paginator="true"
          :rows="rowsPerPage"
          :rowsPerPageOptions="[10, 25, 50]"
          currentPageReportTemplate="Menampilkan {first}–{last} dari {totalRecords} potensi"
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
              {{ loadError || 'Tidak ada potensi yang cocok dengan pencarian.' }}
            </div>
          </template>

          <Column selectionMode="multiple" headerStyle="width: 2.5rem" />

          <Column field="title" header="Judul" sortable />

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
          <Column field="category" header="Kategori" sortable />

          <Column field="status" header="Status" sortable>
            <template #body="{ data }">
              <Tag
                :value="data.status"
                :severity="statusSeverity(data.status)"
                class="rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide"
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
                  @click="editPotential(data.id)"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  class="h-8 w-8 text-neutral-500 hover:bg-danger-50 hover:text-danger-600"
                  title="Hapus"
                  @click="deletePotential(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>

      </template>
    </Card>
  </div>
</template>
