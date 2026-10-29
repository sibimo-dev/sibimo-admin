<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { createCitizen, deleteCitizen as removeCitizen, getCitizen, getCitizens, updateCitizen } from '@/services/citizen.service'
import { updateListCache } from '@/services/list-cache'

import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import AutoComplete from 'primevue/autocomplete'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import CitizenDocumentsPanel from '@/components/citizen/CitizenDocumentsPanel.vue'
import CitizenPersonFields from '@/components/citizen/CitizenPersonFields.vue'

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

/* ------------------------------------------------------------------ */
/* Kelas Tailwind yang dipakai berulang                                */
/* ------------------------------------------------------------------ */
const labelClass = 'text-[13px] font-semibold text-neutral-700'
const inputClass = 'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:bg-neutral-100 disabled:text-neutral-400'
const readonlyInputClass = 'w-full rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2.5 text-[13px] text-neutral-700 outline-none'
const selectClass = 'w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 [&.p-disabled]:bg-neutral-100'
const selectPt = { label: { class: 'px-3 py-2.5' } }
const datePt = { pcInputText: { root: { class: 'w-full px-3 py-2.5' } } }
const outlineBtnClass = 'rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100'

/* ------------------------------------------------------------------ */
/* Opsi dropdown                                                       */
/* ------------------------------------------------------------------ */
const genderOptions = [
  { value: 'Laki-laki', label: '1. Laki-laki' },
  { value: 'Perempuan', label: '2. Perempuan' },
]
// Mati / Pindah sekarang diatur lewat Status, bukan Jenis Data.
const recordTypeOptions = ['PENDUDUK', 'ORANG LUAR']
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
const familyRelationshipOptions = [
  { value: 'Kepala Keluarga', label: '1. Kepala Keluarga' },
  { value: 'Suami', label: '2. Suami' }, { value: 'Istri', label: '3. Istri' },
  { value: 'Anak', label: '4. Anak' }, { value: 'Menantu', label: '5. Menantu' },
  { value: 'Cucu', label: '6. Cucu' }, { value: 'Orang Tua', label: '7. Orang Tua' },
  { value: 'Mertua', label: '8. Mertua' }, { value: 'Famili Lain', label: '9. Famili Lain' },
  { value: 'Pembantu', label: '10. Pembantu' }, { value: 'Lainnya', label: '11. Lainnya' },
]

// Catatan 6: peristiwa dihapus, diganti status (Hidup / Pindah / Mati).
// Nilai 'Active' dipertahankan supaya tetap cocok dengan data lama di backend.
const statusOptions = [
  { label: 'Hidup', value: 'Active' },
  { label: 'Pindah', value: 'Pindah' },
  { label: 'Mati', value: 'Mati' },
]
// Penomoran peristiwa (Lahir01, Pindah01, dst.) diturunkan dari status saat data baru dibuat.
const statusToEventType = { Active: 'LAHIR', Pindah: 'PINDAH', Mati: 'MATI' }

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

/* ------------------------------------------------------------------ */
/* Catatan 8 & 9: Dusun -> RW -> RT beserta ketua RT/RW                 */
/* Daftar dusun/RW/RT sesuai data kalurahan; NAMA KETUA masih dummy.    */
/* Ganti dengan data asli (mis. dari region.service.js) bila tersedia.  */
/* ------------------------------------------------------------------ */
const villageName = 'Kalurahan Bimomartani'
// 12 padukuhan Kalurahan Bimomartani beserta jumlah RW dan RT-nya
// (sumber: bimomartanisid.slemankab.go.id, "Kondisi Umum Kalurahan Bimomartani", data 2022).
// Format: [nama padukuhan, jumlah RW, jumlah RT]. Urutan ini dipakai untuk penomoran RW
// yang berlanjut antar padukuhan (contoh: Pondok Suruh = RW 14-16).
const dusunSeed = [
  ['Krebet', 2, 5], ['Rogobangsan', 2, 5], ['Kalibulus', 2, 4], ['Macanan', 2, 4],
  ['Cokrogaten', 3, 6], ['Koroulon Lor', 2, 5], ['Pondok Suruh', 3, 7], ['Balong', 2, 6],
  ['Banjarharjo', 3, 6], ['Kragilan', 2, 4], ['Sorasan', 2, 5], ['Koroulon Kidul', 2, 4],
]
const pad2 = n => String(n).padStart(2, '0')
let rwCounter = 0
const regionData = dusunSeed.map(([dusunName, rwCount, rtCount]) => {
  let rtCounter = 0
  const rws = Array.from({ length: rwCount }, (_, i) => {
    rwCounter += 1
    // RT dibagi rata antar RW; sisa dibagikan ke RW pertama. Nomor RT berlanjut dalam satu padukuhan.
    const total = Math.floor(rtCount / rwCount) + (i < rtCount % rwCount ? 1 : 0)
    const rts = Array.from({ length: total }, () => {
      rtCounter += 1
      return { rt: pad2(rtCounter), head: `Ketua RT ${pad2(rtCounter)} (dummy)` }
    })
    return { rw: pad2(rwCounter), head: `Ketua RW ${pad2(rwCounter)} (dummy)`, rts }
  })
  return { dusun: dusunName, rws }
}).sort((a, b) => a.dusun.localeCompare(b.dusun))

