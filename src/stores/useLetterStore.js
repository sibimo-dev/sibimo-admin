/**
 * Store sederhana (module-level reactive state) untuk data pengajuan surat.
 * Dipakai bersama oleh LetterListView.vue, LetterCreateView.vue,
 * LetterVerificationListView.vue, dan LetterVerificationView.vue.
 *
 * addSurat() menerima objek `letterType` LENGKAP (dari useLetterTypeStore)
 * supaya nomor prefix, penandatangan, dan metode TTD ikut ke-carry otomatis.
 * updateStatus() dipakai halaman Verifikasi Surat untuk menyetujui/menolak.
 *
 * Ganti isi file ini dengan pemanggilan surat.service.js (Pinia store / API)
 * begitu backend siap.
 */
import { ref } from 'vue'

// Dummy data -- hapus setelah integrasi API.
// citizenName/phone/address ditambahkan supaya halaman Verifikasi Surat
// (yang butuh detail pemohon) punya sesuatu untuk ditampilkan; untuk baris
// lama yang masuk dari "Online" ini masih placeholder karena form pengajuan
// online belum diketahui strukturnya -- sesuaikan begitu ada.
const rows = ref([
  {
    id: 1,
    requestId: 'REQ-20260813-001',
    citizenId: '3201011205900001',
    citizenName: 'Budi Santoso',
    citizenPhone: '081234500001',
    citizenAddress: 'Jl. Merdeka No. 12, Desa Makmur',
    purpose: 'Surat Keterangan Usaha (SKU)',
    category: 'Keterangan',
    status: 'Pending',
    signatureType: 'Digital',
    verifiedBy: '-',
    authorizedBy: '-',
    notes: '',
    date: '13 Agu 2026',
    dateValue: '2026-08-13',
    source: 'Online',
  },
  {
    id: 2,
    requestId: 'REQ-20260812-002',
    citizenId: '3201019876543210',
    citizenName: 'Siti Rahma',
    citizenPhone: '081234500002',
    citizenAddress: 'Jl. Sejahtera No. 8, Desa Makmur',
    purpose: 'Surat Keterangan Tidak Mampu (SKTM)',
    category: 'Keterangan',
    status: 'Diverifikasi',
    signatureType: 'Manual',
    verifiedBy: 'Admin 1',
    authorizedBy: '-',
    notes: '',
    date: '12 Agu 2026',
    dateValue: '2026-08-12',
    source: 'Online',
  },
  {
    id: 3,
    requestId: 'REQ-20260811-003',
    citizenId: '3201015555666677',
    citizenName: 'Andi Wijaya',
    citizenPhone: '081234500003',
    citizenAddress: 'Jl. Domisili No. 3, Desa Makmur',
    purpose: 'Surat Pengantar Domisili',
    category: 'Pengantar',
    status: 'Disetujui',
    signatureType: 'Digital',
    verifiedBy: 'Admin 1',
    authorizedBy: 'Kepala Desa',
    notes: '',
    date: '11 Agu 2026',
    dateValue: '2026-08-11',
    source: 'Online',
  },
  {
    id: 4,
    requestId: 'REQ-20260810-004',
    citizenId: '3201011122334455',
    citizenName: 'Dewi Lestari',
    citizenPhone: '081234500004',
    citizenAddress: 'Jl. Pindah No. 21, Desa Makmur',
    purpose: 'Surat Keterangan Pindah',
    category: 'Keterangan',
    status: 'Ditolak',
    signatureType: 'Manual',
    verifiedBy: 'Admin 2',
    authorizedBy: '-',
    notes: 'Dokumen KK tidak sesuai',
    date: '10 Agu 2026',
    dateValue: '2026-08-10',
    source: 'Online',
  },
  {
    id: 5,
    requestId: 'REQ-20260809-005',
    citizenId: '3201013344556677',
    citizenName: 'Rudi Hartono',
    citizenPhone: '081234500005',
    citizenAddress: 'Jl. Kelahiran No. 5, Desa Makmur',
    purpose: 'Surat Keterangan Kelahiran',
    category: 'Permohonan',
    status: 'Pending',
    signatureType: 'Digital',
    verifiedBy: '-',
    authorizedBy: '-',
    notes: '',
    date: '09 Agu 2026',
    dateValue: '2026-08-09',
    source: 'Online',
  },
  {
    id: 6,
    requestId: 'REQ-20260808-006',
    citizenId: '3201017788990011',
    citizenName: 'Sri Wahyuni',
    citizenPhone: '081234500006',
    citizenAddress: 'Jl. Kematian No. 7, Desa Makmur',
    purpose: 'Surat Keterangan Kematian',
    category: 'Permohonan',
    status: 'Diverifikasi',
    signatureType: 'Manual',
    verifiedBy: 'Admin 2',
    authorizedBy: '-',
    notes: '',
    date: '08 Agu 2026',
    dateValue: '2026-08-08',
    source: 'Online',
  },
  {
    id: 7,
    requestId: 'REQ-20260807-007',
    citizenId: '3201012233445566',
    citizenName: 'Agus Setiawan',
    citizenPhone: '081234500007',
    citizenAddress: 'Jl. Nikah No. 9, Desa Makmur',
    purpose: 'Surat Pengantar Nikah',
    category: 'Pengantar',
    status: 'Disetujui',
    signatureType: 'Digital',
    verifiedBy: 'Admin 1',
    authorizedBy: 'Kepala Desa',
    notes: '',
    date: '07 Agu 2026',
    dateValue: '2026-08-07',
    source: 'Online',
  },
  {
    id: 8,
    requestId: 'REQ-20260731-008',
    citizenId: '3201016677889900',
    citizenName: 'Yuni Kartika',
    citizenPhone: '081234500008',
    citizenAddress: 'Jl. Usaha No. 11, Desa Makmur',
    purpose: 'Surat Keterangan Usaha (SKU)',
    category: 'Keterangan',
    status: 'Ditolak',
    signatureType: 'Manual',
    verifiedBy: 'Admin 1',
    authorizedBy: '-',
    notes: 'Alamat usaha tidak sesuai domisili',
    date: '31 Jul 2026',
    dateValue: '2026-07-31',
    source: 'Online',
  },
  {
    id: 9,
    requestId: 'REQ-20260725-009',
    citizenId: '3201014455667788',
    citizenName: 'Hendra Gunawan',
    citizenPhone: '081234500009',
    citizenAddress: 'Jl. Tidak Mampu No. 13, Desa Makmur',
    purpose: 'Surat Keterangan Tidak Mampu (SKTM)',
    category: 'Keterangan',
    status: 'Pending',
    signatureType: 'Digital',
    verifiedBy: '-',
    authorizedBy: '-',
    notes: '',
    date: '25 Jul 2026',
    dateValue: '2026-07-25',
    source: 'Online',
  },
  {
    id: 10,
    requestId: 'REQ-20260720-010',
    citizenId: '3201019900112233',
    citizenName: 'Maya Puspita',
    citizenPhone: '081234500010',
    citizenAddress: 'Jl. Domisili No. 15, Desa Makmur',
    purpose: 'Surat Pengantar Domisili',
    category: 'Pengantar',
    status: 'Disetujui',
    signatureType: 'Manual',
    verifiedBy: 'Admin 2',
    authorizedBy: 'Kepala Desa',
    notes: '',
    date: '20 Jul 2026',
    dateValue: '2026-07-20',
    source: 'Online',
  },
  {
    id: 11,
    requestId: 'REQ-20260615-011',
    citizenId: '3201013322114455',
    citizenName: 'Doni Prasetyo',
    citizenPhone: '081234500011',
    citizenAddress: 'Jl. Pindah No. 17, Desa Makmur',
    purpose: 'Surat Keterangan Pindah',
    category: 'Keterangan',
    status: 'Diverifikasi',
    signatureType: 'Digital',
    verifiedBy: 'Admin 1',
    authorizedBy: '-',
    notes: '',
    date: '15 Jun 2026',
    dateValue: '2026-06-15',
    source: 'Online',
  },
  {
    id: 12,
    requestId: 'REQ-20260501-012',
    citizenId: '3201018811223344',
    citizenName: 'Lina Marlina',
    citizenPhone: '081234500012',
    citizenAddress: 'Jl. Kelahiran No. 19, Desa Makmur',
    purpose: 'Surat Keterangan Kelahiran',
    category: 'Permohonan',
    status: 'Ditolak',
    signatureType: 'Manual',
    verifiedBy: 'Admin 2',
    authorizedBy: '-',
    notes: 'NIK tidak terdaftar di Kelola Data Warga',
    date: '01 Mei 2026',
    dateValue: '2026-05-01',
    source: 'Online',
  },
])

