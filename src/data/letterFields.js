/* Kumpulan "cetakan" isian yang dipakai berulang oleh file-file surat.
   Satu surat = satu file .vue yang menyusun `sections` + `documents` dari sini. */

/* ---------- Pilihan dropdown ---------- */
export const OPT = {
  gender: ["Laki-laki", "Perempuan"],
  religion: ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu"],
  marital: ["Belum Kawin", "Kawin", "Kawin Tercatat", "Kawin Belum Tercatat", "Cerai Hidup", "Cerai Mati"],
  education: ["Tidak/Belum Sekolah", "SD", "SMP", "SMA/SMK", "D1/D2/D3", "D4/S1", "S2", "S3"],
  occupation: ["Belum/Tidak Bekerja", "Pelajar/Mahasiswa", "Ibu Rumah Tangga", "Petani", "Buruh", "Wiraswasta", "Karyawan Swasta", "PNS/ASN", "TNI/Polri", "Pensiunan"],
  shdk: ["Kepala Keluarga", "Suami", "Istri", "Anak", "Menantu", "Cucu", "Orang Tua", "Mertua", "Famili Lain", "Pembantu", "Lainnya"],
  kkStatus: ["Numpang KK", "Membuat KK Baru", "Nomor KK Tetap"],
  delivery: ["Rumah Sakit", "Puskesmas", "Polindes", "Rumah Bersalin", "Rumah", "Lainnya"],
  attendant: ["Dokter", "Bidan", "Dukun", "Lainnya"],
  plurality: ["Tunggal", "Kembar 2", "Kembar 3", "Kembar 4", "Lainnya"],
};

/* ---------- Pembuat field ---------- */
const make = (type) => (key, label, opts = {}) => ({ key, label, type, ...opts });
export const f = {
  text: make("text"),
  area: make("textarea"),
  select: (key, label, options, opts = {}) => ({ key, label, type: "select", options, ...opts }),
  date: make("date"),
  time: make("time"),
  /** checkbox banyak pilihan (nilai = array) */
  checks: (key, label, options, opts = {}) => ({ key, label, type: "checks", options, ...opts }),
  /** daftar baris berulang (anggota keluarga, saksi, dst). columns = [{ key, label, type?, options? }] */
  rows: (key, label, columns, opts = {}) => ({ key, label, type: "rows", columns, ...opts }),
  nik: (key, label = "NIK", opts = {}) => ({ key, label, type: "text", digits: 16, placeholder: "16 digit NIK", ...opts }),
  kk: (key, label = "Nomor KK", opts = {}) => ({ key, label, type: "text", digits: 16, placeholder: "16 digit Nomor KK", ...opts }),
};

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

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
    f.select("occupation", "Pekerjaan", OPT.occupation, { from: "occupation", editable: true }),
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
  occupation: (p) => [f.select(`${p}Occupation`, "Pekerjaan", OPT.occupation, { editable: true })],
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
    f.select("deceasedOccupation", "Pekerjaan", OPT.occupation, { editable: true }),
    f.date("deathDate", "Tanggal Meninggal"),
    f.time("deathTime", "Jam Meninggal"),
    f.text("deathPlace", "Tempat Meninggal"),
    f.text("deathCause", "Sebab Kematian"),
    f.area("deceasedAddress", "Alamat Terakhir", { span: 2 }),
  ],
});

export const pelaporKematian = () => ({
  title: "Data Pelapor",
  fields: [
    f.text("reporterName", "Nama Lengkap Pelapor", { from: "fullName" }),
    f.nik("reporterNik", "NIK Pelapor", { from: "nik" }),
    f.text("reporterRelation", "Hubungan dengan Almarhum/ah", { placeholder: "Contoh: Anak, Istri, Saudara" }),
    f.area("reporterAddress", "Alamat Pelapor", { from: "address", span: 2 }),
  ],
});

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
export const calonSuami = (parts = NIKAH) => person("groom", "Data Calon Suami", parts, [f.text("groomBin", "Bin (nama ayah)")]);
export const calonIstri = (parts = NIKAH) => person("bride", "Data Calon Istri", parts, [f.text("brideBinti", "Binti (nama ayah)")]);
export const ortuNikah = (prefix, title, binLabel) =>
  person(prefix, title, ["name", "nik", "birth", "nationality", "religion", "occupation", "address"], [f.text(`${prefix}Bin`, binLabel)]);

