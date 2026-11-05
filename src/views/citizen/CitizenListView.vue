<script setup>

import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import { FilterMatchMode } from '@primevue/core/api'
import { useConfirm } from 'primevue/useconfirm'
import {
  createCitizen,
  deleteCitizen as removeCitizen,
  getCitizen,
  getCitizens,
  getCitizenNationalIds,
  refreshCitizenAges,
  updateCitizenRelations,
  validateCitizenImport,
} from '@/services/citizen.service'
import { getListCache, setListCache } from '@/services/list-cache'
import CitizenDocumentsPanel from '@/components/citizen/CitizenDocumentsPanel.vue'

import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
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

const familyMembers = computed(() => {
  const selected = selectedDetailResident.value
  const familyCardNumber = String(selected?.familyCardNumber ?? '').trim()

  if (!familyCardNumber) return []

  const source = Array.isArray(selected?.familyMembers) && selected.familyMembers.length > 0
    ? selected.familyMembers
    : residents.value

  return source
    .filter((resident) => (
      String(resident.familyCardNumber ?? '').trim() === familyCardNumber
      && resident.status !== 'Pindah'
    ))
    .sort((a, b) => {
      const aIsHead = /kepala\s+keluarga/i.test(String(a.familyRelationship ?? ''))
      const bIsHead = /kepala\s+keluarga/i.test(String(b.familyRelationship ?? ''))
      if (aIsHead !== bIsHead) return aIsHead ? -1 : 1
      return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'id')
    })
})

async function viewDetail(data) {
  selectedDetailResident.value = data
  detailDialogVisible.value = true
  try {
    const detail = await getCitizen(data.id)
    selectedDetailResident.value = mapCitizenFromApi(detail)
  } catch {
    // Data ringkas dari tabel tetap ditampilkan jika detail gagal dimuat.
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function mapCitizenFromApi(item) {
  return {
    id: item.citizen_id,
    recordType: item.record_type,
    recordEvent: item.record_event,
    recordYear: item.record_year,
    titleCode: item.title_code,
    name: item.full_name,
    fullName: item.full_name,
    full_name: item.full_name,
    nationalId: item.national_id, 
    familyCardNumber: item.family_card_number,
    dusun: item.dusun,
    rt: item.rt,
    rw: item.rw,
    rtHeadName: item.rt_head_name,
    rwHeadName: item.rw_head_name,
    gender: item.gender,
    address: item.address,
    ktpAddress: item.ktp_address,
    status: item.status,
    occupation: item.occupation,
    education: item.education,
    maritalStatus: item.marital_status,
    religion: item.religion,
    beliefOrganization: item.belief_organization,
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
    disabilityType: item.disability_type,
    motherNationalId: item.mother_national_id,
    motherName: item.mother_name,
    fatherNationalId: item.father_national_id,
    fatherName: item.father_name,
    spouseNationalId: item.spouse_national_id,
    nationality: item.nationality,
    previousAddress: item.previous_address,
    passportNumber: item.passport_number,
    passportExpiryDate: item.passport_expiry_date,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    familyMembers: Array.isArray(item.family_members)
      ? item.family_members.map(mapCitizenFromApi)
      : [],
  }
}

const totalResidents = ref(0)
const serverPage = ref(1)
let searchTimer = null

async function fetchCitizens({ background = false, page = serverPage.value, signal } = {}) {
  if (!background) loading.value = true
  loadError.value = ''
  try {
    const response = await getCitizens({
      page,
      per_page: rowsPerPage.value,
      search: filters.value.global.value || undefined,
    }, signal ? { signal } : {})
    const normalized = Array.isArray(response?.data) ? response.data : []
    setListCache('citizens', normalized)
    residents.value = normalized.map(mapCitizenFromApi)
    totalResidents.value = Number(response?.meta?.total ?? normalized.length)
    serverPage.value = Number(response?.meta?.current_page ?? page)
    return true
  } catch (err) {
    if (signal?.aborted || err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError') {
      return false
    }
    loadError.value = err.response?.data?.message || 'Gagal memuat data warga.'
    if (!background) residents.value = []
    return false
  } finally {
    if (!background) loading.value = false
  }
}

function handleBeforeUnload(event) {
  if (!importing.value && !refreshingAges.value) return
  event.preventDefault()
  event.returnValue = ''
}

// Panggil sekali waktu halaman dibuka
onMounted(() => {
  fetchCitizens({ background: Boolean(cachedCitizens) })
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload))

const selectedResidents = ref([])
const rowsPerPage = ref(10)

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

watch(() => filters.value.global.value, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    serverPage.value = 1
    fetchCitizens({ page: 1 })
  }, 300)
})

function handlePage(event) {
  rowsPerPage.value = event.rows
  serverPage.value = event.page + 1
  fetchCitizens({ page: serverPage.value })
}

const importError = ref('')
const importSuccess = ref('')
const importProgress = ref('')
const importing = ref(false)
const importCancelled = ref(false)
const importAbortController = ref(null)
const importDialogVisible = ref(false)
const importFileInput = ref(null)
const refreshingAges = ref(false)
const ageRefreshProgress = ref('')
const ageRefreshSuccess = ref('')
const ageRefreshError = ref('')

