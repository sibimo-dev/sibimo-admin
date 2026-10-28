<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { createCitizen, deleteCitizen as removeCitizen, getCitizen, getCitizens, getRecordEventCounters, updateCitizen } from '@/services/citizen.service'
import { updateListCache } from '@/services/list-cache'

import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import AutoComplete from 'primevue/autocomplete'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import CitizenDocumentsPanel from '@/components/citizen/CitizenDocumentsPanel.vue'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()

const citizenId = computed(() => route.params.id ?? null)
const isEditMode = computed(() => citizenId.value !== null)

const pageTitle = computed(() => (
  isEditMode.value ? 'Edit Data Warga' : 'Tambah Data Warga'
))

const mainButtonLabel = computed(() => (
  isEditMode.value ? 'Perbarui' : 'Simpan'
))

const genderOptions = [
  { value: 'Laki-laki', label: '1. Laki-laki' },
  { value: 'Perempuan', label: '2. Perempuan' },
]
const recordTypeOptions = ['PENDUDUK', 'MATI', 'PINDAH', 'ORANG LUAR']
const titleOptions = [
  { value: '1', label: '1. Gelar Akademis' },
  { value: '2', label: '2. Gelar Kebangsawanan' },
  { value: '3', label: '3. Gelar Keagamaan' },
]
const recordEventOptions = [
  { value: 'LAHIR', label: 'Lahir' },
  { value: 'DATANG', label: 'Datang' },
  { value: 'PINDAH', label: 'Pindah' },
  { value: 'MATI', label: 'Mati' },
]
const bloodTypeOptions = [
  { value: 'A', label: '1. A' }, { value: 'B', label: '2. B' },
  { value: 'AB', label: '3. AB' }, { value: 'O', label: '4. O' },
  { value: 'A-', label: '5. A-' }, { value: 'A+', label: '6. A+' },
  { value: 'B+', label: '7. B+' }, { value: 'B-', label: '8. B-' },
  { value: 'AB+', label: '9. AB+' }, { value: 'AB-', label: '10. AB-' },
  { value: 'O+', label: '11. O+' }, { value: 'O-', label: '12. O-' },
  { value: 'Tidak Tahu', label: '13. Tidak Tahu' },
]
const certificateOptions = [
  { value: 'Belum Ada', label: '1. Tidak Ada' },
  { value: 'Ada', label: '2. Ada' },
]
// No. 25 formulir: Kelainan Fisik dan Mental
const disabilityOptions = [
  { value: 'Tidak Ada', label: '1. Tidak Ada' },
  { value: 'Ada', label: '2. Ada' },
]
// No. 26 formulir: Penyandang Cacat (muncul bila no. 25 = Ada)
const disabilityTypeOptions = [
  { value: 'Cacat Fisik', label: '1. Cacat Fisik' },
  { value: 'Cacat Netra/Buta', label: '2. Cacat Netra/Buta' },
  { value: 'Cacat Rungu/Wicara', label: '3. Cacat Rungu/Wicara' },
  { value: 'Cacat Mental/Jiwa', label: '4. Cacat Mental/Jiwa' },
  { value: 'Cacat Fisik dan Mental', label: '5. Cacat Fisik dan Mental' },
  { value: 'Cacat Lainnya', label: '6. Cacat Lainnya' },
]
const nationalityOptions = ['WNI', 'WNA']
const educationOptions = [
  { value: 'Tidak Sekolah', label: '1. Tidak/Belum Sekolah' },
  { value: 'Belum Tamat SD/Sederajat', label: '2. Belum Tamat SD/Sederajat' },
  { value: 'Tamat SD/Sederajat', label: '3. Tamat SD/Sederajat' },
  { value: 'SMP', label: '4. SLTP/Sederajat' },
  { value: 'SMA/SMK', label: '5. SLTA/Sederajat' },
  { value: 'D1/D2', label: '6. Diploma I/II' },
  { value: 'D3', label: '7. Akademi/Diploma III/Sarjana Muda' },
  { value: 'S1', label: '8. Diploma IV/Strata I' },
  { value: 'S2', label: '9. Strata II' },
  { value: 'S3', label: '10. Strata III' },
]
const maritalStatusOptions = [
  { value: 'Belum Menikah', label: '1. Belum Kawin' },
  { value: 'Menikah', label: '2. Kawin' },
  { value: 'Cerai Hidup', label: '3. Cerai Hidup' },
  { value: 'Cerai Mati', label: '4. Cerai Mati' },
]
const religionOptions = [
  { value: 'Islam', label: '1. Islam' }, { value: 'Kristen', label: '2. Kristen' },
  { value: 'Katolik', label: '3. Katolik' }, { value: 'Hindu', label: '4. Hindu' },
  { value: 'Buddha', label: '5. Budha' }, { value: 'Konghucu', label: '6. Kong Hu Cu' },
  { value: 'Kepercayaan Terhadap Tuhan Yang Maha Esa', label: '7. Kepercayaan Terhadap Tuhan Yang Maha Esa' },
]
const statusOptions = [
  { label: 'Active', value: 'Active' },
  { label: 'Pindah', value: 'Pindah' },
]

