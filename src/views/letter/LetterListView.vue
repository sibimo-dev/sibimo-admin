<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import SelectButton from 'primevue/selectbutton'
import DatePicker from 'primevue/datepicker'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import AppDataTable from '@/components/common/AppDataTable.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import { useLetterStore } from '@/stores/useLetterStore'

const router = useRouter()
const { rows } = useLetterStore()

const columns = [
  { field: 'requestId', header: 'Request ID', sortable: true },
  { field: 'citizenId', header: 'Citizen ID', sortable: true },
  { field: 'purpose', header: 'Purpose / Service Type', sortable: true },
  { field: 'status', header: 'Status', sortable: true },
  { field: 'signatureType', header: 'Signature Type' },
  { field: 'verifiedBy', header: 'Verified By' },
  { field: 'authorizedBy', header: 'Authorized By' },
  { field: 'date', header: 'Date', sortable: true },
  { field: 'source', header: 'Sumber' },
]

const statusFilters = ['Semua Status', 'Pending', 'Diverifikasi', 'Disetujui', 'Ditolak']
const activeFilter = ref('Semua Status')

const searchQuery = ref('')

const sortField = ref('dateValue')
const sortOrder = ref(-1)

function handleSort(field) {
  if (sortField.value === field) {
    sortOrder.value *= -1
  } else {
    sortField.value = field
    sortOrder.value = 1
  }
}

function sortValue(row, field) {
  if (field === 'date') return new Date(row.dateValue).getTime()
  return row[field]
}

const filteredRows = computed(() => {
  let result = [...rows.value]

  if (activeFilter.value !== 'Semua Status') {
    result = result.filter((r) => r.status === activeFilter.value)
  }

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter(
      (r) =>
        r.requestId.toLowerCase().includes(query) ||
        r.citizenId.toLowerCase().includes(query) ||
        r.purpose.toLowerCase().includes(query),
    )
  }

  const field = sortField.value === 'date' ? 'date' : sortField.value
  result.sort((a, b) => {
    const aVal = sortValue(a, field)
    const bVal = sortValue(b, field)
    if (aVal < bVal) return -1 * sortOrder.value
    if (aVal > bVal) return 1 * sortOrder.value
    return 0
  })

  return result
})

const statusColor = {
  Pending: 'warn',
  Diverifikasi: 'info',
  Disetujui: 'success',
  Ditolak: 'danger',
}

const actionLabel = {
  Pending: 'Verifikasi',
  Diverifikasi: 'Otorisasi',
}

const actionRoute = {
  Pending: { name: 'letter-verification' },
  Diverifikasi: { name: 'letter-authorization' },
}

function handleAction(data) {
  const target = actionRoute[data.status]
  if (!target) return
  router.push({
    ...target,
    query: { highlight: data.requestId },
  })
}


function goToTambahSurat() {
  router.push('/letter/create')
}


const kelurahanName = 'Bimomartani'
const kapanewonName = 'Ngemplak'
const officerName = 'Rasyifa Anom Sudaryono Amd, Kes'

const reportItems = [
  'Kartu Keluarga',
  'Kartu Tanda Penduduk',
  'Surat Keterangan Lahir Baru',
  'Surat Keterangan Kematian Baru',
  'Permohonan Penduduk Datang',
  'Permohonan Pindah Penduduk',
  'Pengantar Akta Kelahiran',
  'Pengantar Akta Kematian',
  'Surat Keterangan Penduduk',
  'Duplikat Surat Kelahiran',
  'Duplikat Surat Kematian',
  'Surat Keterangan Usaha',
  'Surat Keterangan Kehilangan',
  'SKCK',
  'Surat Keterangan Penghasilan',
  'Surat Keterangan Tidak Mampu',
  'SKTS',
  'Surat Ijin Keramaian',
  'Legalisasi',
  'Lain-Lain',
  'Permohonan KIA',
  'Domisili Usaha/Lembaga',
  '',
]