const citizenImportColumns = [
  { key: 'record_type', label: 'JENIS DATA' },
  { key: 'family_card_number', label: 'Nomor KK' },
  { key: 'dusun', label: 'DUSUN' },
  { key: 'rw', label: 'RW' },
  { key: 'rt', label: 'RT' },
  { key: 'national_id', label: 'NIK' },
  { key: 'full_name', label: 'NAMA LENGKAP' },
  { key: 'gender', label: 'L/P' },
  { key: 'birth_place', label: 'TEMPAT LAHIR' },
  { key: 'birth_date', label: 'TANGGAL LAHIR' },
  { key: 'age', label: 'UMUR' },
  { key: 'birth_certificate_status', label: 'AKTA LAHIR' },
  { key: 'birth_certificate_number', label: 'NOMOR AKTA LAHIR' },
  { key: 'blood_type', label: 'GOL. DARAH' },
  { key: 'religion', label: 'AGAMA' },
  { key: 'marital_status', label: 'STATUS KAWIN' },
  { key: 'marriage_certificate_status', label: 'AKTA KAWIN' },
  { key: 'marriage_certificate_number', label: 'NOMOR AKTA KAWIN' },
  { key: 'marriage_date', label: 'TANGGAL KAWIN' },
  { key: 'divorce_certificate_status', label: 'AKTA CERAI' },
  { key: 'divorce_certificate_number', label: 'NOMOR AKTA CERAI' },
  { key: 'divorce_date', label: 'TANGGAL CERAI' },
  { key: 'family_relationship', label: 'STATUS HUB DLM KELUARGA' },
  { key: 'disability_status', label: 'KELAINAN FISIK' },
  { key: 'disability_type', label: 'PENYANDANG CACAT' },
  { key: 'physical_disability', label: 'KETERANGAN CACAT' },
  { key: 'education', label: 'PENDIDIKAN TERAKHIR' },
  { key: 'occupation', label: 'JENIS PEKERJAAN' },
  { key: 'mother_national_id', label: 'NIK IBU' },
  { key: 'mother_name', label: 'NAMA LENGKAP IBU' },
  { key: 'father_national_id', label: 'NIK AYAH' },
  { key: 'father_name', label: 'NAMA LENGKAP AYAH' },
  { key: 'spouse_national_id', label: 'NIK PASANGAN' },
  { key: 'nationality', label: 'KEWARGANEGARAAN' },
  { key: 'phone_number', label: 'NOMOR TELEPON' },
  { key: 'address', label: 'ALAMAT' },
  { key: 'ktp_address', label: 'ALAMAT SESUAI KTP' },
  { key: 'previous_address', label: 'ALAMAT SEBELUMNYA' },
  { key: 'passport_number', label: 'NOMOR PASPOR' },
  { key: 'passport_expiry_date', label: 'TANGGAL BERAKHIR PASPOR' },
  { key: 'belief_organization', label: 'ORGANISASI KEPERCAYAAN' },
  { key: 'status', label: 'STATUS' },
]

function cancelImport() {
  if (!importing.value) return
  importCancelled.value = true
  importAbortController.value?.abort()
  importProgress.value = 'Membatalkan import...'
}

function statusSeverity(status) {
  return status === 'Active' ? 'success' : 'warn'
}

function createResident() {
  router.push({ name: 'citizen-create' })
}

function openImportDialog() {
  importError.value = ''
  importSuccess.value = ''
  importDialogVisible.value = true
}

function chooseImportFile() {
  importFileInput.value?.click()
}

function createTemplateWorksheet() {
  const labels = citizenImportColumns.map(column => column.label)
  const worksheet = XLSX.utils.aoa_to_sheet([labels])
  worksheet['!cols'] = labels.map(column => ({ wch: Math.min(Math.max(column.length + 3, 16), 28) }))
  return worksheet
}

function downloadCitizenImportTemplateExcel() {
  const worksheet = createTemplateWorksheet()
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Data Warga')
  XLSX.writeFile(workbook, 'Template-Import-Data-Warga.xlsx', { bookType: 'xlsx' })
}

function downloadCitizenImportTemplateCsv() {
  const worksheet = createTemplateWorksheet()
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Data Warga')
  // Excel dengan regional Indonesia memakai titik koma sebagai pemisah CSV.
  XLSX.writeFile(workbook, 'Template-Import-Data-Warga.csv', { bookType: 'csv', FS: ';' })
}

const downloadCitizenImportTemplate = downloadCitizenImportTemplateExcel


function handleImportFileInput(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (file) handleFileSelect({ files: [file] })
}

