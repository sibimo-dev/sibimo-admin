/* Kumpulan "cetakan" isian yang dipakai berulang oleh file-file surat.
   Satu surat = satu file .vue yang menyusun `sections` + `documents` dari sini. */

/* ---------- Pilihan dropdown ---------- */
export const GENDER_OPTIONS = [
  "1. Laki-laki",
  "2. Perempuan",
];

export const OPT = {
  gender: GENDER_OPTIONS,
  religion: ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu"],
  marital: ["Belum Kawin", "Kawin", "Kawin Tercatat", "Kawin Belum Tercatat", "Cerai Hidup", "Cerai Mati"],
  education: ["Tidak/Belum Sekolah", "SD", "SMP", "SMA/SMK", "D1/D2/D3", "D4/S1", "S2", "S3"],
  occupation: ["Belum/Tidak Bekerja", "Pelajar/Mahasiswa", "Ibu Rumah Tangga", "Petani", "Buruh", "Wiraswasta", "Karyawan Swasta", "PNS/ASN", "TNI/Polri", "Pensiunan"],
  shdk: ["Kepala Keluarga", "Suami", "Istri", "Anak", "Menantu", "Cucu", "Orang Tua", "Mertua", "Famili Lain", "Pembantu", "Lainnya"],
  kkStatus: ["Numpang KK", "Membuat KK Baru", "Nomor KK Tetap"],
  // Opsi bernomor mengikuti formulir cetak: angka di depan = angka yang dicetak di kotak pilihan pada PDF.
  kkStatusNo: ["1. Numpang KK", "2. Membuat KK Baru", "3. Nomor KK Tetap"],
  relocationReason: ["1. Pekerjaan", "2. Pendidikan", "3. Keamanan", "4. Kesehatan", "5. Perumahan", "6. Keluarga", "7. Lainnya (sebutkan)"],
  relocationType: ["1. Kep. Keluarga", "2. Kep. Keluarga dan seluruh Angg. Keluarga", "3. Kep. Keluarga dan sbg Angg. Keluarga", "4. Anggota Keluarga"],
  relocationScope: ["Antar Desa Dalam Satu Kecamatan", "Antar Kecamatan Dalam Satu Kabupaten/Kota", "Antar Kabupaten/Kota Atau Antar Provinsi"],
  delivery: ["Rumah Sakit", "Puskesmas", "Polindes", "Rumah Bersalin", "Rumah", "Lainnya"],
  attendant: ["Dokter", "Bidan", "Dukun", "Lainnya"],
  plurality: ["Tunggal", "Kembar 2", "Kembar 3", "Kembar 4", "Lainnya"],
};

/* ---------- Pembuat field ---------- */
const make = (type) => (key, label, opts = {}) => ({ key, label, type, ...opts });
const isGenderOptions = (options) => Array.isArray(options)
  && options.length === 2
  && options.every((option) => typeof option === "string")
  && options.map((option) => option.trim().toLowerCase()).sort().join("|") === "laki-laki|perempuan";
const normalizeOptions = (options) => isGenderOptions(options) ? GENDER_OPTIONS : options;
export const f = {
  text: make("text"),
  hamlet: (key, label = "Dusun/Dukuh/Kampung", opts = {}) => ({ key, label, type: "hamlet", ...opts }),
  area: make("textarea"),
  select: (key, label, options, opts = {}) => ({ key, label, type: "select", options, ...opts }),
  /** dropdown yang BOLEH diketik manual (tidak harus dari daftar). options = array teks atau (form) => array teks (daftar bergantung isian lain). */
  combo: (key, label, options, opts = {}) => ({ key, label, type: "combo", options, ...opts }),
  date: make("date"),
  time: make("time"),
  /** pekerjaan: pilih dari daftar bernomor (sama dengan Data Warga) atau ketik bebas. Yang disimpan = nama pekerjaan tanpa nomor. */
  occupation: (key, label = "Pekerjaan", opts = {}) => ({ key, label, type: "occupation", options: OPT.occupation, ...opts }),
  /** checkbox banyak pilihan (nilai = array) */
  checks: (key, label, options, opts = {}) => ({ key, label, type: "checks", options, ...opts }),
  /** daftar baris berulang (anggota keluarga, saksi, dst). columns = [{ key, label, type?, options? }] */
  rows: (key, label, columns, opts = {}) => ({ key, label, type: "rows", columns, ...opts }),
  nik: (key, label = "NIK", opts = {}) => ({ key, label, type: "text", digits: 16, placeholder: "16 digit NIK", ...opts }),
  kk: (key, label = "Nomor KK", opts = {}) => ({ key, label, type: "text", digits: 16, placeholder: "16 digit Nomor KK", ...opts }),
};

/* ---------- Daftar wilayah untuk dropdown "pilih atau ketik manual" ----------
   Hanya saran; petugas tetap boleh mengetik wilayah di luar daftar. Cocokkan ejaan dengan data resmi/tabel wilayah sebelum dipakai.
   Aturan daftar yang saling bergantung (desa ← kecamatan ← kabupaten ← provinsi):
     - induk sudah terisi dan dikenal  → tampil anak dari induk itu saja
     - induk masih kosong              → tampil SEMUA pilihan yang dikenal (supaya dropdown tetap berfungsi di semua cakupan)
     - induk diketik manual & tak dikenal → daftar kosong, isian diketik manual */
const DESA_BY_KECAMATAN = {
  Berbah: ["Jogotirto", "Kalitirto", "Sendangtirto", "Tegaltirto"],
  Cangkringan: ["Argomulyo", "Glagaharjo", "Kepuharjo", "Umbulharjo", "Wukirsari"],
  Depok: ["Caturtunggal", "Condongcatur", "Maguwoharjo"],
  Gamping: ["Ambarketawang", "Balecatur", "Banyuraden", "Nogotirto", "Trihanggo"],
  Godean: ["Sidoagung", "Sidoarum", "Sidokarto", "Sidoluhur", "Sidomoyo", "Sidomulyo", "Sidorejo"],
  Kalasan: ["Purwomartani", "Selomartani", "Tamanmartani", "Tirtomartani"],
  Minggir: ["Sendangagung", "Sendangarum", "Sendangmulyo", "Sendangrejo", "Sendangsari"],
  Mlati: ["Sendangadi", "Sinduadi", "Sumberadi", "Tirtoadi", "Tlogoadi"],
  Moyudan: ["Sumberagung", "Sumberarum", "Sumberrahayu", "Sumbersari"],
  Ngaglik: ["Donoharjo", "Minomartani", "Sardonoharjo", "Sariharjo", "Sinduharjo", "Sukoharjo"],
  Ngemplak: ["Bimomartani", "Sindumartani", "Umbulmartani", "Wedomartani", "Widodomartani"],
  Pakem: ["Candibinangun", "Hargobinangun", "Harjobinangun", "Pakembinangun", "Purwobinangun"],
  Prambanan: ["Bokoharjo", "Gayamharjo", "Joho", "Madurejo", "Sambirejo", "Wukirharjo"],
  Seyegan: ["Margoagung", "Margodadi", "Margokaton", "Margoluwih", "Margomulyo"],
  Sleman: ["Caturharjo", "Pandowoharjo", "Tridadi", "Triharjo", "Trimulyo"],
  Tempel: ["Banyurejo", "Lumbungrejo", "Merdikorejo", "Mororejo", "Pondokrejo", "Sumberrejo", "Tambakrejo"],
  Turi: ["Bangunkerto", "Donokerto", "Girikerto", "Wonokerto"],
};
const KECAMATAN_BY_KABUPATEN = {
  Sleman: Object.keys(DESA_BY_KECAMATAN),
  Bantul: ["Bambanglipuro", "Banguntapan", "Bantul", "Dlingo", "Imogiri", "Jetis", "Kasihan", "Kretek", "Pajangan", "Pandak", "Piyungan", "Pleret", "Pundong", "Sanden", "Sedayu", "Sewon", "Srandakan"],
  "Kulon Progo": ["Galur", "Girimulyo", "Kalibawang", "Kokap", "Lendah", "Nanggulan", "Panjatan", "Pengasih", "Samigaluh", "Sentolo", "Temon", "Wates"],
  Gunungkidul: ["Gedangsari", "Girisubo", "Karangmojo", "Ngawen", "Nglipar", "Paliyan", "Panggang", "Patuk", "Playen", "Ponjong", "Purwosari", "Rongkop", "Saptosari", "Semanu", "Semin", "Tanjungsari", "Tepus", "Wonosari"],
  "Kota Yogyakarta": ["Danurejan", "Gedongtengen", "Gondokusuman", "Gondomanan", "Jetis", "Kotagede", "Kraton", "Mantrijeron", "Mergangsan", "Ngampilan", "Pakualaman", "Tegalrejo", "Umbulharjo", "Wirobrajan"],
};
const KABUPATEN_BY_PROVINSI = {
  "Daerah Istimewa Yogyakarta": ["Sleman", "Bantul", "Kulon Progo", "Gunungkidul", "Kota Yogyakarta"],
};
const PROVINSI = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Jambi", "Sumatera Selatan", "Bengkulu", "Lampung",
  "Kepulauan Bangka Belitung", "Kepulauan Riau", "DKI Jakarta", "Jawa Barat", "Jawa Tengah", "Daerah Istimewa Yogyakarta",
  "Jawa Timur", "Banten", "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur", "Kalimantan Barat", "Kalimantan Tengah",
  "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara", "Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan",
  "Sulawesi Tenggara", "Gorontalo", "Sulawesi Barat", "Maluku", "Maluku Utara", "Papua", "Papua Barat", "Papua Barat Daya",
  "Papua Selatan", "Papua Tengah", "Papua Pegunungan",
];
const flat = (map) => [...new Set(Object.values(map).flat())].sort((a, b) => a.localeCompare(b, "id"));
const optionsFor = (map, parent) => {
  const name = String(parent ?? "").trim().toLowerCase();
  if (!name) return flat(map);
  const key = Object.keys(map).find((k) => k.toLowerCase() === name);
  return key ? map[key] : [];
};