const fullName = ref('')
const recordType = ref('PENDUDUK')
const recordEventType = ref('LAHIR')
const recordEvent = ref('Lahir01')
const recordEventCounters = ref([])
const recordEventLoading = ref(false)
const recordEventPreview = computed(() => {
  const current = recordEventCounters.value.find(item => item.type === recordEventType.value)
  return isEditMode.value && recordEvent.value ? recordEvent.value : current?.next_code ?? 'Nomor otomatis saat disimpan'
})
const titleCode = ref('')
const nationalId = ref('')
const familyCardNumber = ref('')
const dusun = ref('')
const rt = ref('')
const rw = ref('')
const rtHeadName = ref('')
const rwHeadName = ref('')
const gender = ref('Laki-laki')
const birthPlace = ref('')
const birthDate = ref(null)
const age = computed(() => calculateAge(birthDate.value))
const birthCertificateStatus = ref('')
const birthCertificateNumber = ref('')
const bloodType = ref('')
const phoneNumber = ref('')
const address = ref('')
const occupation = ref('')
const education = ref('SMA/SMK')
const maritalStatus = ref('Belum Menikah')
const marriageCertificateStatus = ref('')
const marriageCertificateNumber = ref('')
const marriageDate = ref(null)
const divorceCertificateStatus = ref('')
const divorceCertificateNumber = ref('')
const divorceDate = ref(null)
const familyRelationship = ref('')
const physicalDisability = ref('') // keterangan, hanya untuk "Cacat Lainnya"
const disabilityStatus = ref('')   // no. 25
const disabilityType = ref('')     // no. 26
const religion = ref('Islam')
const beliefOrganization = ref('')
const motherNationalId = ref('')
const motherName = ref('')
const fatherNationalId = ref('')
const fatherName = ref('')
const nationality = ref('WNI')
const ktpAddress = ref('')
const previousAddress = ref('')
const passportNumber = ref('')
const passportExpiryDate = ref(null)

const status = ref('Active')
const statusOpen = ref(true)

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
// Sumber data anggota KK untuk autofill saat mencatat peristiwa Lahir.
const citizenLookup = ref([])

// Pop up berhasil simpan
const successDialog = ref(false)
const successInfo = ref({ title: '', detail: '' })

function closeSuccessDialog() {
  successDialog.value = false
  router.push({ name: 'citizen-list' })
}

const familyCardMembers = computed(() => {
  const kk = String(familyCardNumber.value ?? '').trim()
  if (!/^\d{16}$/.test(kk)) return []
  return citizenLookup.value.filter((citizen) => (
    String(citizen.family_card_number ?? '') === kk
    && citizen.status !== 'Pindah'
  ))
})
const familyCardHead = computed(() => familyCardMembers.value.find((citizen) => /kepala|kk/i.test(String(citizen.family_relationship ?? ''))) ?? familyCardMembers.value[0] ?? null)
const familyCardAutoFillVisible = computed(() => !isEditMode.value && recordEventType.value === 'LAHIR' && familyCardMembers.value.length > 0)
let lastAutoFilledFamilyCard = ''

function applyBirthFamilyCardData() {
  const kk = String(familyCardNumber.value ?? '').trim()
  if (isEditMode.value || recordEventType.value !== 'LAHIR' || !/^\d{16}$/.test(kk) || !familyCardMembers.value.length) return
  if (lastAutoFilledFamilyCard === kk) return

  const source = familyCardHead.value
  const father = familyCardMembers.value.find((citizen) => citizen.gender === 'Laki-laki' && /kepala|suami/i.test(String(citizen.family_relationship ?? '')))
    ?? familyCardMembers.value.find((citizen) => citizen.gender === 'Laki-laki')
  const mother = familyCardMembers.value.find((citizen) => citizen.gender === 'Perempuan' && /istri/i.test(String(citizen.family_relationship ?? '')))
    ?? familyCardMembers.value.find((citizen) => citizen.gender === 'Perempuan')

  // Data alamat dan wilayah mengikuti anggota KK yang sudah tercatat.
  dusun.value = source?.dusun ?? ''
  rt.value = source?.rt ?? ''
  rw.value = source?.rw ?? ''
  rtHeadName.value = source?.rt_head_name ?? ''
  rwHeadName.value = source?.rw_head_name ?? ''
  address.value = source?.address ?? ''
  ktpAddress.value = source?.ktp_address ?? source?.address ?? ''
  nationality.value = source?.nationality ?? nationality.value
  familyRelationship.value = 'Anak'

  // Saat pencatatan kelahiran, data orang tua diambil dari anggota KK.
  motherNationalId.value = mother?.national_id ?? ''
  motherName.value = mother?.full_name ?? ''
  fatherNationalId.value = father?.national_id ?? ''
  fatherName.value = father?.full_name ?? ''
  lastAutoFilledFamilyCard = kk
}

watch([familyCardNumber, recordEventType, citizenLookup], applyBirthFamilyCardData, { deep: true })