function refreshAges() {
  confirm.require({
    message: 'Perbarui umur seluruh data warga berdasarkan tanggal lahir sekarang?',
    header: 'Perbarui Umur Warga',
    icon: 'pi pi-refresh',
    acceptLabel: 'Perbarui',
    rejectLabel: 'Batal',
    accept: async () => {
      refreshingAges.value = true
      ageRefreshProgress.value = 'Menghitung ulang umur seluruh data warga...'
      ageRefreshSuccess.value = ''
      ageRefreshError.value = ''

      try {
        const response = await refreshCitizenAges()
        ageRefreshProgress.value = 'Memuat ulang data warga...'
        await fetchCitizens({ background: true })
        const updatedCount = response?.data?.updated_count ?? 0
        ageRefreshSuccess.value = `${response?.message || 'Umur warga berhasil diperbarui.'} ${updatedCount} data diproses.`
      } catch (err) {
        ageRefreshError.value = err.response?.data?.message || 'Gagal memperbarui umur warga.'
      } finally {
        refreshingAges.value = false
        ageRefreshProgress.value = ''
      }
    },
  })
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

// --- Normalisasi import Excel/CSV ---

function normalizeKey(key) {
  return String(key ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function excelDateToIso(value) {
  if (value === null || value === undefined || value === '') return null
  const toValidIsoDate = (year, month, day) => {
    const normalizedYear = Number(year)
    const normalizedMonth = Number(month)
    const normalizedDay = Number(day)
    if (!Number.isInteger(normalizedYear) || !Number.isInteger(normalizedMonth) || !Number.isInteger(normalizedDay)) return null

    const candidate = `${String(normalizedYear).padStart(4, '0')}-${String(normalizedMonth).padStart(2, '0')}-${String(normalizedDay).padStart(2, '0')}`
    const parsed = new Date(`${candidate}T00:00:00Z`)
    if (Number.isNaN(parsed.getTime())) return null
    if (parsed.getUTCFullYear() !== normalizedYear || parsed.getUTCMonth() + 1 !== normalizedMonth || parsed.getUTCDate() !== normalizedDay) return null
    return candidate
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : toValidIsoDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate())
  }
  const raw = String(value).trim()
  if (!raw) return null

  if (/^\d+(\.\d+)?$/.test(raw)) {
    const parsed = XLSX.SSF.parse_date_code(Number(raw))
    if (parsed) return toValidIsoDate(parsed.y, parsed.m, parsed.d)
  }

  const parts = raw.split(/[\/-]/).map(Number)
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    const [first, second, third] = parts
    const year = first > 31 ? first : third
    const month = second
    const day = first > 31 ? third : first
    return toValidIsoDate(year, month, day)
  }

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime())
    ? null
    : toValidIsoDate(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, parsed.getUTCDate())
}