function formatDisplayDate(date) {
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function nextRequestId(date) {
  const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, '')
  const countToday = rows.value.filter((r) => r.requestId.includes(`REQ-${yyyymmdd}`)).length
  const seq = String(countToday + 1).padStart(3, '0')
  return `REQ-${yyyymmdd}-${seq}`
}

/** Nomor surat resmi, dibangun dari number_prefix tipe surat + urutan berjalan */
function buildLetterNumber(numberPrefix) {
  const countSamePrefix = rows.value.filter((r) => r.letterNumber?.startsWith(numberPrefix)).length
  const seq = String(countSamePrefix + 1).padStart(3, '0')
  return `${numberPrefix}${seq}`
}

/**
 * Tambah surat manual yang diinput admin (pemohon datang langsung ke kelurahan).
 * @param {{ letterType: object, citizenId: string, citizenName: string,
 *           citizenPhone?: string, citizenAddress?: string, notes?: string }} payload
 *   letterType = objek lengkap dari useLetterTypeStore (letter_type_id, letter_name,
 *   category, number_prefix, signer_name, signature_method, dst.)
 */
function addSurat({ letterType, citizenId, citizenName, citizenPhone, citizenAddress, notes }) {
  const now = new Date()
  const signatureTypeLabel = letterType.signature_method === 'digital' ? 'Digital' : 'Manual'

  const newRow = {
    id: rows.value.length ? Math.max(...rows.value.map((r) => r.id)) + 1 : 1,
    requestId: nextRequestId(now),
    letterNumber: buildLetterNumber(letterType.number_prefix),
    citizenId,
    citizenName,
    citizenPhone: citizenPhone || '-',
    citizenAddress: citizenAddress || '-',
    purpose: letterType.letter_name,
    letterTypeId: letterType.letter_type_id,
    category: letterType.category,
    status: 'Pending',
    signatureType: signatureTypeLabel,
    verifiedBy: '-',
    authorizedBy: '-',
    signerName: letterType.signer_name,
    notes: notes || '',
    date: formatDisplayDate(now),
    dateValue: now.toISOString().slice(0, 10),
    source: 'Manual (Kelurahan)',
  }

  rows.value.unshift(newRow)
  return newRow
}