/* ---------- Alamat lengkap (surat pindah/datang, dll) ---------- */
export const alamat = (prefix, title) => ({
  title,
  fields: [
    f.area(`${prefix}Address`, "Alamat (jalan/nomor)", { span: 2 }),
    f.text(`${prefix}Rt`, "RT"),
    f.text(`${prefix}Rw`, "RW"),
    f.text(`${prefix}Hamlet`, "Dusun/Dukuh/Kampung", { optional: true }),
    f.text(`${prefix}Village`, "Desa/Kelurahan"),
    f.text(`${prefix}District`, "Kecamatan"),
    f.text(`${prefix}Regency`, "Kabupaten/Kota"),
    f.text(`${prefix}Province`, "Provinsi"),
    f.text(`${prefix}PostalCode`, "Kode Pos", { optional: true }),
    f.text(`${prefix}Phone`, "Telepon", { optional: true }),
  ],
});

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
   $birth['mother']['rt_rw']               → motherRtRw               (mother.*    → mother…)
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
   reporterAddress, reporterReportDate, reporterApplicationDate, reporterPhone) JUGA TIDAK menjadi field warga:
   diisi petugas/admin kalurahan SETELAH pengajuan masuk. Pelapor = perangkat/petugas yang melaporkan ke Dukcapil,
   BUKAN otomatis ayah/ibu si anak. Jangan beri `from:` / alias ke key reporter* di form warga.

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
  age: (p) => f.text(`${p}Age`, "Umur (tahun)", { placeholder: "Contoh: 30" }),
  occupation: (p) => f.select(`${p}Occupation`, "Pekerjaan", OPT.occupation, { from: `${roleKey(p)}:occupation`, editable: true }),
  address: (p) => f.area(`${p}Address`, "Alamat", { from: `${roleKey(p)}:address`, span: 2 }),
  rtRw: (p) => f.text(`${p}RtRw`, "RT / RW", { placeholder: "Contoh: RT 003 / RW 005" }),
  nationality: (p) => f.text(`${p}Nationality`, "Kewarganegaraan", { default: "WNI" }),
  ethnicity: (p) => f.text(`${p}Ethnicity`, "Kebangsaan / Suku", { placeholder: "Contoh: Jawa" }),
};
const PARENT_HINT = { mother: "Terisi otomatis bila NIK yang Anda verifikasi milik ibu. Bila bukan, isi manual.", father: "Terisi otomatis bila NIK yang Anda verifikasi milik ayah. Bila bukan, isi manual." };
export const BIRTH_PARENT_FULL = ["nik", "name", "birthPlace", "birthDate", "occupation", "address", "rtRw", "nationality"];
export const BIRTH_PARENT_REGISTRATION = ["nik", "name", "birthPlace", "birthDate", "age", "occupation", "address", "rtRw", "nationality", "ethnicity"];
export const BIRTH_PARENT_BRIEF = ["nik", "name", "address", "rtRw"]; // birth-certificate-application-form
export const BIRTH_PARENT_STATEMENT = ["nik", "name", "birthPlace", "birthDate", "occupation", "address", "rtRw"]; // birth-report-statement (penandatangan = ayah/ibu, umur dihitung dari tanggal lahir)
/* marriageParts: data perkawinan yang di kertas termasuk bagian IBU (formulir pelaporan, surat keterangan kelahiran, luar domisili, pencatatan). */
export const birthMother = (parts = BIRTH_PARENT_FULL, title = "Data Ibu Kandung", marriageParts = []) => ({
  title,
  hint: PARENT_HINT.mother,
  fields: [...parts.map((x) => BIRTH_PARENT[x]("mother")), ...marriageParts.map((x) => BIRTH_MARRIAGE[x]())],
});
export const birthFather = (parts = BIRTH_PARENT_FULL, title = "Data Ayah Kandung") => ({ title, hint: PARENT_HINT.father, fields: parts.map((x) => BIRTH_PARENT[x]("father")) });

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

/* ---------- Pelapor  ($birth['reporter']) — DIISI PETUGAS/ADMIN KALURAHAN, bukan warga ----------
   Sengaja tidak ada field untuk pelapor di form warga (lihat catatan di atas). Antarmuka admin yang mengisi:
   reporterNik, reporterName, reporterBirthPlace, reporterBirthDate, reporterAge, reporterOccupation,
   reporterAddress, reporterReportDate, reporterApplicationDate, reporterPhone. */

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