/* Isian wilayah otomatis menurut "Cakupan Kepindahan" (urutan = OPT.relocationScope).
   Yang terisi otomatis hanya level di ATAS desa; desa (dan kecamatan/kab pada cakupan lebih luas) dibiarkan kosong
   untuk dipilih dari dropdown atau diketik.
   antar desa satu kecamatan → Kecamatan Ngemplak, Sleman, DIY | antar kecamatan → Sleman, DIY | antar kab/prov → DIY */
const DIY = "Daerah Istimewa Yogyakarta";
const SCOPE_WILAYAH = [
  { district: "Ngemplak", regency: "Sleman", province: DIY },
  { regency: "Sleman", province: DIY },
  { province: DIY },
];
export const scopeWilayah = (label) => SCOPE_WILAYAH[OPT.relocationScope.indexOf(label)] ?? {};

/* Desa/Kecamatan/Kab/Provinsi yang mengikuti cakupan kepindahan (dibaca watcher di LetterFormFields.vue lewat `scopeAuto`).
   Semua dropdown tetap aktif di setiap cakupan dan boleh diketik manual.
   optionsOf(level) = opsi tambahan per level (mis. from/default dari alamat()). */
export const wilayahByScope = (prefix, scopeKey, optionsOf = () => ({})) => {
  const scoped = (level) => ({ scopeAuto: { key: scopeKey, level } });
  return [
    f.combo(`${prefix}Village`, "Desa/Kelurahan", (form) => optionsFor(DESA_BY_KECAMATAN, form[`${prefix}District`]), { ...scoped("village"), ...optionsOf("village") }),
    f.combo(`${prefix}District`, "Kecamatan", (form) => optionsFor(KECAMATAN_BY_KABUPATEN, form[`${prefix}Regency`]), { ...scoped("district"), ...optionsOf("district") }),
    f.combo(`${prefix}Regency`, "Kabupaten/Kota", (form) => optionsFor(KABUPATEN_BY_PROVINSI, form[`${prefix}Province`]), { ...scoped("regency"), ...optionsOf("regency") }),
    f.combo(`${prefix}Province`, "Provinsi", PROVINSI, { ...scoped("province"), ...optionsOf("province") }),
  ];
};

// TAMBAHKAN bagian ini ke @/data/letterFields.js (di bawah wilayahByScope).
// Pastikan wilayahByScope sudah ada di file tersebut.

export const BIMOMARTANI = {
  village: "Bimomartani",
  district: "Ngemplak",
  regency: "Sleman",
  province: "Daerah Istimewa Yogyakarta",
};

const WILAYAH_LEVELS = { Village: "village", District: "district", Regency: "regency", Province: "province" };

/* Ubah Desa/Kecamatan/Kabupaten/Provinsi pada blok alamat menjadi dropdown (pilih atau ketik manual).
   Tidak lagi ikut "Cakupan Kepindahan" (scopeAuto dibuang). Nilai awal dari `defaults`, kosong bila tidak ada. */
export function wilayahDropdown(section, prefix, scopeKey, defaults = {}) {
  const combos = Object.fromEntries(wilayahByScope(prefix, scopeKey).map((c) => [c.key, c]));
  return {
    ...section,
    fields: section.fields.map((fld) => {
      const suffix = Object.keys(WILAYAH_LEVELS).find((s) => fld.key === `${prefix}${s}`);
      if (!suffix) return fld;
      const merged = { ...fld, ...(combos[fld.key] ?? {}) };
      delete merged.scopeAuto;
      merged.default = defaults[WILAYAH_LEVELS[suffix]] ?? "";
      return merged;
    }),
  };
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);


/* Pilihan yang NILAI-nya angka kode di formulir cetak (mis. F-1.01 kolom 7, 13, 14, ...): dropdown tetap menampilkan
   "1. Laki-laki", tetapi yang disimpan dan dicetak di pratinjau hanya angkanya ("1"). */
export const codeOptions = (list) => list.map((o, i) => (typeof o === "string"
  ? { value: String(i + 1), label: o, source: o.replace(/^\s*\d+\s*[.)\-:]\s*/, "") }
  : { value: String(i + 1), label: o.label, source: o.value })); // source = nilai asli di Data Warga (dipakai autofill dari KK)

/* Umur otomatis: field umur dengan `ageOf` = kunci tanggal lahir. Dihitung ulang tiap tanggal lahir berubah
   (lihat LetterFormFields.vue). Bila tanggal lahir tidak ada di form surat itu, umur tetap diisi manual. */
const AGE = { placeholder: "Otomatis dari tanggal lahir" };

/* ---------- Data pemohon (terisi otomatis dari data warga yang sudah diverifikasi) ---------- */
export const pemohon = (extra = []) => ({
  title: "Data Pemohon",
  hint: "Terisi otomatis dari data warga. Koreksi bila ada yang tidak sesuai.",
  fields: [
    f.text("name", "Nama Lengkap", { from: "fullName" }),
    f.nik("nik", "NIK", { from: "nik" }),
    f.text("birthPlace", "Tempat Lahir", { from: "birthPlace" }),
    f.date("birthDate", "Tanggal Lahir", { from: "birthDate" }),
    f.select("gender", "Jenis Kelamin", OPT.gender, { from: "gender" }),
    f.select("maritalStatus", "Status Perkawinan", OPT.marital, { from: "maritalStatus" }),
    f.select("religion", "Agama", OPT.religion, { from: "religion" }),
    f.occupation("occupation", "Pekerjaan", { from: "occupation" }),
    f.area("address", "Alamat", { from: "address", span: 2 }),
    ...extra,
  ],
});

/* Pemohon ringkas: untuk surat yang datanya didominasi orang lain (anak, almarhum, calon pengantin, dll). */
export const pemohonRingkas = (extra = []) => ({
  title: "Data Pemohon",
  hint: "Terisi otomatis dari data warga. Koreksi bila ada yang tidak sesuai.",
  fields: [
    f.text("name", "Nama Lengkap", { from: "fullName" }),
    f.nik("nik", "NIK", { from: "nik" }),
    f.area("address", "Alamat", { from: "address", span: 2 }),
    ...extra,
  ],
});

/* ---------- Data orang lain ----------
   parts: name nik birth gender religion occupation education nationality marital address
   Kunci field = prefix + bagian, contoh person("groom", ...) → groomName, groomNik, groomBirthPlace, ... */
