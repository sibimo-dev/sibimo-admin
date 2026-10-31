<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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
import { useLetterStore } from '@/stores/useLetterStore'

const router = useRouter()
const { rows, fetchRows } = useLetterStore()

onMounted(async () => {
  window.addEventListener('sibimo:letter-request-updated', fetchRows)
  try {
    await fetchRows()
  } catch (error) {
    console.error('Gagal memuat pengajuan surat:', error)
  }
})

onBeforeUnmount(() => window.removeEventListener('sibimo:letter-request-updated', fetchRows))

const columns = [
  { field: 'requestId', header: 'Request ID', sortable: true },
  { field: 'citizenId', header: 'NIK', sortable: true },
  { field: 'purpose', header: 'Keperluan / Jenis Layanan', sortable: true },
  { field: 'status', header: 'Status', sortable: true },
  { field: 'signatureType', header: 'Jenis Tanda Tangan' },
  { field: 'verifiedBy', header: 'Diverifikasi Oleh' },
  { field: 'authorizedBy', header: 'Diotorisasi Oleh' },
  // Kolom Tanggal memakai field 'dateTs' (timestamp angka) supaya sorting oleh tabel
  // berdasarkan tahun-bulan-hari. Teksnya ditampilkan lewat slot #dateTs di template.
  { field: 'dateTs', header: 'Tanggal & Waktu Pengajuan', sortable: true },
  { field: 'source', header: 'Sumber' },
]

const statusFilters = ['Semua Status', 'Pending', 'Selesai', 'Ditolak']
const activeFilter = ref('Semua Status')

const searchQuery = ref('')

// Ubah berbagai format tanggal (Date, timestamp, "dd/mm/yyyy", ISO) menjadi timestamp angka.
// Format dd/mm/yyyy dibaca sebagai hari/bulan/tahun, bukan bulan/hari/tahun.
function parseDate(value) {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  const str = String(value ?? '').trim()
  const match = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (match) {
    return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1])).getTime()
  }
  const time = new Date(str).getTime()
  return Number.isNaN(time) ? 0 : time
}

// Tampilkan tanggal + jam pengajuan: DD/MM/YYYY HH:mm:ss (sumber: submitted_at dari backend).
function formatDateTime(value) {
  const timestamp = parseDate(value)
  if (!timestamp) return '-'

  const date = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, '0')

  return (
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

// Default: tanggal terbaru di atas
const sortField = ref('dateTs')
const sortOrder = ref(-1)

function handleSort(field) {
  if (sortField.value === field) {
    sortOrder.value *= -1
  } else {
    sortField.value = field
    sortOrder.value = 1
  }
}


const filteredRows = computed(() => {
  let result = (rows.value || []).map((r) => {
    const submittedAt = r.dateValue ?? r.submitted_at ?? r.date
    return {
      ...r,
      status: toDisplayStatus(r),
      // Timestamp lengkap (termasuk jam) untuk sorting
      dateTs: parseDate(submittedAt),
      // Nilai asli submitted_at untuk ditampilkan
      submittedAt,
    }
  })

  if (activeFilter.value !== 'Semua Status') {
    result = result.filter((r) => r.status === activeFilter.value)
  }

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter(
      (r) =>
        String(r.purpose ?? '').toLowerCase().includes(query) ||
        String(r.citizenName ?? '').toLowerCase().includes(query) ||
        String(r.requestId ?? '').toLowerCase().includes(query) ||
        String(r.citizenId ?? '').toLowerCase().includes(query),
    )
  }

  const key = sortField.value
  result.sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    if (aVal < bVal) return -1 * sortOrder.value
    if (aVal > bVal) return 1 * sortOrder.value
    return 0
  })

  return result
})

// Status backend disederhanakan jadi 3 label untuk tampilan.
const displayStatusByBackend = {
  submitted: 'Pending', // menunggu verifikasi
  verified: 'Pending', // menunggu otorisasi
  authorized: 'Selesai',
  completed: 'Selesai',
  rejected: 'Ditolak',
}

