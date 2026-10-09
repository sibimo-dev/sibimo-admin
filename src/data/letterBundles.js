import { opt } from "./letterFields";

/* Semua berkas surat milik paket (nikah, kelahiran, kematian, Letter C, pindah WNI). Dimuat bersama modul ini.
   Isian & dokumen dibaca dari data/letters/<kelompok>/<slug>.js (salinan dari public). */
const parts = import.meta.glob("./letters/{birth,death,letter-c,married-man,marriage-women,applications}/*.js", { eager: true });
function partsOf(slug) {
  const mod = Object.entries(parts).find(([path]) => path.endsWith(`/${slug}.js`))?.[1];
  if (!mod?.sections) console.warn(`[bundle] Berkas surat ${slug}.js belum meng-export \`sections\`/\`documents\`.`);
  return { sections: mod?.sections ?? [], documents: mod?.documents ?? [] };
}

/* Pembuat surat: judul/kode/kelompok = tampilan di paket; isian & dokumen = dari berkas surat. */
const letter = (id, slug, title, code, group, description) => ({ id, slug, title, code, group, description, ...partsOf(slug) });

/* ============ TABEL SURAT PAKET ============
   Urutan argumen: id, slug berkas surat, judul, kode, kelompok di ceklis, deskripsi singkat. */
