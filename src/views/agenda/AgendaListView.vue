<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import * as XLSX from 'xlsx'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Card from 'primevue/card'
import { agendaService } from '@/services/content.service'
import { getListCache, setListCache } from '@/services/list-cache'
import { agendaPeriod } from '@/services/agenda.period'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()
const cachedAgendas = getListCache('agendas')
const loading = ref(!cachedAgendas)
const loadError = ref('')

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

/* ---------- Filter bulan & tahun ---------- */
const now = new Date()
// Tersimpan di state bersama: tetap sama setelah membuka detail lalu kembali
const selectedMonth = computed({
  get: () => agendaPeriod.month, // 0-11
  set: (value) => { agendaPeriod.month = value },
})
const selectedYear = computed({
  get: () => agendaPeriod.year,
  set: (value) => { agendaPeriod.year = value },
})

const monthOptions = monthNames.map((label, value) => ({ label, value }))

// Rentang tahun panjang: 20 tahun sebelum s/d 50 tahun sesudah tahun ini
const yearOptions = Array.from({ length: 71 }, (_, i) => {
  const year = now.getFullYear() - 20 + i
  return { label: String(year), value: year }
})

const periodLabel = computed(() => `${monthNames[selectedMonth.value]} ${selectedYear.value}`)

/* ---------- Helper tanggal ---------- */
function parseDate(dateString) {
  if (!dateString) return new Date(NaN)
  const value = String(dateString)

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Date(`${value.slice(0, 10)}T00:00:00`)
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split('/').map(Number)
    return new Date(year, month - 1, day)
  }

  return new Date(NaN)
}

function formatDate(dateString) {
  const date = parseDate(dateString)
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
}