function toDisplayStatus(row) {
  return displayStatusByBackend[row.backendStatus] ?? row.status
}

const statusColor = {
  Pending: 'warn',
  Selesai: 'success',
  Ditolak: 'danger',
}

// Verifikasi, otorisasi, cetak, dan unduh PDF kini ada di halaman detail.
// Pakai route bernama (letter-detail) supaya tidak bergantung pada bentuk path.
function goToDetail(data) {
  router.push({ name: 'letter-detail', params: { id: data.id }, query: { highlight: data.requestId } })
}

function goToTambahSurat() {
  router.push({ name: 'letter-create' })
}


const kelurahanName = 'Bimomartani'
const kapanewonName = 'Ngemplak'
const officerName = 'Rasyifa Anom Sudaryono Amd, Kes'

// Label jenis surat di rekap diambil langsung dari field `purpose` pada data list,
// jadi hanya jenis surat yang benar-benar ada di list yang masuk ke rekap.
function resolveLetterName(row) {
  return String(row.purpose ?? '').trim() || 'Tanpa Jenis Surat'
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
// Periode yang sedang di-preview. Isi preview dihitung ulang otomatis (computed)
// setiap data surat berubah, jadi surat yang baru Selesai langsung masuk.
const previewConfig = ref(null) // { type: 'monthly' | 'yearly', month, year }

const previewRecap = computed(() => {
  const config = previewConfig.value
  if (!config) return { tableRows: [], totalMale: 0, totalFemale: 0, totalAll: 0 }
  return config.type === 'monthly'
    ? buildMonthlyRecap(config.month, config.year)
    : buildYearlyRecap(config.year)
})

const previewTableRows = computed(() => previewRecap.value.tableRows)
const previewTotals = computed(() => ({
  male: previewRecap.value.totalMale,
  female: previewRecap.value.totalFemale,
  total: previewRecap.value.totalAll,
}))
const previewTitle = computed(() => {
  const config = previewConfig.value
  if (!config) return ''
  if (config.type === 'monthly') {
    const monthLabel = monthOptions.find((option) => option.value === config.month)?.label || ''
    return `LAPORAN BULANAN PELAYANAN UMUM - ${monthLabel.toUpperCase()} ${config.year}`
  }
  return `LAPORAN TAHUNAN PELAYANAN UMUM - ${config.year}`
})

function closePreview() {
  previewDialogVisible.value = false
}

function buildRecapFromRows(rowsInPeriod) {
  // Kelompokkan berdasarkan nama surat yang sebenarnya ada di data periode ini.
  const counters = {}

  rowsInPeriod.forEach((row) => {
    const letterName = resolveLetterName(row)
    if (!counters[letterName]) counters[letterName] = { male: 0, female: 0 }

    const gender = resolveGender(row)
    if (gender === 'Laki-Laki') counters[letterName].male += 1
    else if (gender === 'Perempuan') counters[letterName].female += 1
  })

  const letterNames = Object.keys(counters).sort((a, b) => a.localeCompare(b, 'id'))

  const totalMale = letterNames.reduce((sum, name) => sum + counters[name].male, 0)
  const totalFemale = letterNames.reduce((sum, name) => sum + counters[name].female, 0)
  const totalAll = totalMale + totalFemale

  const tableRows = letterNames.map((name, index) => ({
    no: index + 1,
    jenis: name,
    male: counters[name].male,
    female: counters[name].female,
    total: counters[name].male + counters[name].female,
  }))

  return { tableRows, totalMale, totalFemale, totalAll }
}

// Rekap hanya menghitung surat yang sudah SELESAI (authorized / completed).
// Surat Pending dan Ditolak belum/tidak masuk rekap; begitu statusnya Selesai, otomatis masuk.
function isCompleted(row) {
  return toDisplayStatus(row) === 'Selesai'
}

function buildMonthlyRecap(month, year) {
  const rowsInPeriod = rows.value.filter((row) => {
    if (!isCompleted(row)) return false
    const rowDate = new Date(parseDate(row.dateValue ?? row.submitted_at ?? row.date))
    return rowDate.getMonth() + 1 === month && rowDate.getFullYear() === year
  })
  return buildRecapFromRows(rowsInPeriod)
}

// 1 -> A, 2 -> B, ... 26 -> Z, 27 -> AA, 28 -> AB
function toLetters(n) {
  let result = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    result = String.fromCharCode(65 + rem) + result
    n = Math.floor((n - 1) / 26)
  }
  return result
}

