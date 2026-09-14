<script setup>

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import { FilterMatchMode } from '@primevue/core/api'
import { useConfirm } from 'primevue/useconfirm'
import { createCitizen, deleteCitizen as removeCitizen, getCitizens } from '@/services/citizen.service'
import { getListCache, setListCache } from '@/services/list-cache'

import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import FileUpload from 'primevue/fileupload'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import SelectButton from 'primevue/selectbutton'
import DatePicker from 'primevue/datepicker'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const router = useRouter()
const confirm = useConfirm()

const cachedCitizens = getListCache('citizens')
const residents = ref((cachedCitizens ?? []).map(mapCitizenFromApi))
const loading = ref(!cachedCitizens)
const loadError = ref('')

const detailDialogVisible = ref(false)
const selectedDetailResident = ref(null)

function viewDetail(data) {
  selectedDetailResident.value = data
  detailDialogVisible.value = true
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// Mapping field backend (snake_case) -> field yang dipakai UI (camelCase)
// Kenapa perlu mapping: biar KODE TEMPLATE DI BAWAH (Column, dst) TIDAK PERLU DIUBAH SAMA SEKALI.
function mapCitizenFromApi(item) {
  return {
    id: item.citizen_id,
    recordType: item.record_type,
    recordEvent: item.record_event,
    name: item.full_name,
    nationalId: item.national_id, 
    familyCardNumber: item.family_card_number,
    dusun: item.dusun,
    rt: item.rt,
    rw: item.rw,
    gender: item.gender,
    address: item.address,
    ktpAddress: item.ktp_address,
    status: item.status,
    occupation: item.occupation,
    education: item.education,
    maritalStatus: item.marital_status,
    religion: item.religion,
    phoneNumber: item.phone_number,
    birthPlace: item.birth_place,
    birthDate: item.birth_date,
    age: item.age,
    birthCertificateStatus: item.birth_certificate_status,
    birthCertificateNumber: item.birth_certificate_number,
    bloodType: item.blood_type,
    marriageCertificateStatus: item.marriage_certificate_status,
    marriageCertificateNumber: item.marriage_certificate_number,
    marriageDate: item.marriage_date,
    divorceCertificateStatus: item.divorce_certificate_status,
    divorceCertificateNumber: item.divorce_certificate_number,
    divorceDate: item.divorce_date,
    familyRelationship: item.family_relationship,
    physicalDisability: item.physical_disability,
    disabilityStatus: item.disability_status,
    motherNationalId: item.mother_national_id,
    motherName: item.mother_name,
    fatherNationalId: item.father_national_id,
    fatherName: item.father_name,
    nationality: item.nationality,
  }
}

async function fetchCitizens({ background = false } = {}) {
  if (!background) loading.value = true
  loadError.value = ''
  try {
    const data = await getCitizens()
    const normalized = Array.isArray(data) ? data : []
    setListCache('citizens', normalized)
    residents.value = normalized.map(mapCitizenFromApi)
  } catch (err) {
    loadError.value = err.response?.data?.message || 'Gagal memuat data warga.'
    if (!background) residents.value = []
  } finally {
    if (!background) loading.value = false
  }
}

// Panggil sekali waktu halaman dibuka
onMounted(() => fetchCitizens({ background: Boolean(cachedCitizens) }))

const selectedResidents = ref([])
const rowsPerPage = ref(10)

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

const importError = ref('')
const importSuccess = ref('')

function statusSeverity(status) {
  return status === 'Active' ? 'success' : 'warn'
}

function createResident() {
  router.push({ name: 'citizen-create' })
}

function editResident(id) {
  router.push({ name: 'citizen-edit', params: { id } })
}


// GANTI: deleteResident sekarang beneran panggil API, bukan cuma filter array lokal
async function deleteResident(data) {
  confirm.require({
    message: `Hapus data warga "${data.name}" dengan NIK "${data.nationalId}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await removeCitizen(data.id)
        residents.value = residents.value.filter(resident => resident.id !== data.id)
        setListCache('citizens', items => items.filter(item => item.citizen_id !== data.id))
        selectedResidents.value = selectedResidents.value.filter(resident => resident.id !== data.id)
      } catch (err) {
        loadError.value = err.response?.data?.message || 'Gagal menghapus data warga.'
      }
    },
  })
}


// GANTI: hapus banyak sekaligus -> panggil API satu-satu (backend belum ada endpoint bulk-delete)
async function deleteSelected() {
  confirm.require({
    message: `Hapus ${selectedResidents.value.length} data warga terpilih?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      const idsToDelete = selectedResidents.value.map(resident => resident.id)
      try {
        await Promise.all(idsToDelete.map(id => removeCitizen(id)))
        const idSet = new Set(idsToDelete)
        residents.value = residents.value.filter(resident => !idSet.has(resident.id))
        setListCache('citizens', items => items.filter(item => !idSet.has(item.citizen_id)))
        selectedResidents.value = []
      } catch (err) {
        loadError.value = err.response?.data?.message || 'Sebagian data gagal dihapus.'
        await fetchCitizens() // sinkronin ulang biar data yg berhasil kehapus tetap ke-refresh
      }
    },
  })
}

// --- Bagian import Excel (handleFileSelect, mapRowToResident, normalizeKey)
// TETAP SAMA PERSIS, tidak perlu diubah -- itu logic baca file, bukan komunikasi API.