const LETTERS = {
  ppn: letter("ppn", "relocation-cover-letter", "Surat Pengantar Permohonan Pindah WNI", "PPN", "Pindah WNI", "Surat pengantar permohonan pindah antar desa dalam satu kecamatan."),
  skp: letter("skp", "relocation-certificate-form", "Formulir Keterangan Pindah WNI", "SKP", "Pindah WNI", "Formulir keterangan pindah WNI (kop Dukcapil)."),
  khn: letter("khn", "marriage-application-letter", "Permohonan Kehendak Nikah", "KHN", "Pendaftaran Nikah", "Permohonan kehendak nikah ke KUA."),
  dpn: letter("dpn", "marriage-registration-data-sheet", "Data Isian Pendaftaran Nikah", "DPN", "Pendaftaran Nikah", "Data lengkap kedua mempelai, orang tua, dan status."),
  pnk: letter("pnk", "marriage-introduction-letter", "Pengantar Nikah", "PNK", "Pengantar & Keterangan", "Surat pengantar nikah dari kelurahan."),
  skn: letter("skn", "general-certificate-letter", "Surat Pengantar Tes Kesehatan", "SKN", "Pengantar & Keterangan", "Surat keterangan umum untuk keperluan nikah."),
  knn: letter("knn", "marriage-lodging-certificate-letter", "Surat Keterangan Numpang Nikah", "KNN", "Pengantar & Keterangan", "Bila akad nikah dilangsungkan di luar wilayah."),
  kbp: letter("kbp", "never-married-certificate-letter", "Surat Keterangan Belum Pernah Menikah", "KBP", "Status Perkawinan", "Keterangan belum pernah menikah."),
  pbm: letter("pbm", "not-remarried-statement-letter", "Surat Keterangan Belum Menikah Lagi", "PBM", "Status Perkawinan", "Untuk duda/janda yang belum menikah lagi."),
  kkn: letter("kkn", "death-certificate-for-marriage-letter", "Surat Keterangan Kematian", "KKN", "Status Perkawinan", "Untuk calon suami yang berstatus duda cerai mati."),
  scm: letter("scm", "bride-groom-consent-letter", "Persetujuan Calon Pengantin", "SCM", "Persetujuan & Wali", "Persetujuan kedua calon pengantin."),
  sio: letter("sio", "parental-consent-letter", "Surat Izin Orang Tua", "SIO", "Persetujuan & Wali", "Izin orang tua bagi anak yang akan menikah."),
  n2: letter("n2", "n2", "Permohonan Kehendak Nikah", "N2", "Pendaftaran Nikah", "Permohonan kehendak nikah (N2) — data calon pengantin dan rencana akad."),
  fpn: letter("fpn", "registration-form", "Data Isian Pendaftaran Nikah", "FPN", "Pendaftaran Nikah", "Data calon suami, calon istri, dan rencana akad."),
  n1: letter("n1", "n1", "Pengantar Nikah", "N1", "Pengantar & Keterangan", "Pengantar nikah (N1) dari kelurahan — data calon istri dan orang tua."),
  phk: letter("phk", "health-referral", "Surat Pengantar Tes Kesehatan", "PHK", "Pengantar & Keterangan", "Surat keterangan/pengantar pemeriksaan kesehatan pranikah."),
  pnn: letter("pnn", "marriage-lodging", "Surat Keterangan Numpang Nikah", "PNN", "Pengantar & Keterangan", "Bila akad nikah dilangsungkan di luar wilayah."),
  kbm: letter("kbm", "unmarried-certificate", "Surat Keterangan Belum Pernah Menikah", "KBM", "Status Perkawinan", "Keterangan belum menikah untuk keperluan nikah."),
  pbn: letter("pbn", "unmarried-statement", "Surat Keterangan Belum Menikah Lagi", "PBN", "Status Perkawinan", "Pernyataan belum menikah lagi bermaterai."),
  n6: letter("n6", "n6", "Surat Keterangan Kematian", "N6", "Status Perkawinan", "Untuk calon istri yang berstatus janda cerai mati."),
  n4: letter("n4", "n4", "Persetujuan Calon Pengantin", "N4", "Persetujuan & Wali", "Persetujuan kedua calon pengantin (N4)."),
  n5: letter("n5", "n5", "Surat Izin Orang Tua", "N5", "Persetujuan & Wali", "Izin orang tua calon istri (N5)."),
  swn: letter("swn", "guardian-statement", "Surat Keterangan Wali Nikah", "SWN", "Persetujuan & Wali", "Pernyataan wali nikah calon istri."),
  swh: letter("swh", "judge-guardian", "Surat Keterangan Wali Hakim", "SWH", "Persetujuan & Wali", "Bila akad nikah dilangsungkan dengan wali hakim."),
  akl: letter("akl", "birth-certificate-application-form", "Permohonan Akta Kelahiran", "AKL", "Permohonan & Pelaporan", "Formulir permohonan akta kelahiran."),
  lpk: letter("lpk", "birth-report-form", "Formulir Pelaporan Kelahiran (Untuk Mendapatkan Akta Kelahiran)", "LPK", "Permohonan & Pelaporan", "Formulir pelaporan kelahiran."),
  skt: letter("skt", "late-birth-registration-approval-decree", "Surat Pencatatan Kelahiran Terlambat", "SKT", "Permohonan & Pelaporan", "Khusus pelaporan terlambat — memuat alasan keterlambatan."),
  pcl: letter("pcl", "birth-registration-report", "Pelaporan Pencatatan Kelahiran", "PCL", "Pengantar & Keterangan", "Pengantar pencatatan kelahiran dari kelurahan."),
  pak: letter("pak", "birth-certificate-referral-letter", "Surat Keterangan Mohon Akta Kelahiran", "PAK", "Pengantar & Keterangan", "Pengantar pengurusan akta kelahiran."),
  klh: letter("klh", "birth-attestation-letter", "Surat Keterangan Kelahiran", "KLH", "Pengantar & Keterangan", "Surat keterangan kelahiran."),
  pld: letter("pld", "out-of-domicile-birth-report", "Laporan Kelahiran Luar Domisili", "PLD", "Pengantar & Keterangan", "Bila bayi lahir di luar domisili."),
  plk: letter("plk", "birth-report-statement", "Laporan Kelahiran", "PLK", "Pernyataan & Kuasa", "Pernyataan kebenaran data kelahiran."),
  sps: letter("sps", "spousal-relationship-responsibility-statement", "Surat Pernyataan Tanggung Jawab Mutlak Kebenaran Sebagai Pasangan Suami Istri", "SPS", "Pernyataan & Kuasa", "Pernyataan tanggung jawab mutlak kebenaran sebagai pasangan suami istri."),
  kak: letter("kak", "birth-certificate-power-of-attorney", "Surat Kuasa", "KAK", "Pernyataan & Kuasa", "Bila pengurusan dikuasakan kepada orang lain."),
  akm: letter("akm", "death-certificate-application", "Permohonan Akta Kematian", "AKM", "Permohonan & Pelaporan", "Formulir permohonan akta kematian."),
  lpm: letter("lpm", "death-report-form", "Formulir Pelaporan Kematian (Untuk Mendapatkan Akta Kematian)", "LPM", "Permohonan & Pelaporan", "Formulir pelaporan kematian."),
  pck: letter("pck", "death-registration-report", "Pelaporan Pencatatan Kematian", "PCK", "Pengantar & Keterangan", "Pengantar pencatatan kematian dari kelurahan."),
  plm: letter("plm", "death-report", "Laporan Kematian", "PLM", "Pengantar & Keterangan", "Pengantar lapor kematian."),
  kkt: letter("kkt", "death-certificate", "Surat Keterangan Kematian", "KKT", "Pengantar & Keterangan", "Surat keterangan kematian."),
  // HPK (Perhitungan Selamatan) tidak ditampilkan ke publik: sengaja TIDAK dimasukkan ke MATI_BARU / MATI_LAMA di bawah.
  hpk: letter("hpk", "death-commemoration-calculation", "Perhitungan Selamatan 3 Hari Sampai 1000 Hari", "HPK", "Pengantar & Keterangan", "Perhitungan hari peringatan kematian."),
  pdm: letter("pdm", "death-data-statement", "Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) Kebenaran Data Kematian", "PDM", "Pernyataan & Kuasa", "Pernyataan kebenaran data kematian."),
  pku: letter("pku", "death-general-statement", "Surat Keterangan Mohon Akta Kematian", "PKU", "Pernyataan & Kuasa", "Pernyataan kematian untuk keperluan umum."),
  kkm: letter("kkm", "death-power-of-attorney", "Surat Kuasa", "KKM", "Pernyataan & Kuasa", "Bila pengurusan dikuasakan kepada orang lain."),
  plc: letter("plc", "letter-c-data-statement-letter", "Surat Pernyataan Permohonan Data Letter C", "PLC", "Pernyataan & Kuasa", "Pernyataan pemohon atas data Letter C (warisan atau konversi)."),
  klc: letter("klc", "power-of-attorney-letter", "Surat Kuasa", "KLC", "Pernyataan & Kuasa", "Bila pengurusan Letter C dikuasakan kepada orang lain."),
  kht: letter("kht", "land-price-certificate-letter", "Surat Keterangan Harga Tanah", "KHT", "Keterangan Tanah", "Keterangan harga pasaran tanah dari kalurahan."),
  kat: letter("kat", "land-origin-certificate-letter", "Surat Keterangan Asal Tanah", "KAT", "Keterangan Tanah", "Keterangan asal usul tanah dari kalurahan."),
};