// Kelompok gabungan untuk rekap tahunan, mengikuti paket surat (bundles).
// Pencocokan UTAMA lewat slug surat (bagian akhir `blade_view`, misalnya
// "letters.relocation-certificate-form" -> "relocation-certificate-form").
const bundleSlugGroups = {
  'PERMOHONAN PINDAH WNI': ['relocation-cover-letter', 'relocation-certificate-form'],

  'PERNIKAHAN LAKI-LAKI': [
    'marriage-registration-data-sheet',
    'marriage-application-letter',
    'marriage-introduction-letter',
    'general-certificate-letter',
    'marriage-lodging-certificate-letter',
    'never-married-certificate-letter',
    'not-remarried-statement-letter',
    'death-certificate-for-marriage-letter',
    'bride-groom-consent-letter',
    'parental-consent-letter',
  ],

  'PERNIKAHAN PEREMPUAN': [
    'registration-form',
    'n2',
    'n1',
    'health-referral',
    'marriage-lodging',
    'unmarried-certificate',
    'unmarried-statement',
    'n6',
    'n4',
    'n5',
    'guardian-statement',
    'judge-guardian',
  ],

  KELAHIRAN: [
    'birth-certificate-application-form',
    'birth-report-form',
    'late-birth-registration-approval-decree',
    'birth-registration-report',
    'birth-certificate-referral-letter',
    'birth-attestation-letter',
    'out-of-domicile-birth-report',
    'birth-report-statement',
    'birth-certificate-power-of-attorney',
    'spousal-relationship-responsibility-statement',
    'birth-data-responsibility-statement',
  ],

  KEMATIAN: [
    'death-certificate-application',
    'death-report-form',
    'death-registration-report',
    'death-report',
    'death-certificate',
    'death-data-statement',
    'death-general-statement',
    'death-power-of-attorney',
    'death-commemoration-calculation',
  ],

  // ---- Kelompok mengikuti kolom "Jenis" di sheet identifikasi surat (katalog) ----

  // Dokumen pendaftaran warga baru (REGISTRATION_DOCS) tetap di kategori Permohonan.
  // Pindah WNI & akta kelahiran di dokumen itu tetap di PINDAH WNI / KELAHIRAN.
  PERMOHONAN: [
    'ktp-application-form',
    'population-occurrence-registration',
    'family-biodata', // Formulir Isian Biodata Penduduk WNI (Per Keluarga)
    'resident-arrival-form',
    'temporary-resident-request',
    'temporary-stay-application-form',
    'kia-application-form',
    'divorce-lawsuit-letter',
    'fuel-recommendation-letter',
  ],

  KETERANGAN: [
    'unmarried-status-letter',
    'business-permit-letter',
    'general-statement-letter',
    'general-statement-letter-gov',
    'domicile-certificate',
    'sktm-general',
    'sktm-school',
    'income-permit-letter',
    'event-permit-letter',
    'travel-permit-letter-gov',
    'skck-referral-letter',
    'legalization-register',
  ],

  PERINTAH: ['duty-travel-order-letter'], // SPPD

  PERNYATAAN: [
    'identity-discrepancy-statement-letter',
    'statement-population-data-change',
    'population-document-statement-letter',
    'unregistered-marriage-responsibility-letter', // SPTJM Perkawinan Belum Tercatat
    'heir-power-of-attorney-letter',
    'population-service-authorization-letter',
  ],

  BALASAN: ['permit-followup-letter', 'lease-offer-letter', 'research-response-letter'],

  PENGANTAR: ['marriage-certificate-duplicate-letter', 'general-cover-letter'],

  // Catatan: harga tanah & asal tanah ikut paket Letter C. Hapus dua baris itu
  // kalau mau tetap di kategori aslinya (Keterangan).
  'LETTER C': [
    'letter-c-data-statement-letter',
    'power-of-attorney-letter',
    'land-price-certificate-letter',
    'land-origin-certificate-letter',
  ],
}