const PART = {
  name: (p) => [f.text(`${p}Name`, "Nama Lengkap")],
  nik: (p) => [f.nik(`${p}Nik`)],
  birth: (p) => [f.text(`${p}BirthPlace`, "Tempat Lahir"), f.date(`${p}BirthDate`, "Tanggal Lahir")],
  gender: (p) => [f.select(`${p}Gender`, "Jenis Kelamin", OPT.gender)],
  religion: (p) => [f.select(`${p}Religion`, "Agama", OPT.religion)],
  occupation: (p) => [f.occupation(`${p}Occupation`, "Pekerjaan")],
  education: (p) => [f.select(`${p}Education`, "Pendidikan Terakhir", OPT.education)],
  nationality: (p) => [f.text(`${p}Nationality`, "Kewarganegaraan", { default: "WNI" })],
  marital: (p) => [f.select(`${p}Marital`, "Status Perkawinan", OPT.marital)],
  address: (p) => [f.area(`${p}Address`, "Alamat", { span: 2 })],
};
export const person = (prefix, title, parts = ["name", "nik", "birth", "address"], extra = [], hint) => ({
  title,
  hint,
  fields: [...parts.flatMap((part) => PART[part](prefix)), ...extra],
});

/* ---------- Keperluan surat ---------- */
export const keperluan = (purposeLabel = "Keperluan / Tujuan Surat", destinationLabel = "Surat ditujukan kepada / instansi") => ({
  title: "Keperluan Surat",
  fields: [
    f.area("purpose", purposeLabel, { span: 2, placeholder: "Jelaskan untuk apa surat ini diperlukan" }),
    ...(destinationLabel ? [f.text("destination", destinationLabel, { span: 2, placeholder: "Contoh: Bank BRI, Kantor Kecamatan, Sekolah, dst." })] : []),
  ],
});

/* ---------- Dokumen pendukung yang umum ---------- */
export const DOC = {
  ktp: "Fotokopi/foto KTP pemohon",
  kk: "Fotokopi/foto Kartu Keluarga (KK)",
  rt: "Surat pengantar RT/RW",
  akta: "Fotokopi buku nikah / kutipan akta perkawinan",
  aktaLahir: "Fotokopi akta kelahiran",
  suratKematian: "Surat keterangan kematian dari rumah sakit/dokter/RT",
  ktpSaksi: "Fotokopi KTP 2 (dua) orang saksi",
  pasFoto: "Pas foto terbaru berlatar belakang biru",
  bukti: "Dokumen/bukti pendukung lain yang relevan",
};
export const opt = (label) => ({ label, optional: true });

/* ---------- Blok data keluarga (kelahiran, kematian) dipakai beberapa surat ---------- */
export const keluarga = () => ({
  title: "Data Keluarga",
  fields: [f.kk("familyCardNumber"), f.text("headOfFamilyName", "Nama Kepala Keluarga")],
});

export const anak = ({ detail = false } = {}) => ({
  title: "Data Bayi/Anak",
  fields: [
    f.nik("childNik", "NIK Anak", { optional: true, placeholder: "Isi bila sudah ada" }),
    f.text("childName", "Nama Lengkap Anak"),
    f.select("childGender", "Jenis Kelamin", OPT.gender),
    f.text("childBirthPlace", "Tempat Kelahiran"),
    f.date("childBirthDate", "Tanggal Lahir"),
    ...(detail
      ? [
          f.time("childBirthTime", "Jam Kelahiran"),
          f.select("childDeliveryPlace", "Tempat Dilahirkan", OPT.delivery),
          f.select("childPlurality", "Jenis Kelahiran", OPT.plurality),
          f.text("childBirthOrder", "Kelahiran ke-", { placeholder: "Contoh: Pertama" }),
          f.select("childAttendant", "Penolong Kelahiran", OPT.attendant),
          f.text("childWeight", "Berat Bayi (Kg)"),
          f.text("childLength", "Panjang Bayi (Cm)"),
        ]
      : []),
  ],
});

export const ortu = (prefix, title) =>
  person(prefix, title, ["name", "nik", "birth", "occupation", "nationality", "address"]);

export const perkawinanOrtu = () => ({
  title: "Data Perkawinan Orang Tua",
  fields: [
    f.text("marriageCertificateNumber", "Nomor Kutipan Akta Perkawinan"),
    f.date("marriageDate", "Tanggal Perkawinan"),
    f.text("marriageRecordPlace", "Tempat Pencatatan Perkawinan", { optional: true }),
  ],
});

export const saksi = (n) => person(`witness${n}`, `Data Saksi ${n}`, ["name", "nik", "birth", "address"]);

export const almarhum = () => ({
  title: "Data Almarhum/Almarhumah",
  fields: [
    f.nik("deceasedNik", "NIK", { optional: true }),
    f.text("deceasedName", "Nama Lengkap"),
    f.select("deceasedGender", "Jenis Kelamin", OPT.gender),
    f.text("deceasedBirthPlace", "Tempat Lahir"),
    f.date("deceasedBirthDate", "Tanggal Lahir"),
    f.select("deceasedReligion", "Agama", OPT.religion),
    f.occupation("deceasedOccupation", "Pekerjaan"),
    f.date("deathDate", "Tanggal Meninggal"),
    f.time("deathTime", "Jam Meninggal"),
    f.text("deathPlace", "Tempat Meninggal"),
    f.text("deathCause", "Sebab Kematian"),
    f.area("deceasedAddress", "Alamat Terakhir", { span: 2 }),
  ],
});

export const pelaporKematian = (parts = null, title = "Data Pelapor") => {
  if (!parts) {
    return {
      title,
      fields: [
        f.text("reporterName", "Nama Lengkap Pelapor", { from: "fullName" }),
        f.nik("reporterNik", "NIK Pelapor", { from: "nik" }),
        f.text("reporterRelation", "Hubungan dengan Almarhum/ah", { placeholder: "Contoh: Anak, Istri, Saudara" }),
        f.area("reporterAddress", "Alamat Pelapor", { from: "address", span: 2 }),
      ],
    };
  }
  return {
    title,
    hint: "Terisi otomatis dari data warga berdasarkan NIK pemohon. Koreksi bila ada yang tidak sesuai.",
    fields: parts.map((p) => ({
      ...REPORTER[p](),
      ...(p === "reportDate" ? { default: localToday() } : {}),
      from: REPORTER_AUTO_FROM[p],
    })),
  };
};

/* ---------- Pernikahan ---------- */
export const akad = () => ({
  title: "Rencana Akad Nikah",
  fields: [
    f.date("akadDate", "Tanggal Akad"),
    f.time("akadTime", "Jam Akad"),
    f.text("akadPlace", "Tempat Akad Nikah", { span: 2 }),
  ],
});
const NIKAH = ["name", "nik", "birth", "nationality", "religion", "occupation", "education", "address"];
const RESIDENT_PARTS = {
  Name: "fullName", Nik: "nik", BirthPlace: "birthPlace", BirthDate: "birthDate", Gender: "gender",
  Religion: "religion", Occupation: "occupation", Education: "education", Nationality: "nationality",
  Marital: "maritalStatus", Address: "address",
};
const residentFields = (section, relation) => ({
  ...section,
  fields: section.fields.map((field) => {
    const suffix = Object.keys(RESIDENT_PARTS).find((part) => field.key.endsWith(part));
    return suffix ? { ...field, from: `${relation}:${RESIDENT_PARTS[suffix]}` } : field;
  }),
});
export const calonSuami = (parts = NIKAH) => residentFields(
  { ...person("groom", "Data Calon Suami", parts, [f.text("groomBin", "Bin (nama ayah)", { from: "asGroom:fatherName" })]), lookupKey: "groom" },
  "asGroom",
);
export const calonIstri = (parts = NIKAH) => residentFields(
  { ...person("bride", "Data Calon Istri", parts, [f.text("brideBinti", "Binti (nama ayah)", { from: "asBride:fatherName" })]), lookupKey: "bride" },
  "asBride",
);
export const ortuNikah = (prefix, title, binLabel) => {
  const relation = prefix === "child" ? "asGroom" : prefix === "childSpouse" ? "spouse" : String(prefix).toLowerCase().endsWith("father") ? "parentFather" : "parentMother";
  const lookupKey = prefix === "child" ? "groom" : prefix === "childSpouse" ? "bride" : undefined;
  const parentOf = /^groom/i.test(prefix) || ["father", "mother"].includes(prefix)
    ? "groom"
    : /^bride/i.test(prefix) ? "bride" : undefined;
  return residentFields(
    {
      ...person(prefix, title, ["name", "nik", "birth", "nationality", "religion", "occupation", "address"], [f.text(`${prefix}Bin`, binLabel, {
        from: `${relation}:fatherName`,
      })]),
      ...(lookupKey ? { lookupKey } : {}),
      parentOf,
    },
    relation,
  );
};

