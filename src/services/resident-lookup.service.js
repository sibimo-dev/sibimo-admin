/* Pencarian data warga lewat NIK (dipakai form Tambah Surat admin).
   Hasilnya dinormalisasi ke bentuk yang dibaca `field.from` di data/letterFields.js
   (fullName, nik, birthPlace, birthDate, birthPlaceDate, gender, maritalStatus, religion, occupation, address, phoneNumber).

   TODO(BE): sementara memakai GET /citizens (modul Data Warga) lalu mencocokkan `national_id` di sisi frontend.
   Bila backend sudah punya endpoint khusus (mis. GET /citizens/by-nik/{nik}), cukup ganti isi `findResidentByNik`. */
import { getCitizens } from './citizen.service'

// Pilihan di modul Data Warga ≠ pilihan di form surat (data/letterFields.js → OPT), jadi disamakan di sini.
const MARITAL = { 'Belum Menikah': 'Belum Kawin', Menikah: 'Kawin' }
const RELIGION = { Konghucu: 'Khonghucu' }
const GENDER = {
  l: 'Laki-laki', 'laki-laki': 'Laki-laki', 'laki laki': 'Laki-laki', male: 'Laki-laki', pria: 'Laki-laki',
  p: 'Perempuan', perempuan: 'Perempuan', female: 'Perempuan', wanita: 'Perempuan',
}
const normGender = (g) => GENDER[String(g ?? '').trim().toLowerCase()] ?? g ?? ''

function toDate(value) {
  if (!value) return null
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  const date = y && m && d ? new Date(y, m - 1, d) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const fmtLong = (d) =>
  d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

export function toResident(c) {
  const birthDate = toDate(c.birth_date)
  return {
    fullName: c.full_name ?? '',
    nik: String(c.national_id ?? ''),
    birthPlace: c.birth_place ?? '',
    birthDate,
    // gabungan "Sleman, 17 Agustus 1990" untuk surat yang memakai satu kolom Tempat/Tgl. Lahir
    birthPlaceDate: [c.birth_place, fmtLong(birthDate)].filter(Boolean).join(', '),
    gender: normGender(c.gender),
    maritalStatus: MARITAL[c.marital_status] ?? c.marital_status ?? '',
    religion: RELIGION[c.religion] ?? c.religion ?? '',
    occupation: c.occupation ?? '',
    address: c.address ?? c.ktp_address ?? '',
    phoneNumber: c.phone_number ?? '',
  }
}

/* nik (16 digit) → resident | null (tidak ditemukan). Melempar error bila request gagal. */
export async function findResidentByNik(nik) {
  const result = await getCitizens()
  const list = Array.isArray(result) ? result : (result?.data ?? [])
  const hit = list.find((c) => String(c.national_id) === String(nik))
  return hit ? toResident(hit) : null
}