const slugToBundleGroup = Object.fromEntries(
  Object.entries(bundleSlugGroups).flatMap(([groupName, slugs]) =>
    slugs.map((slug) => [slug, groupName]),
  ),
)

// CADANGAN: kalau slug tidak ada / tidak dikenal, cocokkan lewat nama surat.
// Urutan penting: paket (pindah, letter c, nikah, kelahiran, kematian) diperiksa lebih dulu.
const bundleNamePatterns = [
  { name: 'PERMOHONAN PINDAH WNI', pattern: /pindah.*(wni|warga negara indonesia)/i },
  { name: 'LETTER C', pattern: /letter\s*c\b/i },
  {
    name: 'PERNIKAHAN LAKI-LAKI',
    pattern: /(nikah|menikah|pengantin).*laki|laki.*(nikah|menikah|pengantin)/i,
  },
  {
    name: 'PERNIKAHAN PEREMPUAN',
    pattern: /(nikah|menikah|pengantin).*perempuan|perempuan.*(nikah|menikah|pengantin)/i,
  },
  { name: 'KELAHIRAN', pattern: /kelahiran/i },
  { name: 'KEMATIAN', pattern: /kematian/i },
  { name: 'BALASAN', pattern: /balasan|menindaklanjuti|tindak\s*lanjut|penawaran\s+sewa/i },
  { name: 'PERINTAH', pattern: /sppd|perjalanan\s+dinas/i },
  {
    name: 'PERNYATAAN',
    pattern:
      /perkawinan\s+belum\s+tercatat|beda\s+nama|elemen\s+(perubahan\s+)?data|perubahan\s+data\s+penduduk|dokumen\s+kependudukan|sidang\s+waris|pelayanan\s+administrasi\s+kependudukan/i,
  },
  {
    name: 'PERMOHONAN',
    pattern:
      /biodata\s+penduduk|permohonan\s+ktp|pindah\s+datang|penduduk\s+datang|penduduk\s+sementara|skts|tinggal\s+sementara|peristiwa\s+kependudukan|\bkia\b|perubahan\s+(kk|ktp)|cerai|bbm/i,
  },
  {
    name: 'PENGANTAR',
    pattern: /duplikat\s+nikah|pengantar\s+umum|surat\s+pengantar/i,
  },
  {
    name: 'KETERANGAN',
    pattern:
      /legalisasi|domisili|keterangan\s+(usaha|umum|tidak\s+mampu|penghasilan|keramaian|jalan|belum\s+kawin)|mohon\s+skck|\bskck\b/i,
  },
]

function resolveGroupName(row) {
  // 1. Lewat slug surat (paling akurat)
  const slug = String(row.templateView ?? '').split('.').pop()
  if (slug && slugToBundleGroup[slug]) return slugToBundleGroup[slug]

  // 2. Cadangan lewat nama surat
  const letterName = resolveLetterName(row)
  const byName = bundleNamePatterns.find((group) => group.pattern.test(letterName))
  if (byName) return byName.name

  // 3. Kategori asli dari database
  const category = String(row.category ?? '').trim().toUpperCase()
  return category && category !== '-' ? category : 'LAINNYA'
}