const purposeToReportItem = {
  'Surat Keterangan Usaha (SKU)': 'Surat Keterangan Usaha',
  'Surat Keterangan Tidak Mampu (SKTM)': 'Surat Keterangan Tidak Mampu',
  'Surat Pengantar Domisili': 'Lain-Lain',
  'Surat Keterangan Pindah': 'Permohonan Pindah Penduduk',
  'Surat Keterangan Kelahiran': 'Surat Keterangan Lahir Baru',
  'Surat Keterangan Kematian': 'Surat Keterangan Kematian Baru',
  'Surat Pengantar Nikah': 'Lain-Lain',

  'Surat Keterangan Umum': 'Surat Keterangan Penduduk',
  'Surat Permohonan KIA': 'Permohonan KIA',
  'SKCK': 'SKCK',
  'Elemen Perubahan Data': 'Lain-Lain',
  'Surat Ijin Keramaian': 'Surat Ijin Keramaian',
  'Surat Keterangan Asal Tanah': 'Lain-Lain',
  'Surat Pernyataan Domisili Usaha': 'Domisili Usaha/Lembaga',
  'Surat Permohonan Perubahan KK': 'Kartu Keluarga',
  'Surat Keterangan Penghasilan': 'Surat Keterangan Penghasilan',
  'Surat Permohonan Pindah Penduduk': 'Permohonan Pindah Penduduk',
  'Surat Pernyataan Beda Nama': 'Lain-Lain',
  'Surat Permohonan Perubahan KTP': 'Kartu Tanda Penduduk',
  'Permohonan Data Letter C': 'Lain-Lain',
  'Surat Permohonan Kematian Lama': 'Duplikat Surat Kematian',
  'Surat Rekomendasi Pembelian Jenis BBM': 'Lain-Lain',
  'Surat Keterangan Tidak Mampu Sekolah': 'Surat Keterangan Tidak Mampu',
  'Surat Permohonan Kematian Baru': 'Surat Keterangan Kematian Baru',
  'Surat Permohonan Nikah Perempuan': 'Lain-Lain',
  'Surat Keterangan Usaha': 'Surat Keterangan Usaha',
  'Surat Permohonan Kelahiran Baru': 'Surat Keterangan Lahir Baru',
  'Surat Permohonan Nikah Laki-laki': 'Lain-Lain',
  'Surat Keterangan Belum Menikah': 'Lain-Lain',
  'Surat Permohonan Kelahiran Lama': 'Duplikat Surat Kelahiran',
  'Surat Permohonan Cerai': 'Lain-Lain',
  'SPPD (Surat Perintah Perjalanan Dinas)': 'Lain-Lain',
  'Surat Permohonan Masuk Penduduk': 'Permohonan Penduduk Datang',
  'Surat Harga Tanah': 'Lain-Lain',
  'Surat Pengantar Duplikat Nikah': 'Pengantar Akta Kelahiran',
}

function resolveReportItem(purpose) {
  return purposeToReportItem[purpose] || 'Lain-Lain'
}

function resolveGender(row) {
  const citizenId = row.citizenId || ''
  const dayDigits = citizenId.slice(6, 8)
  const day = parseInt(dayDigits, 10)
  if (citizenId.length < 8 || isNaN(day)) return ''
  return day > 40 ? 'Perempuan' : 'Laki-Laki'
}

const monthOptions = [
  { label: 'Januari', value: 1 },
  { label: 'Februari', value: 2 },
  { label: 'Maret', value: 3 },
  { label: 'April', value: 4 },
  { label: 'Mei', value: 5 },
  { label: 'Juni', value: 6 },
  { label: 'Juli', value: 7 },
  { label: 'Agustus', value: 8 },
  { label: 'September', value: 9 },
  { label: 'Oktober', value: 10 },
  { label: 'November', value: 11 },
  { label: 'Desember', value: 12 },
]

const printDialogVisible = ref(false)
const reportType = ref('monthly') // 'monthly' | 'yearly'
const reportTypeOptions = [
  { label: 'Laporan Bulanan', value: 'monthly' },
  { label: 'Laporan Tahunan', value: 'yearly' },
]
const selectedPeriod = ref(new Date())