function normalizeKey(key) {
  return String(key ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function excelDateToIso(value) {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const raw = String(value).trim()
  if (!raw) return null

  if (/^\d+(\.\d+)?$/.test(raw)) {
    const parsed = XLSX.SSF.parse_date_code(Number(raw))
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`
  }

  const parts = raw.split(/[\/-]/).map(Number)
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    const [first, second, third] = parts
    const year = first > 31 ? first : third
    const month = first > 31 ? second : second
    const day = first > 31 ? third : first
    if (year && month && day) return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

function normalizeGender(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'p' || normalized === 'perempuan') return 'Perempuan'
  if (normalized === 'l' || normalized === 'laki-laki' || normalized === 'laki laki') return 'Laki-laki'
  return String(value ?? '').trim()
}

function normalizeReligion(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  const values = {
    katholik: 'Katolik',
    katolik: 'Katolik',
    budha: 'Buddha',
    buddha: 'Buddha',
    islam: 'Islam',
    kristen: 'Kristen',
    hindu: 'Hindu',
    konghucu: 'Konghucu',
  }
  return values[normalized] ?? String(value ?? '').trim()
}

function mapRowToResident(row) {
  const normalized = {}

  Object.keys(row).forEach(key => {
    normalized[normalizeKey(key)] = row[key]
  })

  const record_type = normalized['tulispendudukmatipindahorangluar'] ?? 'PENDUDUK'
  const record_event = normalized['tulislahir01dstdatang01dstpindah01dstmati01dst'] ?? 'Lahir01'
  const full_name = normalized['namalengkap'] ?? normalized['nama'] ?? normalized['name'] ?? ''
  const national_id = normalized['nik'] ?? normalized['nationalid'] ?? ''
  const family_card_number = normalized['nomorkk'] ?? normalized['kk'] ?? normalized['familycardnumber'] ?? ''
  const dusun = normalized['dusun'] ?? ''
  const rt = normalized['rt'] ?? ''
  const rw = normalized['rw'] ?? ''
  const gender = normalizeGender(normalized['lp'] ?? normalized['jeniskelamin'] ?? normalized['gender'] ?? normalized['jk'] ?? '')
  const birth_place = normalized['tempatlahir'] ?? normalized['birthplace'] ?? ''
  const birth_date = excelDateToIso(normalized['tanggallahir'] ?? normalized['birthdate'] ?? null)
  const age = normalized['umur'] ? Number.parseInt(normalized['umur'], 10) : null
  const birth_certificate_status = normalized['aktalahir'] ?? ''
  const birth_certificate_number = normalized['nomoraktalahir'] ?? ''
  const blood_type = normalized['goldarah'] ?? ''
  const phone_number = normalized['notelepon'] ?? normalized['nomortelepon'] ?? normalized['phonenumber'] ?? ''
  const address = normalized['alamat'] ?? normalized['address'] ?? ''
  const occupation = normalized['pekerjaan'] ?? normalized['occupation'] ?? ''
  const education = normalized['pendidikan'] ?? normalized['education'] ?? ''
  const marital_status = normalized['statuskawin'] ?? normalized['statuspernikahan'] ?? normalized['maritalstatus'] ?? ''
  const marriage_certificate_status = normalized['aktakawin'] ?? ''
  const marriage_certificate_number = normalized['nomoraktakawin'] ?? ''
  const marriage_date = excelDateToIso(normalized['tanggalkawin'] ?? null)
  const divorce_certificate_status = normalized['aktacerai'] ?? ''
  const divorce_certificate_number = normalized['nomoraktacerai'] ?? ''
  const divorce_date = excelDateToIso(normalized['tanggalcerai'] ?? null)
  const family_relationship = normalized['statushubdlmkeluarga'] ?? ''
  const physical_disability = normalized['kelainanfisik'] ?? ''
  const disability_status = normalized['penyandangcacat'] ?? ''
  const religion = normalizeReligion(normalized['agama'] ?? '')
  const mother_national_id = normalized['nikibu'] ?? ''
  const mother_name = normalized['namalengkapibu'] ?? ''
  const father_national_id = normalized['nikayah'] ?? ''
  const father_name = normalized['namalengkapayah'] ?? ''
  const nationality = normalized['kewarganegaraan'] ?? ''
  const ktp_address = address
  const status = String(normalized['status'] ?? '').trim().toLowerCase() === 'pindah' ? 'Pindah' : 'Active'


  if (!full_name && !national_id) return null

  return {
    record_type: String(record_type).trim() || 'PENDUDUK',
    record_event: String(record_event).trim() || 'Lahir01',
    full_name: String(full_name).trim(),
    national_id: String(national_id).trim(),
    family_card_number: String(family_card_number).trim(),
    dusun: String(dusun).trim(),
    rt: String(rt).trim(),
    rw: String(rw).trim(),
    gender,
    birth_place: String(birth_place).trim(),
    birth_date,
    age: Number.isNaN(age) ? null : age,
    birth_certificate_status: String(birth_certificate_status).trim(),
    birth_certificate_number: String(birth_certificate_number).trim(),
    blood_type: String(blood_type).trim(),
    phone_number: String(phone_number).trim(),
    address: String(address).trim(),
    ktp_address: String(ktp_address).trim(),
    occupation: String(occupation).trim(),
    education: String(education).trim(),
    marital_status: String(marital_status).trim(),
    marriage_certificate_status: String(marriage_certificate_status).trim(),
    marriage_certificate_number: String(marriage_certificate_number).trim(),
    marriage_date,
    divorce_certificate_status: String(divorce_certificate_status).trim(),
    divorce_certificate_number: String(divorce_certificate_number).trim(),
    divorce_date,
    family_relationship: String(family_relationship).trim(),
    physical_disability: String(physical_disability).trim(),
    disability_status: String(disability_status).trim(),
    religion,
    mother_national_id: String(mother_national_id).trim(),
    mother_name: String(mother_name).trim(),
    father_national_id: String(father_national_id).trim(),
    father_name: String(father_name).trim(),
    nationality: String(nationality).trim(),
    status,
  }
}

function readCitizenRows(workbook) {
  for (const sheetName of workbook.SheetNames) {
    const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: '',
      raw: false,
    })
    const headerIndex = matrix.findIndex(row => {
      const keys = row.map(normalizeKey)
      return keys.includes('nik') && keys.includes('namalengkap')
    })
    if (headerIndex < 0) continue

    const headers = matrix[headerIndex]
    return matrix.slice(headerIndex + 1).map(values => headers.reduce((row, header, index) => {
      if (header !== '') row[header] = values[index] ?? ''
      return row
    }, {}))
  }

  return []
}

async function handleFileSelect(event) {
  const file = event.files?.[0]
  if (!file) return

  importError.value = ''
  importSuccess.value = ''

  const reader = new FileReader()

  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const rows = readCitizenRows(workbook)

      if (rows.length === 0) {
        importError.value = 'File tidak berisi data yang bisa diimpor.'
        return
      }

      const payloads = rows.map(row => mapRowToResident(row)).filter(p => p !== null)

      if (payloads.length === 0) {
        importError.value = 'Tidak ada baris valid ditemukan. Pastikan kolom Nama Lengkap dan NIK terisi.'
        return
      }

      let successCount = 0
      let failCount = 0

      for (const payload of payloads) {
        try {
          await createCitizen(payload)
          successCount++
        } catch {
          failCount++
        }
      }

      await fetchCitizens()

      if (failCount === 0) {
        importSuccess.value = `${successCount} data warga berhasil diimpor.`
      } else {
        importSuccess.value = `${successCount} data berhasil diimpor, ${failCount} gagal (kemungkinan NIK duplikat/tidak valid).`
      }
    } catch (err) {
      importError.value = 'Gagal membaca file. Pastikan format file adalah .xlsx, .xls, atau .csv.'
    }
  }

  reader.readAsArrayBuffer(file)
}

// ======================================================================
// Bagian baru: Download laporan data warga (Bulanan / Tahunan)
// Alur: klik "Download Data Warga" -> pilih jenis periode + tanggal ->
// "Lihat Preview" -> tampil tabel rekap ala profil kependudukan ->
// "Download Excel" untuk unduh file .xlsx dari data yang sama persis
// dengan yang ditampilkan di preview.
// ======================================================================

const downloadDialogVisible = ref(false)
const previewDialogVisible = ref(false)

const reportPeriodOptions = [
  { label: 'Laporan Bulanan', value: 'monthly' },
  { label: 'Laporan Tahunan', value: 'yearly' },
]
const reportPeriodType = ref('monthly')
const reportDate = ref(new Date())
const reportRows = ref([])
const reportTitle = ref('')

function openDownloadDialog() {
  reportPeriodType.value = 'monthly'
  reportDate.value = new Date()
  downloadDialogVisible.value = true
}

function calculateAgeFromBirthDate(birthDateStr) {
  if (!birthDateStr) return null
  const birthDate = new Date(birthDateStr)
  if (Number.isNaN(birthDate.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--

  return age
}

function getResidentAge(resident) {
  if (resident.age !== null && resident.age !== undefined && resident.age !== '') {
    const parsedAge = Number(resident.age)
    if (!Number.isNaN(parsedAge)) return parsedAge
  }
  return calculateAgeFromBirthDate(resident.birthDate)
}

function formatPercent(count, total) {
  if (!total) return '0,00%'
  return `${((count / total) * 100).toFixed(2).replace('.', ',')}%`
}

function countByGender(list) {
  const male = list.filter(resident => resident.gender === 'Laki-laki').length
  const female = list.filter(resident => resident.gender === 'Perempuan').length
  return { male, female, total: male + female }
}

function groupResidentsBy(list, keyFn) {
  const groupMap = new Map()
  list.forEach(resident => {
    const rawKey = keyFn(resident)
    const key = rawKey && String(rawKey).trim() ? String(rawKey).trim() : 'Tidak Diketahui'
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key).push(resident)
  })
  return Array.from(groupMap.entries())
}

function buildSingleCategoryRow(categoryLabel, list, totalPopulation) {
  const { male, female, total } = countByGender(list)
  return [{
    id: `${categoryLabel}|`,
    category: categoryLabel,
    subcategory: '',
    male,
    female,
    total,
    percent: formatPercent(total, totalPopulation),
  }]
}

function buildCategoryRows(categoryLabel, groupedEntries, totalPopulation) {
  return groupedEntries.map(([subLabel, list]) => {
    const { male, female, total } = countByGender(list)
    return {
      id: `${categoryLabel}|${subLabel}`,
      category: categoryLabel,
      subcategory: subLabel,
      male,
      female,
      total,
      percent: formatPercent(total, totalPopulation),
    }
  })
}

// Untuk kategori dengan daftar sub-jenis yang SUDAH PASTI (fixed), setiap sub-jenis
// tetap ditampilkan walau jumlahnya 0, supaya struktur laporan konsisten setiap saat.
function buildFixedCategoryRows(categoryLabel, sourceList, normalizeFn, order, totalPopulation) {
  const groupedMap = new Map(groupResidentsBy(sourceList, normalizeFn))
  return order.map(subLabel => {
    const list = groupedMap.get(subLabel) ?? []
    const { male, female, total } = countByGender(list)
    return {
      id: `${categoryLabel}|${subLabel}`,
      category: categoryLabel,
      subcategory: subLabel,
      male,
      female,
      total,
      percent: formatPercent(total, totalPopulation),
    }
  })
}

// Untuk kategori berbasis rentang usia (Usia Pendidikan, Angkatan Kerja, Penggolongan
// Usia 1/2/3, Kepemilikan Akta Kelahiran Berdasar Usia, dst).
function buildAgeBracketRows(categoryLabel, sourceList, brackets, totalPopulation) {
  return brackets.map(({ label, min, max }) => {
    const list = sourceList.filter(resident => {
      const age = getResidentAge(resident)
      return age !== null && age !== undefined && age >= min && age <= max
    })
    const { male, female, total } = countByGender(list)
    return {
      id: `${categoryLabel}|${label}`,
      category: categoryLabel,
      subcategory: label,
      male,
      female,
      total,
      percent: formatPercent(total, totalPopulation),
    }
  })
}

// Untuk kategori yang datanya belum tersedia di model data warga saat ini
// (mis. Miskin / Rentan Miskin belum ada field khususnya) -> tampil 0 dulu
// supaya strukturnya tetap lengkap, sambil menunggu field terkait ditambahkan.
function buildPlaceholderRows(categoryLabel, subLabels) {
  return subLabels.map(subLabel => ({
    id: `${categoryLabel}|${subLabel}`,
    category: categoryLabel,
    subcategory: subLabel,
    male: 0,
    female: 0,
    total: 0,
    percent: '0,00%',
  }))
}

function normalizeMaritalStatusLabel(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  const map = {
    'belum kawin': 'Belum Kawin',
    'belum menikah': 'Belum Kawin',
    kawin: 'Kawin',
    menikah: 'Kawin',
    'kawin tercatat': 'Kawin Tercatat',
    'menikah tercatat': 'Kawin Tercatat',
    'kawin belum tercatat': 'Kawin Belum Tercatat',
    'menikah belum tercatat': 'Kawin Belum Tercatat',
    'cerai mati': 'Cerai Mati',
    'cerai hidup': 'Cerai Hidup',
  }
  return map[normalized] ?? (normalized ? 'Belum Kawin' : 'Belum Kawin')
}

function normalizeEducationLabel(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  const map = {
    'tidak sekolah': 'Tidak/Belum Sekolah',
    'tidak/belum sekolah': 'Tidak/Belum Sekolah',
    'belum sekolah': 'Tidak/Belum Sekolah',
    'belum tamat sd': 'Belum Tamat SD/Sederajat',
    'belum tamat sd/sederajat': 'Belum Tamat SD/Sederajat',
    sd: 'Tamat SD/Sederajat',
    'tamat sd': 'Tamat SD/Sederajat',
    'tamat sd/sederajat': 'Tamat SD/Sederajat',
    smp: 'SLTP/Sederajat',
    sltp: 'SLTP/Sederajat',
    'sltp/sederajat': 'SLTP/Sederajat',
    sma: 'SLTA/Sederajat',
    slta: 'SLTA/Sederajat',
    'slta/sederajat': 'SLTA/Sederajat',
    'diploma i/ii': 'Diploma I/II',
    'd1/d2': 'Diploma I/II',
    'akademi/diploma iii/sarjana muda': 'Akademi/Diploma III/Sarjana Muda',
    d3: 'Akademi/Diploma III/Sarjana Muda',
    'diploma iii': 'Akademi/Diploma III/Sarjana Muda',
    'diploma iv/strata i': 'Diploma IV/Strata I',
    s1: 'Diploma IV/Strata I',
    'strata i': 'Diploma IV/Strata I',
    'strata ii': 'Strata II',
    s2: 'Strata II',
    'strata iii': 'Strata III',
    s3: 'Strata III',
  }
  return map[normalized] ?? (normalized ? 'Tidak/Belum Sekolah' : 'Tidak/Belum Sekolah')
}

function normalizeBloodTypeLabel(value) {
  const normalized = String(value ?? '').trim().toUpperCase()
  return ['A', 'B', 'O', 'AB'].includes(normalized) ? normalized : 'Tidak Tahu'
}

function normalizeFamilyRelationshipLabel(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  const map = {
    'kepala keluarga': 'Kepala Keluarga',
    suami: 'Suami',
    istri: 'Istri',
    anak: 'Anak',
    menantu: 'Menantu',
    cucu: 'Cucu',
    'orang tua': 'Orang Tua',
    mertua: 'Mertua',
    'famili lain': 'Famili Lain',
    pembantu: 'Pembantu',
  }
  return map[normalized] ?? 'Lainnya'
}

function normalizeDisabilityLabel(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (!normalized) return null
  const map = {
    'cacat fisik': 'Cacat Fisik',
    'cacat netra': 'Cacat Netra/Buta',
    'cacat netra/buta': 'Cacat Netra/Buta',
    buta: 'Cacat Netra/Buta',
    'cacat rungu': 'Cacat Rungu/Wicara',
    'cacat rungu/wicara': 'Cacat Rungu/Wicara',
    tuli: 'Cacat Rungu/Wicara',
    'cacat mental': 'Cacat Mental/Jiwa',
    'cacat mental/jiwa': 'Cacat Mental/Jiwa',
    'cacat fisik dan mental': 'Cacat Fisik Dan Mental',
  }
  return map[normalized] ?? 'Cacat Lainnya'
}

function hasDocument(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  return ['ada', 'sudah', 'ya', 'yes', 'true', '1', 'punya', 'memiliki', 'sudah ada'].includes(normalized)
}

const MARITAL_STATUS_ORDER = ['Belum Kawin', 'Kawin', 'Kawin Tercatat', 'Kawin Belum Tercatat', 'Cerai Mati', 'Cerai Hidup']
const EDUCATION_ORDER = [
  'Tidak/Belum Sekolah',
  'Belum Tamat SD/Sederajat',
  'Tamat SD/Sederajat',
  'SLTP/Sederajat',
  'SLTA/Sederajat',
  'Diploma I/II',
  'Akademi/Diploma III/Sarjana Muda',
  'Diploma IV/Strata I',
  'Strata II',
  'Strata III',
]
const BLOOD_TYPE_ORDER = ['A', 'B', 'O', 'AB', 'Tidak Tahu']
const FAMILY_RELATIONSHIP_ORDER = ['Kepala Keluarga', 'Suami', 'Istri', 'Anak', 'Menantu', 'Cucu', 'Orang Tua', 'Mertua', 'Famili Lain', 'Pembantu', 'Lainnya']
const DISABILITY_ORDER = ['Cacat Fisik', 'Cacat Netra/Buta', 'Cacat Rungu/Wicara', 'Cacat Mental/Jiwa', 'Cacat Fisik Dan Mental', 'Cacat Lainnya']

const EDUCATION_AGE_BRACKETS = [
  { label: '00-03 Tahun', min: 0, max: 3 },
  { label: '04-06 Tahun', min: 4, max: 6 },
  { label: '07-12 Tahun', min: 7, max: 12 },
  { label: '13-15 Tahun', min: 13, max: 15 },
  { label: '16-18 Tahun', min: 16, max: 18 },
  { label: '19 Tahun Keatas', min: 19, max: Infinity },
]
const WORKFORCE_AGE_BRACKETS = [
  { label: '10-14 Tahun', min: 10, max: 14 },
  { label: '15-19 Tahun', min: 15, max: 19 },
  { label: '20-26 Tahun', min: 20, max: 26 },
  { label: '27-40 Tahun', min: 27, max: 40 },
  { label: '41-56 Tahun', min: 41, max: 56 },
  { label: '57 Tahun Keatas', min: 57, max: Infinity },
]
const AGE_GROUP_1_BRACKETS = [
  { label: '0-6 Tahun', min: 0, max: 6 },
  { label: '7-12 Tahun', min: 7, max: 12 },
  { label: '13-18 Tahun', min: 13, max: 18 },
  { label: '19-24 Tahun', min: 19, max: 24 },
  { label: '25-55 Tahun', min: 25, max: 55 },
  { label: '56-79 Tahun', min: 56, max: 79 },
  { label: '80 Tahun Keatas', min: 80, max: Infinity },
]
const AGE_GROUP_2_BRACKETS = [
  { label: '0-4 Tahun', min: 0, max: 4 },
  { label: '5-9 Tahun', min: 5, max: 9 },
  { label: '10-14 Tahun', min: 10, max: 14 },
  { label: '15-19 Tahun', min: 15, max: 19 },
  { label: '20-24 Tahun', min: 20, max: 24 },
  { label: '25-29 Tahun', min: 25, max: 29 },
  { label: '30-34 Tahun', min: 30, max: 34 },
  { label: '35-39 Tahun', min: 35, max: 39 },
  { label: '40 Tahun Keatas', min: 40, max: Infinity },
]
const AGE_GROUP_3_BRACKETS = [
  { label: '0-5 Tahun', min: 0, max: 5 },
  { label: '6-16 Tahun', min: 6, max: 16 },
  { label: '17-25 Tahun', min: 17, max: 25 },
  { label: '26-55 Tahun', min: 26, max: 55 },
  { label: '56 Tahun Keatas', min: 56, max: Infinity },
]
const BIRTH_CERTIFICATE_AGE_BRACKETS = AGE_GROUP_1_BRACKETS

function buildDemographicReport(sourceResidents) {
  const totalPopulation = sourceResidents.length
  const rows = []

  // 1. Jumlah Penduduk
  rows.push(...buildSingleCategoryRow('1. Jumlah Penduduk', sourceResidents, totalPopulation))

  // 2. Jumlah KK
  const headOfFamilyList = sourceResidents.filter(resident => normalizeFamilyRelationshipLabel(resident.familyRelationship) === 'Kepala Keluarga')
  rows.push(...buildSingleCategoryRow('2. Jumlah KK', headOfFamilyList, totalPopulation))

  // 3. Pemeluk Agama
  const religionOrder = ['Islam', 'Katolik', 'Kristen', 'Hindu', 'Buddha', 'Konghucu']
  const religionGroups = groupResidentsBy(sourceResidents, resident => resident.religion)
  const orderedReligionGroups = [
    ...religionOrder.map(name => [name, religionGroups.find(([key]) => key === name)?.[1] ?? []]),
    ...religionGroups.filter(([key]) => !religionOrder.includes(key)),
  ]
  rows.push(...buildCategoryRows('3. Pemeluk Agama', orderedReligionGroups, totalPopulation))

  // 4. Wajib KTP (usia >= 17 tahun)
  const mandatoryIdList = sourceResidents.filter(resident => (getResidentAge(resident) ?? 0) >= 17)
  rows.push(...buildSingleCategoryRow('4. Wajib KTP', mandatoryIdList, totalPopulation))

  // 5. Status Perkawinan
  rows.push(...buildFixedCategoryRows(
    '5. Status Perkawinan', sourceResidents, resident => normalizeMaritalStatusLabel(resident.maritalStatus), MARITAL_STATUS_ORDER, totalPopulation,
  ))

  // 6. Balita (0-4 tahun)
  const toddlerList = sourceResidents.filter(resident => {
    const age = getResidentAge(resident)
    return age !== null && age >= 0 && age <= 4
  })
  rows.push(...buildSingleCategoryRow('6. Balita', toddlerList, totalPopulation))

  // 7. Lansia (>= 60 tahun)
  const elderlyList = sourceResidents.filter(resident => (getResidentAge(resident) ?? -1) >= 60)
  rows.push(...buildSingleCategoryRow('7. Lansia', elderlyList, totalPopulation))

  // 8. Tingkat Pendidikan
  rows.push(...buildFixedCategoryRows(
    '8. Tingkat Pendidikan', sourceResidents, resident => normalizeEducationLabel(resident.education), EDUCATION_ORDER, totalPopulation,
  ))

  // 9. Golongan Darah (termasuk "Tidak Tahu")
  rows.push(...buildFixedCategoryRows(
    '9. Golongan Darah', sourceResidents, resident => normalizeBloodTypeLabel(resident.bloodType), BLOOD_TYPE_ORDER, totalPopulation,
  ))

  // 10. Usia Pendidikan
  rows.push(...buildAgeBracketRows('10. Usia Pendidikan', sourceResidents, EDUCATION_AGE_BRACKETS, totalPopulation))

  // 11. Usia Angkatan Kerja
  rows.push(...buildAgeBracketRows('11. Usia Angkatan Kerja', sourceResidents, WORKFORCE_AGE_BRACKETS, totalPopulation))

  // 12. Penggolongan Menurut Usia 1
  rows.push(...buildAgeBracketRows('12. Penggolongan Menurut Usia 1', sourceResidents, AGE_GROUP_1_BRACKETS, totalPopulation))

  // 13. Penggolongan Menurut Usia 2
  rows.push(...buildAgeBracketRows('13. Penggolongan Menurut Usia 2', sourceResidents, AGE_GROUP_2_BRACKETS, totalPopulation))

  // 14. Penggolongan Menurut Usia 3
  rows.push(...buildAgeBracketRows('14. Penggolongan Menurut Usia 3', sourceResidents, AGE_GROUP_3_BRACKETS, totalPopulation))

  // 15. Usia 18 - 56 Tahun (dirinci menurut tingkat pendidikan)
  const workingAgeList = sourceResidents.filter(resident => {
    const age = getResidentAge(resident)
    return age !== null && age >= 18 && age <= 56
  })
  rows.push(...buildFixedCategoryRows(
    '15. Usia 18-56 Tahun', workingAgeList, resident => normalizeEducationLabel(resident.education), EDUCATION_ORDER, workingAgeList.length,
  ))

  // 16. Pasangan Usia Subur (kawin, usia 15-49 tahun)
  const fertileCoupleList = sourceResidents.filter(resident => {
    const age = getResidentAge(resident)
    const marital = normalizeMaritalStatusLabel(resident.maritalStatus)
    return age !== null && age >= 15 && age <= 49
      && (marital === 'Kawin' || marital === 'Kawin Tercatat' || marital === 'Kawin Belum Tercatat')
  })
  rows.push(...buildSingleCategoryRow('16. Pasangan Usia Subur', fertileCoupleList, totalPopulation))

  // 17. Miskin & 18. Rentan Miskin
  // Catatan: data warga saat ini belum punya field status kemiskinan,
  // jadi nilainya 0 dulu sampai field terkait ditambahkan di backend.
  rows.push(...buildPlaceholderRows('17. Miskin', ['Kepala Keluarga', 'Jiwa Penduduk Miskin']))
  rows.push(...buildPlaceholderRows('18. Rentan Miskin', ['Kepala Keluarga', 'Jiwa Penduduk Rentan Miskin']))

  // 19. Cacat (hanya warga yang tercatat memiliki kondisi disabilitas)
  const disabledList = sourceResidents.filter(resident => resident.disabilityStatus || resident.physicalDisability)
  rows.push(...buildFixedCategoryRows(
    '19. Cacat',
    disabledList,
    resident => normalizeDisabilityLabel(resident.disabilityStatus || resident.physicalDisability),
    DISABILITY_ORDER,
    totalPopulation,
  ))

  // 20. Status Hubungan (dalam keluarga)
  rows.push(...buildFixedCategoryRows(
    '20. Status Hubungan', sourceResidents, resident => normalizeFamilyRelationshipLabel(resident.familyRelationship), FAMILY_RELATIONSHIP_ORDER, totalPopulation,
  ))

  // 21. Kepemilikan Akta Akta
  // Catatan: akta kematian dideteksi dari recordType (belum ada field akta kematian
  // khusus di model data), sedangkan akta lain dideteksi dari field status akta masing-masing.
  const aktaSubcategories = [
    ['Akta Kelahiran', sourceResidents.filter(resident => hasDocument(resident.birthCertificateStatus))],
    ['Akta Kematian', sourceResidents.filter(resident => String(resident.recordType ?? '').toLowerCase().includes('mati'))],
    ['Akta Nikah', sourceResidents.filter(resident => hasDocument(resident.marriageCertificateStatus))],
    ['Akta Cerai', sourceResidents.filter(resident => hasDocument(resident.divorceCertificateStatus))],
  ]
  rows.push(...buildCategoryRows('21. Kepemilikan Akta Akta', aktaSubcategories, totalPopulation))

  // 22. Kepemilikan Akta Kelahiran Berdasarkan Usia
  const ownsBirthCertificateList = sourceResidents.filter(resident => hasDocument(resident.birthCertificateStatus))
  rows.push(...buildAgeBracketRows(
    '22. Kepemilikan Akta Kelahiran Berdasar Usia', ownsBirthCertificateList, BIRTH_CERTIFICATE_AGE_BRACKETS, totalPopulation,
  ))

  // 23. Jenis Pekerjaan
  const occupationGroups = groupResidentsBy(sourceResidents, resident => resident.occupation)
  rows.push(...buildCategoryRows('23. Jenis Pekerjaan', occupationGroups, totalPopulation))

  return rows
}

// Catatan: data warga saat ini tidak menyimpan tanggal pencatatan (createdAt),
// sehingga "Laporan Bulanan" dan "Laporan Tahunan" merekap seluruh data warga
// yang aktif sebagai gambaran populasi terkini, dengan judul mengikuti periode
// (bulan/tahun) yang dipilih pengguna.
function getResidentsForPeriod() {
  return residents.value
}

function generatePreview() {
  const filteredResidents = getResidentsForPeriod()
  reportRows.value = buildDemographicReport(filteredResidents)

  const selectedDate = reportDate.value instanceof Date ? reportDate.value : new Date(reportDate.value)

  reportTitle.value = reportPeriodType.value === 'monthly'
    ? `LAPORAN BULANAN DATA WARGA - ${selectedDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
    : `LAPORAN TAHUNAN DATA WARGA - TAHUN ${selectedDate.getFullYear()}`

  downloadDialogVisible.value = false
  previewDialogVisible.value = true
}

function exportReportToExcel() {
  const header = ['No / Jenis', 'Sub Jenis', 'L', 'P', 'Jumlah', 'Persen']
  const sheetData = [[reportTitle.value], [], header]
  const merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: header.length - 1 } }]

  let currentRow = sheetData.length
  let index = 0

  while (index < reportRows.value.length) {
    const currentCategory = reportRows.value[index].category
    const startRow = currentRow
    let rowCount = 0

    while (index < reportRows.value.length && reportRows.value[index].category === currentCategory) {
      const row = reportRows.value[index]
      sheetData.push([row.category, row.subcategory, row.male, row.female, row.total, row.percent])
      rowCount++
      currentRow++
      index++
    }

    if (rowCount > 1) {
      merges.push({ s: { r: startRow, c: 0 }, e: { r: startRow + rowCount - 1, c: 0 } })
    }
  }

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
  worksheet['!merges'] = merges
  worksheet['!cols'] = [{ wch: 28 }, { wch: 26 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Warga')

  const selectedDate = reportDate.value instanceof Date ? reportDate.value : new Date(reportDate.value)
  const fileLabel = reportPeriodType.value === 'monthly'
    ? `Bulanan-${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`
    : `Tahunan-${selectedDate.getFullYear()}`

  XLSX.writeFile(workbook, `Data-Warga-${fileLabel}.xlsx`)
}

function exportReportToPdf() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text(reportTitle.value, pageWidth / 2, 40, { align: 'center' })

  // Susun body sebagai array-of-arrays. Kolom "category" digabung (rowSpan)
  // dengan cara hanya mengisi kolom tersebut di baris pertama tiap kelompok,
  // baris berikutnya dalam kelompok yang sama tidak menyertakan kolom itu
  // sama sekali (ditangani otomatis oleh jspdf-autotable).
  const body = []
  let index = 0

  while (index < reportRows.value.length) {
    const currentCategory = reportRows.value[index].category
    const groupStart = index
    let rowCount = 0

    while (index < reportRows.value.length && reportRows.value[index].category === currentCategory) {
      rowCount++
      index++
    }

    for (let i = 0; i < rowCount; i++) {
      const row = reportRows.value[groupStart + i]
      const line = []

      if (i === 0) {
        line.push(rowCount > 1 ? { content: row.category, rowSpan: rowCount } : row.category)
      }

      line.push(row.subcategory || '-', row.male, row.female, row.total, row.percent)
      body.push(line)
    }
  }

  autoTable(doc, {
    startY: 55,
    head: [['No / Jenis', 'Sub Jenis', 'L', 'P', 'Jumlah', 'Persen']],
    body,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 5, valign: 'middle' },
    headStyles: { fillColor: [252, 211, 77], textColor: [60, 40, 10], fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 150 },
      1: { cellWidth: 130 },
    },
  })

  const selectedDate = reportDate.value instanceof Date ? reportDate.value : new Date(reportDate.value)
  const fileLabel = reportPeriodType.value === 'monthly'
    ? `Bulanan-${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`
    : `Tahunan-${selectedDate.getFullYear()}`

  doc.save(`Data-Warga-${fileLabel}.pdf`)
}
</script>