const familyRelationshipOptions = [
  { value: 'Kepala Keluarga', label: '1. Kepala Keluarga' },
  { value: 'Suami', label: '2. Suami' }, { value: 'Istri', label: '3. Istri' },
  { value: 'Anak', label: '4. Anak' }, { value: 'Menantu', label: '5. Menantu' },
  { value: 'Cucu', label: '6. Cucu' }, { value: 'Orang Tua', label: '7. Orang Tua' },
  { value: 'Mertua', label: '8. Mertua' }, { value: 'Famili Lain', label: '9. Famili Lain' },
  { value: 'Pembantu', label: '10. Pembantu' }, { value: 'Lainnya', label: '11. Lainnya' },
]
const occupationCatalog = [
  '1. Belum/Tidak Bekerja', '2. Mengurus Rumah Tangga', '3. Pelajar/Mahasiswa', '4. Pensiunan',
  '5. Pegawai Negeri Sipil (PNS)', '6. Tentara Nasional Indonesia (TNI)', '7. Kepolisian RI (POLRI)',
  '8. Perdagangan', '9. Petani/Pekebun', '10. Peternak', '11. Nelayan/Perikanan', '12. Industri',
  '13. Konstruksi', '14. Transportasi', '15. Karyawan Swasta', '16. Karyawan BUMN', '17. Karyawan BUMD',
  '18. Karyawan Honorer', '19. Buruh Harian Lepas', '20. Buruh Tani/Perkebunan', '21. Buruh Nelayan/Perikanan',
  '22. Buruh Peternakan', '23. Pembantu Rumah Tangga', '24. Tukang Cukur', '25. Tukang Listrik',
  '26. Tukang Batu', '27. Tukang Kayu', '28. Tukang Sol Sepatu', '29. Tukang Las/Pandai Besi',
  '30. Tukang Jahit', '31. Tukang Gigi', '32. Penata Rias', '33. Penata Busana', '34. Penata Rambut',
  '35. Mekanik', '36. Seniman', '37. Tabib', '38. Paraji', '39. Perancang Busana', '40. Penterjemah',
  '41. Imam Masjid', '42. Pendeta', '43. Pastor', '44. Wartawan', '45. Ustadz/Mubaligh', '46. Juru Masak',
  '47. Promotor Acara', '48. Anggota DPR-RI', '49. Anggota DPD', '50. Anggota BPK', '51. Presiden',
  '52. Wakil Presiden', '53. Anggota Mahkamah Konstitusi', '54. Anggota Kabinet/Kementrian', '55. Duta Besar',
  '56. Gubernur', '57. Wakil Gubernur', '58. Bupati', '59. Wakil Bupati', '60. Walikota', '61. Wakil walikota',
  '62. Anggota DPRD Prov.', '63. Anggota DPRD Kab./Kota', '64. Dosen', '65. Guru', '66. Pilot', '67. Pengacara',
  '68. Notaris', '69. Arsitek', '70. Akuntan', '71. Konsultan', '72. Dokter', '73. Bidan', '74. Perawat',
  '75. Apoteker', '76. Psikiater/Psikolog', '77. Penyiar Televisi', '78. Penyiar Radio', '79. Pelaut',
  '80. Peneliti', '81. Sopir', '82. Pialang', '83. Paranormal', '84. Pedagang', '85. Perangkat Desa',
  '86. Kepala desa', '87. Biarawati', '88. Wiraswasta', '89. Lainnya, Sebutkan', '90. Hakim', '91. Biarawan',
]
const occupationSuggestions = ref([])
function searchOccupation(event) {
  const query = String(event.query ?? '').trim().toLowerCase()
  occupationSuggestions.value = occupationCatalog.filter(option => !query || option.toLowerCase().includes(query))
}

const hasValid16Digits = value => /^\d{16}$/.test(String(value ?? ''))

const nationalIdInvalid = computed(() => nationalId.value !== '' && !hasValid16Digits(nationalId.value))
const familyCardInvalid = computed(() => familyCardNumber.value !== '' && !hasValid16Digits(familyCardNumber.value))
const birthCertificateNumberDisabled = computed(() => birthCertificateStatus.value !== 'Ada')
const isNeverMarried = computed(() => maritalStatus.value === 'Belum Menikah')
const isDivorced = computed(() => ['Cerai Hidup', 'Cerai Mati'].includes(maritalStatus.value))
const marriageDataDisabled = computed(() => isNeverMarried.value)
const divorceDataDisabled = computed(() => !isDivorced.value)

watch(maritalStatus, (value) => {
  if (value === 'Belum Menikah') {
    marriageCertificateStatus.value = ''
    marriageCertificateNumber.value = ''
    marriageDate.value = null
  }
  if (!['Cerai Hidup', 'Cerai Mati'].includes(value)) {
    divorceCertificateStatus.value = ''
    divorceCertificateNumber.value = ''
    divorceDate.value = null
  }
})

watch(birthCertificateStatus, (value) => {
  if (value !== 'Ada') birthCertificateNumber.value = ''
})

// No. 25 bukan "Ada" -> no. 26 dan keterangan dikosongkan
watch(disabilityStatus, (value) => {
  if (value !== 'Ada') {
    disabilityType.value = ''
    physicalDisability.value = ''
  }
})

// No. 26 bukan "Cacat Lainnya" -> keterangan dikosongkan
watch(disabilityType, (value) => {
  if (value !== 'Cacat Lainnya') physicalDisability.value = ''
})

const statusLabelMap = {
  Active: 'Active',
  Pindah: 'Pindah',
}

const statusDisplay = computed(() => (
  statusLabelMap[status.value] ?? status.value
))