function normalizeFamilyCard(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits.length === 16 ? digits : null
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

  // Jenis Data (PENDUDUK / ORANG LUAR)
  const rawRecordType = String(normalized['jenisdata'] ?? normalized['recordtype'] ?? normalized['tulispendudukmatipindahorangluar'] ?? '').trim()
  const record_type = /orang\s*luar/i.test(rawRecordType) ? 'ORANG LUAR' : 'PENDUDUK'

  // Status (Active / Pindah / Mati)
  let status = 'Active'
  const rawStatus = String(normalized['status'] ?? '').trim().toLowerCase()
  if (rawStatus === 'pindah' || /pindah/i.test(rawRecordType) || /pindah/i.test(String(normalized['peristiwa'] ?? ''))) {
    status = 'Pindah'
  } else if (rawStatus === 'mati' || rawStatus === 'meninggal' || /mati/i.test(rawRecordType) || /mati/i.test(String(normalized['peristiwa'] ?? ''))) {
    status = 'Mati'
  }

  const full_name = normalized['namalengkap'] ?? normalized['nama'] ?? normalized['name'] ?? ''
  const national_id = normalized['nik'] ?? normalized['nationalid'] ?? ''
  const family_card_number = normalizeFamilyCard(normalized['nomorkk'] ?? normalized['kk'] ?? normalized['familycardnumber'] ?? '')
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
  const phone_number = normalized['notelepon'] ?? normalized['nomortelepon'] ?? normalized['nomorteleponwa'] ?? normalized['noteleponwa'] ?? normalized['whatsapp'] ?? normalized['nowa'] ?? normalized['phonenumber'] ?? ''
  const address = normalized['alamat'] ?? normalized['address'] ?? ''
  const occupation = normalized['pekerjaan'] ?? normalized['jenispekerjaan'] ?? normalized['occupation'] ?? ''
  const education = normalized['pendidikan'] ?? normalized['pendidikanterakhir'] ?? normalized['education'] ?? ''
  const marital_status = normalized['statuskawin'] ?? normalized['statuspernikahan'] ?? normalized['maritalstatus'] ?? ''
  const marriage_certificate_status = normalized['aktakawin'] ?? ''
  const marriage_certificate_number = normalized['nomoraktakawin'] ?? ''
  const marriage_date = excelDateToIso(normalized['tanggalkawin'] ?? null)
  const divorce_certificate_status = normalized['aktacerai'] ?? ''
  const divorce_certificate_number = normalized['nomoraktacerai'] ?? ''
  const divorce_date = excelDateToIso(normalized['tanggalcerai'] ?? null)
  const family_relationship = normalized['statushubdlmkeluarga'] ?? normalized['hubungankeluarga'] ?? ''

  // Disabilitas / Kecacatan
  let disability_status = normalized['kelainanfisik'] ?? normalized['statuskelainanfisik'] ?? normalized['disabilitystatus'] ?? ''
  const disability_type = normalized['penyandangcacat'] ?? normalized['jeniscacat'] ?? normalized['jeniskecacatan'] ?? normalized['disabilitytype'] ?? ''
  const physical_disability = normalized['keterangancacat'] ?? normalized['kelainanfisiklainnya'] ?? normalized['physicaldisability'] ?? ''
  if (!disability_status && disability_type && disability_type !== 'Tidak Ada' && disability_type !== '-') {
    disability_status = 'Ada'
  }

  const religion = normalizeReligion(normalized['agama'] ?? '')
  const belief_organization = normalized['organisasikepercayaan'] ?? normalized['namaorganisasikepercayaan'] ?? ''

  const rawMotherNik = String(normalized['nikibu'] ?? '').replace(/\D/g, '').slice(0, 16)
  const mother_national_id = rawMotherNik.length === 16 ? rawMotherNik : null
  const mother_name = normalized['namalengkapibu'] ?? normalized['namaibu'] ?? ''

  const rawFatherNik = String(normalized['nikayah'] ?? '').replace(/\D/g, '').slice(0, 16)
  const father_national_id = rawFatherNik.length === 16 ? rawFatherNik : null
  const father_name = normalized['namalengkapayah'] ?? normalized['namaayah'] ?? ''

  const rawSpouseNik = String(normalized['nikpasangan'] ?? normalized['spousenationalid'] ?? normalized['niksuami'] ?? normalized['nikistri'] ?? '').replace(/\D/g, '').slice(0, 16)
  const spouse_national_id = rawSpouseNik.length === 16 ? rawSpouseNik : null

  const nationality = normalized['kewarganegaraan'] ?? 'WNI'
  const ktp_address = normalized['alamatsesuaiktp'] ?? normalized['ktpaddress'] ?? address
  const previous_address = normalized['alamatsebelumnya'] ?? normalized['alamatsebelum'] ?? ''
  const passport_number = normalized['nomorpaspor'] ?? normalized['paspor'] ?? ''
  const passport_expiry_date = excelDateToIso(normalized['tanggalberakhirpaspor'] ?? normalized['tanggalakhirpaspor'] ?? null)

  if (!full_name && !national_id) return null

  return {
    record_type,
    full_name: String(full_name).trim(),
    national_id: String(national_id).trim(),
    family_card_number,
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
    disability_status: String(disability_status).trim(),
    disability_type: String(disability_type).trim(),
    physical_disability: String(physical_disability).trim(),
    religion,
    belief_organization: String(belief_organization).trim(),
    mother_national_id,
    mother_name: String(mother_name).trim(),
    father_national_id,
    father_name: String(father_name).trim(),
    spouse_national_id,
    nationality: String(nationality).trim(),
    previous_address: String(previous_address).trim(),
    passport_number: String(passport_number).trim(),
    passport_expiry_date,
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
      return keys.includes('nik') && (keys.includes('namalengkap') || keys.includes('nama') || keys.includes('name'))
    })
    if (headerIndex < 0) continue

    const headers = matrix[headerIndex]
    return matrix.slice(headerIndex + 1)
      .filter(values => values && values.some(v => String(v ?? '').trim() !== ''))
      .map(values => headers.reduce((row, header, index) => {
        if (header !== '') row[header] = values[index] ?? ''
        return row
      }, {}))
  }

  return []
}