function openPrintDialog() {
  reportType.value = 'monthly'
  selectedPeriod.value = new Date()
  printDialogVisible.value = true
}

function closePrintDialog() {
  printDialogVisible.value = false
}

const previewDialogVisible = ref(false)
const previewTitle = ref('')
const previewTableRows = ref([])
const previewTotals = ref({ male: 0, female: 0, total: 0 })

function closePreview() {
  previewDialogVisible.value = false
}

function buildRecapFromRows(rowsInPeriod) {
  const counters = {}
  reportItems.forEach((item) => {
    if (item) counters[item] = { male: 0, female: 0 }
  })

  rowsInPeriod.forEach((row) => {
    const itemLabel = resolveReportItem(row.purpose)
    if (!counters[itemLabel]) counters[itemLabel] = { male: 0, female: 0 }

    const gender = resolveGender(row)
    if (gender === 'Laki-Laki') counters[itemLabel].male += 1
    else if (gender === 'Perempuan') counters[itemLabel].female += 1
  })

  const totalMale = reportItems.reduce((sum, item) => sum + (counters[item]?.male || 0), 0)
  const totalFemale = reportItems.reduce((sum, item) => sum + (counters[item]?.female || 0), 0)
  const totalAll = totalMale + totalFemale

  const tableRows = reportItems.map((item, index) => {
    const counter = counters[item] || { male: 0, female: 0 }
    const total = counter.male + counter.female
    return {
      no: index + 1,
      jenis: item,
      male: counter.male,
      female: counter.female,
      total,
    }
  })

  return { tableRows, totalMale, totalFemale, totalAll }
}

function buildMonthlyRecap(month, year) {
  const rowsInPeriod = rows.value.filter((row) => {
    const rowDate = new Date(row.dateValue)
    return rowDate.getMonth() + 1 === month && rowDate.getFullYear() === year
  })
  return buildRecapFromRows(rowsInPeriod)
}

function buildYearlyRecap(year) {
  const rowsInPeriod = rows.value.filter((row) => new Date(row.dateValue).getFullYear() === year)
  return buildRecapFromRows(rowsInPeriod)
}

function openPreview() {
  const period = selectedPeriod.value
  const year = period.getFullYear()

  if (reportType.value === 'monthly') {
    const month = period.getMonth() + 1
    const monthLabel = monthOptions.find((option) => option.value === month)?.label || ''
    const recap = buildMonthlyRecap(month, year)
    previewTableRows.value = recap.tableRows
    previewTotals.value = { male: recap.totalMale, female: recap.totalFemale, total: recap.totalAll }
    previewTitle.value = `LAPORAN BULANAN PELAYANAN UMUM - ${monthLabel.toUpperCase()} ${year}`
  } else {
    const recap = buildYearlyRecap(year)
    previewTableRows.value = recap.tableRows
    previewTotals.value = { male: recap.totalMale, female: recap.totalFemale, total: recap.totalAll }
    previewTitle.value = `LAPORAN TAHUNAN PELAYANAN UMUM - ${year}`
  }

  printDialogVisible.value = false
  previewDialogVisible.value = true
}

function buildFileSuffix() {
  const period = selectedPeriod.value
  const year = period.getFullYear()
  return reportType.value === 'monthly'
    ? `${year}-${String(period.getMonth() + 1).padStart(2, '0')}`
    : `${year}`
}