/* ---------- Kode wilayah "Diisi Oleh Petugas" (kop formulir Dukcapil: Kode-Nama Provinsi/Kab/Kecamatan/Desa, Nama Dusun, Nomor KK) ----------
   Kode & nama wilayah terisi default Kalurahan Bimomartani (34 / 04 / 11 / 020) dan boleh diubah petugas.
   Opsi: names  = sertakan kolom nama (Provinsi, Kab, Kecamatan, Desa). Matikan bila nama sudah ada di blok alamat surat itu.
         hamlet = sertakan pilihan Nama Dusun (pilih dari data dusun/dukuh atau ketik); hamletCode = kolom kode dusun. hamletKey = kunci field dusun.
         kk     = sertakan Nomor KK (terisi otomatis dari NIK pemohon) supaya ikut tampil di pratinjau. */
export const WILAYAH_KODE = {
  provinceCode: "34", provinceName: "Daerah Istimewa Yogyakarta",
  regencyCode: "04", regencyName: "Sleman",
  districtCode: "11", districtName: "Ngemplak",
  villageCode: "020", villageName: "Bimomartani",
};
export const kodeWilayahFields = ({ names = true, hamlet = true, hamletCode = hamlet, hamletKey = "hamlet", hamletOptional = false, kk = false } = {}) => {
  const pair = (key, label) => [
    f.text(`${key}Code`, `Kode ${label}`, { default: WILAYAH_KODE[`${key}Code`], placeholder: "Kode" }),
    ...(names ? [f.text(`${key}Name`, `Nama ${label}`, { default: WILAYAH_KODE[`${key}Name`] })] : []),
  ];
  return [
    ...pair("province", "Provinsi"),
    ...pair("regency", "Kabupaten/Kota"),
    ...pair("district", "Kecamatan"),
    ...pair("village", "Desa/Kalurahan"),
    ...(hamletCode ? [f.text("hamletCode", "Kode Dusun", { optional: true, placeholder: "Contoh: 01" })] : []),
    ...(hamlet ? [f.hamlet(hamletKey, "Dusun/Dukuh/Kampung", { from: "dusun", ...(hamletOptional ? { optional: true } : {}) })] : []),
    ...(kk ? [f.kk("kkNumber", "Nomor KK", { from: "familyCardNumber" })] : []),
  ];
};
export const kodeWilayah = (opts = {}, title = "Diisi Oleh Petugas (Kode Wilayah)") => ({
  title,
  hint: "Kode wilayah sudah terisi default Kalurahan Bimomartani; ubah bila perlu. Nama dusun dipilih dari data dusun/dukuh atau diketik.",
  fields: kodeWilayahFields(opts),
});

/* ---------- Alamat lengkap (surat pindah/datang, dll) ----------
   Opsi (opsional):
     from      = kunci data warga untuk mengisi "Alamat (jalan/nomor)" otomatis (mis. "address").
                 Dipakai pada alamat asal surat pindah: alamat asal = alamat pemohon, sekaligus dibaca applicantOf()
                 sebagai applicant.address.
     hamletFree = true → Dusun/Dukuh/Kampung berupa isian teks bebas (tanpa daftar dusun desa ini), mis. alamat tujuan pindah yang bisa di luar desa.
     hamlet    = false → sembunyikan Dusun/Dukuh/Kampung dari blok alamat (dipindah ke blok Kode Wilayah).
     phoneFrom = kunci data warga untuk mengisi "Telepon" otomatis (mis. "phoneNumber").
     scopeKey  = kunci field "Cakupan Kepindahan" di form (mis. "relocationTypeLabel"). Bila diisi, Desa/Kecamatan/Kab/Provinsi
                 menjadi dropdown yang boleh diketik manual dan terisi otomatis mengikuti cakupan (lihat wilayahByScope & scopeWilayah).
   Pemanggilan lama alamat("origin", "Judul") tetap berjalan seperti biasa. */
export const alamat = (prefix, title, { from, phoneFrom, fieldFrom = {}, defaults = {}, hamlet = true, hamletFree = false, scopeKey } = {}) => {
  const source = (suffix) => (fieldFrom[suffix] ? { from: fieldFrom[suffix] } : {});
  const fallback = (suffix) => (Object.prototype.hasOwnProperty.call(defaults, suffix) ? { default: defaults[suffix] } : {});
  const options = (suffix) => ({ ...source(suffix), ...fallback(suffix) });
  const wilayah = scopeKey
    ? wilayahByScope(prefix, scopeKey, options)
    : [
        f.text(`${prefix}Village`, "Desa/Kelurahan", options("village")),
        f.text(`${prefix}District`, "Kecamatan", options("district")),
        f.text(`${prefix}Regency`, "Kabupaten/Kota", options("regency")),
        f.text(`${prefix}Province`, "Provinsi", options("province")),
      ];
  return ({
  title,
  fields: [
    f.area(`${prefix}Address`, "Alamat (jalan/nomor)", { span: 2, ...(from ? { from } : {}) }),
    f.text(`${prefix}Rt`, "RT", options("rt")),
    f.text(`${prefix}Rw`, "RW", options("rw")),
    ...(hamlet ? [hamletFree ? f.text(`${prefix}Hamlet`, "Dusun/Dukuh/Kampung", { placeholder: "Ketik nama dusun/dukuh/kampung", ...options("hamlet") }) : f.hamlet(`${prefix}Hamlet`, "Dusun/Dukuh/Kampung", { optional: true, ...options("hamlet") })] : []),
    ...wilayah,
    f.text(`${prefix}PostalCode`, "Kode Pos", { optional: true, ...options("postalCode") }),
    f.text(`${prefix}Phone`, "Telepon", { optional: true, ...(phoneFrom ? { from: phoneFrom } : {}), ...options("phone") }),
  ],
  });
};

/* ---------- Atur susunan blok & isian PER FILE SURAT ----------
   Blok/isian surat dirakit dari fungsi bersama di atas (mis. birthReportSections dipakai 3 surat), jadi urutannya
   tidak bisa diubah di satu surat tanpa mengubah surat lain. `arrange` membuat salinan susunan itu lalu
   mengaturnya khusus untuk file surat yang memanggilnya — surat lain TIDAK ikut berubah.

   arrange(sections, {
     order:  ["Data Keluarga", "Data Bayi/Anak"],          // urutan blok (judul blok). Yang tidak disebut ikut di belakang.
     fields: { "Data Bayi/Anak": ["childName", "childNik"] }, // urutan isian di dalam blok (key). Yang tidak disebut ikut di belakang.
                                                            // Key dari blok lain ikut PINDAH ke blok ini.
     patch:  { childBirthOrder: { label: "Anak ke-", placeholder: "Contoh: Kedua", span: 2 } }, // ubah label/placeholder/span/optional
     drop:   ["childWeight"],                               // buang isian dari surat ini (juga tidak divalidasi)
   })
   Key harus tetap sama dengan variabel di blade. Hanya urutan/tampilan yang berubah, nilainya tetap dibagi antar surat. */
export function arrange(sections, spec = {}) {
  const { order = [], fields = {}, patch = {}, drop = [] } = spec;
  const pool = new Map(sections.flatMap((s) => s.fields.map((x) => [x.key, x])));
  const titles = new Set(sections.map((s) => s.title));
  for (const t of [...order, ...Object.keys(fields)]) if (!titles.has(t)) console.warn(`[arrange] Blok "${t}" tidak ditemukan.`);
  for (const k of [...Object.values(fields).flat(), ...Object.keys(patch), ...drop]) if (!pool.has(k)) console.warn(`[arrange] Isian "${k}" tidak ditemukan.`);

  const claimed = new Set(Object.values(fields).flat());
  const dropped = new Set(drop);
  const decorate = (x) => ({ ...x, ...(patch[x.key] ?? {}) });
  const built = sections
    .map((s) => {
      const listed = (fields[s.title] ?? []).filter((k, i, a) => a.indexOf(k) === i).map((k) => pool.get(k)).filter(Boolean);
      const rest = s.fields.filter((x) => !claimed.has(x.key));
      return { ...s, fields: [...listed, ...rest].filter((x) => !dropped.has(x.key)).map(decorate) };
    })
    .filter((s) => s.fields.length);
  const rank = (t) => (order.includes(t) ? order.indexOf(t) : order.length);
  return built.map((s, i) => ({ s, i })).sort((a, b) => rank(a.s.title) - rank(b.s.title) || a.i - b.i).map((o) => o.s);
}