async function handleFileSelect(event) {
  const file = event.files?.[0]
  if (!file) return

  importDialogVisible.value = false
  importError.value = ''
  importSuccess.value = ''
  importProgress.value = 'Membaca dan memeriksa file (Excel / CSV)...'
  importing.value = true
  importCancelled.value = false
  importAbortController.value = new AbortController()
  const requestSignal = importAbortController.value.signal

  try {
    const data = new Uint8Array(await file.arrayBuffer())
    const workbook = XLSX.read(data, { type: 'array' })
    const rows = readCitizenRows(workbook)

    if (rows.length === 0) {
      importError.value = 'File tidak berisi data warga yang bisa diimpor. Pastikan file memiliki kolom NIK dan Nama Lengkap.'
      return
    }

    if (rows.length > 1000) {
      importError.value = `Import dibatalkan. File berisi ${rows.length} data warga (maksimal 1.000 data per import).`
      return
    }

    if (importCancelled.value) {
      importError.value = 'Import dibatalkan sebelum data diproses.'
      return
    }

    importProgress.value = 'Memvalidasi data di server...'

    // Jika file asli Excel (.xlsx/.xls), konversi sheet warga jadi CSV untuk preflight backend
    let preflightFile = file
    const ext = String(file.name.split('.').pop() ?? '').toLowerCase()
    if (ext === 'xlsx' || ext === 'xls') {
      let targetSheetName = workbook.SheetNames[0]
      for (const sheetName of workbook.SheetNames) {
        const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '', raw: false })
        const hasHeader = matrix.some(row => {
          const keys = row.map(normalizeKey)
          return keys.includes('nik') && (keys.includes('namalengkap') || keys.includes('nama') || keys.includes('name'))
        })
        if (hasHeader) {
          targetSheetName = sheetName
          break
        }
      }
      const csvContent = XLSX.utils.sheet_to_csv(workbook.Sheets[targetSheetName], { FS: ';' })
      preflightFile = new File([new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })], 'preflight.csv', { type: 'text/csv' })
    }

    const preflight = await validateCitizenImport(preflightFile, { signal: requestSignal })
    const serverRowCount = preflight?.data?.row_count ?? rows.length

    if (importCancelled.value) {
      importError.value = 'Import dibatalkan sebelum data diproses.'
      return
    }

    importProgress.value = `File lolos pemeriksaan (${serverRowCount} data). Mengecek NIK yang sudah tersimpan...`

    // Ambil NIK saja sebelum mulai menulis agar data lama tidak pernah
    // dikirim ulang dan tidak perlu memuat ribuan profil warga.
    const existingNikList = await getCitizenNationalIds({ signal: requestSignal })
    if (!Array.isArray(existingNikList)) {
      importError.value = 'Import dibatalkan karena daftar warga yang sudah ada tidak dapat diverifikasi.'
      return
    }

    const mappedRows = rows
      .map((row, index) => ({ rowNumber: index + 2, payload: mapRowToResident(row) }))
      .filter(item => item.payload !== null)

    if (mappedRows.length === 0) {
      importError.value = 'Tidak ada baris valid ditemukan. Pastikan kolom Nama Lengkap dan NIK terisi.'
      return
    }

    const totalFileRows = rows.length
    const existingNiks = new Set(existingNikList.map(nik => String(nik ?? '').trim()).filter(Boolean))
    const seenFileNiks = new Set()
    const candidateRows = []
    let alreadyExistsCount = 0
    let duplicateInFileCount = 0
    let successCount = 0
    let failCount = 0
    let relationWarningCount = 0
    const failures = []
    const relationWarnings = []

    for (const item of mappedRows) {
      const nik = String(item.payload.national_id ?? '').trim()
      if (nik && existingNiks.has(nik)) {
        alreadyExistsCount++
      } else if (nik && seenFileNiks.has(nik)) {
        duplicateInFileCount++
      } else {
        if (nik) seenFileNiks.add(nik)
        candidateRows.push(item)
      }
    }

    // Tahap 1: masukkan data utama tanpa FK keluarga. Dengan cara ini anak
    // tetap dapat disimpan walaupun baris ayah/ibu/pasangannya berada setelah
    // baris anak atau berada di batch Excel berikutnya.
    const createdRows = []
    const createConcurrency = 8
    for (let start = 0; start < candidateRows.length; start += createConcurrency) {
      if (importCancelled.value) break
      const chunk = candidateRows.slice(start, start + createConcurrency)
      importProgress.value = `Mengimpor data ${Math.min(start + chunk.length, candidateRows.length)} dari ${candidateRows.length}...`
      const results = await Promise.all(chunk.map(async ({ payload, rowNumber }) => {
        const basePayload = {
          ...payload,
          mother_national_id: null,
          father_national_id: null,
          spouse_national_id: null,
        }

        try {
          const created = await createCitizen(basePayload, { signal: requestSignal })
          return {
            ok: true,
            payload,
            rowNumber,
            citizenId: created?.citizen_id ?? created?.id,
          }
        } catch (err) {
          const validationErrors = err.response?.data?.errors
          const validationMessage = validationErrors
            ? Object.entries(validationErrors)
              .flatMap(([field, messages]) => `${field}: ${messages.join(', ')}`)
              .join('; ')
            : err.response?.data?.message || 'Data ditolak server.'
          return { ok: false, payload, rowNumber, validationMessage }
        }
      }))

      for (const result of results) {
        if (result.ok) {
          successCount++
          createdRows.push(result)
        } else {
          failCount++
          if (failures.length < 5) {
            failures.push(`Baris ${result.rowNumber} (${result.payload.full_name || result.payload.national_id}): ${result.validationMessage}`)
          }
        }
      }
    }

    // Tahap 2: seluruh baris baru sudah dibuat, sehingga FK keluarga yang
    // berada di file yang sama maupun batch sebelumnya dapat dihubungkan.
    if (!importCancelled.value && createdRows.length > 0) {
      importProgress.value = 'Menghubungkan relasi ayah, ibu, dan pasangan...'
      const relationUpdates = createdRows
        .filter(({ citizenId, payload }) => citizenId && ['mother_national_id', 'father_national_id', 'spouse_national_id']
          .some(field => String(payload[field] ?? '').trim()))
        .map(({ citizenId, payload }) => ({
          citizen_id: citizenId,
          mother_national_id: String(payload.mother_national_id ?? '').trim() || null,
          father_national_id: String(payload.father_national_id ?? '').trim() || null,
          spouse_national_id: String(payload.spouse_national_id ?? '').trim() || null,
        }))

      if (relationUpdates.length > 0) {
        try {
          const relationResult = await updateCitizenRelations(relationUpdates, { signal: requestSignal })
          relationWarningCount = relationResult?.data?.unresolved_count ?? 0
        } catch (err) {
          relationWarningCount = relationUpdates.length
          if (relationWarnings.length < 5) {
            relationWarnings.push(err.response?.data?.message || 'Relasi keluarga belum dapat diproses secara batch.')
          }
        }
      }
    }

    const wasCancelled = importCancelled.value
    let refreshed = true
    if (wasCancelled) {
      // Request reload harus memakai signal baru; signal import sudah di-abort.
      await fetchCitizens()
    } else {
      importProgress.value = 'Memverifikasi data ke database...'
      refreshed = await fetchCitizens({ signal: requestSignal })
    }

    if (wasCancelled) {
      const processedCount = successCount + failCount + alreadyExistsCount + duplicateInFileCount
      const remainingCount = Math.max(totalFileRows - processedCount, 0)
      importSuccess.value = successCount > 0
        ? `${successCount} data warga berhasil diimpor sebelum proses dibatalkan.`
        : ''
      importError.value = `Import dibatalkan. ${remainingCount} data belum diproses.`
    } else if (!refreshed && successCount > 0) {
      importError.value = `${successCount} data berhasil dikirim, tetapi daftar warga gagal dimuat ulang dari database. Periksa koneksi lalu refresh halaman.`
    } else if (successCount > 0) {
      const verifiedCount = successCount
      // Penyebut harus memakai total baris pada file, bukan jumlah baris yang
      // kebetulan berhasil. Sebelumnya import sebagian tampil menyesatkan,
      // misalnya "348 dari 348" padahal file berisi 1.000 baris.
      const skippedCount = Math.max(totalFileRows - mappedRows.length, 0)
      importSuccess.value = `${verifiedCount} dari ${totalFileRows} data berhasil diimpor dan terverifikasi tersimpan di database.`

      const messages = []
      if (alreadyExistsCount > 0) messages.push(`${alreadyExistsCount} data sudah ada dan dilewati tanpa ditimpa.`)
      if (duplicateInFileCount > 0) messages.push(`${duplicateInFileCount} data duplikat di dalam file dilewati.`)
      if (failCount + skippedCount > 0) {
        const detail = failures.length > 0 ? ` ${failures.join(' | ')}` : ''
        messages.push(`${failCount + skippedCount} data tidak berhasil diimpor.${detail}`)
      }
      if (relationWarningCount > 0) {
        messages.push(`${relationWarningCount} relasi keluarga belum terhubung.${relationWarnings.join(' | ')}`)
      }
      importError.value = messages.join(' ')
    } else {
      const skippedCount = Math.max(totalFileRows - mappedRows.length, 0)
      importSuccess.value = alreadyExistsCount > 0
        ? `0 dari ${totalFileRows} data baru diimpor. ${alreadyExistsCount} data sudah ada dan tidak ditimpa.`
        : ''
      importError.value = `${failCount + skippedCount} data gagal diimpor. ${failures.join(' | ')}`
    }
  } catch (err) {
    if (importCancelled.value || err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError') {
      await fetchCitizens()
      importError.value = 'Import berhasil dibatalkan. Data yang sudah tersimpan tetap dipertahankan.'
      return
    }
    importError.value = err.response?.data?.message
      || 'Gagal membaca file. Pastikan file yang dipilih berformat Excel (.xlsx, .xls) atau CSV dan sesuai template.'
  } finally {
    importing.value = false
    importAbortController.value = null
    importProgress.value = ''
  }
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