function downloadPdf() {
  const period = selectedPeriod.value
  const year = period.getFullYear()
  const monthLabel =
    reportType.value === 'monthly'
      ? monthOptions.find((option) => option.value === period.getMonth() + 1)?.label || ''
      : ''

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFont(undefined, 'bold')
  doc.setFontSize(14)
  doc.text('REKAPITULASI PELAYANAN UMUM', pageWidth / 2, 14, { align: 'center' })
  doc.text(
    `KALURAHAN ${kelurahanName.toUpperCase()}, KAPANEWON ${kapanewonName.toUpperCase()}`,
    pageWidth / 2,
    20,
    { align: 'center' },
  )
  doc.setFont(undefined, 'normal')

  const periodBody =
    reportType.value === 'monthly'
      ? [
          [
            'Bulan',
            { content: monthLabel, styles: { fillColor: [250, 204, 21] } },
            'Tahun',
            { content: String(year), styles: { fillColor: [250, 204, 21] } },
          ],
        ]
      : [['Tahun', { content: String(year), styles: { fillColor: [250, 204, 21] } }]]
  const periodColWidths = reportType.value === 'monthly' ? [15, 34, 15, 25] : [15, 25]
  const periodTableWidth = periodColWidths.reduce((sum, w) => sum + w, 0)
  const periodMarginLeft = (pageWidth - periodTableWidth) / 2

  autoTable(doc, {
    startY: 23,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1.5, valign: 'middle', halign: 'center' },
    body: periodBody,
    columnStyles: Object.fromEntries(periodColWidths.map((width, index) => [index, { cellWidth: width }])),
    margin: { left: periodMarginLeft },
    tableWidth: 'wrap',
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    head: [['No', 'Jenis', 'Laki-Laki', 'Perempuan', 'Jumlah']],
    body: previewTableRows.value.map((row) => [
      row.no,
      row.jenis,
      row.male || '',
      row.female || '',
      row.total || '',
    ]),
    foot: [
      ['', 'Jumlah', previewTotals.value.male, previewTotals.value.female, previewTotals.value.total],
    ],
    theme: 'grid',
    margin: { left: 14, right: 14, bottom: 5 },
    styles: { fontSize: 10, cellPadding: 1.8, valign: 'middle' },
    headStyles: { fillColor: [250, 204, 21], textColor: [30, 41, 59], fontSize: 10 },
    footStyles: { fillColor: [250, 204, 21], textColor: [30, 41, 59], fontStyle: 'bold', fontSize: 10 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { cellWidth: 80 },
      2: { halign: 'center', cellWidth: 35 },
      3: { halign: 'center', cellWidth: 35 },
      4: { halign: 'center', cellWidth: 20 },
    },
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 4,
    theme: 'plain',
    pageBreak: 'avoid',
    rowPageBreak: 'avoid',
    margin: { left: 140, bottom: 5 },
    styles: { fontSize: 9, cellPadding: 0.6, halign: 'left' },
    tableWidth: 'wrap',
    body: [
      [kelurahanName],
      [`a.n LURAH ${kelurahanName.toUpperCase()}`],
      ['Carik'],
      ['u.b.'],
      [''],
      [''],
      [''],
      [officerName],
    ],
    didParseCell: (data) => {
      if (data.row.index === 7) {
        data.cell.styles.lineWidth = { bottom: 0.2 }
        data.cell.styles.lineColor = [30, 41, 59]
      }
    },
  })

  doc.save(`rekapitulasi-pelayanan-umum-${buildFileSuffix()}.pdf`)
  closePreview()
}

