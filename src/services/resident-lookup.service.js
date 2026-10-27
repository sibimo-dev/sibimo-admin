/* Pencarian data warga lewat NIK (dipakai form Tambah Surat admin).
   Hasilnya dinormalisasi ke bentuk yang dibaca `field.from` di data/letterFields.js
   (fullName, nik, birthPlace, birthDate, birthPlaceDate, gender, maritalStatus, religion, occupation, address, phoneNumber).

   TODO(BE): sementara memakai GET /citizens (modul Data Warga) lalu mencocokkan `national_id` di sisi frontend.
   Bila backend sudah punya endpoint khusus (mis. GET /citizens/by-nik/{nik}), cukup ganti isi `findResidentByNik`. */
import { getCitizens } from './citizen.service'

// Pilihan form surat (data/letterFields.js → OPT) sekarang sama persis dengan modul Data Warga, jadi status perkawinan,
// agama, pendidikan, pekerjaan, dan SHDK diteruskan apa adanya tanpa dipetakan lagi.
const GENDER = {
  l: 'Laki-laki', 'laki-laki': 'Laki-laki', 'laki laki': 'Laki-laki', male: 'Laki-laki', pria: 'Laki-laki',
  p: 'Perempuan', perempuan: 'Perempuan', female: 'Perempuan', wanita: 'Perempuan',
}
const normGender = (g) => GENDER[String(g ?? '').trim().toLowerCase()] ?? g ?? ''
const normNik = (value) => String(value ?? '').replace(/\D/g, '')
const normName = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ')

const firstFilled = (...values) => values.find((value) => String(value ?? '').trim() !== '') ?? ''

function toDate(value) {
  if (!value) return null
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  const date = y && m && d ? new Date(y, m - 1, d) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function ageFromBirthDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  const today = new Date()
  let age = today.getFullYear() - date.getFullYear()
  const birthdayPassed = today.getMonth() > date.getMonth()
    || (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate())
  if (!birthdayPassed) age -= 1
  return age >= 0 ? String(age) : ''
}

const fmtLong = (d) =>
  d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

function toResidentPerson(c) {
  if (!c) return null
  const birthDate = toDate(c.birth_date)
  return {
    citizenId: c.citizen_id ?? c.citizenId ?? null,
    fullName: c.full_name ?? '',
    nik: normNik(c.national_id),
    titleCode: c.title_code ?? '',
    birthPlace: c.birth_place ?? '',
    birthDate,
    age: ageFromBirthDate(birthDate),
    birthPlaceDate: [c.birth_place, fmtLong(birthDate)].filter(Boolean).join(', '),
    gender: normGender(c.gender),
    maritalStatus: c.marital_status ?? '',
    religion: c.religion ?? '',
    beliefOrganization: c.belief_organization ?? '',
    occupation: c.occupation ?? '',
    education: c.education ?? '',
    nationality: c.nationality ?? 'WNI',
    address: c.address ?? c.ktp_address ?? '',
    phoneNumber: c.phone_number ?? '',
    marriageCertificateNumber: c.marriage_certificate_number ?? '',
    familyCardNumber: normNik(firstFilled(c.family_card_number, c.familyCardNumber, c.kk_number, c.nomor_kk)),
    familyRelationship: c.family_relationship ?? '',
    fatherName: c.father_name ?? '',
    motherName: c.mother_name ?? '',
    dusun: c.dusun ?? '',
    rt: c.rt ?? '',
    rw: c.rw ?? '',
    rtHeadName: c.rt_head_name ?? '',
    rwHeadName: c.rw_head_name ?? '',
    previousAddress: c.previous_address ?? '',
    passportNumber: c.passport_number ?? '',
    passportExpiryDate: toDate(c.passport_expiry_date),
    // Data tambahan per anggota (dipakai autofill "Daftar anggota keluarga" pada Biodata Penduduk)
    birthCertificateStatus: c.birth_certificate_status ?? '',
    birthCertificateNumber: c.birth_certificate_number ?? '',
    bloodType: c.blood_type ?? '',
    marriageCertificateStatus: c.marriage_certificate_status ?? '',
    marriageCertificateNumber: c.marriage_certificate_number ?? '',
    marriageDate: toDate(c.marriage_date),
    divorceCertificateStatus: c.divorce_certificate_status ?? '',
    divorceCertificateNumber: c.divorce_certificate_number ?? '',
    divorceDate: toDate(c.divorce_date),
    disabilityStatus: c.disability_status ?? '',
    disabilityType: c.disability_type ?? '',
    motherNationalId: normNik(c.mother_national_id),
    fatherNationalId: normNik(c.father_national_id),
  }
}

function spouseOf(c, citizens) {
  const familyCard = normNik(c?.family_card_number)
  if (!familyCard || !isMarriedStatus(c?.marital_status)) return null
  const allowedRelations = spouseRelationsFor(c)
  if (!allowedRelations) return null
  const ownGender = normGender(c.gender)
  const opposite = ownGender === 'Laki-laki' ? 'Perempuan' : ownGender === 'Perempuan' ? 'Laki-laki' : ''
  if (!opposite) return null
  const candidates = citizens
    .filter((item) => normNik(item.family_card_number) === familyCard)
    .filter((item) => normNik(item.national_id) !== normNik(c.national_id))
    .filter((item) => isMarriedStatus(item.marital_status))
    .filter((item) => normGender(item.gender) === opposite)
    .filter((item) => allowedRelations.some((allowed) => String(item.family_relationship ?? '').toLowerCase().includes(allowed)))
  if (!candidates.length) return null
  return toResidentPerson(candidates[0])
}