/* ------------------------------------------------------------------ */
/* State form                                                          */
/* ------------------------------------------------------------------ */
const fullName = ref('')
const recordType = ref('PENDUDUK')
const recordEvent = ref('') // hanya terisi saat edit (kode peristiwa asli)
const originalEventType = ref('LAHIR')
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
const nationality = ref('WNI')
const ktpAddressLoaded = ref('')   // alamat KTP dari data lama (mode edit)
const previousAddress = ref('')
const passportNumber = ref('')
const passportExpiryDate = ref(null)

const status = ref('Active')
const statusOpen = ref(true)

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
// Sumber data warga: untuk daftar anggota KK dan pencarian NIK orang tua.
const citizenLookup = ref([])

// Pop up berhasil simpan
const successDialog = ref(false)
const successInfo = ref({ title: '', detail: '' })

function closeSuccessDialog() {
  successDialog.value = false
  router.push({ name: 'citizen-list' })
}

const statusDisplay = computed(() => (
  statusOptions.find(item => item.value === status.value)?.label ?? status.value
))
const recordEventType = computed(() => (
  isEditMode.value ? originalEventType.value : (statusToEventType[status.value] ?? 'LAHIR')
))

/* ------------------------------------------------------------------ */
/* Validasi sederhana                                                  */
/* ------------------------------------------------------------------ */
const hasValid16Digits = value => /^\d{16}$/.test(String(value ?? ''))
const nationalIdInvalid = computed(() => nationalId.value !== '' && !hasValid16Digits(nationalId.value))
const familyCardInvalid = computed(() => familyCardNumber.value !== '' && !hasValid16Digits(familyCardNumber.value))
const familyCardValid = computed(() => hasValid16Digits(familyCardNumber.value))

/* ------------------------------------------------------------------ */
/* Catatan 1: Nomor KK -> daftar anggota keluarga                      */
/* ------------------------------------------------------------------ */
const familyCardMembers = computed(() => {
  const kk = String(familyCardNumber.value ?? '').trim()
  if (!/^\d{16}$/.test(kk)) return []
  return citizenLookup.value.filter(citizen => (
    String(citizen.family_card_number ?? '') === kk
    && citizen.status !== 'Pindah'
  ))
})
const familyCardHead = computed(() => (
  familyCardMembers.value.find(citizen => /kepala/i.test(String(citizen.family_relationship ?? '')))
  ?? familyCardMembers.value[0]
  ?? null
))

/* ------------------------------------------------------------------ */
/* Catatan 3, 4, 12: data orang tua lengkap, cari lewat NIK            */
/* ------------------------------------------------------------------ */
const newParent = () => ({
  nationalId: '',
  fullName: '',
  birthPlace: '',
  birthDate: null,
  occupation: '',
  religion: '',
  nationality: 'WNI',
  address: '',
  fromRegistry: false, // true = data diambil dari data warga, hanya NIK yang bisa diubah
})
const father = reactive(newParent())
const mother = reactive(newParent())
const spouse = reactive(newParent()) // suami/istri (atau mantan) sesuai status pernikahan
const allPeople = [father, mother, spouse]
const parentForms = [
  { key: 'father', prefix: 'father', title: 'Data Ayah', label: 'Ayah', model: father },
  { key: 'mother', prefix: 'mother', title: 'Data Ibu', label: 'Ibu', model: mother },
]

// Judul dan label isian pasangan mengikuti jenis kelamin dan status pernikahan
const spouseRole = computed(() => (gender.value === 'Perempuan' ? 'Suami' : 'Istri'))
const spouseLabel = computed(() => (
  maritalStatus.value === 'Cerai Hidup' ? `Mantan ${spouseRole.value}` : spouseRole.value
))
const spouseTitle = computed(() => {
  if (maritalStatus.value === 'Cerai Hidup') return `Data Mantan ${spouseRole.value}`
  if (maritalStatus.value === 'Cerai Mati') {
    return `Data ${spouseRole.value} (${spouseRole.value === 'Suami' ? 'Almarhum' : 'Almarhumah'})`
  }
  return `Data ${spouseRole.value}`
})

function findCitizenByNik(nik) {
  return citizenLookup.value.find(citizen => String(citizen.national_id ?? '') === nik) ?? null
}

function fillParent(parent, citizen) {
  parent.fullName = citizen.full_name ?? ''
  parent.birthPlace = citizen.birth_place ?? ''
  parent.birthDate = fromApiDate(citizen.birth_date)
  parent.occupation = citizen.occupation ?? ''
  parent.religion = citizen.religion ?? ''
  parent.nationality = citizen.nationality ?? 'WNI'
  parent.address = citizen.ktp_address ?? citizen.address ?? ''
  parent.fromRegistry = true
}