const DOC_TERLAMBAT = opt("Surat pernyataan keterlambatan pelaporan");
const pick = (ids) => ids.map((id) => LETTERS[id]);

/* ---------- Pasangan kunci yang artinya sama (isian otomatis antar surat) ---------- */
const SUF = ["Name", "Nik", "BirthPlace", "BirthDate", "Nationality", "Religion", "Occupation", "Education", "Address", "Bin"];
const link = (a, b, suffixes = SUF) => suffixes.map((s) => [a + s, b + s]);
const APPLICANT = ["name", "nik", "birthPlace", "birthDate", "religion", "occupation", "address", "education", "nationality"];
const asPrefix = (p) => ["Name", "Nik", "BirthPlace", "BirthDate", "Religion", "Occupation", "Address", "Education", "Nationality"].map((s) => p + s);
const applicantAs = (p) => APPLICANT.map((k, i) => [k, asPrefix(p)[i]]);

const ALIAS_NIKAH_LAKI = [
  ...applicantAs("groom"), ["applicantBin", "groomBin"],
  ...link("father", "groomFather"), ...link("mother", "groomMother"),
  ...link("spouse", "bride", SUF.filter((s) => s !== "Bin")), ["spouseBin", "brideBinti"],
  ["previousSpouseName", "groomPrevName"], ...link("deceased", "groomPrev", ["Name", "BirthPlace", "BirthDate", "Nationality", "Religion", "Occupation", "Address"]),
  ["deathDate", "groomPrevDeathDate"], ["deathPlace", "groomPrevDeathPlace"],
  ...link("child", "groom"), ...link("childSpouse", "bride", SUF.filter((x) => x !== "Bin")), ["childSpouseBin", "brideBinti"],
];
const ALIAS_NIKAH_PEREMPUAN = [
  ...applicantAs("bride"), ["applicantBin", "brideBinti"],
  ...link("father", "brideFather"), ...link("mother", "brideMother"),
  ...link("spouse", "groom", SUF.filter((s) => s !== "Bin")), ["spouseBin", "groomBin"],
  ["previousSpouseName", "exHusbandName"], ["exHusbandName", "bridePrevName"], ["exHusbandNik", "bridePrevNik"],
  ["exHusbandDiedAt", "bridePrevDeathDate"], ["exHusbandDiedPlace", "bridePrevDeathPlace"],
];
/* Surat kelahiran memakai nama field yang sama dengan blade (lihat data/letterFields.js), jadi isian orang tua, anak
   dan saksi otomatis terbagi antar surat. Yang perlu dihubungkan hanya kkNumber dengan familyCardNumber serta
   suami/istri dengan ayah/ibu. PELAPOR (reporter*) TIDAK dihubungkan ke data warga: diisi petugas/admin kalurahan. */
