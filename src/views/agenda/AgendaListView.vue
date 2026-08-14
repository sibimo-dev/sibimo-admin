<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Tag from 'primevue/tag'

const router = useRouter()

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

const search = ref('')
const selected = ref([])
const rowsPerPage = ref(10)

function parseDate(dateString) {
  const [day, month, year] = dateString.split('/').map(Number)
  return new Date(year, month - 1, day)
}

function getDayName(dateString) {
  return dayNames[parseDate(dateString).getDay()]
}

const agendasWithDay = computed(() =>
  agendas.value.map(agendaItem => ({
    ...agendaItem,
    dayName: getDayName(agendaItem.date),
    sortableDate: parseDate(agendaItem.date).getTime(),
  }))
)

function addNew() {
  router.push({ name: 'agenda-create' })
}

function deleteSelected() {
  const selectedIds = selected.value.map(item => item.id)

  agendas.value = agendas.value.filter(
    agendaItem => !selectedIds.includes(agendaItem.id)
  )

  selected.value = []
}

function editAgenda(id) {
  router.push({
    name: 'agenda-edit',
    params: { id },
  })
}

function deleteAgenda(id) {
  agendas.value = agendas.value.filter(
    agendaItem => agendaItem.id !== id
  )
}

function exportData() {
  const rows = selected.value.length > 0
    ? selected.value
    : agendasWithDay.value

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
        agendaItem.dayName,
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
  <div class="min-h-full px-6 py-6 text-neutral-800 lg:px-8">

    <h1 class="m-0 mb-1 text-[22px] font-bold text-primary-900">
      Kelola Agenda
    </h1>

    <p class="mb-5 text-sm text-neutral-500">
      Kelola daftar agenda kegiatan desa.
    </p>

    <div class="rounded-xl border border-neutral-200 bg-white px-6 pb-3 pt-5 shadow-sm">

      <div class="mb-4 flex items-center justify-between">
        <h2 class="m-0 text-base font-semibold text-primary-900">
          Kelola Agenda
        </h2>
      </div>

      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">

        <div class="flex items-center gap-2">

          <Button
            label="Baru"
            icon="pi pi-plus"
            severity="primary"
            size="small"
            @click="addNew"
          />

          <Button
            label="Hapus"
            icon="pi pi-trash"
            severity="secondary"
            outlined
            size="small"
            :disabled="selected.length === 0"
            @click="deleteSelected"
          />

        </div>

        <div class="flex items-center gap-2">

          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="search"
              placeholder="Cari"
              class="w-[160px] text-[13px]"
            />
          </IconField>

          <Button
            label="Export"
            icon="pi pi-download"
            severity="secondary"
            outlined
            size="small"
            @click="exportData"
          />

        </div>
      </div>

      <DataTable
        v-model:selection="selected"
        :value="agendasWithDay"
        :globalFilterFields="['name', 'location']"
        :filters="{ global: { value: search, matchMode: 'contains' } }"
        :rows="rowsPerPage"
        paginator
        :rowsPerPageOptions="[10, 25, 50]"
        dataKey="id"
        stripedRows
        class="text-[13px]"
      >
        <template #empty>
          <div class="px-3 py-6 text-center text-neutral-400">
            Tidak ada agenda yang cocok dengan pencarian.
          </div>
        </template>

        <Column selectionMode="multiple" headerStyle="width: 3rem" />

        <Column header="No" headerStyle="width: 3rem">
          <template #body="{ index }">
            {{ index + 1 }}
          </template>
        </Column>

        <Column field="name" header="Nama Agenda" sortable />

        <Column field="dayName" header="Hari" />

        <Column field="date" header="Tanggal" sortable />

        <Column field="time" header="Jam" />

        <Column field="location" header="Lokasi" />

        <Column field="status" header="Status" sortable>
          <template #body="{ data }">
            <Tag
              :value="data.status"
              :severity="data.status === 'PUBLISHED' ? 'info' : 'secondary'"
            />
          </template>
        </Column>

        <Column header="Aksi" headerStyle="width: 6rem">
          <template #body="{ data }">
            <Button
              icon="pi pi-pencil"
              text
              rounded
              severity="secondary"
              size="small"
              @click="editAgenda(data.id)"
            />

            <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              size="small"
              @click="deleteAgenda(data.id)"
            />
          </template>
        </Column>
      </DataTable>

    </div>
  </div>
</template>