/* Jadikan semua isian dalam satu blok opsional (mis. data pasangan terdahulu). */
export const optional = (section) => ({ ...section, fields: section.fields.map((x) => ({ ...x, optional: true })) });

/* ---------- Blok & dokumen yang dipakai bersama beberapa surat paket (nikah, kelahiran, kematian, Letter C) ---------- */
export const N7 = ["name", "nik", "birth", "nationality", "religion", "occupation", "address"]; // bagian data tanpa pendidikan
export const eduNat = () => [f.select("education", "Pendidikan Terakhir", OPT.education), f.text("nationality", "Kewarganegaraan", { default: "WNI" })];
export const calonPengantin = () => ({ title: "Calon Pengantin", fields: [f.text("groomName", "Nama Calon Suami"), f.text("brideName", "Nama Calon Istri")] });

export const DOC_LAHIR = "Surat keterangan lahir dari dokter/bidan/penolong kelahiran";
export const bayi = () => [keluarga(), anak({ detail: true }), ortu("mother", "Data Ibu Kandung"), ortu("father", "Data Ayah Kandung"), perkawinanOrtu(),
  pemohonRingkas([f.text("reporterRelation", "Hubungan pelapor dengan bayi", { placeholder: "Contoh: Ayah, Ibu, Kakek" })]), saksi(1), saksi(2)];
export const dokBayi = () => [DOC_LAHIR, DOC.kk, "Fotokopi KTP ayah dan ibu", DOC.akta, DOC.ktpSaksi];

export const jenazah = () => [keluarga(), almarhum(), pelaporKematian(), saksi(1), saksi(2)];
export const dokJenazah = () => [DOC.suratKematian, DOC.kk, "Fotokopi KTP almarhum/almarhumah", "Fotokopi KTP pelapor", DOC.ktpSaksi];

export const DOC_LETTER_C = "Fotokopi Letter C / bukti kepemilikan tanah";
export const DOC_PBB = opt("Fotokopi SPPT PBB");

/* ======================================================================================================
   SURAT KELAHIRAN (letters/birth/*.blade.php)
   Nama field (key) sengaja disamakan dengan variabel di template PDF resources/views/letters/birth/*.blade.php.
   ATURAN PENAMAAN  (camelCase dari path `$birth[...]` di blade)
   ------------------------------------------------------------------------------------------------
   blade                                   → key form
   $birth['family_card_number']            → familyCardNumber
   $birth['head_of_family_name']           → headOfFamilyName
   $birth['child']['birth_place']          → childBirthPlace          (child.*     → child…)
   $birth['mother']['rt'] / ['rw']         → motherRt / motherRw      (mother.*    → mother…; RT dan RW dipisah)
   $birth['father']['occupation']          → fatherOccupation         (father.*    → father…)
   $birth['marriage']['record_date']       → marriageRecordDate       (marriage.*  → marriage…)
   $birth['reporter']['report_date']       → reporterReportDate       (reporter.*  → reporter…)
   $birth['witnesses'][0]['nik']           → witness1Nik              ($w[0] = saksi 1, $w[1] = saksi 2)
   $birth['hamlet']['name']                → hamletName               (hamlet.*    → hamlet…)
   $birth['documents'] (centang)           → documents                (array kode dokumen)
   $applicant['kk_number']                 → kkNumber                 ($applicant.* = pemohon: name, nik, address, …)
   $form['family_relationship']            → familyRelationship

   Yang TIDAK menjadi field (diisi sistem/petugas): $village, $signature, $number, $signer, $decree[...],
   birth['application_number'], birth['report_kind'], birth['registrar_name'], dan child['birth_day_name']
   (hari lahir dihitung dari childBirthDate).

   PELAPOR ($birth['reporter'] → reporterNik, reporterName, reporterBirthPlace/Date, reporterAge, reporterOccupation,
   reporterAddress, reporterReportDate, reporterApplicationDate, reporterPhone) di ADMIN menjadi blok "Data Pelapor"
   (helper `pelapor()` di bawah), diisi petugas/admin kalurahan. Blok ini TIDAK ada di form public (warga).
   Pelapor = orang yang melaporkan ke Dukcapil, BUKAN otomatis ayah/ibu si anak. Jangan beri `from:` / alias ke key
   reporter* (diketik manual oleh petugas).

   Data warga yang terverifikasi (NIK) otomatis mengisi blok AYAH atau IBU, tergantung jenis kelamin NIK tersebut
   (lihat `from: "asFather:…" / "asMother:…"` dan makeResidentLookup di views/services/layout/formLogic.js).
   ====================================================================================================== */

export const birthFamily = keluarga;

/* ---------- Bayi / anak  ($birth['child']) ---------- */
const BIRTH_CHILD = {
  nik: () => f.nik("childNik", "NIK Anak", { optional: true, placeholder: "Isi bila sudah ada" }),
  name: () => f.text("childName", "Nama Lengkap Anak"),
  gender: () => f.select("childGender", "Jenis Kelamin", OPT.gender),
  deliveryPlace: () => f.select("childDeliveryPlace", "Tempat Dilahirkan", OPT.delivery),
  deliveryAddress: () => f.text("childDeliveryAddress", "Alamat RS/RB tempat dilahirkan", { span: 2 }),
  birthPlace: () => f.text("childBirthPlace", "Tempat Kelahiran"),
  birthDate: () => f.date("childBirthDate", "Tanggal Lahir"),
  birthTime: () => f.time("childBirthTime", "Jam Kelahiran"),
  plurality: () => f.select("childPlurality", "Jenis Kelahiran", OPT.plurality),
  birthOrder: () => f.text("childBirthOrder", "Kelahiran/Anak ke-", { placeholder: "Contoh: Pertama" }),
  birthAttendant: () => f.select("childBirthAttendant", "Penolong Kelahiran", OPT.attendant),
  weight: () => f.text("childWeight", "Berat Bayi (Kg)", { placeholder: "Contoh: 3.2" }),
  length: () => f.text("childLength", "Panjang Bayi (Cm)", { placeholder: "Contoh: 49" }),
  gestationalAge: () => f.text("childGestationalAge", "Umur kelahiran / usia kehamilan", { placeholder: "Contoh: 38 minggu" }),
  deliveryMethod: () => f.text("childDeliveryMethod", "Cara kelahiran", { placeholder: "Normal / Caesar" }),
  deliveryCost: () => f.text("childDeliveryCost", "Biaya kelahiran", { optional: true }),
};
/* Urutan sama dengan blade: birth-report-form, birth-attestation-letter, birth-registration-report, out-of-domicile-birth-report */
export const BIRTH_CHILD_FULL = ["nik", "name", "gender", "deliveryPlace", "birthPlace", "birthDate", "birthTime", "plurality", "birthOrder", "birthAttendant", "weight", "length"];
/* birth-report-statement (tanpa NIK, ada alamat RS/RB, umur/cara/biaya kelahiran) */
export const BIRTH_CHILD_STATEMENT = ["name", "gender", "deliveryPlace", "deliveryAddress", "birthPlace", "birthDate", "birthTime", "plurality", "birthOrder", "birthAttendant", "weight", "length", "gestationalAge", "deliveryMethod", "deliveryCost"];
export const birthChild = (parts = BIRTH_CHILD_FULL, title = "Data Bayi/Anak") => ({ title, fields: parts.map((p) => BIRTH_CHILD[p]()) });

/* ---------- Ibu / Ayah  ($birth['mother'], $birth['father']) ----------
   Terisi otomatis dari data warga HANYA untuk peran yang cocok dengan jenis kelamin NIK terverifikasi:
   NIK laki-laki → blok Ayah, NIK perempuan → blok Ibu. Blok yang lain dibiarkan kosong untuk diisi manual. */
