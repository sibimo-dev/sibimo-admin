// Shared constants + helpers for the Community Satisfaction Survey (IKM).
// The 9 service elements follow the national IKM standard (Permenpan RB No. 14/2017).
// Every answer is scored 1-4 (index of the option + 1).

export const SURVEY_ELEMENTS = [
  {
    key: 'requirements',
    title: 'Persyaratan',
    question: 'Bagaimana pendapat Saudara tentang kesesuaian persyaratan pelayanan dengan jenis pelayanannya?',
    options: ['Tidak Sesuai', 'Kurang Sesuai', 'Sesuai', 'Sangat Sesuai'],
    recommendation: 'Tinjau ulang persyaratan layanan: hapus dokumen yang tidak perlu dan pasang daftar persyaratan yang jelas di loket serta di website.',
  },
  {
    key: 'procedure',
    title: 'Prosedur',
    question: 'Bagaimana pemahaman Saudara tentang kemudahan prosedur pelayanan di unit ini?',
    options: ['Tidak Mudah', 'Kurang Mudah', 'Mudah', 'Sangat Mudah'],
    recommendation: 'Sederhanakan alur layanan, sediakan bagan alur/SOP bergambar, dan tempatkan petugas penerima yang bisa memandu warga.',
  },
  {
    key: 'time',
    title: 'Waktu Pelayanan',
    question: 'Bagaimana pendapat Saudara tentang kecepatan waktu dalam memberikan pelayanan?',
    options: ['Tidak Cepat', 'Kurang Cepat', 'Cepat', 'Sangat Cepat'],
    recommendation: 'Tetapkan standar waktu layanan per jenis dokumen, tampilkan di loket, dan pantau keterlambatan secara berkala.',
  },
  {
    key: 'cost',
    title: 'Biaya/Tarif',
    question: 'Bagaimana pendapat Saudara tentang kewajaran biaya/tarif dalam pelayanan?',
    options: ['Sangat Mahal', 'Cukup Mahal', 'Murah', 'Gratis'],
    recommendation: 'Pastikan tarif sesuai ketentuan dan diumumkan terbuka; tegaskan layanan yang gratis agar tidak ada kesalahpahaman.',
  },
  {
    key: 'product',
    title: 'Produk Layanan',
    question: 'Bagaimana pendapat Saudara tentang kesesuaian produk pelayanan dengan hasil yang diberikan?',
    options: ['Tidak Sesuai', 'Kurang Sesuai', 'Sesuai', 'Sangat Sesuai'],
    recommendation: 'Periksa kembali ketelitian dokumen yang diterbitkan (data, format, tanda tangan) sebelum diserahkan kepada warga.',
  },
  {
    key: 'competence',
    title: 'Kompetensi Petugas',
    question: 'Bagaimana pendapat Saudara tentang kompetensi/kemampuan petugas dalam pelayanan?',
    options: ['Tidak Kompeten', 'Kurang Kompeten', 'Kompeten', 'Sangat Kompeten'],
    recommendation: 'Adakan pelatihan dan pembagian tugas yang jelas bagi petugas agar warga mendapat jawaban yang konsisten.',
  },
  {
    key: 'behavior',
    title: 'Perilaku Petugas',
    question: 'Bagaimana pendapat Saudara tentang perilaku petugas dalam pelayanan terkait kesopanan dan keramahan?',
    options: ['Tidak Sopan dan Ramah', 'Kurang Sopan dan Ramah', 'Sopan dan Ramah', 'Sangat Sopan dan Ramah'],
    recommendation: 'Perkuat budaya 3S (senyum, sapa, salam) dan tetapkan standar pelayanan yang ramah untuk seluruh petugas.',
  },
  {
    key: 'complaints',
    title: 'Penanganan Pengaduan',
    question: 'Bagaimana pendapat Saudara tentang penanganan pengaduan pengguna layanan?',
    options: ['Tidak Ada', 'Ada tetapi Tidak Berfungsi', 'Berfungsi Kurang Maksimal', 'Dikelola dengan Baik'],
    recommendation: 'Sosialisasikan kanal pengaduan (menu Aduan, kotak saran, WhatsApp) dan tetapkan batas waktu tindak lanjut.',
  },
  {
    key: 'facilities',
    title: 'Sarana & Prasarana',
    question: 'Bagaimana pendapat Saudara tentang kualitas sarana dan prasarana pelayanan?',
    options: ['Buruk', 'Cukup', 'Baik', 'Sangat Baik'],
    recommendation: 'Perbaiki sarana pendukung: ruang tunggu, tempat duduk, papan informasi, toilet, dan akses bagi lansia/disabilitas.',
  },
]