// Rekap tahunan berkelompok per kategori surat (A KETERANGAN, B PERMOHONAN, dst).
// - Kelompok: surat berhubungan digabung lewat `bundleGroups`, sisanya memakai `category`.
// - Kelompok diurutkan dari jumlah terbanyak.
// - Di dalam kategori, jenis surat diurutkan dari jumlah terbanyak, lalu abjad.
function buildGroupedRecapFromRows(rowsInPeriod) {
  const groups = {}

  rowsInPeriod.forEach((row) => {
    const groupName = resolveGroupName(row)
    const letterName = resolveLetterName(row)

    if (!groups[groupName]) groups[groupName] = {}
    if (!groups[groupName][letterName]) groups[groupName][letterName] = { male: 0, female: 0 }

    const gender = resolveGender(row)
    if (gender === 'Laki-Laki') groups[groupName][letterName].male += 1
    else if (gender === 'Perempuan') groups[groupName][letterName].female += 1
  })

  const groupList = Object.entries(groups)
    .map(([name, letters]) => {
      const items = Object.entries(letters)
        .map(([letterName, c]) => ({
          name: letterName,
          male: c.male,
          female: c.female,
          total: c.male + c.female,
        }))
        .filter((item) => item.total > 0)
        .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'id'))

      return {
        name,
        items,
        male: items.reduce((sum, item) => sum + item.male, 0),
        female: items.reduce((sum, item) => sum + item.female, 0),
        total: items.reduce((sum, item) => sum + item.total, 0),
      }
    })
    .filter((group) => group.total > 0)
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'id'))

  const tableRows = []
  groupList.forEach((group, groupIndex) => {
    tableRows.push({
      isGroup: true,
      no: toLetters(groupIndex + 1),
      jenis: group.name,
      male: group.male,
      female: group.female,
      total: group.total,
    })

    group.items.forEach((item, itemIndex) => {
      tableRows.push({
        isGroup: false,
        no: itemIndex + 1,
        jenis: item.name,
        male: item.male,
        female: item.female,
        total: item.total,
      })
    })
  })

  const totalMale = groupList.reduce((sum, g) => sum + g.male, 0)
  const totalFemale = groupList.reduce((sum, g) => sum + g.female, 0)

  return { tableRows, totalMale, totalFemale, totalAll: totalMale + totalFemale }
}

function buildYearlyRecap(year) {
  const rowsInPeriod = rows.value.filter(
    (row) =>
      isCompleted(row) &&
      new Date(parseDate(row.dateValue ?? row.submitted_at ?? row.date)).getFullYear() === year,
  )
  return buildGroupedRecapFromRows(rowsInPeriod)
}

async function openPreview() {
  const period = selectedPeriod.value

  // Ambil data terbaru dulu supaya surat yang baru selesai ikut terhitung.
  try {
    await fetchRows()
  } catch (error) {
    console.error('Gagal memuat ulang pengajuan surat:', error)
  }

  previewConfig.value = {
    type: reportType.value,
    month: period.getMonth() + 1,
    year: period.getFullYear(),
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
    didParseCell: (data) => {
      // Baris judul kelompok (A KETERANGAN, B PERMOHONAN, ...) dibuat tebal dan berwarna
      if (data.section === 'body' && previewTableRows.value[data.row.index]?.isGroup) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [254, 243, 199]
      }
    },
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

        <div class="relative w-72">
          <i class="pi pi-search absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Cari nama surat/nama pemohon"
            aria-label="Cari nama surat atau nama pemohon"
            class="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </div>
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
            <Tag
              :value="data.status"
              :severity="statusColor[data.status]"
              class="!whitespace-nowrap"
            />
          </template>
          <template #dateTs="{ data }">
            <span class="whitespace-nowrap">
              {{ formatDateTime(data.submittedAt) }}
            </span>
          </template>
          <template #actions="{ data }">
            <AppButton
              label="Detail"
              variant="primary"
              size="small"
              @click="goToDetail(data)"
            />
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

      <DataTable
        :value="previewTableRows"
        :row-class="(data) => (data.isGroup ? '!bg-amber-50 font-semibold' : '')"
        size="small"
        scrollable
        scroll-height="22rem"
      >
        <Column field="no" header="No" style="width: 3rem" />
        <Column field="jenis" header="Jenis" style="width: 16rem" />
        <Column field="male" header="Laki-Laki" style="width: 6.5rem" />
        <Column field="female" header="Perempuan" style="width: 6.5rem" />
        <Column field="total" header="Jumlah" style="width: 5rem" />
        <template #empty>
          <p class="text-center text-slate-400 py-6 text-sm">Tidak ada surat pada periode ini.</p>
        </template>
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