const PARENT_ALIAS = ["Name", "Nik", "BirthPlace", "BirthDate", "Occupation", "Address"];
const ALIAS_LAHIR = [
  ["kkNumber", "familyCardNumber"],
  ...link("husband", "father", PARENT_ALIAS), ...link("wife", "mother", PARENT_ALIAS),
];
const ALIAS_MATI = []; // pelapor kematian diisi petugas/admin, tidak disambungkan ke data warga
const ALIAS_LETTER_C = [["letterCOwnerName", "ownerName"]]; // pemilik pada Letter C = pemilik tanah pada surat keterangan

// 10 surat (married-man) dan 12 surat (marriage-women), sama dengan daftar di scaffold.
const NIKAH_LAKI = ["khn", "dpn", "pnk", "skn", "knn", "kbp", "pbm", "kkn", "scm", "sio"];
const NIKAH_PEREMPUAN = ["n2", "fpn", "n1", "phk", "pnn", "kbm", "pbn", "n6", "n4", "n5", "swn", "swh"];
// Kelahiran = 10 surat (Lama: semua; Baru: tanpa Keputusan Pencatatan Terlambat).
// Kematian = 7 surat (Baru) / 8 surat (Lama, + SPTJM Data Kematian). "hpk" (Perhitungan Selamatan) tidak dipublikasikan.
const LAHIR_BARU = ["akl", "lpk", "pcl", "pak", "klh", "pld", "plk", "kak", "sps"];
const LAHIR_LAMA = ["akl", "lpk", "skt", "pcl", "pak", "klh", "pld", "plk", "kak", "sps"];
const MATI_BARU = ["akm", "lpm", "pck", "plm", "kkt", "pku", "kkm"];
const MATI_LAMA = ["akm", "lpm", "pck", "plm", "kkt", "pdm", "pku", "kkm"];
const LETTER_C = ["plc", "klc", "kht", "kat"];
const PINDAH = ["ppn", "skp"]; // isian kedua surat memakai kunci yang sama → terisi otomatis di surat berikutnya

/* Paket "lama" = pelaporan terlambat: surat utama menerima dokumen opsional tambahan. */
const lateDoc = (ls, ids) => ls.map((l) => (ids.includes(l.id) ? { ...l, documents: [...l.documents, DOC_TERLAMBAT] } : l));