const roleKey = (p) => (p === "father" ? "asFather" : "asMother");
const BIRTH_PARENT = {
  nik: (p) => f.nik(`${p}Nik`, "NIK", { from: `${roleKey(p)}:nik` }),
  name: (p) => f.text(`${p}Name`, "Nama Lengkap", { from: `${roleKey(p)}:fullName` }),
  birthPlace: (p) => f.text(`${p}BirthPlace`, "Tempat Lahir", { from: `${roleKey(p)}:birthPlace` }),
  birthDate: (p) => f.date(`${p}BirthDate`, "Tanggal Lahir", { from: `${roleKey(p)}:birthDate` }),
  age: (p) => f.text(`${p}Age`, "Umur (tahun)", { ...AGE, ageOf: `${p}BirthDate` }),
  occupation: (p) => f.occupation(`${p}Occupation`, "Pekerjaan", { from: `${roleKey(p)}:occupation` }),
  address: (p) => f.area(`${p}Address`, "Alamat", { from: `${roleKey(p)}:address`, span: 2 }),
  rtRw: (p) => [f.text(`${p}Rt`, "RT", { placeholder: "Contoh: 3" }), f.text(`${p}Rw`, "RW", { placeholder: "Contoh: 5" })], // 2 isian terpisah: ${p}Rt dan ${p}Rw
  nationality: (p) => f.text(`${p}Nationality`, "Kewarganegaraan", { default: "WNI" }),
  ethnicity: (p) => f.text(`${p}Ethnicity`, "Kebangsaan / Suku", { placeholder: "Contoh: Jawa" }),
};
const PARENT_HINT = { mother: "Terisi otomatis bila NIK yang Anda verifikasi milik ibu. Bila bukan, isi manual.", father: "Terisi otomatis bila NIK yang Anda verifikasi milik ayah. Bila bukan, isi manual." };
export const BIRTH_PARENT_FULL = ["nik", "name", "birthPlace", "birthDate", "occupation", "address", "rtRw", "nationality"];
export const BIRTH_PARENT_REGISTRATION = ["nik", "name", "birthPlace", "birthDate", "age", "occupation", "address", "rtRw", "nationality", "ethnicity"];
export const BIRTH_PARENT_BRIEF = ["nik", "name", "address", "rtRw"]; // birth-certificate-application-form
export const BIRTH_PARENT_STATEMENT = ["nik", "name", "birthPlace", "birthDate", "occupation", "address", "rtRw"]; // birth-report-statement (penandatangan = ayah/ibu, umur dihitung dari tanggal lahir)
/* marriageParts: data perkawinan yang di kertas termasuk bagian IBU (formulir pelaporan, surat keterangan kelahiran, luar domisili, pencatatan). */
const parentFields = (parts, p) => parts.flatMap((x) => [].concat(BIRTH_PARENT[x](p))); // bagian "rtRw" menghasilkan 2 isian (RT dan RW)
export const birthMother = (parts = BIRTH_PARENT_FULL, title = "Data Ibu Kandung", marriageParts = []) => ({
  title,
  hint: PARENT_HINT.mother,
  fields: [...parentFields(parts, "mother"), ...marriageParts.map((x) => BIRTH_MARRIAGE[x]())],
});
export const birthFather = (parts = BIRTH_PARENT_FULL, title = "Data Ayah Kandung") => ({ title, hint: PARENT_HINT.father, fields: parentFields(parts, "father") });

/* Laporan Kelahiran (birth-report-statement): yang bertanda tangan = ayah/ibu kandung → hubungan terisi dari jenis kelamin NIK. */
export const birthSigner = () => ({
  title: "Yang Bertanda Tangan",
  hint: "Orang tua yang membuat laporan ini. Data lengkapnya diisi pada blok Ibu/Ayah di bawah.",
  fields: [f.select("reporterRelationship", "Hubungan dengan bayi", ["Ayah", "Ibu"], { from: "parentRole" })],
});

/* ---------- Perkawinan orang tua  ($birth['marriage']) ---------- */
const BIRTH_MARRIAGE = {
  certificateNumber: () => f.text("marriageCertificateNumber", "Nomor Kutipan Akta Perkawinan"),
  date: () => f.date("marriageDate", "Tanggal Pernikahan"),
  recordPlace: () => f.text("marriageRecordPlace", "Tempat Pencatatan Perkawinan", { optional: true }),
  recordDate: () => f.date("marriageRecordDate", "Tanggal Pencatatan Perkawinan"),
};
export const BIRTH_MARRIAGE_APPLICATION = ["certificateNumber", "date"]; // birth-certificate-application-form → mar['certificate_number'], mar['date']
export const BIRTH_MARRIAGE_RECORD = ["recordPlace", "recordDate"]; // formulir/keterangan → mar['record_place'], mar['record_date']
export const BIRTH_MARRIAGE_REGISTRATION = ["certificateNumber", "recordPlace", "recordDate"]; // birth-registration-report
export const birthParentsMarriage = (parts = BIRTH_MARRIAGE_RECORD) => ({ title: "Data Perkawinan Orang Tua", fields: parts.map((p) => BIRTH_MARRIAGE[p]()) });

/* ---------- Pelapor  ($birth['reporter'] / pelapor kematian) — DIISI PETUGAS/ADMIN KALURAHAN ----------
   Dipakai surat kelahiran DAN kematian yang di kertasnya memuat blok PELAPOR (sumber: xlsx Form Identifikasi Layanan).
   Key sama di semua surat (reporterNik, reporterName, …) → di dalam satu paket cukup diisi sekali, surat lain ikut terisi.
   parts: nik name birthPlace birthDate age occupation address addressKtp phone reportDate applicationDate
   "Tanda Tangan" di xlsx tidak jadi field (area tanda tangan dicetak di kertas). */
const REPORTER = {
  nik: () => f.nik("reporterNik", "NIK"),
  name: () => f.text("reporterName", "Nama Lengkap"),
  birthPlace: () => f.text("reporterBirthPlace", "Tempat Lahir"),
  birthDate: () => f.date("reporterBirthDate", "Tanggal Lahir"),
  age: () => f.text("reporterAge", "Umur (tahun)", { ...AGE, ageOf: "reporterBirthDate" }),
  occupation: () => f.occupation("reporterOccupation", "Pekerjaan"),
  address: () => f.area("reporterAddress", "Alamat", { span: 2 }),
  addressKtp: () => f.area("reporterAddress", "Alamat (sesuai KTP)", { span: 2 }),
  phone: () => f.text("reporterPhone", "No HP / Telepon / Email Aktif", { optional: true }),
  reportDate: () => f.date("reporterReportDate", "Tanggal Lapor"),
  applicationDate: () => f.date("reporterApplicationDate", "Tanggal Permohonan"),
};
export const PELAPOR_FULL = ["nik", "name", "birthPlace", "birthDate", "age", "occupation", "address", "reportDate"]; // formulir pelaporan, surat keterangan kelahiran, luar domisili, formulir pelaporan kematian
export const PELAPOR_SKK = ["nik", "name", "birthPlace", "birthDate", "age", "occupation", "addressKtp", "reportDate"]; // surat keterangan kematian (alamat sesuai KTP)
export const PELAPOR_APPLICATION = ["nik", "name", "address", "phone", "applicationDate"]; // permohonan akta kelahiran / kematian
export const PELAPOR_REGISTRATION_BIRTH = ["nik", "name", "birthPlace", "birthDate", "age", "occupation", "address"]; // pelaporan pencatatan kelahiran
export const PELAPOR_REGISTRATION_DEATH = ["nik", "name", "birthPlace", "birthDate", "address"]; // pelaporan pencatatan kematian
export const PELAPOR_DECREE = ["name", "reportDate"]; // keputusan pencatatan kelahiran terlambat
export const PELAPOR_ATTORNEY = ["name", "occupation", "address"]; // penerima kuasa = pelapor (surat kuasa kelahiran)
export const pelapor = (parts = PELAPOR_FULL, title = "Data Pelapor", hint = "Data orang yang melaporkan ke Dukcapil (orang tua, keluarga, atau pihak lain yang melapor). Isi sesuai KTP pelapor.") => ({
  title,
  hint,
  fields: parts.map((p) => REPORTER[p]()),
});

/* Pelapor surat kematian di admin mengikuti NIK pemohon yang dicari di awal form.
   Data jenazah tetap memakai helper `deathDeceased()` tanpa sumber otomatis; hanya
   blok pelapor yang mengambil identitas pemohon. Tanggal lapor otomatis memakai hari saat form dibuka. */
