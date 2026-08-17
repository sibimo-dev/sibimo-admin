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

const potentials = ref([
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
])

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

function deletePotential(id) {
  potentials.value = potentials.value.filter(potential => potential.id !== id)
  selectedPotentials.value = selectedPotentials.value.filter(potential => potential.id !== id)
}

function deleteSelected() {
  const idsToDelete = new Set(selectedPotentials.value.map(potential => potential.id))
  potentials.value = potentials.value.filter(potential => !idsToDelete.has(potential.id))
  selectedPotentials.value = []
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
  <div class="min-h-full px-6 py-6 text-neutral-800 lg:px-8">

    <h1 class="m-0 mb-1 text-[22px] font-bold text-primary-900">
      Potensi Desa
    </h1>

    <p class="m-0 mb-5 text-sm text-neutral-500">
      Kelola daftar potensi yang dimiliki desa.
    </p>

    <div class="rounded-xl border border-neutral-200 bg-white shadow-sm">

      <div class="border-b border-neutral-100 px-6 py-4">
        <h2 class="m-0 text-base font-semibold text-primary-900">
          Kelola Potensi Desa
        </h2>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-4">

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

      <div class="px-6 pb-4">
        <DataTable
          v-model:selection="selectedPotentials"
          :value="potentials"
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
              Tidak ada potensi yang cocok dengan pencarian.
            </div>
          </template>

          <Column selectionMode="multiple" headerStyle="width: 2.5rem" />

          <Column field="title" header="Judul" sortable />

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
                  @click="deletePotential(data.id)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

    </div>
  </div>
</template>