// Helper: format Date object -> 'YYYY-MM-DD' buat dikirim ke backend
function toApiDate(date) {
  if (!date) return null
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date

  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return null

  const pad = value => String(value).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function fromApiDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function eventTypeFromCode(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized.startsWith('datang')) return 'DATANG'
  if (normalized.startsWith('pindah')) return 'PINDAH'
  if (normalized.startsWith('mati')) return 'MATI'
  return 'LAHIR'
}

async function fetchRecordEventCounters() {
  recordEventLoading.value = true
  try {
    recordEventCounters.value = await getRecordEventCounters(new Date().getFullYear())
  } catch {
    recordEventCounters.value = []
  } finally {
    recordEventLoading.value = false
  }
}

function calculateAge(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null

  const today = new Date()
  if (date > today) return null

  let years = today.getFullYear() - date.getFullYear()
  const birthdayHasPassed = (
    today.getMonth() > date.getMonth()
    || (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate())
  )

  if (!birthdayHasPassed) years -= 1

  return Math.max(years, 0)
}

// Ambil data asli dari API
async function fetchCitizenDetail() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await getCitizen(citizenId.value)

    recordType.value = data.record_type ?? 'PENDUDUK'
    recordEvent.value = data.record_event ?? 'Lahir01'
    recordEventType.value = eventTypeFromCode(recordEvent.value)
    titleCode.value = data.title_code ?? ''
    fullName.value = data.full_name ?? ''
    nationalId.value = data.national_id ?? ''
    familyCardNumber.value = data.family_card_number ?? ''
    dusun.value = data.dusun ?? ''
    rt.value = data.rt ?? ''
    rw.value = data.rw ?? ''
    rtHeadName.value = data.rt_head_name ?? ''
    rwHeadName.value = data.rw_head_name ?? ''
    gender.value = data.gender ?? 'Laki-laki'
    birthPlace.value = data.birth_place ?? ''
    birthDate.value = fromApiDate(data.birth_date)
    birthCertificateStatus.value = data.birth_certificate_status ?? ''
    birthCertificateNumber.value = data.birth_certificate_number ?? ''
    bloodType.value = data.blood_type ?? ''
    phoneNumber.value = data.phone_number ?? ''
    address.value = data.address ?? ''
    occupation.value = data.occupation ?? ''
    education.value = data.education ?? 'SMA/SMK'
    maritalStatus.value = data.marital_status ?? 'Belum Menikah'
    marriageCertificateStatus.value = data.marriage_certificate_status ?? ''
    marriageCertificateNumber.value = data.marriage_certificate_number ?? ''
    marriageDate.value = fromApiDate(data.marriage_date)
    divorceCertificateStatus.value = data.divorce_certificate_status ?? ''
    divorceCertificateNumber.value = data.divorce_certificate_number ?? ''
    divorceDate.value = fromApiDate(data.divorce_date)
    familyRelationship.value = data.family_relationship ?? ''
    physicalDisability.value = data.physical_disability ?? ''
    disabilityStatus.value = data.disability_status ?? ''
    disabilityType.value = data.disability_type ?? ''
    religion.value = data.religion ?? 'Islam'
    beliefOrganization.value = data.belief_organization ?? ''
    motherNationalId.value = data.mother_national_id ?? ''
    motherName.value = data.mother_name ?? ''
    fatherNationalId.value = data.father_national_id ?? ''
    fatherName.value = data.father_name ?? ''
    nationality.value = data.nationality ?? 'WNI'
    ktpAddress.value = data.ktp_address ?? data.address ?? ''
    previousAddress.value = data.previous_address ?? ''
    passportNumber.value = data.passport_number ?? ''
    passportExpiryDate.value = fromApiDate(data.passport_expiry_date)
    status.value = data.status ?? 'Active'
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Gagal memuat detail data warga.'
  } finally {
    loading.value = false
  }
}

async function fetchCitizenLookup() {
  if (isEditMode.value) return

  try {
    const data = await getCitizens()
    citizenLookup.value = Array.isArray(data) ? data : []
  } catch {
    // Form tetap dapat diisi manual bila daftar warga gagal dimuat.
    citizenLookup.value = []
  }
}

onMounted(() => {
  fetchRecordEventCounters()
  fetchCitizenLookup()
  if (isEditMode.value) fetchCitizenDetail()
})

function goBack() {
  router.push({ name: 'citizen-list' })
}