const REPORTER_AUTO_FROM = {
  nik: "nik",
  name: "fullName",
  birthPlace: "birthPlace",
  birthDate: "birthDate",
  age: "age",
  occupation: "occupation",
  address: "address",
  addressKtp: "address",
  phone: "phoneNumber",
};
const localToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/* ---------- Saksi  ($birth['witnesses'][0] = Saksi I, [1] = Saksi II) ---------- */
export const birthWitness = (n) => ({
  title: `Data Saksi ${n}`,
  fields: [
    f.nik(`witness${n}Nik`),
    f.text(`witness${n}Name`, "Nama Lengkap"),
    f.text(`witness${n}Age`, "Umur (tahun)", { placeholder: "Contoh: 40" }),
    f.area(`witness${n}Address`, "Alamat", { span: 2 }),
  ],
});

/* ---------- Dukuh  ($birth['hamlet']) — tanda tangan "Mengetahui Dukuh ..." ---------- */
export const birthHamlet = () => ({
  title: "Dusun / Dukuh",
  fields: [f.text("hamletName", "Nama Dusun (Dukuh)"), f.text("hamletHeadName", "Nama Dukuh (untuk tanda tangan)", { optional: true })],
});

/* ---------- Nama penandatangan (OPSIONAL) ----------
   Dipakai surat yang di kertasnya punya kolom tanda tangan pihak lain (sumber: kolom "Keterangan TTD" pada
   Form Identifikasi Layanan). Penandatangan yang SUDAH punya isian (pemohon, pihak pertama/kedua, saksi, penerima/
   pemberi kuasa) tidak diulang di sini. Isian ini TIDAK wajib: dikosongkan = nama dicetak kosong / ditulis tangan.
   parts: hamletHead districtHead rtHead rwHead witness1 witness2 registrar officer districtOfficer receivingOfficer departmentHead notary
   Lurah / Petugas Kalurahan TIDAK dibuat form: penandatangannya sudah ditangani di otorisasi surat.
   Key sama di semua surat (hamletHeadName dst.) → dalam satu paket cukup diisi sekali. */
const SIGNER_NAME = {
  hamletHead: () => f.text("hamletHeadName", "Nama Dukuh", { optional: true }),
  districtHead: () => f.text("districtHeadName", "Nama Camat/Panewu", { optional: true }),
  rtHead: () => f.text("rtHeadName", "Nama Ketua RT", { optional: true }),
  rwHead: () => f.text("rwHeadName", "Nama Ketua RW", { optional: true }),
  witness1: () => f.text("witness1Name", "Nama Saksi I", { optional: true }),
  witness2: () => f.text("witness2Name", "Nama Saksi II", { optional: true }),
  registrar: () => f.text("registrarName", "Nama Petugas Registrasi", { optional: true }),
  officer: () => f.text("officerName", "Nama Petugas", { optional: true }),
  districtOfficer: () => f.text("districtOfficerName", "Nama Petugas Kecamatan", { optional: true }),
  receivingOfficer: () => f.text("receivingOfficerName", "Nama Petugas Penerima Berkas", { optional: true }),
  // Kepala Dinas (Dukcapil): nama + NIP. Satu "part" menghasilkan 2 isian.
  departmentHead: () => [
    f.text("departmentHeadName", "Nama Kepala Dinas", { optional: true }),
    f.text("departmentHeadNip", "NIP Kepala Dinas", { optional: true, placeholder: "Contoh: 19700101 199503 1 001" }),
  ],
  notary: () => f.text("notaryName", "Nama Notaris", { optional: true }),
};
export const signerNames = (parts, hint = "Opsional. Isi bila nama penandatangan ingin dicetak di bawah tanda tangan; kosongkan bila akan ditulis tangan.") => ({
  title: "Nama Penandatangan (Opsional)",
  hint,
  fields: parts.flatMap((p) => [].concat(SIGNER_NAME[p]())),
});

/* ---------- Susunan form yang SAMA PERSIS di beberapa blade ---------- */
/* birth-report-form, birth-attestation-letter, out-of-domicile-birth-report */
export const birthReportSections = () => [
  keluarga(), birthChild(BIRTH_CHILD_FULL), birthMother(BIRTH_PARENT_FULL, "Data Ibu Kandung", BIRTH_MARRIAGE_RECORD), birthFather(), pelapor(PELAPOR_FULL), birthWitness(1), birthWitness(2),
];
/* birth-registration-report (ada umur & kebangsaan orang tua, nomor akta nikah) */
export const birthRegistrationSections = () => [
  keluarga(), birthChild(BIRTH_CHILD_FULL), birthMother(BIRTH_PARENT_REGISTRATION, "Data Ibu Kandung", BIRTH_MARRIAGE_REGISTRATION), birthFather(BIRTH_PARENT_REGISTRATION),
  pelapor(PELAPOR_REGISTRATION_BIRTH), birthWitness(1), birthWitness(2),
];

/* ---------- Pemohon surat pernyataan pasangan suami istri  ($applicant) ---------- */
export const birthSpouseApplicant = () => ({
  title: "Data Pemohon",
  hint: "Terisi otomatis dari data warga. Koreksi bila ada yang tidak sesuai.",
  fields: [
    f.text("name", "Nama Lengkap", { from: "fullName" }),
    f.nik("nik", "NIK", { from: "nik" }),
    f.text("birthPlace", "Tempat Lahir", { from: "birthPlace" }),
    f.date("birthDate", "Tanggal Lahir", { from: "birthDate" }),
    f.occupation("occupation", "Pekerjaan", { from: "occupation" }),
    f.area("address", "Alamat", { from: "address", span: 2 }),
    f.kk("kkNumber", "Nomor KK"),
    f.select("familyRelationship", "Status hubungan keluarga", ["Suami", "Istri", "Anak"]),
  ],
});
/* $husband / $wife: name, nik, birth (tempat + tanggal), occupation, address */
export const birthSpousePerson = (prefix, title) => ({
  title,
  fields: [
    f.text(`${prefix}Name`, "Nama Lengkap"),
    f.nik(`${prefix}Nik`),
    f.text(`${prefix}BirthPlace`, "Tempat Lahir"),
    f.date(`${prefix}BirthDate`, "Tanggal Lahir"),
    f.occupation(`${prefix}Occupation`, "Pekerjaan"),
    f.area(`${prefix}Address`, "Alamat", { span: 2 }),
  ],
});

/* ---------- Ceklis dokumen pada Permohonan Akta Kelahiran  ($birth['documents']) ----------
   `value` = kunci yang dicocokkan blade lewat in_array($key, $birth['documents']). */
export const BIRTH_DOCUMENT_OPTIONS = [
  { value: "medical_birth_attestation", label: "Surat Keterangan lahir dari dokter/bidan/penolong kelahiran" },
  { value: "village_birth_attestation", label: "Surat keterangan kelahiran" },
  { value: "marriage_certificate_copy", label: "Fotokopi buku nikah/kutipan akta perkawinan orang tua (dilegalisir)" },
  { value: "family_card_copy", label: "Fotokopi Kartu Keluarga (KK) orang tua/wali" },
  { value: "parents_id_copy", label: "Fotokopi KTP-el orang tua/wali/pelapor" },
  { value: "witnesses_id_copy", label: "Fotokopi KTP-el 2 (dua) orang saksi" },
  { value: "power_of_attorney", label: "Surat Kuasa dan fotokopi KTP-el penerima kuasa" },
  { value: "passport_copy", label: "Fotokopi paspor bagi WNI bukan penduduk dan orang asing" },
  { value: "temporary_residence_certificate", label: "Fotokopi SKKT orang tua bagi pemegang ITAS" },
  { value: "office_head_decree", label: "Surat Keputusan Kepala Dinas Kependudukan dan Pencatatan Sipil" },
  { value: "sptjm_birth_data", label: "SPTJM Kebenaran Data Kelahiran" },
  { value: "sptjm_spouse_status", label: "SPTJM Kebenaran Sebagai Pasangan Suami Istri" },
];
export const birthDocumentsChecklist = () => ({
  title: "Dokumen yang Dilampirkan",
  hint: "Centang dokumen yang Anda lampirkan. Akan tercetak sebagai tanda X pada formulir.",
  fields: [f.checks("documents", "Dokumen yang dilampirkan", BIRTH_DOCUMENT_OPTIONS, { cols: 1, optional: true })],
});