function toIso(date) {
  if (Number.isNaN(date.getTime())) return ''
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mm}-${dd}`
}

function mapAgendaItem(item) {
  const rawDate = item.event_date ?? item.date
  const parsedDate = parseDate(rawDate)
  const valid = !Number.isNaN(parsedDate.getTime())

  return {
    id: item.agenda_id,
    name: item.title,
    date: formatDate(rawDate),
    dateIso: toIso(parsedDate), // dipakai untuk sorting yang benar
    month: valid ? parsedDate.getMonth() : null,
    year: valid ? parsedDate.getFullYear() : null,
    day: valid ? dayNames[parsedDate.getDay()] : '-',
    time: `${item.start_time ?? ''}${item.end_time ? ` - ${item.end_time}` : ''}`.trim() || '-',
    location: item.location ?? '-',
    status: item.status?.toUpperCase() ?? 'PUBLISHED',
  }
}

/* ---------- Data ---------- */
const agendas = ref((cachedAgendas ?? []).map(mapAgendaItem))

// Hanya agenda pada bulan & tahun yang dipilih
const filteredAgendas = computed(() =>
  agendas.value.filter(
    item => item.month === selectedMonth.value && item.year === selectedYear.value,
  ),
)

async function loadAgendas({ background = false } = {}) {
  if (!background) loading.value = true
  try {
    const data = await agendaService.list()
    const normalized = Array.isArray(data) ? data : []
    setListCache('agendas', normalized)
    agendas.value = normalized.map(mapAgendaItem)
    loadError.value = ''
  } catch (error) {
    loadError.value = 'Data agenda belum dapat dimuat.'
    if (!background) agendas.value = []
    console.error('Gagal memuat agenda:', error)
  } finally {
    if (!background) loading.value = false
  }
}
onMounted(() => loadAgendas({ background: Boolean(cachedAgendas) }))

const selected = ref([])
const filters = ref({
  global: { value: null },
})

// Ganti bulan/tahun -> pilihan checkbox direset
watch([selectedMonth, selectedYear], () => {
  selected.value = []
})

const rowsPerPage = ref(10)

const emptyMessage = computed(() => {
  if (loadError.value) return loadError.value
  if (filters.value.global.value) return 'Tidak ada agenda yang cocok dengan pencarian.'
  return `Belum ada agenda pada ${periodLabel.value}.`
})

function statusSeverity(status) {
  return status === 'PUBLISHED' ? 'success' : 'warn'
}

function addNew() {
  router.push({ name: 'agenda-create' })
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
    accept: async () => {
      try {
        await agendaService.remove(data.id)
        await loadAgendas()
        selected.value = selected.value.filter(item => item.id !== data.id)
      } catch (error) {
        window.alert(error.response?.data?.message ?? 'Gagal menghapus agenda.')
      }
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
    accept: async () => {
      const selectedIds = new Set(selected.value.map(item => item.id))

      try {
        await Promise.all([...selectedIds].map(id => agendaService.remove(id)))
        await loadAgendas()
        selected.value = []
      } catch (error) {
        window.alert(error.response?.data?.message ?? 'Gagal menghapus sebagian agenda.')
        await loadAgendas()
      }
    },
  })
}

/* ---------- Export CSV (sesuai bulan yang dipilih) ---------- */
function exportData() {
  const rows = selected.value.length > 0
    ? selected.value
    : filteredAgendas.value

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
        agendaItem.day,
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
  link.download = `agenda-${selectedYear.value}-${String(selectedMonth.value + 1).padStart(2, '0')}.csv`

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/* ---------- Template Excel ---------- */
const TEMPLATE_HEADERS = [
  'Nama Acara',
  'Tanggal',
  'Jam Mulai',
  'Jam Selesai',
  'Tempat',
  'Yang Menghadiri/Keterangan',
]

function downloadTemplate() {
  const sheetAgenda = XLSX.utils.aoa_to_sheet([
    TEMPLATE_HEADERS,
    ['Rapat Koordinasi Kelurahan', '2026-11-05', '08:00', '10:00', 'Balai Kelurahan', 'Lurah dan seluruh ketua RW'],
    ['Posyandu Balita', '2026-12-10', '09:00', '12:00', 'Pos RW 04', 'Kader Posyandu'],
    ['Kerja Bakti Lingkungan', '2027-01-15', '06:30', '09:00', 'Seluruh wilayah', 'Warga'],
  ])
  sheetAgenda['!cols'] = [
    { wch: 38 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 28 }, { wch: 36 },
  ]

  const sheetGuide = XLSX.utils.aoa_to_sheet([
    ['Petunjuk Pengisian Template Agenda'],
    [],
    ['1. Isi data pada sheet "Agenda" mulai baris ke-2. Hapus baris contoh sebelum mengimpor.'],
    ['2. Nama Acara dan Tanggal WAJIB diisi.'],
    ['3. Tanggal ditulis YYYY-MM-DD (contoh 2026-11-05) atau DD/MM/YYYY (contoh 05/11/2026).'],
    ['4. Jam ditulis HH:mm, format 24 jam (contoh 08:00). Jika kosong, jam mulai dianggap 00:00.'],
    ['5. Jangan mengubah / menghapus judul kolom di baris pertama.'],
    ['6. Satu file boleh berisi agenda dari banyak bulan dan tahun; semuanya masuk dalam sekali unggah.'],
  ])
  sheetGuide['!cols'] = [{ wch: 100 }]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheetAgenda, 'Agenda')
  XLSX.utils.book_append_sheet(workbook, sheetGuide, 'Petunjuk')
  XLSX.writeFile(workbook, 'template-agenda.xlsx')
}

/* ---------- Import Excel ---------- */
const importInput = ref(null)
const importing = ref(false)

function openImportPicker() {
  importInput.value?.click()
}

const pad = n => String(n).padStart(2, '0')

// Mengembalikan 'YYYY-MM-DD' atau null
function normalizeDate(value) {
  if (value === '' || value == null) return null

  // Sel tanggal asli Excel (angka serial)
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(Math.floor(value))
    return parsed ? `${parsed.y}-${pad(parsed.m)}-${pad(parsed.d)}` : null
  }

  const text = String(value).trim()
  let year, month, day

  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (match) {
    ;[, year, month, day] = match.map(Number)
  } else {
    match = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
    if (!match) return null
    ;[, day, month, year] = match.map(Number)
  }

  const check = new Date(year, month - 1, day)
  const valid = check.getFullYear() === year
    && check.getMonth() === month - 1
    && check.getDate() === day

  return valid ? `${year}-${pad(month)}-${pad(day)}` : null
}

// Mengembalikan 'HH:mm' atau null
function normalizeTime(value) {
  if (value === '' || value == null) return null

  // Sel jam asli Excel = pecahan hari
  if (typeof value === 'number') {
    const totalMinutes = Math.round((value % 1) * 24 * 60)
    return `${pad(Math.floor(totalMinutes / 60) % 24)}:${pad(totalMinutes % 60)}`
  }

  const match = String(value).trim().match(/(\d{1,2})[:.](\d{2})/)
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null

  return `${pad(hours)}:${pad(minutes)}`
}

async function handleImportSelect(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file || importing.value) return

  importing.value = true

  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const records = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true })

    const validRows = []
    const errors = []

    records.forEach((record, index) => {
      const rowNumber = index + 2 // baris 1 = judul kolom

      // Samakan nama kolom: huruf kecil & tanpa spasi berlebih
      const row = Object.fromEntries(
        Object.entries(record).map(([key, val]) => [key.trim().toLowerCase(), val]),
      )

      const isEmpty = Object.values(row).every(val => String(val).trim() === '')
      if (isEmpty) return

      const title = String(row['nama acara'] ?? '').trim()
      const eventDate = normalizeDate(row['tanggal'])
      const startTime = normalizeTime(row['jam mulai']) ?? '00:00'
      const endTime = normalizeTime(row['jam selesai']) ?? startTime

      if (!title) {
        errors.push(`Baris ${rowNumber}: Nama Acara kosong`)
        return
      }
      if (!eventDate) {
        errors.push(`Baris ${rowNumber}: Tanggal tidak valid`)
        return
      }

      validRows.push({
        rowNumber,
        payload: {
          title,
          event_date: eventDate,
          start_time: startTime,
          end_time: endTime,
          location: String(row['tempat'] ?? '').trim(),
          attendee: String(row['yang menghadiri/keterangan'] ?? '').trim(),
        },
      })
    })

    if (validRows.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'Tidak ada data yang dapat diimpor',
        detail: errors.slice(0, 3).join('; ') || 'File kosong atau format tidak sesuai template.',
        life: 6000,
      })
      return
    }

    let successCount = 0
    let firstSuccessDate = null

    // Berurutan agar urutan data tetap sesuai file
    for (const item of validRows) {
      try {
        await agendaService.create(item.payload)
        successCount++
        if (!firstSuccessDate) firstSuccessDate = item.payload.event_date
      } catch (error) {
        errors.push(`Baris ${item.rowNumber}: ${error.response?.data?.message ?? 'gagal disimpan'}`)
      }
    }

    await loadAgendas({ background: true })

    // Pindah ke bulan dari data pertama yang berhasil masuk
    if (firstSuccessDate) {
      const [year, month] = firstSuccessDate.split('-').map(Number)
      selectedYear.value = year
      selectedMonth.value = month - 1
    }

    toast.add({
      severity: errors.length ? 'warn' : 'success',
      summary: `${successCount} agenda berhasil diimpor`,
      detail: errors.length
        ? `${errors.length} baris dilewati. ${errors.slice(0, 3).join('; ')}`
        : 'Semua baris dari file berhasil masuk ke daftar.',
      life: 6000,
    })
  } catch (error) {
    console.error('Gagal mengimpor agenda:', error)
    toast.add({
      severity: 'error',
      summary: 'Gagal membaca file',
      detail: 'Pastikan file berformat .xlsx/.xls dan sesuai template.',
      life: 5000,
    })
  } finally {
    importing.value = false
  }
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
        <!-- Toolbar -->
        <div class="mb-4 flex flex-col gap-3">
          <!-- Baris 1: aksi data -->
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div class="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <Button
                label="Baru"
                icon="pi pi-plus"
                class="w-full justify-center rounded-lg border border-transparent bg-primary-700 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-primary-800 sm:w-auto"
                @click="addNew"
              />

              <Button
                label="Hapus"
                icon="pi pi-trash"
                severity="secondary"
                outlined
                :disabled="selected.length === 0"
                class="w-full justify-center rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                @click="deleteSelected"
              />
            </div>

            <input
              ref="importInput"
              type="file"
              accept=".xlsx,.xls"
              class="hidden"
              @change="handleImportSelect"
            />

            <div class="grid grid-cols-3 gap-2 sm:flex sm:items-center">
              <Button
                type="button"
                severity="secondary"
                outlined
                class="w-full justify-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-2 py-2 text-xs font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 sm:w-auto sm:px-3.5 sm:text-[13px]"
                @click="downloadTemplate"
              >
                <i class="pi pi-download text-xs" />
                <span>Template</span>
              </Button>

              <Button
                type="button"
                severity="secondary"
                outlined
                :disabled="importing"
                class="w-full justify-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-2 py-2 text-xs font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 sm:w-auto sm:px-3.5 sm:text-[13px]"
                @click="openImportPicker"
              >
                <i :class="importing ? 'pi pi-spinner pi-spin' : 'pi pi-upload'" class="text-xs" />
                <span>Import<span class="hidden sm:inline">&nbsp;Excel</span></span>
              </Button>

              <Button
                type="button"
                severity="secondary"
                outlined
                class="w-full justify-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-2 py-2 text-xs font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 sm:w-auto sm:px-3.5 sm:text-[13px]"
                @click="exportData"
              >
                <i class="pi pi-download text-xs" />
                <span>Export</span>
              </Button>
            </div>
          </div>

          <!-- Baris 2: filter periode + pencarian -->
          <div class="flex flex-col gap-3 border-t border-neutral-100 pt-3 lg:flex-row lg:items-end lg:justify-between">
            <div class="grid grid-cols-2 gap-3 sm:flex sm:items-end">
              <div class="flex flex-col gap-1">
                <label for="filterMonth" class="text-xs font-medium text-neutral-500">
                  Bulan
                </label>
                <Select
                  id="filterMonth"
                  v-model="selectedMonth"
                  :options="monthOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full sm:w-44"
                />
              </div>

              <div class="flex flex-col gap-1">
                <label for="filterYear" class="text-xs font-medium text-neutral-500">
                  Tahun
                </label>
                <Select
                  id="filterYear"
                  v-model="selectedYear"
                  :options="yearOptions"
                  optionLabel="label"
                  optionValue="value"
                  filter
                  class="w-full sm:w-32"
                />
              </div>
            </div>

            <IconField class="w-full lg:w-80">
              <InputIcon class="pi pi-search text-neutral-400" />

              <InputText
                v-model="filters.global.value"
                placeholder="Cari agenda atau lokasi"
                class="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-8 pr-3 text-[13px] text-neutral-800 outline-none transition focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
              />
            </IconField>
          </div>
        </div>

        <DataTable
          v-model:selection="selected"
          v-model:filters="filters"
          :value="filteredAgendas"
          :loading="loading"
          dataKey="id"
          :paginator="true"
          :rows="rowsPerPage"
          :rowsPerPageOptions="[10, 25, 50]"
          :globalFilterFields="['name', 'location', 'status']"
          sortField="dateIso"
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
              {{ emptyMessage }}
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
            field="day"
            header="Hari"
            sortable
            sortField="dateIso"
          />

          <Column
            field="date"
            header="Tanggal"
            sortable
            sortField="dateIso"
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