<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Card from 'primevue/card'

const router = useRouter()
const confirm = useConfirm()

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const agendas = ref([
  {
    id: 1,
    name: 'Musyawarah Perencanaan Desa (Musrenbangdes)',
    date: '03/08/2026',
    time: '09:00 - Selesai',
    location: 'Balai Desa',
    status: 'PUBLISHED',
  },
  {
    id: 2,
    name: 'Posyandu Balita & Lansia Melati',
    date: '05/08/2026',
    time: '08:00 - 12:00',
    location: 'Pos Kamling RW 04',
    status: 'PUBLISHED',
  },
  {
    id: 3,
    name: 'Kerja Bakti Lingkungan Serentak',
    date: '09/08/2026',
    time: '06:30 - Selesai',
    location: 'Seluruh Wilayah Desa',
    status: 'DRAFT',
  },
  {
    id: 4,
    name: 'Penyuluhan Pertanian Organik',
    date: '13/08/2026',
    time: '10:00 - 14:00',
    location: 'Aula Tani Makmur',
    status: 'PUBLISHED',
  },
  {
    id: 5,
    name: 'Pelatihan UMKM Kerajinan',
    date: '16/08/2026',
    time: '09:00 - 15:00',
    location: 'Aula Balai Desa',
    status: 'PUBLISHED',
  },
  {
    id: 6,
    name: 'Rapat Koordinasi BUMDes',
    date: '18/08/2026',
    time: '13:00 - Selesai',
    location: 'Kantor BUMDes',
    status: 'DRAFT',
  },
  {
    id: 7,
    name: 'Vaksinasi Massal Hewan Ternak',
    date: '20/08/2026',
    time: '07:30 - 11:00',
    location: 'Lapangan Desa',
    status: 'PUBLISHED',
  },
  {
    id: 8,
    name: 'Sosialisasi Bantuan Sosial Tahap III',
    date: '22/08/2026',
    time: '09:00 - 12:00',
    location: 'Balai Desa',
    status: 'PUBLISHED',
  },
])

const selected = ref([])
const filters = ref({
  global: { value: null },
})

const rowsPerPage = ref(10)

function parseDate(dateString) {
  const [day, month, year] = dateString.split('/').map(Number)
  return new Date(year, month - 1, day)
}

function getDayName(dateString) {
  return dayNames[parseDate(dateString).getDay()]
}

function statusSeverity(status) {
  return status === 'PUBLISHED' ? 'success' : 'warn'
}

function addNew() {
  router.push({ name: 'agenda-create' })
}

function goToCalendar() {
  router.push({ name: 'agenda-calendar' })
}

function editAgenda(id) {
  router.push({
    name: 'agenda-edit',
    params: { id },
  })
}

function deleteAgenda(data) {
  confirm.require({
    message: `Hapus agenda "${data.name}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: () => {
      agendas.value = agendas.value.filter(
        agendaItem => agendaItem.id !== data.id
      )

      selected.value = selected.value.filter(item => item.id !== data.id)
    },
  })
}

function deleteSelected() {
  confirm.require({
    message: `Hapus ${selected.value.length} agenda terpilih?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: () => {
      const selectedIds = new Set(selected.value.map(item => item.id))

      agendas.value = agendas.value.filter(
        agendaItem => !selectedIds.has(agendaItem.id)
      )

      selected.value = []
    },
  })
}

function exportData() {
  const rows = selected.value.length > 0
    ? selected.value
    : agendas.value

  if (rows.length === 0) return

  const headers = ['Nama Agenda', 'Hari', 'Tanggal', 'Jam', 'Lokasi', 'Status']

  const escapeCsv = (value) => {
    const stringValue = String(value ?? '')

    return /[",\n]/.test(stringValue)
      ? `"${stringValue.replace(/"/g, '""')}"`
      : stringValue
  }

  const csvLines = [
    headers.join(','),
    ...rows.map(agendaItem =>
      [
        agendaItem.name,
        getDayName(agendaItem.date),
        agendaItem.date,
        agendaItem.time,
        agendaItem.location,
        agendaItem.status,
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
  link.download = `agenda-${new Date().toISOString().slice(0, 10)}.csv`

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
        Kelola Agenda
      </h1>
      <p class="m-0 mt-1 text-sm text-neutral-500">
        Kelola daftar agenda kegiatan desa.
      </p>
    </div>

    <Card
      :pt="{
        root: { class: 'rounded-lg border border-neutral-200 bg-white shadow-sm' },
        body: { class: 'p-5' },
        content: { class: 'p-0' },
      }"
    >
      <template #content>
        <div class="mb-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <div class="flex flex-wrap items-center gap-2">
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
              :disabled="selected.length === 0"
              class="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
              @click="deleteSelected"
            />
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <IconField class="w-full sm:w-72">
              <InputIcon class="pi pi-search text-neutral-400" />

              <InputText
                v-model="filters.global.value"
                placeholder="Cari agenda atau lokasi"
                class="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-8 pr-3 text-[13px] text-neutral-800 outline-none transition focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
              />
            </IconField>

            <Button
              label="Kalender"
              icon="pi pi-calendar"
              severity="secondary"
              outlined
              class="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
              @click="goToCalendar"
            />

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
          v-model:selection="selected"
          v-model:filters="filters"
          :value="agendas"
          dataKey="id"
          :paginator="true"
          :rows="rowsPerPage"
          :rowsPerPageOptions="[10, 25, 50]"
          :globalFilterFields="['name', 'location', 'status']"
          sortField="date"
          :sortOrder="1"
          removableSort
          stripedRows
          currentPageReportTemplate="Menampilkan {first}–{last} dari {totalRecords} agenda"
          paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
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
              Tidak ada agenda yang cocok dengan pencarian.
            </div>
          </template>

          <Column selectionMode="multiple" headerStyle="width: 2.5rem" />

          <Column
            field="name"
            header="Nama Agenda"
            sortable
            class="min-w-64"
          />

          <Column
            header="Hari"
            sortable
            sortField="date"
          >
            <template #body="{ data }">
              {{ getDayName(data.date) }}
            </template>
          </Column>

          <Column
            field="date"
            header="Tanggal"
            sortable
          />

          <Column
            field="time"
            header="Jam"
          />

          <Column
            field="location"
            header="Lokasi"
            class="min-w-48"
          />

          <Column
            field="status"
            header="Status"
            sortable
          >
            <template #body="{ data }">
              <Tag
                :value="data.status"
                :severity="statusSeverity(data.status)"
                class="rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide"
              />
            </template>
          </Column>

          <Column
            header="Aksi"
            headerStyle="width: 6rem"
          >
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <Button
                  icon="pi pi-pencil"
                  text
                  rounded
                  severity="secondary"
                  class="h-8 w-8 text-neutral-500 hover:bg-neutral-100 hover:text-primary-700"
                  aria-label="Edit agenda"
                  title="Edit"
                  @click="editAgenda(data.id)"
                />

                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  class="h-8 w-8 text-neutral-500 hover:bg-danger-50 hover:text-danger-600"
                  aria-label="Hapus agenda"
                  title="Hapus"
                  @click="deleteAgenda(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>