function onParentNik(parent, value) {
  const nik = String(value ?? '').replace(/\D/g, '').slice(0, 16)
  const wasLocked = parent.fromRegistry

  // NIK diganti setelah data terisi otomatis -> kosongkan lagi dan buka kembali isian manual
  if (wasLocked) Object.assign(parent, newParent())
  parent.nationalId = nik

  if (hasValid16Digits(nik)) {
    const citizen = findCitizenByNik(nik)
    if (citizen) fillParent(parent, citizen)
  }
}

const parentNikInvalid = parent => parent.nationalId !== '' && !hasValid16Digits(parent.nationalId)

function loadParent(parent, prefix, data) {
  parent.nationalId = data[`${prefix}_national_id`] ?? ''
  parent.fullName = data[`${prefix}_name`] ?? ''
  parent.birthPlace = data[`${prefix}_birth_place`] ?? ''
  parent.birthDate = fromApiDate(data[`${prefix}_birth_date`])
  parent.occupation = data[`${prefix}_occupation`] ?? ''
  parent.religion = data[`${prefix}_religion`] ?? ''
  parent.nationality = data[`${prefix}_nationality`] ?? 'WNI'
  parent.address = data[`${prefix}_address`] ?? ''
  parent.fromRegistry = false
}

function parentPayload(parent, prefix) {
  return {
    [`${prefix}_national_id`]: parent.nationalId,
    [`${prefix}_name`]: parent.fullName,
    [`${prefix}_birth_place`]: parent.birthPlace,
    [`${prefix}_birth_date`]: toApiDate(parent.birthDate),
    [`${prefix}_occupation`]: parent.occupation,
    [`${prefix}_religion`]: parent.religion,
    [`${prefix}_nationality`]: parent.nationality,
    [`${prefix}_address`]: parent.address,
  }
}

/* ------------------------------------------------------------------ */
/* Isi otomatis dari anggota KK (hanya saat tambah data baru)          */
/* ------------------------------------------------------------------ */
let lastRegionKk = ''
let lastParentKk = ''

function applyFamilyCardData() {
  if (isEditMode.value) return
  const kk = String(familyCardNumber.value ?? '').trim()

  if (!hasValid16Digits(kk)) {
    lastRegionKk = ''
    lastParentKk = ''
    return
  }

  // Hubungan bukan "Anak" -> lepaskan data orang tua yang tadi terisi dari KK
  if (familyRelationship.value !== 'Anak' && lastParentKk) {
    ;[father, mother].forEach((parent) => {
      if (parent.fromRegistry) Object.assign(parent, newParent())
    })
    lastParentKk = ''
  }

  if (!familyCardMembers.value.length) return

  if (!familyRelationship.value) familyRelationship.value = 'Anak'

  // Wilayah mengikuti anggota KK yang sudah tercatat
  if (lastRegionKk !== kk) {
    const source = familyCardHead.value
    const dusunData = regionData.find(item => item.dusun === source?.dusun)
    const rwData = dusunData?.rws.find(item => item.rw === source?.rw)
    const rtData = rwData?.rts.find(item => item.rt === source?.rt)

    dusun.value = source?.dusun ?? ''
    rw.value = source?.rw ?? ''
    rt.value = source?.rt ?? ''
    rwHeadName.value = rwData?.head ?? source?.rw_head_name ?? ''
    rtHeadName.value = rtData?.head ?? source?.rt_head_name ?? ''
    nationality.value = source?.nationality ?? nationality.value
    lastRegionKk = kk
  }

  // Data orang tua diambil dari anggota KK bila yang dicatat adalah anak
  if (familyRelationship.value === 'Anak' && lastParentKk !== kk) {
    const members = familyCardMembers.value
    const dad = members.find(c => c.gender === 'Laki-laki' && /kepala|suami/i.test(String(c.family_relationship ?? '')))
      ?? members.find(c => c.gender === 'Laki-laki')
    const mom = members.find(c => c.gender === 'Perempuan' && /istri/i.test(String(c.family_relationship ?? '')))
      ?? members.find(c => c.gender === 'Perempuan')

    Object.assign(father, newParent())
    Object.assign(mother, newParent())
    if (dad) { father.nationalId = dad.national_id ?? ''; fillParent(father, dad) }
    if (mom) { mother.nationalId = mom.national_id ?? ''; fillParent(mother, mom) }
    lastParentKk = kk
  }
}

watch([familyCardNumber, familyRelationship, citizenLookup], applyFamilyCardData)

// Daftar warga baru selesai dimuat -> coba cocokkan NIK orang tua yang sudah diketik
watch(citizenLookup, () => {
  if (isEditMode.value) return
  allPeople.forEach((model) => {
    if (model.fromRegistry || !hasValid16Digits(model.nationalId)) return
    const citizen = findCitizenByNik(model.nationalId)
    if (citizen) fillParent(model, citizen)
  })
})