export const BUNDLES = [
  {
    slug: "permohonan-pindah-wni", shortCode: "PKT-PDH", hue: "lime", icon: "pi pi-file-export",
    title: "Permohonan Pindah WNI",
    description: "Paket surat pindah antar desa dalam satu kecamatan: surat pengantar dan formulir keterangan pindah. Isi dalam satu pengajuan.",
    letters: pick(PINDAH), aliases: [],
  },
  {
    slug: "permohonan-nikah-laki-laki", shortCode: "PKT-NKL", hue: "sky", icon: "pi pi-heart",
    title: "Permohonan Nikah Laki-laki",
    description: "Paket surat pengurusan nikah untuk calon suami. Pilih surat yang dibutuhkan, isi dalam satu pengajuan.",
    letters: pick(NIKAH_LAKI), aliases: ALIAS_NIKAH_LAKI,
  },
  {
    slug: "permohonan-nikah-perempuan", shortCode: "PKT-NKP", hue: "rose", icon: "pi pi-heart-fill",
    title: "Permohonan Nikah Perempuan",
    description: "Paket surat pengurusan nikah untuk calon istri. Pilih surat yang dibutuhkan, isi dalam satu pengajuan.",
    letters: pick(NIKAH_PEREMPUAN), aliases: ALIAS_NIKAH_PEREMPUAN,
  },
  {
    slug: "permohonan-akta-kelahiran-baru", shortCode: "PKT-LHB", hue: "emerald", icon: "pi pi-user-plus",
    title: "Permohonan Akta Kelahiran Baru",
    description: "Paket surat kelahiran yang dilaporkan tepat waktu. Pilih surat yang dibutuhkan dalam satu pengajuan.",
    letters: pick(LAHIR_BARU), aliases: ALIAS_LAHIR,
  },
  {
    slug: "permohonan-akta-kelahiran-lama", shortCode: "PKT-LHL", hue: "teal", icon: "pi pi-history",
    title: "Permohonan Akta Kelahiran Lama",
    description: "Paket surat kelahiran yang dilaporkan terlambat, termasuk keputusan pencatatan kelahiran terlambat.",
    letters: lateDoc(pick(LAHIR_LAMA), ["akl", "lpk"]), aliases: ALIAS_LAHIR,
  },
  {
    slug: "permohonan-akta-kematian-baru", shortCode: "PKT-MTB", hue: "violet", icon: "pi pi-book",
    title: "Permohonan Akta Kematian Baru",
    description: "Paket surat kematian yang dilaporkan tepat waktu. Pilih surat yang dibutuhkan dalam satu pengajuan.",
    letters: pick(MATI_BARU), aliases: ALIAS_MATI,
  },
  {
    slug: "permohonan-akta-kematian-lama", shortCode: "PKT-MTL", hue: "fuchsia", icon: "pi pi-calendar-times",
    title: "Permohonan Akta Kematian Lama",
    description: "Paket surat kematian yang dilaporkan terlambat. Pilih surat yang dibutuhkan dalam satu pengajuan.",
    letters: lateDoc(pick(MATI_LAMA), ["akm", "lpm"]), aliases: ALIAS_MATI,
  },
  {
    slug: "permohonan-data-letter-c", shortCode: "PKT-LTC", hue: "amber", icon: "pi pi-map",
    title: "Permohonan Data Letter C",
    description: "Paket surat pengurusan data Letter C: pernyataan, surat kuasa, keterangan harga tanah, dan keterangan asal usul tanah.",
    letters: pick(LETTER_C), aliases: ALIAS_LETTER_C,
  },
];

export const findBundle = (slug) => BUNDLES.find((b) => b.slug === slug) ?? null;

/* Entri katalog (bentuk sama dengan layanan surat satuan). Paket masuk kategori Permohonan. */
export const BUNDLE_SERVICES = BUNDLES.map((b) => ({
  slug: b.slug,
  title: b.title,
  description: b.description,
  icon: b.icon,
  badge: "Paket Surat",
  shortCode: b.shortCode,
  keywords: b.letters.flatMap((l) => [l.title, l.code]),
  bundle: { count: b.letters.length, hue: b.hue },
  category: "permohonan",
}));

/* Surat yang sudah masuk paket → disembunyikan dari katalog sebagai kartu terpisah.
   Dicocokkan lewat slug berkas (nikah) ATAU judul (kelahiran/kematian). */
const norm = (x) => String(x ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const BUNDLED_TITLES = new Set(BUNDLES.flatMap((b) => b.letters.filter((l) => !l.slug).map((l) => norm(l.title))));
const BUNDLED_SLUGS = new Set(BUNDLES.flatMap((b) => b.letters.map((l) => l.slug).filter(Boolean)));
/* Surat dari folder-folder ini selalu masuk paket (nikah/kelahiran/kematian/Letter C), apa pun judulnya. */
const BUNDLED_GROUPS = new Set(["birth", "death", "letter-c", "married-man", "marriage-women"]);
export const isBundledLetter = (service) =>
  BUNDLED_GROUPS.has(service.group) || BUNDLED_SLUGS.has(service.slug) || BUNDLED_TITLES.has(norm(service.title));
export const isBundledTitle = (title) => BUNDLED_TITLES.has(norm(title));