/* ---------- Susunan form yang SAMA PERSIS di beberapa blade ---------- */
/* birth-report-form, birth-attestation-letter, out-of-domicile-birth-report */
export const birthReportSections = () => [
  keluarga(), birthChild(BIRTH_CHILD_FULL), birthMother(BIRTH_PARENT_FULL, "Data Ibu Kandung", BIRTH_MARRIAGE_RECORD), birthFather(), birthWitness(1), birthWitness(2),
];
/* birth-registration-report (ada umur & kebangsaan orang tua, nomor akta nikah) */
export const birthRegistrationSections = () => [
  keluarga(), birthChild(BIRTH_CHILD_FULL), birthMother(BIRTH_PARENT_REGISTRATION, "Data Ibu Kandung", BIRTH_MARRIAGE_REGISTRATION), birthFather(BIRTH_PARENT_REGISTRATION),
  birthWitness(1), birthWitness(2),
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
    f.select("occupation", "Pekerjaan", OPT.occupation, { from: "occupation", editable: true }),
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
    f.select(`${prefix}Occupation`, "Pekerjaan", OPT.occupation, { editable: true }),
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

   PELAPOR (NIK, nama, TTL, umur, pekerjaan, alamat, no HP, tanggal lapor, tanda tangan) TIDAK menjadi field warga:
   diisi petugas/admin kalurahan, sama seperti kelahiran (lihat ALIAS_MATI di letterBundles.js).
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
  age: () => [f.text("deceasedAge", "Umur (tahun)", { optional: true, placeholder: "Isi bila tanggal lahir tidak diketahui" })],
  religion: () => [f.select("deceasedReligion", "Agama", OPT.religion)],
  occupation: () => [f.select("deceasedOccupation", "Pekerjaan", OPT.occupation, { editable: true })],
  address: () => [f.area("deceasedAddress", "Alamat", { span: 2 })],
  childOrder: () => [f.text("deceasedChildOrder", "Anak ke- (dengan huruf)", { placeholder: "Contoh: Kedua" })],
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

/* Urutan SAMA di Formulir Pelaporan Kematian & Surat Keterangan Kematian */
export const DEATH_JENAZAH_FORM = ["nik", "name", "gender", "birthPlace", "birthDate", "age", "religion", "occupation", "address", "childOrder", "deathDate", "deathDay", "deathTime", "deathCause", "deathPlace", "informant"];

/* Surat Keterangan Kematian: sama seperti di atas, ditambah "Tempat Meninggal" (no. 11 di xlsx) setelah Hari/Tanggal */
export const DEATH_JENAZAH_SKK = ["nik", "name", "gender", "birthPlace", "birthDate", "age", "religion", "occupation", "address", "childOrder", "deathDate", "deathDay", "deathLocation", "deathTime", "deathCause", "deathPlace", "informant"];

/* ---------- Ibu / Ayah jenazah ---------- */
const DEATH_PARENT = {
  nik: (p) => [f.nik(`${p}Nik`)],
  name: (p) => [f.text(`${p}Name`, "Nama Lengkap")],
  birthPlace: (p) => [f.text(`${p}BirthPlace`, "Tempat Lahir")],
  birthDate: (p) => [f.date(`${p}BirthDate`, "Tanggal Lahir")],
  age: (p) => [f.text(`${p}Age`, "Umur (tahun)", { optional: true, placeholder: "Isi bila tanggal lahir tidak diketahui" })],
  occupation: (p) => [f.select(`${p}Occupation`, "Pekerjaan", OPT.occupation, { editable: true })],
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
  ageOptional: (n) => [f.text(`witness${n}Age`, "Umur (tahun)", { optional: true, placeholder: "Isi bila tanggal lahir tidak diketahui" })],
  address: (n) => [f.area(`witness${n}Address`, "Alamat", { span: 2 })],
};
export const deathWitness = (n, parts = ["nik", "name", "age", "address"]) => ({ title: `Data Saksi ${n}`, fields: parts.flatMap((p) => DEATH_WITNESS[p](n)) });

/* ---------- Yang bertanda tangan / pemohon (terisi otomatis dari data warga) ---------- */
const DEATH_SIGNER = {
  nik: () => [f.nik("nik", "NIK", { from: "nik" })],
  name: () => [f.text("name", "Nama Lengkap", { from: "fullName" })],
  birthPlace: () => [f.text("birthPlace", "Tempat Lahir", { from: "birthPlace" })],
  birthDate: () => [f.date("birthDate", "Tanggal Lahir", { from: "birthDate" })],
  occupation: () => [f.select("occupation", "Pekerjaan", OPT.occupation, { from: "occupation", editable: true })],
  address: () => [f.area("address", "Alamat", { from: "address", span: 2 })],
  relation: () => [f.text("deceasedRelation", "Hubungan dengan yang meninggal", { placeholder: "Contoh: Anak, Istri, Saudara" })],
};
export const deathSigner = (parts, title = "Yang Bertanda Tangan") => ({
  title,
  hint: "Terisi otomatis dari data warga. Koreksi bila ada yang tidak sesuai.",
  fields: parts.flatMap((p) => DEATH_SIGNER[p]()),
});