/* ------------------------------------------------------------------ */
/* Dusun / RW / RT                                                     */
/* ------------------------------------------------------------------ */
function withCurrent(values, current) {
  const list = [...values]
  if (current && !list.includes(current)) list.push(current)
  return list
}

const dusunOptions = computed(() => (
  withCurrent(regionData.map(item => item.dusun), dusun.value).map(value => ({ value, label: value }))
))
const rwOptions = computed(() => {
  const dusunData = regionData.find(item => item.dusun === dusun.value)
  return withCurrent((dusunData?.rws ?? []).map(item => item.rw), rw.value)
    .map(value => ({ value, label: `RW ${value}` }))
})
const rtOptions = computed(() => {
  const rwData = regionData
    .find(item => item.dusun === dusun.value)
    ?.rws.find(item => item.rw === rw.value)
  return withCurrent((rwData?.rts ?? []).map(item => item.rt), rt.value)
    .map(value => ({ value, label: `RT ${value}` }))
})

function onDusunChange(value) {
  dusun.value = value ?? ''
  rw.value = ''
  rt.value = ''
  rwHeadName.value = ''
  rtHeadName.value = ''
}

function onRwChange(value) {
  rw.value = value ?? ''
  rt.value = ''
  rtHeadName.value = ''
  const rwData = regionData.find(item => item.dusun === dusun.value)?.rws.find(item => item.rw === value)
  rwHeadName.value = rwData?.head ?? ''
}

function onRtChange(value) {
  rt.value = value ?? ''
  const rtData = regionData
    .find(item => item.dusun === dusun.value)
    ?.rws.find(item => item.rw === rw.value)
    ?.rts.find(item => item.rt === value)
  rtHeadName.value = rtData?.head ?? ''
}

// Catatan 10: alamat lengkap dihapus. Alamat KTP otomatis dari isian dusun, RW, RT.
const ktpAddress = computed(() => {
  if (!dusun.value && !rw.value && !rt.value) return ktpAddressLoaded.value
  const parts = []
  if (dusun.value) parts.push(`Dusun ${dusun.value}`)
  if (rt.value || rw.value) parts.push(`RT ${rt.value || '-'}/RW ${rw.value || '-'}`)
  parts.push(villageName)
  return parts.join(', ')
})

/* ------------------------------------------------------------------ */
/* Catatan 11: nomor akta abu-abu bila aktanya tidak ada               */
/* ------------------------------------------------------------------ */
const birthCertificateNumberDisabled = computed(() => birthCertificateStatus.value !== 'Ada')
const isNeverMarried = computed(() => maritalStatus.value === 'Belum Menikah')
const isDivorced = computed(() => ['Cerai Hidup', 'Cerai Mati'].includes(maritalStatus.value))
const marriageDataDisabled = computed(() => isNeverMarried.value)
const marriageNumberDisabled = computed(() => marriageDataDisabled.value || marriageCertificateStatus.value !== 'Ada')
const divorceDataDisabled = computed(() => !isDivorced.value)
const divorceNumberDisabled = computed(() => divorceDataDisabled.value || divorceCertificateStatus.value !== 'Ada')