<template>
  <div>

    <div class="mb-6">
      <h1 class="m-0 text-2xl font-bold text-primary-900">
        Kelola Data Warga
      </h1>

      <p class="m-0 mt-1 text-sm text-neutral-500">
        Kelola data kependudukan warga desa.
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
              label="Tambah Warga"
              icon="pi pi-plus"
              class="rounded-lg border border-transparent bg-primary-700 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-primary-800"
              @click="createResident"
            />

            <Button
              label="Hapus"
              icon="pi pi-trash"
              severity="secondary"
              outlined
              :disabled="selectedResidents.length === 0"
              class="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
              @click="deleteSelected"
            />

            <Button
              label="Download Data Warga"
              icon="pi pi-download"
              severity="secondary"
              outlined
              class="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
              @click="openDownloadDialog"
            />

          </div>

          <div class="flex flex-wrap items-center gap-2">
            <IconField class="w-full sm:w-72">
              <InputIcon class="pi pi-search text-neutral-400" />
              <InputText
                v-model="filters.global.value"
                placeholder="Cari nama, NIK, atau alamat"
                class="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-8 pr-3 text-[13px] text-neutral-800 outline-none transition focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
              />
            </IconField>

            <FileUpload
              mode="basic"
              accept=".xlsx,.xls,.csv"
              chooseLabel="Import Data Warga"
              chooseIcon="pi pi-upload"
              :auto="false"
              customUpload
              :pt="{
                root: { class: 'inline-flex' },
                chooseButton: {
                  class:
                    'inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100',
                },
              }"
              @select="handleFileSelect"
            />
          </div>
        </div>

        <div v-if="importError || importSuccess" class="mb-4">
          <Message v-if="importError" severity="error" :closable="false" class="text-[13px]">
            {{ importError }}
          </Message>

          <Message v-if="importSuccess" severity="success" :closable="false" class="text-[13px]">
            {{ importSuccess }}
          </Message>
        </div>

        <DataTable
          v-model:selection="selectedResidents"
          :value="residents"
          :loading="loading"
          :filters="filters"
          :paginator="true"
          :rows="rowsPerPage"
          :rowsPerPageOptions="[10, 25, 50]"
          currentPageReportTemplate="Menampilkan {first}–{last} dari {totalRecords} warga"
          paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          dataKey="id"
          sortField="name"
          :sortOrder="1"
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
              {{ loadError || 'Tidak ada data warga yang cocok dengan pencarian.' }}
            </div>
          </template>

          <Column selectionMode="multiple" headerStyle="width: 2.5rem" />

          <Column field="name" header="Nama Lengkap" sortable />
          <Column field="nationalId" header="NIK" sortable />
          <Column field="gender" header="Jenis Kelamin" sortable />
          <Column field="address" header="Alamat" />

          <Column field="status" header="Status" sortable>
            <template #body="{ data }">
              <Tag
                :value="data.status"
                :severity="statusSeverity(data.status)"
                class="rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide"
              />
            </template>
          </Column>

          <Column header="Aksi" headerStyle="width: 8rem">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <Button
                  icon="pi pi-eye"
                  text
                  rounded
                  severity="secondary"
                  class="h-8 w-8 text-neutral-500 hover:bg-neutral-100 hover:text-primary-700"
                  title="Detail"
                  @click="viewDetail(data)"
                />
                <Button
                  icon="pi pi-pencil"
                  text
                  rounded
                  severity="secondary"
                  class="h-8 w-8 text-neutral-500 hover:bg-neutral-100 hover:text-primary-700"
                  title="Edit"
                  @click="editResident(data.id)"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  class="h-8 w-8 text-neutral-500 hover:bg-danger-50 hover:text-danger-600"
                  title="Hapus"
                  @click="deleteResident(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>

      </template>
    </Card>

    <!-- ============ DIALOG: PILIH PERIODE DOWNLOAD (BULANAN / TAHUNAN) ============ -->
    <Dialog
      v-model:visible="downloadDialogVisible"
      header="Download Data Warga"
      modal
      :style="{ width: '26rem' }"
      class="rounded-lg"
      :pt="{
        header: { class: 'border-b border-neutral-100 px-5 py-4' },
        title: { class: 'text-base font-bold text-primary-900' },
        content: { class: 'px-5 py-5' },
        footer: { class: 'flex justify-end gap-2 border-t border-neutral-100 px-5 py-3' },
      }"
    >
      <div class="flex flex-col gap-5">
        <div class="flex flex-col gap-2">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Jenis Laporan</span>
          <SelectButton
            v-model="reportPeriodType"
            :options="reportPeriodOptions"
            optionLabel="label"
            optionValue="value"
            :allowEmpty="false"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            {{ reportPeriodType === 'monthly' ? 'Pilih Bulan & Tahun' : 'Pilih Tahun' }}
          </span>
          <DatePicker
            v-model="reportDate"
            :view="reportPeriodType === 'monthly' ? 'month' : 'year'"
            :dateFormat="reportPeriodType === 'monthly' ? 'MM yy' : 'yy'"
            showIcon
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <Button
          label="Batal"
          severity="secondary"
          outlined
          class="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
          @click="downloadDialogVisible = false"
        />
        <Button
          label="Lihat Preview"
          icon="pi pi-eye"
          class="rounded-lg border border-transparent bg-primary-700 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-primary-800"
          @click="generatePreview"
        />
      </template>
    </Dialog>

    <!-- ============ DIALOG: PREVIEW LAPORAN SEBELUM DOWNLOAD ============ -->
    <Dialog
      v-model:visible="previewDialogVisible"
      header="Preview Laporan Data Warga"
      modal
      :style="{ width: '52rem' }"
      class="rounded-lg"
      :pt="{
        header: { class: 'border-b border-neutral-100 px-5 py-4' },
        title: { class: 'text-base font-bold text-primary-900' },
        content: { class: 'px-5 py-5' },
        footer: { class: 'flex justify-end gap-2 border-t border-neutral-100 px-5 py-3' },
      }"
    >
      <div class="flex flex-col gap-4">
        <div class="rounded-lg bg-amber-50 px-4 py-3 text-center text-[13px] font-bold uppercase tracking-wide text-amber-900">
          {{ reportTitle }}
        </div>

        <div class="max-h-[60vh] overflow-y-auto">
          <DataTable
            :value="reportRows"
            dataKey="id"
            rowGroupMode="rowspan"
            groupRowsBy="category"
            class="w-full overflow-hidden rounded-lg border border-neutral-200 text-[13px]"
            :pt="{
              headerRow: { class: 'bg-amber-100' },
              headerCell: { class: 'whitespace-nowrap border-b border-neutral-200 bg-amber-100 px-3 py-2.5 text-left font-semibold text-neutral-700' },
              bodyRow: { class: 'border-b border-neutral-100 last:border-b-0' },
              bodyCell: { class: 'px-3 py-2 align-middle text-neutral-700' },
            }"
          >
            <Column field="category" header="No / Jenis" bodyClass="font-semibold text-neutral-800 align-top" />
            <Column field="subcategory" header="Sub Jenis" />
            <Column field="male" header="L" />
            <Column field="female" header="P" />
            <Column field="total" header="Jumlah" bodyClass="font-semibold" />
            <Column field="percent" header="Persen" />
          </DataTable>
        </div>
      </div>

      <template #footer>
        <Button
          label="Tutup"
          severity="secondary"
          outlined
          class="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
          @click="previewDialogVisible = false"
        />
        <Button
          label="Download Excel"
          icon="pi pi-file-excel"
          class="rounded-lg border border-transparent bg-green-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-green-700"
          @click="exportReportToExcel"
        />
        <Button
          label="Download PDF"
          icon="pi pi-file-pdf"
          class="rounded-lg border border-transparent bg-red-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-red-700"
          @click="exportReportToPdf"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="detailDialogVisible"
      header="Detail Data Warga"
      modal
      :style="{ width: '36rem' }"
      class="rounded-lg"
      :pt="{
        header: { class: 'border-b border-neutral-100 px-5 py-4' },
        title: { class: 'text-base font-bold text-primary-900' },
        content: { class: 'px-5 py-5' },
        footer: { class: 'border-t border-neutral-100 px-5 py-3' },
      }"
    >
      <div v-if="selectedDetailResident" class="flex max-h-[65vh] flex-col gap-6 overflow-y-auto pr-1">

        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-base font-bold text-neutral-800">{{ selectedDetailResident.name || '-' }}</span>
          <Tag
            :value="selectedDetailResident.status"
            :severity="statusSeverity(selectedDetailResident.status)"
            class="w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide"
          />
        </div>

        <!-- ============ IDENTITAS POKOK ============ -->
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2 border-b border-neutral-100 pb-2 text-[13px] font-semibold text-neutral-800">
            <i class="pi pi-id-card text-primary-500" />
            Identitas Pokok
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Jenis Data</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.recordType || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Peristiwa</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.recordEvent || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">NIK</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.nationalId || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Nomor KK</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.familyCardNumber || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Jenis Kelamin</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.gender || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Kewarganegaraan</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.nationality || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Tempat Lahir</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.birthPlace || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Tanggal Lahir</span>
              <span class="text-[13px] text-neutral-800">{{ formatDate(selectedDetailResident.birthDate) }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Umur</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.age ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Golongan Darah</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.bloodType || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Agama</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.religion || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Akta Lahir</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.birthCertificateStatus || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Nomor Akta Lahir</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.birthCertificateNumber || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- ============ ALAMAT & DOMISILI ============ -->
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2 border-b border-neutral-100 pb-2 text-[13px] font-semibold text-neutral-800">
            <i class="pi pi-map-marker text-primary-500" />
            Alamat & Domisili
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Dusun</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.dusun || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">RT / RW</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.rt || '-' }} / {{ selectedDetailResident.rw || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1 sm:col-span-2">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Alamat</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.address || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1 sm:col-span-2">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Alamat sesuai KTP</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.ktpAddress || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- ============ KONTAK, PENDIDIKAN & PEKERJAAN ============ -->
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2 border-b border-neutral-100 pb-2 text-[13px] font-semibold text-neutral-800">
            <i class="pi pi-briefcase text-primary-500" />
            Kontak, Pendidikan & Pekerjaan
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Nomor Telepon</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.phoneNumber || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Pekerjaan</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.occupation || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Pendidikan</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.education || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- ============ STATUS PERNIKAHAN ============ -->
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2 border-b border-neutral-100 pb-2 text-[13px] font-semibold text-neutral-800">
            <i class="pi pi-heart text-primary-500" />
            Status Pernikahan
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="flex flex-col gap-1 sm:col-span-2">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Status Pernikahan</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.maritalStatus || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Akta Kawin</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.marriageCertificateStatus || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Nomor Akta Kawin</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.marriageCertificateNumber || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Tanggal Kawin</span>
              <span class="text-[13px] text-neutral-800">{{ formatDate(selectedDetailResident.marriageDate) }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Akta Cerai</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.divorceCertificateStatus || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Nomor Akta Cerai</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.divorceCertificateNumber || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Tanggal Cerai</span>
              <span class="text-[13px] text-neutral-800">{{ formatDate(selectedDetailResident.divorceDate) }}</span>
            </div>
          </div>
        </div>

        <!-- ============ DATA KELUARGA ============ -->
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2 border-b border-neutral-100 pb-2 text-[13px] font-semibold text-neutral-800">
            <i class="pi pi-users text-primary-500" />
            Data Keluarga
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="flex flex-col gap-1 sm:col-span-2">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Hubungan Keluarga</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.familyRelationship || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Nama Ibu</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.motherName || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">NIK Ibu</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.motherNationalId || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Nama Ayah</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.fatherName || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">NIK Ayah</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.fatherNationalId || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- ============ KESEHATAN & DISABILITAS ============ -->
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2 border-b border-neutral-100 pb-2 text-[13px] font-semibold text-neutral-800">
            <i class="pi pi-heart-fill text-primary-500" />
            Kesehatan & Disabilitas
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Kelainan Fisik</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.physicalDisability || '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Penyandang Cacat</span>
              <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.disabilityStatus || '-' }}</span>
            </div>
          </div>
        </div>

      </div>

      <template #footer>
        <Button
          label="Tutup"
          severity="secondary"
          outlined
          class="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
          @click="detailDialogVisible = false"
        />
      </template>
    </Dialog>

  </div>
</template>