// Catatan: laporan periodik belum memfilter berdasarkan createdAt,
// sehingga "Laporan Bulanan" dan "Laporan Tahunan" merekap seluruh data warga
// sebagai gambaran populasi terkini, dengan judul mengikuti periode
// (bulan/tahun) yang dipilih pengguna. Export Excel Lengkap di bawah mengambil
// seluruh baris data warga tanpa filter periode.
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

function exportAllCitizensToExcel() {
  // Kolom diurutkan sama persis dengan citizenImportColumns agar file hasil export
  // langsung bisa di-re-import tanpa perlu mengatur ulang kolom.
  const columns = [
    ['JENIS DATA', 'recordType'],
    ['Nomor KK', 'familyCardNumber'],
    ['DUSUN', 'dusun'],
    ['RW', 'rw'],
    ['RT', 'rt'],
    ['NIK', 'nationalId'],
    ['NAMA LENGKAP', 'name'],
    ['L/P', 'gender'],
    ['TEMPAT LAHIR', 'birthPlace'],
    ['TANGGAL LAHIR', 'birthDate'],
    ['UMUR', 'age'],
    ['AKTA LAHIR', 'birthCertificateStatus'],
    ['NOMOR AKTA LAHIR', 'birthCertificateNumber'],
    ['GOL. DARAH', 'bloodType'],
    ['AGAMA', 'religion'],
    ['STATUS KAWIN', 'maritalStatus'],
    ['AKTA KAWIN', 'marriageCertificateStatus'],
    ['NOMOR AKTA KAWIN', 'marriageCertificateNumber'],
    ['TANGGAL KAWIN', 'marriageDate'],
    ['AKTA CERAI', 'divorceCertificateStatus'],
    ['NOMOR AKTA CERAI', 'divorceCertificateNumber'],
    ['TANGGAL CERAI', 'divorceDate'],
    ['STATUS HUB DLM KELUARGA', 'familyRelationship'],
    ['KELAINAN FISIK', 'disabilityStatus'],
    ['PENYANDANG CACAT', 'disabilityType'],
    ['KETERANGAN CACAT', 'physicalDisability'],
    ['PENDIDIKAN TERAKHIR', 'education'],
    ['JENIS PEKERJAAN', 'occupation'],
    ['NIK IBU', 'motherNationalId'],
    ['NAMA LENGKAP IBU', 'motherName'],
    ['NIK AYAH', 'fatherNationalId'],
    ['NAMA LENGKAP AYAH', 'fatherName'],
    ['NIK PASANGAN', 'spouseNationalId'],
    ['KEWARGANEGARAAN', 'nationality'],
    ['NOMOR TELEPON', 'phoneNumber'],
    ['ALAMAT', 'address'],
    ['ALAMAT SESUAI KTP', 'ktpAddress'],
    ['ALAMAT SEBELUMNYA', 'previousAddress'],
    ['NOMOR PASPOR', 'passportNumber'],
    ['TANGGAL BERAKHIR PASPOR', 'passportExpiryDate'],
    ['ORGANISASI KEPERCAYAAN', 'beliefOrganization'],
    ['STATUS', 'status'],
  ]
  // Mapping transformasi kolom khusus yang perlu dikonversi formatnya
  // agar file hasil export langsung bisa di-re-import.
  const columnTransforms = {
    gender: (val) => {
      const g = String(val ?? '').trim().toLowerCase()
      if (g === 'laki-laki' || g === 'l') return 'L'
      if (g === 'perempuan' || g === 'p') return 'P'
      return val ?? ''
    },
  }

  const rows = [
    columns.map(([label]) => label),
    ...residents.value.map((resident) =>
      columns.map(([, key]) => {
        const val = resident[key] ?? ''
        return columnTransforms[key] ? columnTransforms[key](val) : val
      }),
    ),
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  worksheet['!cols'] = columns.map(([label]) => ({ wch: Math.min(Math.max(label.length + 3, 14), 28) }))
  worksheet['!autofilter'] = { ref: `A1:${XLSX.utils.encode_col(columns.length - 1)}${rows.length}` }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Warga Lengkap')

  const dateLabel = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `Data-Warga-Lengkap-${dateLabel}.xlsx`)
  downloadDialogVisible.value = false
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

    <div
      v-if="importing || refreshingAges"
      class="fixed inset-0 z-[1100] flex items-center justify-center bg-neutral-900/35 px-4 backdrop-blur-[1px]"
      @click.stop
    >
      <div class="w-full max-w-sm rounded-xl bg-white p-5 text-center shadow-xl">
        <i class="pi pi-spin pi-spinner text-3xl text-primary-600" />
        <h2 class="mt-3 text-base font-semibold text-primary-900">
          {{ refreshingAges ? 'Memperbarui umur warga' : 'Mengimpor data warga' }}
        </h2>
        <p class="mt-2 text-sm text-neutral-600">
          {{ refreshingAges ? (ageRefreshProgress || 'Sedang memproses data...') : (importProgress || 'Sedang memproses data...') }}
        </p>
        <p class="mt-2 text-xs text-amber-700">
          Jangan berpindah halaman atau menutup browser sampai proses selesai.
        </p>
        <Button
          v-if="importing"
          label="Batalkan Import"
          icon="pi pi-times"
          severity="danger"
          outlined
          size="small"
          class="mt-4"
          @click="cancelImport"
        />
      </div>
    </div>

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
                placeholder="Cari nama, NIK, alamat, atau telepon"
                class="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-8 pr-3 text-[13px] text-neutral-800 outline-none transition focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
              />
            </IconField>

            <Button
              label="Perbarui Umur"
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              :loading="refreshingAges"
              :disabled="refreshingAges"
              class="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
              @click="refreshAges"
            />

            <Button
              label="Import Data Warga"
              icon="pi pi-upload"
              severity="secondary"
              outlined
              :disabled="importing || refreshingAges"
              class="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
              @click="openImportDialog"
            />
          </div>
        </div>

        <div v-if="importError || importSuccess || importProgress || ageRefreshError || ageRefreshSuccess || ageRefreshProgress" class="mb-4">
          <Message v-if="ageRefreshProgress" severity="info" :closable="false" class="mb-2 text-[13px]">
            {{ ageRefreshProgress }}
          </Message>

          <Message v-if="ageRefreshError" severity="error" :closable="false" class="mb-2 text-[13px]">
            {{ ageRefreshError }}
          </Message>

          <Message v-if="ageRefreshSuccess" severity="success" :closable="false" class="mb-2 text-[13px]">
            {{ ageRefreshSuccess }}
          </Message>

          <Message v-if="importProgress" severity="info" :closable="false" class="mb-2 text-[13px]">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span>{{ importProgress }}</span>
              <Button
                v-if="importing"
                label="Batalkan Import"
                icon="pi pi-times"
                severity="danger"
                outlined
                size="small"
                class="shrink-0"
                @click="cancelImport"
              />
            </div>
          </Message>

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
          :lazy="true"
          :totalRecords="totalResidents"
          :first="(serverPage - 1) * rowsPerPage"
          @page="handlePage"
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

          <Column header="No." headerStyle="width: 4rem">
            <template #body="{ index }">{{ index + 1 }}</template>
          </Column>

          <Column field="name" header="Nama Lengkap" sortable />
          <Column field="nationalId" header="NIK" sortable />
          <Column field="gender" header="Jenis Kelamin" sortable />
          <Column field="address" header="Alamat" />

          <Column field="phoneNumber" header="No. Telepon/WA" sortable>
            <template #body="{ data }">
              <span v-if="data.phoneNumber" class="whitespace-nowrap">{{ data.phoneNumber }}</span>
              <span v-else class="text-neutral-400">-</span>
            </template>
          </Column>

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

    <input
      ref="importFileInput"
      type="file"
      accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
      class="hidden"
      @change="handleImportFileInput"
    />

    <Dialog
      v-model:visible="importDialogVisible"
      header="Import Data Warga"
      modal
      :style="{ width: '32rem' }"
      class="rounded-lg"
      :pt="{
        header: { class: 'border-b border-neutral-100 px-5 py-4' },
        title: { class: 'text-base font-bold text-primary-900' },
        content: { class: 'px-5 py-5' },
        footer: { class: 'flex justify-end gap-2 border-t border-neutral-100 px-5 py-3' },
      }"
    >
      <div class="space-y-4 text-sm text-neutral-600">
        <p class="m-0">
          Gunakan template agar nama kolom sesuai database. Import menerima file <strong>Excel (.xlsx, .xls)</strong> maupun <strong>CSV</strong> dengan maksimal 1.000 data warga per upload.
        </p>

        <div class="rounded-lg border border-primary-100 bg-primary-50 p-3 text-xs text-primary-800">
          Unduh salah satu template di bawah ini, isi data warga, lalu unggah kembali file Excel atau CSV tersebut.
        </div>

        <div class="flex flex-col gap-2 pt-1">
          <div class="flex flex-wrap gap-2">
            <Button
              label="Download Template Excel (.xlsx)"
              icon="pi pi-file-excel"
              severity="success"
              outlined
              class="rounded-lg text-xs"
              @click="downloadCitizenImportTemplateExcel"
            />
            <Button
              label="Download Template CSV"
              icon="pi pi-download"
              severity="secondary"
              outlined
              class="rounded-lg text-xs"
              @click="downloadCitizenImportTemplateCsv"
            />
          </div>
          <Button
            label="Pilih File (Excel / CSV)"
            icon="pi pi-upload"
            class="mt-2 w-full rounded-lg"
            @click="chooseImportFile"
          />
        </div>
      </div>

      <template #footer>
        <Button
          label="Batal"
          severity="secondary"
          outlined
          class="rounded-lg"
          @click="importDialogVisible = false"
        />
      </template>
    </Dialog>

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
          label="Download Excel Lengkap"
          icon="pi pi-file-excel"
          severity="success"
          outlined
          class="rounded-lg border border-green-600 bg-white px-3.5 py-2 text-[13px] font-medium text-green-700 hover:bg-green-50"
          @click="exportAllCitizensToExcel"
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
              <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Nomor Telepon/WA</span>
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

          <div class="mt-1 flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div class="text-[12px] font-semibold text-neutral-700">Anggota dalam KK</div>
                <div class="text-[11px] text-neutral-500">
                  {{ familyMembers.length ? `${familyMembers.length} anggota terdaftar pada KK ini` : 'Belum ada anggota lain yang terdaftar pada KK ini' }}
                </div>
              </div>
              <span class="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-neutral-500">
                KK {{ selectedDetailResident.familyCardNumber || '-' }}
              </span>
            </div>

            <div v-if="familyMembers.length" class="flex flex-col gap-2">
              <button
                v-for="(member, index) in familyMembers"
                :key="member.id"
                type="button"
                class="flex w-full items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-left transition hover:border-primary-300 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-200"
                @click="viewDetail(member)"
              >
                <span class="flex min-w-0 items-center gap-3">
                  <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-semibold text-primary-700">
                    {{ index + 1 }}
                  </span>
                  <span class="min-w-0">
                    <span class="block truncate text-[13px] font-semibold text-neutral-800">{{ member.name || '-' }}</span>
                    <span class="mt-0.5 block truncate text-[11px] text-neutral-500">
                      {{ member.nationalId || '-' }} · {{ member.familyRelationship || 'Hubungan belum diisi' }}
                    </span>
                  </span>
                </span>
                <i class="pi pi-chevron-right shrink-0 text-xs text-neutral-400" />
              </button>
            </div>

            <div v-else class="rounded-lg border border-dashed border-neutral-300 bg-white px-3 py-3 text-[12px] text-neutral-500">
              Nomor KK warga ini belum memiliki anggota lain yang bisa ditampilkan.
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

        <CitizenDocumentsPanel
          v-if="selectedDetailResident?.id"
          :citizen-id="selectedDetailResident.id"
          :manage="true"
        />

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