// Kirim ke API (POST buat tambah baru, PUT buat update)
async function saveCitizen() {
  saving.value = true
  errorMessage.value = ''

  if (!hasValid16Digits(nationalId.value)) {
    errorMessage.value = 'NIK harus tepat 16 digit angka.'
    saving.value = false
    return
  }
  if (familyCardNumber.value && !hasValid16Digits(familyCardNumber.value)) {
    errorMessage.value = 'Nomor KK harus tepat 16 digit angka.'
    saving.value = false
    return
  }

  const payload = {
    record_type: recordType.value,
    record_event: recordEvent.value,
    record_event_type: recordEventType.value,
    title_code: titleCode.value,
    full_name: fullName.value,
    national_id: nationalId.value,
    family_card_number: familyCardNumber.value,
    dusun: dusun.value,
    rt: rt.value,
    rw: rw.value,
    rt_head_name: rtHeadName.value,
    rw_head_name: rwHeadName.value,
    gender: gender.value,
    birth_place: birthPlace.value,
    birth_date: toApiDate(birthDate.value),
    age: age.value,
    birth_certificate_status: birthCertificateStatus.value,
    birth_certificate_number: birthCertificateNumber.value,
    blood_type: bloodType.value,
    phone_number: phoneNumber.value,
    address: address.value,
    occupation: occupation.value,
    education: education.value,
    marital_status: maritalStatus.value,
    marriage_certificate_status: marriageCertificateStatus.value,
    marriage_certificate_number: marriageCertificateNumber.value,
    marriage_date: toApiDate(marriageDate.value),
    divorce_certificate_status: divorceCertificateStatus.value,
    divorce_certificate_number: divorceCertificateNumber.value,
    divorce_date: toApiDate(divorceDate.value),
    family_relationship: familyRelationship.value,
    physical_disability: physicalDisability.value,
    disability_status: disabilityStatus.value,
    disability_type: disabilityType.value,
    religion: religion.value,
    belief_organization: beliefOrganization.value,
    mother_national_id: motherNationalId.value,
    mother_name: motherName.value,
    father_national_id: fatherNationalId.value,
    father_name: fatherName.value,
    nationality: nationality.value,
    ktp_address: ktpAddress.value,
    previous_address: previousAddress.value,
    passport_number: passportNumber.value,
    passport_expiry_date: toApiDate(passportExpiryDate.value),
    status: status.value,
  }

  try {
    const saved = isEditMode.value
      ? await updateCitizen(citizenId.value, payload)
      : await createCitizen(payload)

    updateListCache('citizens', items => {
      if (isEditMode.value) {
        return items.map(item => item.citizen_id === Number(citizenId.value)
          ? { ...item, ...saved }
          : item)
      }

      return [saved, ...items]
    })

    // Pop up di tengah layar; pindah halaman baru setelah pengguna menekan OK
    successInfo.value = {
      title: isEditMode.value ? 'Data warga berhasil diperbarui' : 'Data warga berhasil disimpan',
      detail: isEditMode.value
        ? `${fullName.value} berhasil diperbarui.`
        : `${fullName.value} berhasil ditambahkan ke data warga.`,
    }
    successDialog.value = true
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Gagal menyimpan data warga.'
  } finally {
    saving.value = false
  }
}