watch(maritalStatus, (value) => {
  if (value === 'Belum Menikah') {
    Object.assign(spouse, newParent())
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
watch(marriageCertificateStatus, (value) => {
  if (value !== 'Ada') marriageCertificateNumber.value = ''
})
watch(divorceCertificateStatus, (value) => {
  if (value !== 'Ada') divorceCertificateNumber.value = ''
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

/* ------------------------------------------------------------------ */
/* Helper tanggal & umur                                               */
/* ------------------------------------------------------------------ */
// Date -> 'YYYY-MM-DD' untuk dikirim ke backend
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

/* ------------------------------------------------------------------ */
/* Ambil data dari API                                                 */
/* ------------------------------------------------------------------ */
async function fetchCitizenDetail() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await getCitizen(citizenId.value)

    // Data lama bertipe MATI/PINDAH dianggap PENDUDUK; keadaannya dibaca dari Status.
    recordType.value = data.record_type === 'ORANG LUAR' ? 'ORANG LUAR' : 'PENDUDUK'
    recordEvent.value = data.record_event ?? ''
    originalEventType.value = eventTypeFromCode(recordEvent.value)
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
    loadParent(father, 'father', data)
    loadParent(mother, 'mother', data)
    loadParent(spouse, 'spouse', data)
    nationality.value = data.nationality ?? 'WNI'
    ktpAddressLoaded.value = data.ktp_address ?? data.address ?? ''
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
  try {
    const data = await getCitizens()
    citizenLookup.value = Array.isArray(data) ? data : []
  } catch {
    // Form tetap dapat diisi manual bila daftar warga gagal dimuat.
    citizenLookup.value = []
  }
}

onMounted(() => {
  fetchCitizenLookup()
  if (isEditMode.value) fetchCitizenDetail()
})

function goBack() {
  router.push({ name: 'citizen-list' })
}

/* ------------------------------------------------------------------ */
/* Simpan (POST tambah baru, PUT update)                               */
/* ------------------------------------------------------------------ */
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
  for (const { model, label } of [...parentForms, { model: spouse, label: spouseLabel.value }]) {
    if (parentNikInvalid(model)) {
      errorMessage.value = `NIK ${label} harus tepat 16 digit angka.`
      saving.value = false
      return
    }
  }

  const payload = {
    record_type: recordType.value,
    record_event_type: recordEventType.value,
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
    // Alamat lengkap dihapus dari form; alamat KTP dibentuk otomatis dari dusun/RW/RT.
    address: ktpAddress.value,
    ktp_address: ktpAddress.value,
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
    ...parentPayload(father, 'father'),
    ...parentPayload(mother, 'mother'),
    ...parentPayload(spouse, 'spouse'),
    nationality: nationality.value,
    previous_address: previousAddress.value,
    passport_number: passportNumber.value,
    passport_expiry_date: toApiDate(passportExpiryDate.value),
    status: status.value,
  }
  // Saat tambah baru, kode peristiwa (Lahir01, dst.) dibuat otomatis oleh backend.
  if (isEditMode.value) payload.record_event = recordEvent.value

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
        :class="outlineBtnClass"
        @click="goBack"
      />
    </div>

    <div
      v-if="errorMessage"
      class="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700"
      role="alert"
    >
      {{ errorMessage }}
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

              <!-- Catatan 1: Nomor KK paling atas, lalu anggota keluarganya -->
              <div class="flex flex-col gap-2">
                <label :class="labelClass" for="familyCardNumber">Nomor KK</label>
                <InputText
                  id="familyCardNumber"
                  v-model="familyCardNumber"
                  maxlength="16"
                  inputmode="numeric"
                  placeholder="16 digit nomor KK"
                  :invalid="familyCardInvalid"
                  aria-describedby="familyCardNumber-help"
                  :class="[inputClass, familyCardInvalid ? '!border-red-500 focus:!ring-red-100' : '']"
                />
                <small id="familyCardNumber-help" class="text-xs" :class="familyCardInvalid ? 'text-red-600' : 'text-neutral-500'">
                  {{ familyCardInvalid ? 'Nomor KK harus tepat 16 digit angka.' : 'Masukkan 16 digit angka. Anggota keluarga pada KK akan tampil di bawah.' }}
                </small>
              </div>

              <div v-if="familyCardValid" class="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3">
                <template v-if="familyCardMembers.length">
                  <div class="flex items-center gap-2 text-[13px] font-semibold text-neutral-800">
                    <i class="pi pi-users text-primary-500" />
                    Anggota keluarga pada KK ini ({{ familyCardMembers.length }})
                  </div>
                  <div class="mt-2 divide-y divide-neutral-200 text-[13px]">
                    <div
                      v-for="member in familyCardMembers"
                      :key="member.citizen_id ?? member.national_id"
                      class="grid grid-cols-1 gap-0.5 py-1.5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)] sm:gap-3"
                      :class="member.national_id === nationalId ? 'font-semibold text-primary-700' : 'text-neutral-700'"
                    >
                      <span>{{ member.full_name }}</span>
                      <span class="text-neutral-500">{{ member.national_id }}</span>
                      <span class="text-neutral-500">{{ member.family_relationship || '-' }}</span>
                    </div>
                  </div>
                  <p v-if="!isEditMode" class="m-0 mt-2 text-xs text-emerald-700">
                    <i class="pi pi-bolt text-[11px]" />
                    Dusun, RW, RT, dan data orang tua (bila hubungan = Anak) terisi otomatis dari KK ini.
                  </p>
                </template>
                <p v-else class="m-0 text-[13px] text-neutral-600">
                  Nomor KK ini belum terdaftar. Warga ini akan menjadi anggota pertama pada KK tersebut.
                </p>
              </div>

              <div class="flex flex-col gap-2">
                <label :class="labelClass" for="nationalId">NIK</label>
                <InputText
                  id="nationalId"
                  v-model="nationalId"
                  maxlength="16"
                  inputmode="numeric"
                  placeholder="16 digit NIK"
                  :invalid="nationalIdInvalid"
                  aria-describedby="nationalId-help"
                  :class="[inputClass, nationalIdInvalid ? '!border-red-500 focus:!ring-red-100' : '']"
                />
                <small id="nationalId-help" class="text-xs" :class="nationalIdInvalid ? 'text-red-600' : 'text-neutral-500'">
                  {{ nationalIdInvalid ? 'NIK harus tepat 16 digit angka.' : 'Masukkan 16 digit angka.' }}
                </small>
              </div>

              <!-- Catatan 5: kolom Gelar dihapus, gelar langsung di nama lengkap -->
              <div class="flex flex-col gap-2">
                <label :class="labelClass" for="fullName">Nama Lengkap</label>
                <InputText
                  id="fullName"
                  v-model="fullName"
                  placeholder="Nama lengkap warga"
                  :class="inputClass"
                />
                <small class="text-xs text-neutral-500">Bila memiliki gelar, tulis langsung di nama. Contoh: Dr. Budi Santoso, S.Kom.</small>
              </div>

              <!-- Catatan 6: kolom Peristiwa dihapus, diganti Status di panel kanan -->
              <div class="flex flex-col gap-2">
                <label :class="labelClass" for="recordType">Jenis Data</label>
                <Select
                  id="recordType"
                  v-model="recordType"
                  :options="recordTypeOptions"
                  :class="selectClass"
                  :pt="selectPt"
                />
              </div>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label :class="labelClass" for="gender">Jenis Kelamin</label>
                  <Select id="gender" v-model="gender" :options="genderOptions" optionLabel="label" optionValue="value" :class="selectClass" :pt="selectPt" />
                </div>
                <div class="flex flex-col gap-2">
                  <label :class="labelClass" for="nationality">Kewarganegaraan</label>
                  <Select id="nationality" v-model="nationality" :options="nationalityOptions" :class="selectClass" :pt="selectPt" />
                </div>
              </div>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label :class="labelClass" for="birthPlace">Tempat Lahir</label>
                  <InputText id="birthPlace" v-model="birthPlace" placeholder="Tempat lahir" :class="inputClass" />
                </div>
                <div class="flex flex-col gap-2">
                  <label :class="labelClass" for="birthDate">Tanggal Lahir</label>
                  <DatePicker
                    id="birthDate"
                    v-model="birthDate"
                    dateFormat="dd/mm/yy"
                    :manualInput="true"
                    showIcon
                    iconDisplay="input"
                    :class="selectClass"
                    :pt="datePt"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div class="flex flex-col gap-2">
                  <label :class="labelClass" for="age">Umur (otomatis)</label>
                  <InputText id="age" :model-value="age ?? ''" type="number" readonly placeholder="Otomatis dari tanggal lahir" :class="readonlyInputClass" />
                </div>
                <div class="flex flex-col gap-2">
                  <label :class="labelClass" for="bloodType">
                    Golongan Darah <span class="font-normal text-neutral-400">(Opsional)</span>
                  </label>
                  <Select id="bloodType" v-model="bloodType" :options="bloodTypeOptions" optionLabel="label" optionValue="value" placeholder="Pilih golongan darah" :class="selectClass" :pt="selectPt" />
                </div>
                <div class="flex flex-col gap-2">
                  <label :class="labelClass" for="religion">Agama</label>
                  <Select id="religion" v-model="religion" :options="religionOptions" optionLabel="label" optionValue="value" :class="selectClass" :pt="selectPt" />
                </div>
              </div>

              <!-- Catatan 11: nomor akta abu-abu bila akta tidak ada -->
              <div class="flex flex-col gap-2">
                <label :class="labelClass" for="birthCertificateStatus">
                  Akta Lahir <span class="font-normal text-neutral-400">(Opsional)</span>
                </label>
                <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Select id="birthCertificateStatus" v-model="birthCertificateStatus" :options="certificateOptions" optionLabel="label" optionValue="value" placeholder="Pilih status" :class="selectClass" :pt="selectPt" />
                  <InputText
                    id="birthCertificateNumber"
                    v-model="birthCertificateNumber"
                    :disabled="birthCertificateNumberDisabled"
                    :placeholder="birthCertificateNumberDisabled ? 'Tidak perlu diisi' : 'Nomor akta lahir'"
                    :class="inputClass"
                  />
                </div>
              </div>

              <div v-if="religion === 'Kepercayaan Terhadap Tuhan Yang Maha Esa'" class="flex flex-col gap-2">
                <label :class="labelClass" for="beliefOrganization">
                  Organisasi Kepercayaan <span class="font-normal text-neutral-400">(Opsional)</span>
                </label>
                <InputText id="beliefOrganization" v-model="beliefOrganization" placeholder="Nama organisasi kepercayaan" :class="inputClass" />
              </div>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label :class="labelClass" for="passportNumber">
                    Nomor Paspor <span class="font-normal text-neutral-400">(Opsional)</span>
                  </label>
                  <InputText id="passportNumber" v-model="passportNumber" placeholder="Nomor paspor bila ada" :class="inputClass" />
                </div>
                <div class="flex flex-col gap-2">
                  <label :class="labelClass" for="passportExpiryDate">
                    Tanggal Berakhir Paspor <span class="font-normal text-neutral-400">(Opsional)</span>
                  </label>
                  <DatePicker id="passportExpiryDate" v-model="passportExpiryDate" dateFormat="dd/mm/yy" :manualInput="true" showIcon iconDisplay="input" placeholder="dd/mm/yyyy" :class="selectClass" :pt="datePt" />
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

              <!-- Catatan 8: pilih dusun dulu, RW dan RT tinggal memilih -->
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div class="flex flex-col gap-2">
                  <label :class="labelClass" for="dusun">Dusun</label>
                  <Select
                    id="dusun"
                    :modelValue="dusun"
                    :options="dusunOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Pilih dusun"
                    :class="selectClass"
                    :pt="selectPt"
                    @update:modelValue="onDusunChange"
                  />
                </div>
                <div class="flex flex-col gap-2">
                  <label :class="labelClass" for="rw">RW</label>
                  <Select
                    id="rw"
                    :modelValue="rw"
                    :options="rwOptions"
                    optionLabel="label"
                    optionValue="value"
                    :placeholder="dusun ? 'Pilih RW' : 'Pilih dusun dulu'"
                    :disabled="!dusun"
                    :class="selectClass"
                    :pt="selectPt"
                    @update:modelValue="onRwChange"
                  />
                </div>
                <div class="flex flex-col gap-2">
                  <label :class="labelClass" for="rt">RT</label>
                  <Select
                    id="rt"
                    :modelValue="rt"
                    :options="rtOptions"
                    optionLabel="label"
                    optionValue="value"
                    :placeholder="rw ? 'Pilih RT' : 'Pilih RW dulu'"
                    :disabled="!rw"
                    :class="selectClass"
                    :pt="selectPt"
                    @update:modelValue="onRtChange"
                  />
                </div>
              </div>

              <!-- Catatan 9: ketua RT/RW mengikuti tabel RT/RW (dummy) -->
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label :class="labelClass" for="rwHeadName">Nama Ketua RW</label>
                  <InputText id="rwHeadName" :model-value="rwHeadName" readonly placeholder="Terisi otomatis dari RW" :class="readonlyInputClass" />
                </div>
                <div class="flex flex-col gap-2">
                  <label :class="labelClass" for="rtHeadName">Nama Ketua RT</label>
                  <InputText id="rtHeadName" :model-value="rtHeadName" readonly placeholder="Terisi otomatis dari RT" :class="readonlyInputClass" />
                </div>
              </div>

              <!-- Catatan 10: alamat lengkap dihapus, alamat KTP mengikuti isian di atas -->
              <div class="flex flex-col gap-2">
                <label :class="labelClass" for="ktpAddress">Alamat sesuai KTP</label>
                <InputText id="ktpAddress" :model-value="ktpAddress" readonly placeholder="Terisi otomatis dari dusun, RW, dan RT" :class="readonlyInputClass" />
                <small class="text-xs text-neutral-500">Dibentuk otomatis dari dusun, RW, dan RT yang dipilih.</small>
              </div>

              <div class="flex flex-col gap-2">
                <label :class="labelClass" for="previousAddress">
                  Alamat Sebelumnya <span class="font-normal text-neutral-400">(Opsional)</span>
                </label>
                <InputText id="previousAddress" v-model="previousAddress" placeholder="Alamat tetap terakhir sebelum tinggal sekarang" :class="inputClass" />
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
                <label :class="labelClass" for="phoneNumber">
                  Nomor Telepon/WA <span class="font-normal text-neutral-400">(Opsional)</span>
                </label>
                <InputText id="phoneNumber" v-model="phoneNumber" inputmode="tel" placeholder="08xxxxxxxxxx" :class="inputClass" />
              </div>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label :class="labelClass" for="occupation">Pekerjaan</label>
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
                  <label :class="labelClass" for="education">Pendidikan</label>
                  <Select id="education" v-model="education" :options="educationOptions" optionLabel="label" optionValue="value" :class="selectClass" :pt="selectPt" />
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
                <label :class="labelClass" for="maritalStatus">Status Pernikahan</label>
                <Select id="maritalStatus" v-model="maritalStatus" :options="maritalStatusOptions" optionLabel="label" optionValue="value" :class="selectClass" :pt="selectPt" />
              </div>

              <!-- Muncul bila status bukan "Belum Kawin": data pasangan, cukup isi NIK bila sudah terdaftar -->
              <CitizenPersonFields
                v-if="!isNeverMarried"
                :model="spouse"
                id-prefix="spouse"
                :title="spouseTitle"
                :label="spouseLabel"
                :religion-options="religionOptions"
                :nationality-options="nationalityOptions"
                :occupation-suggestions="occupationSuggestions"
                @update:nik="onParentNik(spouse, $event)"
                @search-occupation="searchOccupation"
              />

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label :class="labelClass" for="marriageCertificateStatus">
                    Akta Kawin <span class="font-normal text-neutral-400">(Opsional)</span>
                  </label>
                  <Select id="marriageCertificateStatus" v-model="marriageCertificateStatus" :options="certificateOptions" optionLabel="label" optionValue="value" placeholder="Pilih status" :disabled="marriageDataDisabled" :class="selectClass" :pt="selectPt" />
                </div>
                <div class="flex flex-col gap-2">
                  <label :class="labelClass" for="marriageCertificateNumber">
                    Nomor Akta Kawin <span class="font-normal text-neutral-400">(Opsional)</span>
                  </label>
                  <InputText
                    id="marriageCertificateNumber"
                    v-model="marriageCertificateNumber"
                    :disabled="marriageNumberDisabled"
                    :placeholder="marriageNumberDisabled ? 'Tidak perlu diisi' : 'Nomor akta kawin'"
                    :class="inputClass"
                  />
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <label :class="labelClass" for="marriageDate">
                  Tanggal Kawin <span class="font-normal text-neutral-400">(Opsional)</span>
                </label>
                <DatePicker id="marriageDate" v-model="marriageDate" :disabled="marriageDataDisabled" dateFormat="dd/mm/yy" :manualInput="true" showIcon iconDisplay="input" :class="selectClass" :pt="datePt" />
              </div>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label :class="labelClass" for="divorceCertificateStatus">
                    Akta Cerai <span class="font-normal text-neutral-400">(Opsional)</span>
                  </label>
                  <Select id="divorceCertificateStatus" v-model="divorceCertificateStatus" :options="certificateOptions" optionLabel="label" optionValue="value" placeholder="Pilih status" :disabled="divorceDataDisabled" :class="selectClass" :pt="selectPt" />
                </div>
                <div class="flex flex-col gap-2">
                  <label :class="labelClass" for="divorceCertificateNumber">
                    Nomor Akta Cerai <span class="font-normal text-neutral-400">(Opsional)</span>
                  </label>
                  <InputText
                    id="divorceCertificateNumber"
                    v-model="divorceCertificateNumber"
                    :disabled="divorceNumberDisabled"
                    :placeholder="divorceNumberDisabled ? 'Tidak perlu diisi' : 'Nomor akta cerai'"
                    :class="inputClass"
                  />
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <label :class="labelClass" for="divorceDate">
                  Tanggal Cerai <span class="font-normal text-neutral-400">(Opsional)</span>
                </label>
                <DatePicker id="divorceDate" v-model="divorceDate" :disabled="divorceDataDisabled" dateFormat="dd/mm/yy" :manualInput="true" showIcon iconDisplay="input" :class="selectClass" :pt="datePt" />
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
                <label :class="labelClass" for="familyRelationship">Hubungan Dalam Keluarga</label>
                <Select id="familyRelationship" v-model="familyRelationship" :options="familyRelationshipOptions" optionLabel="label" optionValue="value" placeholder="Pilih hubungan" :class="selectClass" :pt="selectPt" />
              </div>

              <!-- Catatan 3, 4, 12: data orang tua lengkap; cukup isi NIK bila sudah terdaftar -->
              <CitizenPersonFields
                v-for="parent in parentForms"
                :key="parent.key"
                :model="parent.model"
                :id-prefix="parent.key"
                :title="parent.title"
                :label="parent.label"
                :religion-options="religionOptions"
                :nationality-options="nationalityOptions"
                :occupation-suggestions="occupationSuggestions"
                @update:nik="onParentNik(parent.model, $event)"
                @search-occupation="searchOccupation"
              />

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
                <label :class="labelClass" for="disabilityStatus">
                  Kelainan Fisik dan Mental <span class="font-normal text-neutral-400">(Opsional)</span>
                </label>
                <Select id="disabilityStatus" v-model="disabilityStatus" :options="disabilityOptions" optionLabel="label" optionValue="value" placeholder="Pilih status" :class="selectClass" :pt="selectPt" />
              </div>

              <!-- No. 26: muncul bila no. 25 = Ada -->
              <div v-if="disabilityStatus === 'Ada'" class="flex flex-col gap-2">
                <label :class="labelClass" for="disabilityType">Penyandang Cacat</label>
                <Select id="disabilityType" v-model="disabilityType" :options="disabilityTypeOptions" optionLabel="label" optionValue="value" placeholder="Pilih jenis cacat" :class="selectClass" :pt="selectPt" />
              </div>

              <!-- Keterangan: muncul bila no. 26 = Cacat Lainnya -->
              <div v-if="disabilityType === 'Cacat Lainnya'" class="flex flex-col gap-2">
                <label :class="labelClass" for="physicalDisability">Keterangan</label>
                <InputText id="physicalDisability" v-model="physicalDisability" placeholder="Sebutkan jenis cacat lainnya" :class="inputClass" />
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
                :class="['flex-1', outlineBtnClass]"
                @click="goBack"
              />

              <Button
                :label="mainButtonLabel"
                :loading="saving"
                class="flex-1 rounded-lg border border-primary-500 bg-primary-500 px-3.5 py-2.5 text-[13px] font-medium text-white hover:bg-primary-600"
                @click="saveCitizen"
              />
            </div>
          </template>
        </Card>

        <!-- Catatan 6: Status (Hidup / Pindah / Mati) menggantikan Peristiwa -->
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
                  :class="selectClass"
                  :pt="selectPt"
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
          :class="['w-full', outlineBtnClass]"
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