function isMarriedStatus(status) {
  const value = String(status ?? '').trim().toLowerCase()
  if (!value || /belum|cerai|janda|duda|jejaka|perawan/i.test(value)) return false
  return /kawin|menikah/i.test(value)
}

function spouseRelationsFor(c) {
  const relation = String(c?.family_relationship ?? '').trim().toLowerCase()
  if (!relation || /anak|menantu|cucu|orang ?tua|saudara|famili/i.test(relation)) return null
  if (relation.includes('istri')) return ['suami', 'kepala']
  if (relation.includes('suami')) return ['istri', 'kepala']
  if (/kepala|\bkk\b/i.test(relation)) return normGender(c.gender) === 'Laki-laki' ? ['istri'] : ['suami']
  return null
}

export function toResident(c, citizens = []) {
  const birthDate = toDate(c.birth_date)
  const familyCardNumber = normNik(firstFilled(c.family_card_number, c.familyCardNumber, c.kk_number, c.nomor_kk))
  const byNik = (nik) => citizens.find((item) => normNik(item.national_id) === normNik(nik))
  const byParent = (nik, name, gender) => {
    const direct = byNik(nik)
    if (direct) return direct
    const matches = citizens.filter((item) => normName(item.full_name) === normName(name))
    const householdMatches = matches.filter((item) => normNik(item.family_card_number) === familyCardNumber)
    const candidates = householdMatches.length ? householdMatches : matches
    const sameGender = candidates.filter((item) => normGender(item.gender) === gender)
    return sameGender.length === 1 ? sameGender[0] : candidates.length === 1 ? candidates[0] : null
  }
  const fallbackParent = (nik, name) => ({
    fullName: name ?? '',
    nik: normNik(nik),
  })
  // Jika NIK orang tua belum tersimpan pada baris anak, tetap coba hubungkan
  // lewat nama yang sama secara unik agar detail orang tua ikut lengkap.
  const fatherRecord = byParent(c.father_national_id, c.father_name, 'Laki-laki')
  const motherRecord = byParent(c.mother_national_id, c.mother_name, 'Perempuan')
  const household = familyCardNumber
    ? citizens
      .filter((item) => normNik(item.family_card_number) === familyCardNumber)
      .map(toResidentPerson)
      .filter(Boolean)
    : []
  const familyHead = household.find((person) => /kepala\s+keluarga/i.test(String(person.familyRelationship ?? '')))
  const headOfFamilyName = firstFilled(
    c.head_of_family_name,
    c.headOfFamilyName,
    c.nama_kepala_keluarga,
    familyHead?.fullName,
    /kepala\s+keluarga/i.test(String(c.family_relationship ?? '')) ? c.full_name : '',
  )
  return {
    citizenId: c.citizen_id ?? c.citizenId ?? null,
    fullName: c.full_name ?? '',
    nik: normNik(c.national_id),
    titleCode: c.title_code ?? '',
    birthPlace: c.birth_place ?? '',
    birthDate,
    age: ageFromBirthDate(birthDate),
    // gabungan "Sleman, 17 Agustus 1990" untuk surat yang memakai satu kolom Tempat/Tgl. Lahir
    birthPlaceDate: [c.birth_place, fmtLong(birthDate)].filter(Boolean).join(', '),
    gender: normGender(c.gender),
    maritalStatus: c.marital_status ?? '',
    religion: c.religion ?? '',
    beliefOrganization: c.belief_organization ?? '',
    occupation: c.occupation ?? '',
    education: c.education ?? '',
    nationality: c.nationality ?? 'WNI',
    address: c.address ?? c.ktp_address ?? '',
    phoneNumber: c.phone_number ?? '',
    father: fatherRecord ? toResidentPerson(fatherRecord) : fallbackParent(c.father_national_id, c.father_name),
    mother: motherRecord ? toResidentPerson(motherRecord) : fallbackParent(c.mother_national_id, c.mother_name),
    fatherName: fatherRecord?.full_name ?? c.father_name ?? '',
    motherName: motherRecord?.full_name ?? c.mother_name ?? '',
    spouse: spouseOf(c, citizens),
    familyCardNumber,
    headOfFamilyName,
    familyRelationship: c.family_relationship ?? '',
    dusun: c.dusun ?? '',
    rt: c.rt ?? '',
    rw: c.rw ?? '',
    rtHeadName: c.rt_head_name ?? '',
    rwHeadName: c.rw_head_name ?? '',
    previousAddress: c.previous_address ?? '',
    passportNumber: c.passport_number ?? '',
    passportExpiryDate: toDate(c.passport_expiry_date),
    // Wilayah ini adalah wilayah tetap kalurahan; gunakan data API bila kelak
    // tersedia, dan fallback ke konfigurasi Kalurahan Bimomartani saat ini.
    village: c.village ?? c.kelurahan ?? c.desa ?? 'Bimomartani',
    district: c.district ?? c.kapanewon ?? c.kecamatan ?? 'Ngemplak',
    regency: c.regency ?? c.kabupaten ?? c.kabupaten_kota ?? 'Sleman',
    province: c.province ?? c.provinsi ?? 'Daerah Istimewa Yogyakarta',
    postalCode: c.postal_code ?? c.post_code ?? c.kode_pos ?? '',
    household,
    householdCount: household.length ? String(household.length) : '',
  }
}

/* nik (16 digit) → resident | null (tidak ditemukan). Melempar error bila request gagal. */
export async function findResidentByNik(nik) {
  const result = await getCitizens()
  const list = Array.isArray(result) ? result : (result?.data ?? [])
  const hit = list.find((c) => normNik(c.national_id) === normNik(nik))
  return hit ? toResident(hit, list) : null
}