function getByRequestId(requestId) {
  return rows.value.find((r) => r.requestId === requestId) || null
}

/** Dipakai LetterAuthorizationView.vue -- dicari lewat `id` numerik (row.id), bukan requestId */
function getSuratById(id) {
  return rows.value.find((r) => String(r.id) === String(id)) || null
}

/** Update partial field surat berdasarkan `id` numerik (dipakai proses otorisasi) */
function updateSurat(id, payload) {
  const idx = rows.value.findIndex((r) => String(r.id) === String(id))
  if (idx === -1) return null
  rows.value[idx] = { ...rows.value[idx], ...payload }
  return rows.value[idx]
}

/**
 * Update status pengajuan surat (dipakai halaman Verifikasi Surat).
 * @param {string} requestId
 * @param {{ status: 'Diverifikasi'|'Ditolak', verifiedBy?: string, notes?: string }} payload
 */
function updateStatus(requestId, { status, verifiedBy, notes }) {
  const idx = rows.value.findIndex((r) => r.requestId === requestId)
  if (idx === -1) return null

  rows.value[idx] = {
    ...rows.value[idx],
    status,
    verifiedBy: verifiedBy ?? rows.value[idx].verifiedBy,
    notes: notes !== undefined ? notes : rows.value[idx].notes,
  }
  return rows.value[idx]
}

export function useLetterStore() {
  return { rows, addSurat, getByRequestId, updateStatus, getSuratById, updateSurat }
}