/* ======================================================================================================
   SURAT KEMATIAN (letters/death/*.blade.php)
   Sumber isian: xlsx "Form Identifikasi Layanan" (baris 44–60). Tiap surat memilih bagian (parts) sesuai urutan di xlsx.
   Key: awalan deceased = jenazah, mother / father = ibu / ayah, witnessN = saksi.

   PELAPOR (NIK, nama, TTL, umur, pekerjaan, alamat, no HP, tanggal lapor) di ADMIN menjadi blok "Data Pelapor"
   (helper `pelapor()` di atas, key reporter*), diisi petugas/admin kalurahan seperti kelahiran. Tidak ada di form public
   dan tidak disambungkan ke data warga (lihat ALIAS_MATI di letterBundles.js).
   "Yang Bertanda Tangan" (Laporan Kematian, SPTJM, Surat Kuasa) = pemohon, terisi otomatis dari data warga.
   Umur penandatangan dihitung dari tanggal lahir, jadi bukan field.
   "Perhitungan Selamatan" (3 hari s.d. 1000 hari) dihitung sistem dari deathDate, bukan field.
   ====================================================================================================== */
export const DEATH_CAUSE = ["Sakit biasa/tua", "Wabah penyakit", "Kecelakaan", "Kriminalitas", "Bunuh diri", "Lainnya"];
export const DEATH_INFORMANT = ["Dokter", "Tenaga Kesehatan", "Kepolisian", "Lainnya"];

/* ---------- Jenazah ---------- */
const DEATH_DECEASED = {
  kk: () => [f.kk("familyCardNumber")],
  nik: () => [f.nik("deceasedNik", "NIK", { optional: true })],
  name: () => [f.text("deceasedName", "Nama Lengkap")],
  gender: () => [f.select("deceasedGender", "Jenis Kelamin", OPT.gender)],
  birthPlace: () => [f.text("deceasedBirthPlace", "Tempat Kelahiran")],
  birthDate: () => [f.date("deceasedBirthDate", "Tanggal Lahir")],
  age: () => [f.text("deceasedAge", "Umur (tahun)", { optional: true, placeholder: "Otomatis dari tanggal lahir; isi manual bila tanggal lahir tidak diketahui", ageOf: "deceasedBirthDate" })],
  religion: () => [f.select("deceasedReligion", "Agama", OPT.religion)],
  occupation: () => [f.occupation("deceasedOccupation", "Pekerjaan")],
  address: () => [f.area("deceasedAddress", "Alamat", { span: 2 })],
  childOrder: () => [f.text("deceasedChildOrder", "Anak ke- (dengan huruf)", { optional: true, placeholder: "Contoh: Kedua" })], // tidak dipakai lagi (dihapus dari semua surat kematian); dibiarkan agar file lama yang masih menyebut "childOrder" tidak error
  deathDate: () => [f.date("deathDate", "Tanggal Meninggal", { dayKey: "deathDay" })],
  deathDay: () => [f.text("deathDay", "Hari Meninggal", { placeholder: "Terisi otomatis dari tanggal" })],
  deathTime: () => [f.time("deathTime", "Jam Meninggal")],
  deathCause: () => [f.select("deathCause", "Sebab", DEATH_CAUSE)],
  deathCauseDetail: () => [f.text("deathCauseDetail", "Rincian Sebab")],
  deathPlace: () => [f.text("deathPlace", "Tempat Kematian")],
  deathCity: () => [f.text("deathCity", "Kab/Kota Meninggal")],
  deathLocation: () => [f.text("deathLocation", "Tempat Meninggal")], // hanya Surat Keterangan Kematian (xlsx memuat Tempat Meninggal DAN Tempat Kematian)
  informant: () => [f.select("deathInformant", "Yang Menerangkan", DEATH_INFORMANT)],
};
/* labels: ganti label per surat bila xlsx memakai istilah lain, mis. { birthPlace: "Tempat Dilahirkan" } */
export const deathDeceased = (parts, title = "Data Jenazah", labels = {}) => ({
  title,
  fields: parts.flatMap((p) => DEATH_DECEASED[p]().map((x) => (labels[p] ? { ...x, label: labels[p] } : x))),
});

/* Urutan SAMA di Formulir Pelaporan Kematian & Surat Keterangan Kematian ("Anak ke" sudah dihapus) */
export const DEATH_JENAZAH_FORM = ["nik", "name", "gender", "birthPlace", "birthDate", "age", "religion", "occupation", "address", "deathDate", "deathDay", "deathTime", "deathCause", "deathPlace", "informant"];

/* Surat Keterangan Kematian: sama seperti di atas, ditambah "Tempat Meninggal" (no. 11 di xlsx) setelah Hari/Tanggal */
export const DEATH_JENAZAH_SKK = ["nik", "name", "gender", "birthPlace", "birthDate", "age", "religion", "occupation", "address", "deathDate", "deathDay", "deathLocation", "deathTime", "deathCause", "deathPlace", "informant"];

/* ---------- Ibu / Ayah jenazah ---------- */
const DEATH_PARENT = {
  // NIK & nama orang tua jenazah tidak wajib: data warga lama sering tidak lengkap
  nik: (p) => [f.nik(`${p}Nik`, "NIK", { optional: true, placeholder: "Kosongkan bila tidak ada / tidak diketahui" })],
  name: (p) => [f.text(`${p}Name`, "Nama Lengkap", { optional: true, placeholder: "Kosongkan bila tidak diketahui" })],
  birthPlace: (p) => [f.text(`${p}BirthPlace`, "Tempat Lahir")],
  birthDate: (p) => [f.date(`${p}BirthDate`, "Tanggal Lahir")],
  age: (p) => [f.text(`${p}Age`, "Umur (tahun)", { optional: true, placeholder: "Otomatis dari tanggal lahir; isi manual bila tanggal lahir tidak diketahui", ageOf: `${p}BirthDate` })],
  occupation: (p) => [f.occupation(`${p}Occupation`, "Pekerjaan")],
  address: (p) => [f.area(`${p}Address`, "Alamat", { span: 2 })],
  addressKtp: (p) => [f.area(`${p}Address`, "Alamat (sesuai KTP)", { span: 2 })],
  nationality: (p) => [f.text(`${p}Nationality`, "Kewarganegaraan", { default: "WNI" })],
};
export const deathParent = (prefix, title, parts) => ({ title, fields: parts.flatMap((p) => DEATH_PARENT[p](prefix)) });

/* ---------- Saksi I & II (Formulir/SKK: NIK, nama, umur, alamat. Pencatatan: + tanggal lahir) ---------- */
const DEATH_WITNESS = {
  nik: (n) => [f.nik(`witness${n}Nik`)],
  name: (n) => [f.text(`witness${n}Name`, "Nama Lengkap")],
  birthDate: (n) => [f.date(`witness${n}BirthDate`, "Tanggal Lahir")],
  age: (n) => [f.text(`witness${n}Age`, "Umur (tahun)", { placeholder: "Contoh: 40" })],
  ageOptional: (n) => [f.text(`witness${n}Age`, "Umur (tahun)", { optional: true, placeholder: "Otomatis dari tanggal lahir; isi manual bila tanggal lahir tidak diketahui", ageOf: `witness${n}BirthDate` })],
  address: (n) => [f.area(`witness${n}Address`, "Alamat", { span: 2 })],
};
export const deathWitness = (n, parts = ["nik", "name", "age", "address"]) => ({ title: `Data Saksi ${n}`, fields: parts.flatMap((p) => DEATH_WITNESS[p](n)) });

/* ---------- Yang bertanda tangan / pemohon (terisi otomatis dari data warga) ---------- */
const DEATH_SIGNER = {
  nik: () => [f.nik("nik", "NIK", { from: "nik" })],
  name: () => [f.text("name", "Nama Lengkap", { from: "fullName" })],
  birthPlace: () => [f.text("birthPlace", "Tempat Lahir", { from: "birthPlace" })],
  birthDate: () => [f.date("birthDate", "Tanggal Lahir", { from: "birthDate" })],
  occupation: () => [f.occupation("occupation", "Pekerjaan", { from: "occupation" })],
  address: () => [f.area("address", "Alamat", { from: "address", span: 2 })],
  relation: () => [f.text("deceasedRelation", "Hubungan dengan yang meninggal", { placeholder: "Contoh: Anak, Istri, Saudara" })],
};
export const deathSigner = (parts, title = "Yang Bertanda Tangan") => ({
  title,
  hint: "Terisi otomatis dari data warga. Koreksi bila ada yang tidak sesuai.",
  fields: parts.flatMap((p) => DEATH_SIGNER[p]()),
});