export const SERVICE_TYPES = [
  'Administrasi Kependudukan (KTP/KK)',
  'Surat Pengantar/Keterangan',
  'Surat Keterangan Domisili',
  'Surat Keterangan Tidak Mampu',
  'Akta Kelahiran/Kematian',
  'Pertanahan',
  'Perizinan Usaha',
  'Lainnya',
]

export const GENDERS = ['Laki-laki', 'Perempuan']

export const EDUCATIONS = [
  'Tidak Sekolah',
  'Tidak Tamat SD/Sederajat',
  'Tamat SD/Sederajat',
  'Tidak Tamat SMP/Sederajat',
  'Tamat SMP/Sederajat',
  'Tidak Tamat SMA/Sederajat',
  'Tamat SMA/Sederajat',
  'Tamat D1, D2 atau D3',
  'Tamat S1, S2, S3',
]

export const OCCUPATIONS = [
  'PNS/TNI/Polri',
  'Pegawai Swasta',
  'Wiraswasta/Pedagang',
  'Petani/Buruh',
  'Pelajar/Mahasiswa',
  'Ibu Rumah Tangga',
  'Pensiunan',
  'Lainnya',
]

export const SCORE_COLORS = ['bg-red-400', 'bg-amber-400', 'bg-lime-500', 'bg-emerald-500']
export const SCORE_LABELS = ['Tidak puas', 'Kurang puas', 'Puas', 'Sangat puas']

// IKM = average (1-4) x 25, so the range is 25-100.
export function averageToIkm(average) {
  return Number(average || 0) * 25
}

export function getIkmGrade(ikm) {
  if (ikm >= 88.31) return { grade: 'A', label: 'Sangat Baik', bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-700' }
  if (ikm >= 76.61) return { grade: 'B', label: 'Baik', bar: 'bg-lime-500', badge: 'bg-lime-50 text-lime-700', text: 'text-lime-700' }
  if (ikm >= 65) return { grade: 'C', label: 'Kurang Baik', bar: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700', text: 'text-amber-700' }
  return { grade: 'D', label: 'Tidak Baik', bar: 'bg-red-500', badge: 'bg-red-50 text-red-700', text: 'text-red-700' }
}

export function formatNumber(value, digits = 2) {
  return Number(value || 0).toLocaleString('id-ID', { maximumFractionDigits: digits, minimumFractionDigits: 0 })
}

function sumDistribution(distribution = {}) {
  return [1, 2, 3, 4].reduce((sum, score) => sum + Number(distribution[score] ?? 0), 0)
}

// Percentage of all answers that are "satisfied" (score 3 or 4).
export function getSatisfiedPercent(elements = []) {
  let total = 0
  let satisfied = 0
  elements.forEach(element => {
    total += sumDistribution(element.distribution)
    satisfied += Number(element.distribution?.[3] ?? 0) + Number(element.distribution?.[4] ?? 0)
  })
  return total ? (satisfied / total) * 100 : 0
}

// Elements that need evaluation: grade C/D, or at least 25% of answers are "dissatisfied" (score 1-2).
export function buildEvaluation(elements = []) {
  return SURVEY_ELEMENTS
    .map(definition => {
      const data = elements.find(element => element.key === definition.key)
      if (!data) return null

      const total = sumDistribution(data.distribution)
      if (!total) return null

      const dissatisfied = ((Number(data.distribution[1] ?? 0) + Number(data.distribution[2] ?? 0)) / total) * 100
      const ikm = averageToIkm(data.average)
      const grade = getIkmGrade(ikm)
      const needsAttention = grade.grade === 'C' || grade.grade === 'D' || dissatisfied >= 25

      return {
        key: definition.key,
        title: definition.title,
        recommendation: definition.recommendation,
        ikm,
        grade,
        dissatisfied,
        priority: grade.grade === 'D' || dissatisfied >= 40 ? 'high' : 'medium',
        needsAttention,
      }
    })
    .filter(item => item && item.needsAttention)
    .sort((a, b) => a.ikm - b.ikm)
}