function downloadExcel() {
  const header = ['No', 'Jenis', 'Laki-Laki', 'Perempuan', 'Jumlah']
  const body = previewTableRows.value.map((row) => [row.no, row.jenis, row.male, row.female, row.total])
  const footer = ['', 'Jumlah', previewTotals.value.male, previewTotals.value.female, previewTotals.value.total]

  const worksheet = XLSX.utils.aoa_to_sheet([[previewTitle.value], [], header, ...body, footer])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekapitulasi')
  XLSX.writeFile(workbook, `rekapitulasi-pelayanan-umum-${buildFileSuffix()}.xlsx`)
  closePreview()
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="mb-6 flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-slate-800">Pengelolaan Layanan Surat</h1>
        <p class="text-sm text-slate-500 mt-1">Kelola permintaan surat warga secara terpusat.</p>
      </div>
      <div class="flex items-center gap-2">
        <AppButton
          label="Cetak Data"
          variant="outline"
          icon="pi pi-print"
          @click="openPrintDialog"
        />
        <AppButton
          label="+ Tambah Surat"
          variant="primary"
          @click="goToTambahSurat"
        />
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <!-- Toolbar: filter status di kiri, search di kanan (gaya toolbar tabel Berita) -->
      <div class="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div class="flex items-center gap-2 flex-wrap">
          <AppButton
            v-for="filter in statusFilters"
            :key="filter"
            :label="filter"
            size="small"
            :variant="activeFilter === filter ? 'primary' : 'outline'"
            @click="activeFilter = filter"
          />
        </div>

        <AppInput
          v-model="searchQuery"
          placeholder="Cari Ticket ID atau Nama..."
          icon="pi pi-search"
          class="w-72"
        />
      </div>

      <div class="rounded-xl border border-slate-100 overflow-hidden">
        <AppDataTable
          :columns="columns"
          :rows="filteredRows"
          :sort-field="sortField"
          :sort-order="sortOrder"
          @sort="handleSort"
        >
          <template #status="{ data }">
            <Tag :value="data.status" :severity="statusColor[data.status]" />
          </template>
          <template #actions="{ data }">
            <AppButton
              v-if="actionLabel[data.status]"
              :label="actionLabel[data.status]"
              variant="primary"
              size="small"
              @click="handleAction(data)"
            />
            <span v-else class="text-slate-300 text-sm">—</span>
          </template>
        </AppDataTable>
      </div>

      <!-- Empty state -->
      <p v-if="filteredRows.length === 0" class="text-center text-slate-400 py-10 text-sm">
        Tidak ada data yang cocok dengan pencarian/filter.
      </p>
    </div>

    <!-- Dialog langkah 1: pilih jenis laporan (Bulanan/Tahunan) & periodenya -->
    <Dialog
      v-model:visible="printDialogVisible"
      header="Cetak Data Surat"
      modal
      :style="{ width: '26rem' }"
    >
      <div class="flex flex-col gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Jenis Laporan
          </label>
          <SelectButton
            v-model="reportType"
            :options="reportTypeOptions"
            option-label="label"
            option-value="value"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            {{ reportType === 'monthly' ? 'Pilih Bulan & Tahun' : 'Pilih Tahun' }}
          </label>
          <DatePicker
            v-model="selectedPeriod"
            :view="reportType === 'monthly' ? 'month' : 'year'"
            :date-format="reportType === 'monthly' ? 'MM yy' : 'yy'"
            show-icon
            icon-display="input"
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <AppButton label="Batal" variant="outline" @click="closePrintDialog" />
        <AppButton label="Lihat Preview" variant="primary" icon="pi pi-eye" @click="openPreview" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="previewDialogVisible"
      header="Preview Laporan Data Surat"
      modal
      :style="{ width: '48rem' }"
    >
      <div class="bg-amber-100 text-center text-sm font-semibold text-slate-800 rounded-lg py-2 mb-4">
        {{ previewTitle }}
      </div>

      <DataTable :value="previewTableRows" size="small" scrollable scroll-height="22rem">
        <Column field="no" header="No" style="width: 3rem" />
        <Column field="jenis" header="Jenis" style="width: 16rem" />
        <Column field="male" header="Laki-Laki" style="width: 6.5rem" />
        <Column field="female" header="Perempuan" style="width: 6.5rem" />
        <Column field="total" header="Jumlah" style="width: 5rem" />
      </DataTable>

      <div class="flex items-center justify-between mt-4 px-2 text-sm font-semibold text-slate-700">
        <span>Total</span>
        <span>
          Laki-Laki {{ previewTotals.male }} · Perempuan {{ previewTotals.female }} · Jumlah {{ previewTotals.total }}
        </span>
      </div>

      <template #footer>
        <AppButton label="Tutup" variant="outline" @click="closePreview" />
        <AppButton label="Download Excel" variant="primary" icon="pi pi-file-excel" @click="downloadExcel" />
        <AppButton label="Download PDF" variant="primary" icon="pi pi-file-pdf" @click="downloadPdf" />
      </template>
    </Dialog>
  </div>
</template>