// Hapus lewat API
function deleteCitizen() {
  confirm.require({
    message: `Hapus data warga "${fullName.value}" dengan NIK "${nationalId.value}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await removeCitizen(citizenId.value)
        router.push({ name: 'citizen-list' })
      } catch (err) {
        errorMessage.value = err.response?.data?.message || 'Gagal menghapus data warga.'
      }
    },
  })
}
</script>

<template>
  <div>

    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 class="m-0 text-2xl font-bold text-primary-900">
        {{ pageTitle }}
      </h1>

      <Button
        label="Kembali ke Daftar Warga"
        icon="pi pi-arrow-left"
        severity="secondary"
        outlined
        class="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
        @click="goBack"
      />
    </div>

    <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">

      <div class="flex flex-col gap-5">

        <!-- ============ IDENTITAS POKOK ============ -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2 text-[15px] font-semibold text-neutral-800">
              <i class="pi pi-id-card text-primary-500" />
              Identitas Pokok
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-5">

              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="fullName">
                  Nama Lengkap
                </label>
                <InputText
                  id="fullName"
                  v-model="fullName"
                  placeholder="Nama lengkap warga"
                  class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                />
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="titleCode">Gelar</label>
                <Select id="titleCode" v-model="titleCode" :options="titleOptions" optionLabel="label" optionValue="value" placeholder="Pilih gelar bila ada" class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800" :pt="{ label: { class: 'px-3 py-2.5' } }" />
              </div>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="recordType">Jenis Data</label>
                  <Select
                    id="recordType"
                    v-model="recordType"
                    :options="recordTypeOptions"
                    class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800"
                    :pt="{ label: { class: 'px-3 py-2.5' } }"
                  />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="recordEvent">Peristiwa</label>
                  <Select
                    id="recordEvent"
                    v-model="recordEventType"
                    :options="recordEventOptions"
                    optionLabel="label"
                    optionValue="value"
                    :loading="recordEventLoading"
                    class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800"
                    :pt="{ label: { class: 'px-3 py-2.5' } }"
                  />
                  <small class="text-xs text-neutral-500">Nomor berikutnya: <b>{{ recordEventPreview }}</b> (otomatis per tahun)</small>
                  <div v-if="recordEventCounters.length" class="grid grid-cols-2 gap-1 text-[11px] text-neutral-500">
                    <span v-for="item in recordEventCounters" :key="item.type">
                      {{ item.label }} terakhir: <b>{{ item.last_number ? `${item.label}${String(item.last_number).padStart(2, '0')}` : 'Belum ada' }}</b>
                    </span>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="nationalId">
                    NIK
                  </label>
                  <InputText
                    id="nationalId"
                    v-model="nationalId"
                    maxlength="16"
                    inputmode="numeric"
                    placeholder="16 digit NIK"
                    :invalid="nationalIdInvalid"
                    aria-describedby="nationalId-help"
                    :class="['w-full rounded-lg border bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none transition focus:ring-4', nationalIdInvalid ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-100']"
                  />
                  <small id="nationalId-help" class="text-xs" :class="nationalIdInvalid ? 'text-red-600' : 'text-neutral-500'">
                    {{ nationalIdInvalid ? 'NIK harus tepat 16 digit angka.' : 'Masukkan 16 digit angka.' }}
                  </small>
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="familyCardNumber">
                    Nomor KK
                  </label>
                  <InputText
                    id="familyCardNumber"
                    v-model="familyCardNumber"
                    maxlength="16"
                    inputmode="numeric"
                    placeholder="16 digit nomor KK"
                    :invalid="familyCardInvalid"
                    aria-describedby="familyCardNumber-help"
                    :class="['w-full rounded-lg border bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none transition focus:ring-4', familyCardInvalid ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-100']"
                  />
                  <small id="familyCardNumber-help" class="text-xs" :class="familyCardInvalid ? 'text-red-600' : 'text-neutral-500'">
                    {{ familyCardInvalid ? 'Nomor KK harus tepat 16 digit angka.' : 'Masukkan 16 digit angka.' }}
                  </small>
                </div>
              </div>

              <div v-if="familyCardAutoFillVisible" class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
                <div class="flex items-center gap-2 font-semibold">
                  <i class="pi pi-bolt" /> Data KK ditemukan dan isian terkait sudah diisi otomatis.
                </div>
                <div class="mt-1">{{ familyCardMembers.length }} anggota KK terdaftar, termasuk {{ familyCardHead?.full_name || 'kepala keluarga' }}.</div>
              </div>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="gender">
                    Jenis Kelamin
                  </label>
                  <Select
                    id="gender"
                    v-model="gender"
                    :options="genderOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                    :pt="{ label: { class: 'px-3 py-2.5' } }"
                  />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="nationality">Kewarganegaraan</label>
                  <Select
                    id="nationality"
                    v-model="nationality"
                    :options="nationalityOptions"
                    class="w-full rounded-lg border border-neutral-300 bg-white text-[13px]"
                    :pt="{ label: { class: 'px-3 py-2.5' } }"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="birthPlace">
                    Tempat Lahir
                  </label>
                  <InputText
                    id="birthPlace"
                    v-model="birthPlace"
                    placeholder="Tempat lahir"
                    class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="birthDate">
                    Tanggal Lahir
                  </label>
                  <DatePicker
                    id="birthDate"
                    v-model="birthDate"
                    dateFormat="dd/mm/yy"
                    :manualInput="true"
                    showIcon
                    iconDisplay="input"
                    class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                    :pt="{ pcInputText: { root: { class: 'w-full px-3 py-2.5' } } }"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="age">Umur (otomatis)</label>
                  <InputText id="age" :model-value="age ?? ''" type="number" readonly placeholder="Otomatis dari tanggal lahir" class="w-full rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2.5 text-[13px]" />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="bloodType">Golongan Darah</label>
                  <Select id="bloodType" v-model="bloodType" :options="bloodTypeOptions" optionLabel="label" optionValue="value" placeholder="Pilih golongan darah" class="w-full rounded-lg border border-neutral-300 bg-white text-[13px]" :pt="{ label: { class: 'px-3 py-2.5' } }" />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="religion">Agama</label>
                  <Select
                    id="religion"
                    v-model="religion"
                    :options="religionOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                    :pt="{ label: { class: 'px-3 py-2.5' } }"
                  />
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="birthCertificateStatus">Akta Lahir</label>
                <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Select id="birthCertificateStatus" v-model="birthCertificateStatus" :options="certificateOptions" optionLabel="label" optionValue="value" placeholder="Pilih status" class="w-full rounded-lg border border-neutral-300 bg-white text-[13px]" :pt="{ label: { class: 'px-3 py-2.5' } }" />
                  <InputText id="birthCertificateNumber" v-model="birthCertificateNumber" :disabled="birthCertificateNumberDisabled" placeholder="Nomor akta lahir" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] disabled:bg-neutral-100 disabled:text-neutral-400" />
                </div>
              </div>

              <div v-if="religion === 'Kepercayaan Terhadap Tuhan Yang Maha Esa'" class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="beliefOrganization">Organisasi Kepercayaan</label>
                <InputText id="beliefOrganization" v-model="beliefOrganization" placeholder="Nama organisasi kepercayaan" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
              </div>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="passportNumber">Nomor Paspor</label>
                  <InputText id="passportNumber" v-model="passportNumber" placeholder="Nomor paspor bila ada" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="passportExpiryDate">Tanggal Berakhir Paspor</label>
                  <DatePicker id="passportExpiryDate" v-model="passportExpiryDate" dateFormat="dd/mm/yy" :manualInput="true" showIcon iconDisplay="input" placeholder="dd/mm/yyyy" class="w-full rounded-lg border border-neutral-300 bg-white text-[13px]" :pt="{ pcInputText: { root: { class: 'w-full px-3 py-2.5' } } }" />
                </div>
              </div>

            </div>
          </template>
        </Card>

        <!-- ============ ALAMAT & DOMISILI ============ -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2 text-[15px] font-semibold text-neutral-800">
              <i class="pi pi-map-marker text-primary-500" />
              Alamat & Domisili
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-5">

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="dusun">Dusun</label>
                  <InputText id="dusun" v-model="dusun" placeholder="Nama dusun" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="rt">RT</label>
                  <InputText id="rt" v-model="rt" placeholder="RT" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="rw">RW</label>
                  <InputText id="rw" v-model="rw" placeholder="RW" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
                </div>
              </div>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="rtHeadName">Nama Ketua RT</label>
                  <InputText id="rtHeadName" v-model="rtHeadName" placeholder="Nama Ketua RT" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="rwHeadName">Nama Ketua RW</label>
                  <InputText id="rwHeadName" v-model="rwHeadName" placeholder="Nama Ketua RW" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="address">
                  Alamat
                </label>
                <Textarea
                  id="address"
                  v-model="address"
                  rows="3"
                  placeholder="Alamat lengkap warga"
                  class="w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                />
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="ktpAddress">
                  Alamat sesuai KTP
                </label>
                <Textarea
                  id="ktpAddress"
                  v-model="ktpAddress"
                  rows="3"
                  placeholder="Alamat lengkap sesuai KTP"
                  class="w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                />
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="previousAddress">Alamat Sebelumnya</label>
                <Textarea id="previousAddress" v-model="previousAddress" rows="3" placeholder="Alamat tetap terakhir sebelum tinggal sekarang" class="w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
              </div>

            </div>
          </template>
        </Card>

        <!-- ============ KONTAK, PENDIDIKAN & PEKERJAAN ============ -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2 text-[15px] font-semibold text-neutral-800">
              <i class="pi pi-briefcase text-primary-500" />
              Kontak, Pendidikan & Pekerjaan
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-5">

              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="phoneNumber">
                  Nomor Telepon/WA
                </label>
                <InputText
                  id="phoneNumber"
                  v-model="phoneNumber"
                  inputmode="tel"
                  placeholder="08xxxxxxxxxx"
                  class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                />
              </div>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="occupation">
                    Pekerjaan
                  </label>
                  <AutoComplete
                    id="occupation"
                    v-model="occupation"
                    :suggestions="occupationSuggestions"
                    dropdown
                    :forceSelection="false"
                    placeholder="Cari pekerjaan atau kode"
                    class="w-full"
                    inputClass="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]"
                    @complete="searchOccupation"
                  />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="education">
                    Pendidikan
                  </label>
                  <Select
                    id="education"
                    v-model="education"
                    :options="educationOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                    :pt="{ label: { class: 'px-3 py-2.5' } }"
                  />
                </div>
              </div>

            </div>
          </template>
        </Card>

        <!-- ============ STATUS PERNIKAHAN ============ -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2 text-[15px] font-semibold text-neutral-800">
              <i class="pi pi-heart text-primary-500" />
              Status Pernikahan
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-5">

              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="maritalStatus">
                  Status Pernikahan
                </label>
                <Select
                  id="maritalStatus"
                  v-model="maritalStatus"
                  :options="maritalStatusOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  :pt="{ label: { class: 'px-3 py-2.5' } }"
                />
              </div>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="marriageCertificateStatus">Akta Kawin</label>
                  <Select id="marriageCertificateStatus" v-model="marriageCertificateStatus" :options="certificateOptions" optionLabel="label" optionValue="value" placeholder="Pilih status" :disabled="marriageDataDisabled" class="w-full rounded-lg border border-neutral-300 bg-white text-[13px]" :pt="{ label: { class: 'px-3 py-2.5' } }" />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="marriageCertificateNumber">Nomor Akta Kawin</label>
                  <InputText id="marriageCertificateNumber" v-model="marriageCertificateNumber" :disabled="marriageDataDisabled" placeholder="Nomor akta kawin" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] disabled:bg-neutral-100 disabled:text-neutral-400" />
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="marriageDate">Tanggal Kawin</label>
                <DatePicker id="marriageDate" v-model="marriageDate" :disabled="marriageDataDisabled" dateFormat="dd/mm/yy" :manualInput="true" showIcon iconDisplay="input" class="w-full rounded-lg border border-neutral-300 bg-white text-[13px]" :pt="{ pcInputText: { root: { class: 'w-full px-3 py-2.5' } } }" />
              </div>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="divorceCertificateStatus">Akta Cerai</label>
                  <Select id="divorceCertificateStatus" v-model="divorceCertificateStatus" :options="certificateOptions" optionLabel="label" optionValue="value" placeholder="Pilih status" :disabled="divorceDataDisabled" class="w-full rounded-lg border border-neutral-300 bg-white text-[13px]" :pt="{ label: { class: 'px-3 py-2.5' } }" />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="divorceCertificateNumber">Nomor Akta Cerai</label>
                  <InputText id="divorceCertificateNumber" v-model="divorceCertificateNumber" :disabled="divorceDataDisabled" placeholder="Nomor akta cerai" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] disabled:bg-neutral-100 disabled:text-neutral-400" />
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="divorceDate">Tanggal Cerai</label>
                <DatePicker id="divorceDate" v-model="divorceDate" :disabled="divorceDataDisabled" dateFormat="dd/mm/yy" :manualInput="true" showIcon iconDisplay="input" class="w-full rounded-lg border border-neutral-300 bg-white text-[13px]" :pt="{ pcInputText: { root: { class: 'w-full px-3 py-2.5' } } }" />
              </div>

            </div>
          </template>
        </Card>

        <!-- ============ DATA KELUARGA ============ -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2 text-[15px] font-semibold text-neutral-800">
              <i class="pi pi-users text-primary-500" />
              Data Keluarga
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-5">

              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="familyRelationship">Hubungan Dalam Keluarga</label>
                <Select id="familyRelationship" v-model="familyRelationship" :options="familyRelationshipOptions" optionLabel="label" optionValue="value" placeholder="Pilih hubungan" class="w-full rounded-lg border border-neutral-300 bg-white text-[13px]" :pt="{ label: { class: 'px-3 py-2.5' } }" />
              </div>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="motherName">Nama Lengkap Ibu</label>
                  <InputText id="motherName" v-model="motherName" placeholder="Nama ibu" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="motherNationalId">NIK Ibu</label>
                  <InputText id="motherNationalId" v-model="motherNationalId" maxlength="16" inputmode="numeric" placeholder="NIK ibu" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="fatherName">Nama Lengkap Ayah</label>
                  <InputText id="fatherName" v-model="fatherName" placeholder="Nama ayah" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-[13px] font-semibold text-neutral-700" for="fatherNationalId">NIK Ayah</label>
                  <InputText id="fatherNationalId" v-model="fatherNationalId" maxlength="16" inputmode="numeric" placeholder="NIK ayah" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
                </div>
              </div>

            </div>
          </template>
        </Card>

        <!-- ============ KESEHATAN & DISABILITAS ============ -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2 text-[15px] font-semibold text-neutral-800">
              <i class="pi pi-heart-fill text-primary-500" />
              Kesehatan & Disabilitas
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-5">
              <!-- No. 25 -->
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="disabilityStatus">Kelainan Fisik dan Mental</label>
                <Select id="disabilityStatus" v-model="disabilityStatus" :options="disabilityOptions" optionLabel="label" optionValue="value" placeholder="Pilih status" class="w-full rounded-lg border border-neutral-300 bg-white text-[13px]" :pt="{ label: { class: 'px-3 py-2.5' } }" />
              </div>

              <!-- No. 26: muncul bila no. 25 = Ada -->
              <div v-if="disabilityStatus === 'Ada'" class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="disabilityType">Penyandang Cacat</label>
                <Select id="disabilityType" v-model="disabilityType" :options="disabilityTypeOptions" optionLabel="label" optionValue="value" placeholder="Pilih jenis cacat" class="w-full rounded-lg border border-neutral-300 bg-white text-[13px]" :pt="{ label: { class: 'px-3 py-2.5' } }" />
              </div>

              <!-- Keterangan: muncul bila no. 26 = Cacat Lainnya -->
              <div v-if="disabilityType === 'Cacat Lainnya'" class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="physicalDisability">Keterangan</label>
                <InputText id="physicalDisability" v-model="physicalDisability" placeholder="Sebutkan jenis cacat lainnya" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
              </div>
            </div>
          </template>
        </Card>

        <CitizenDocumentsPanel
          v-if="isEditMode && citizenId"
          :citizen-id="citizenId"
          :manage="true"
        />

      </div>

      <aside class="flex flex-col gap-5">

        <Card>
          <template #content>
            <div class="flex gap-2.5">
              <Button
                label="Batal"
                severity="secondary"
                outlined
                class="flex-1 rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
                @click="goBack"
              />

              <Button
                :label="mainButtonLabel"
                class="flex-1 rounded-lg border border-primary-500 bg-primary-500 px-3.5 py-2.5 text-[13px] font-medium text-white hover:bg-primary-600"
                @click="saveCitizen"
              />
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-2.5">
              <button
                type="button"
                class="flex items-center justify-between bg-transparent p-0 text-left text-[13px] text-neutral-700"
                @click="statusOpen = !statusOpen"
              >
                <span>
                  Status:
                  <strong>{{ statusDisplay }}</strong>
                </span>

                <i
                  class="pi pi-chevron-up text-[11px] text-neutral-400 transition-transform"
                  :class="statusOpen ? 'rotate-180' : ''"
                />
              </button>

              <div v-show="statusOpen" class="flex flex-col gap-1.5">
                <Select
                  v-model="status"
                  :options="statusOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  :pt="{ label: { class: 'px-3 py-2.5' } }"
                />
              </div>
            </div>
          </template>
        </Card>

        <Button
          v-if="isEditMode"
          label="Hapus Data Warga"
          icon="pi pi-trash"
          severity="secondary"
          outlined
          class="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
          @click="deleteCitizen"
        />

      </aside>
    </div>

    <!-- ============ POP UP BERHASIL SIMPAN ============ -->
    <Dialog
      v-model:visible="successDialog"
      modal
      :closable="false"
      :draggable="false"
      :dismissableMask="false"
      :style="{ width: '26rem' }"
      :pt="{ header: { class: 'hidden' }, content: { class: 'p-8' } }"
    >
      <div class="flex flex-col items-center gap-4 text-center">
        <div class="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <i class="pi pi-check-circle text-5xl text-green-600" />
        </div>
        <h2 class="m-0 text-xl font-bold text-neutral-800">{{ successInfo.title }}</h2>
        <p class="m-0 text-sm text-neutral-600">{{ successInfo.detail }}</p>
        <Button
          label="OK"
          class="mt-2 w-full rounded-lg border border-primary-500 bg-primary-500 px-3.5 py-2.5 text-[13px] font-medium text-white hover:bg-primary-600"
          autofocus
          @click="closeSuccessDialog"
        />
      </div>
    </Dialog>
  </div>
</template>
