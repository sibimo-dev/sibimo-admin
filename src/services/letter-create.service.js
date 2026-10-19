import { createLetterRequest } from "./letter-request.service";
import { getLetterTypes, getFields } from "./letter-type.service";
import { getBackendLetterCode } from "@/data/letterBackendMap";

// Key generik yang dipakai untuk dua isian berbeda: label di form yang menentukan ("Tujuan" vs "Pergi ke").
/* Pasangan yang sudah dipastikan dari backend asli: { slug: { keyDiForm: "label ATAU field_key backend" } } */
const EXTRA_OVERRIDES = {
  "ktp-application-form": { applicationType: "Jenis Permohonan KTP" },
};
/* Wilayah kalurahan: field backend wajib yang tidak ada isiannya di form (diisi sistem, bukan pemohon). Ubah di sini bila perlu. */
const WILAYAH = { provinsi: "Daerah Istimewa Yogyakarta", kabupaten: "Sleman", kecamatan: "Ngemplak", desa: "Bimomartani" };
function wilayahFor(f) {
  const t = String(f.field_label || f.field_key || "").toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\b(pemerintah|nama|kalurahan|kelurahan|kapanewon)\b/g, (m) => (m === "pemerintah" || m === "nama" ? "" : m === "kalurahan" || m === "kelurahan" ? "desa" : "kecamatan")).replace(/\s+/g, " ").trim();
  return WILAYAH[t] ?? null;
}
const LABEL_FIRST_KEYS = new Set(["destination"]);
const isPergiLabel = (label) => /\bpergi\b/i.test(String(label ?? ""));

// label isian form per surat (key -> label), dipakai untuk membedakan key generik seperti `destination`
const letterModules = import.meta.glob("@/data/letters/*/*.js");
export async function loadLetterMeta(slug) {
  try {
    const path = Object.keys(letterModules).find((p) => p.endsWith(`/${slug}.js`));
    if (!path) return { labels: {}, documents: [] };
    const mod = await letterModules[path]();
    const labels = {};
    for (const sec of mod.sections ?? []) for (const f of sec.fields) labels[f.key] = f.label;
    return { labels, documents: mod.documents ?? [] };
  } catch { return { labels: {}, documents: [] }; }
}

/* Field wajib backend yang sebenarnya adalah DOKUMEN yang diunggah di langkah 2 (mis. "Spesimen Tanda Tangan",
   "Pas Foto"): dianggap terisi lewat dokumen itu. Bila berkas diunggah -> "Terlampir: <nama file>";
   bila berkas fisik diserahkan langsung ke kalurahan -> teks itu. Hanya untuk field wajib yang belum terisi. */
const DOC_STOP = new Set(["atau", "dan", "dari", "yang", "untuk", "bila", "jika", "di", "ke", "asli", "fotokopi", "kopi"]);
const DOC_WORDS = new Set(["spesimen", "foto", "scan"]);
const docTokens = (t) => String(t ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\([^)]*\)/g, " ").split(/[^a-z0-9]+/).filter((w) => w && !DOC_STOP.has(w));
export function fillFromDocuments(fields, backendFields, documents = [], files = []) {
  const out = { ...fields };
  const docLabels = documents.map((d) => (typeof d === "string" ? d : d?.label)).filter(Boolean);
  for (const f of backendFields) {
    const k = String(f.field_key);
    if (!f.is_required || (out[k] !== undefined && out[k] !== "")) continue;
    const ft = docTokens(f.field_label);
    if (!ft.length || (ft.length < 2 && !DOC_WORDS.has(ft[0]))) continue;
    const hit = docLabels.filter((l) => { const dt = new Set(docTokens(l)); return ft.every((w) => dt.has(w)); });
    if (hit.length !== 1) continue;
    const up = files.find((x) => x.label === hit[0]);
    out[k] = up ? `Terlampir: ${up.file?.name || hit[0]}` : "Diserahkan langsung ke kalurahan";
  }
  return out;
}

/* Nilai netral untuk field backend wajib yang belum punya isian di form, sesuai tipe field-nya. */
const PLACEHOLDER = "-";
function placeholderFor(f) {
  const type = String(f.field_type ?? "text").toLowerCase();
  if (type === "number") return "0";
  if (type === "date") return new Date().toISOString().slice(0, 10);
  if (type === "select") {
    let opts = f.options;
    if (typeof opts === "string") { try { opts = JSON.parse(opts); } catch { opts = opts.split(/\r?\n/); } }
    const first = Array.isArray(opts) ? opts[0] : null;
    const val = first && typeof first === "object" ? first.value ?? first.label : first;
    return val ? String(val) : PLACEHOLDER;
  }
  return PLACEHOLDER;
}
export function fillRequiredPlaceholders(fields, backendFields = []) {
  const out = { ...fields };
  for (const f of backendFields) {
    const k = String(f.field_key);
    if (f.is_required && (out[k] === undefined || out[k] === null || out[k] === "")) out[k] = placeholderFor(f);
  }
  return out;
}

export const LETTER_SOURCE = "Manual (Kelurahan)";
const LOCAL_MODE = import.meta.env.VITE_LETTER_MODE === "local";
const LOCAL_STORAGE_KEY = "sibimo_local_letter_requests_v1";

let typesPromise = null;
function loadTypes() {
  typesPromise ??= getLetterTypes().catch((err) => { typesPromise = null; throw err; });
  return typesPromise;
}

/* Dipakai LetterWizard & BundleWizard untuk menampilkan pesan error dari backend (validasi / message). */
export function getLetterRequestError(error, fallback = "Pengajuan surat gagal dikirim.") {
  const response = error?.response?.data;
  const validationErrors = response?.errors && typeof response.errors === "object"
    ? Object.values(response.errors).flat().filter(Boolean)
    : [];
  const validationMessage = [...new Set(validationErrors)].join(" ");
  return validationMessage || response?.message || error?.message || fallback;
}

const norm = (v) => String(v ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
const snake = (v) => String(v ?? "").replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "").toLowerCase();

const aliases = {
  applicantName: ["nama", "nama_pemohon", "nama_lengkap", "applicant_name"],
  fullName: ["nama", "nama_pemohon", "nama_lengkap", "applicant_name"],
  name: ["nama", "nama_pemohon", "nama_lengkap", "applicant_name"],
  applicantNik: ["nik", "nik_pemohon", "applicant_nik"],
  nik: ["nik", "nik_pemohon", "applicant_nik"],
  applicantAddress: ["alamat", "alamat_pemohon", "alamat_lengkap", "applicant_address"],
  address: ["alamat", "alamat_pemohon", "alamat_lengkap", "applicant_address"],
  applicantPhone: ["nomor_telepon", "no_telepon", "no_hp", "nomor_hp", "applicant_phone"],
  phone: ["nomor_telepon", "no_telepon", "no_hp", "nomor_hp", "applicant_phone"],
  birthPlace: ["tempat_lahir"], birthDate: ["tanggal_lahir"], gender: ["jenis_kelamin"],
  maritalStatus: ["status_perkawinan"], religion: ["agama"], occupation: ["pekerjaan"],
  businessName: ["nama_usaha", "nama_perusahaan"], companyName: ["nama_perusahaan", "nama_usaha"],
  businessType: ["jenis_usaha", "jenis_usaha_kegiatan"], businessActivity: ["jenis_usaha_kegiatan", "jenis_usaha"],
  businessAddress: ["alamat_usaha", "alamat_domisili_usaha"], domicileAddress: ["alamat_domisili_usaha", "alamat"],
  buildingStatus: ["status_bangunan"], buildingUse: ["kegunaan_bangunan"], responsiblePerson: ["nama_penanggung_jawab"],
  employeeCount: ["jumlah_karyawan"], phoneNumber: ["nomor_telepon_usaha", "nomor_telepon"],
  purpose: ["keperluan", "tujuan"], destination: ["tujuan", "tujuan_surat", "instansi_tujuan", "tujuan_instansi"], destinationAgency: ["instansi_tujuan"], institution: ["instansi_tujuan"],
  fatherName: ["nama_ayah"], motherName: ["nama_ibu"], childName: ["nama_anak"], studentName: ["nama_siswa"],
  studentGender: ["jenis_kelamin"], deceasedName: ["nama_almarhum", "nama_jenazah"], ownerName: ["nama_pemilik"],
  ownerNik: ["nik_pemilik"], income: ["penghasilan"], category: ["kategori"],
  // Alias dari kolom "Detail Isi Surat" pada Form Identifikasi Layanan.
  birthPlaceDate: ["ttl", "tempat_tanggal_lahir", "tempat_tgl_lahir", "tempat_dan_tanggal_lahir"],
  birthDatePlace: ["ttl", "tempat_tanggal_lahir", "tempat_tgl_lahir"],
  placeDateOfBirth: ["ttl", "tempat_tanggal_lahir", "tempat_tgl_lahir"],
  age: ["umur", "usia"],
  familyCardNumber: ["nomor_kk", "no_kk", "nomor_kartu_keluarga", "no_kartu_keluarga"],
  headOfFamilyName: ["nama_kepala_keluarga"],
  householdRelationship: ["shdk", "status_hubungan_dalam_keluarga", "hubungan_dalam_keluarga"],
  education: ["pendidikan", "pendidikan_terakhir"],
  nationality: ["kewarganegaraan", "warganegara"],
  businessType: ["jenis_usaha", "jenis_usaha_kegiatan", "jenis_kegiatan"],
  businessAddress: ["alamat_usaha"],
  buildingStatus: ["status_bangunan"],
  buildingUse: ["kegunaan_bangunan"],
  responsiblePerson: ["nama_penanggung_jawab", "penanggung_jawab"],
  employeeCount: ["jumlah_karyawan"],
  phoneNumber: ["nomor_telepon", "no_telepon", "nomor_hp"],
  travelTo: ["pergi_ke", "tujuan_perjalanan"],
  eventDate: ["tanggal_acara", "hari_tanggal"],
  eventTime: ["jam", "waktu_acara"],
  eventPlace: ["tempat_acara", "tempat"],
  participantCount: ["peserta", "jumlah_peserta"],
  personInCharge: ["penanggung_jawab"],
  childBirthTime: ["jam_kelahiran"],
  childDeliveryPlace: ["tempat_dilahirkan"],
  childBirthOrder: ["anak_ke", "kelahiran_ke"],
  childAttendant: ["penolong_kelahiran"],
  childWeight: ["berat_bayi", "berat"],
  deceasedBirthDate: ["tanggal_lahir_jenazah", "tanggal_lahir_almarhum"],
  deceasedAge: ["umur_jenazah", "umur_almarhum"],
  // Alias tambahan dari seluruh kolom "Detail Isi Surat" pada XLSX.
  fullName: ["nama", "nama_lengkap", "nama_pemohon", "nama_warga"],
  placeOfBirth: ["tempat_lahir", "tempat_lahir_pemohon"],
  dateOfBirth: ["tanggal_lahir", "tgl_lahir", "tanggal_lahir_pemohon"],
  birthPlace: ["tempat_lahir", "tempat_lahir_pemohon"],
  birthDate: ["tanggal_lahir", "tgl_lahir", "tanggal_lahir_pemohon"],
  gender: ["jenis_kelamin"],
  maritalStatus: ["status_perkawinan", "status_kawin"],
  religion: ["agama"],
  occupation: ["pekerjaan", "mata_pencaharian"],
  address: ["alamat", "alamat_pemohon", "alamat_lengkap", "alamat_tempat_tinggal"],
  purpose: ["keperluan", "tujuan", "maksud_dan_tujuan", "dipergunakan_untuk"],
  useFor: ["dipergunakan_untuk", "keperluan"],
  purposeOfLetter: ["dipergunakan_untuk", "keperluan", "maksud_dan_tujuan"],
  agency: ["instansi_tujuan", "instansi", "tujuan_instansi"],
  destinationAgency: ["instansi_tujuan", "instansi", "tujuan_instansi"],
  familyCardNumber: ["nomor_kk", "no_kk", "nomor_kartu_keluarga", "no_kartu_keluarga"],
  kkNumber: ["nomor_kk", "no_kk", "nomor_kartu_keluarga"],
  rt: ["rt", "nomor_rt"],
  rw: ["rw", "nomor_rw"],
  hamlet: ["dusun", "padukuhan"],
  village: ["desa", "kelurahan", "kalurahan"],
  district: ["kecamatan", "kapanewon"],
  regency: ["kabupaten", "kota"],
  province: ["provinsi"],
  childName: ["nama_anak"],
  childNik: ["nik_anak"],
  childBirthPlace: ["tempat_lahir_anak"],
  childBirthDate: ["tanggal_lahir_anak", "tgl_lahir_anak"],
  childGender: ["jenis_kelamin_anak"],
  fatherName: ["nama_ayah", "nama_bapak"],
  fatherNik: ["nik_ayah", "nik_bapak"],
  motherName: ["nama_ibu"],
  motherNik: ["nik_ibu"],
  deceasedName: ["nama_almarhum", "nama_jenazah", "nama_orang_meninggal"],
  deceasedBirthDate: ["tanggal_lahir_jenazah", "tanggal_lahir_almarhum"],
  deathDate: ["tanggal_kematian", "tanggal_meninggal", "hari_tanggal_meninggal"],
  deathPlace: ["tempat_kematian", "tempat_meninggal"],
  eventDate: ["tanggal_acara", "hari_tanggal", "pada_hari_tanggal"],
  eventTime: ["jam", "waktu_acara"],
  eventPlace: ["tempat_acara", "tempat"],
  participantCount: ["peserta", "jumlah_peserta"],
  personInCharge: ["penanggung_jawab", "nama_penanggung_jawab"],
  travelTo: ["pergi_ke", "tujuan_perjalanan"],
  education: ["pendidikan", "pendidikan_terakhir"],
  nationality: ["kewarganegaraan", "warganegara"],
  familyRelationship: ["shdk", "status_hubungan_dalam_keluarga"],
  familyStatus: ["shdk", "status_hubungan_dalam_keluarga"],
  income: ["penghasilan", "jumlah_penghasilan"],
  category: ["kategori"],
  businessName: ["nama_usaha", "nama_perusahaan", "nama_perusahaan_yayasan"],
  businessType: ["jenis_usaha", "jenis_usaha_kegiatan", "jenis_kegiatan"],
  businessAddress: ["alamat_usaha", "alamat_domisili_usaha"],
  buildingStatus: ["status_bangunan"],
  buildingUse: ["kegunaan_bangunan"],
  responsiblePerson: ["nama_penanggung_jawab", "penanggung_jawab", "nama_pimpinan"],
  employeeCount: ["jumlah_karyawan"],
  ownerName: ["nama_pemilik"],
  ownerNik: ["nik_pemilik"],
};

function applicantFromFields(applicant = {}, fields = {}) {
  const get = (...keys) => {
    for (const key of keys) {
      const value = applicant?.[key] ?? fields?.[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") return value;
    }
    return "";
  };
  return {
    name: get("name", "applicantName", "fullName", "nama", "namaPemohon", "namaLengkap"),
    nik: get("nik", "applicantNik", "citizenNik", "NIK"),
    address: get("address", "applicantAddress", "alamat", "alamatPemohon"),
    phone: get("phone", "applicantPhone", "phoneNumber", "nomorTelepon", "noHp"),
  };
}
/* Label backend sering disalin dari PDF dan bernomor ("1. Nomor Kartu Keluarga", "a. Desa/Kelurahan"). Nomor/huruf
   di depan diabaikan saat mencocokkan label, kalau tidak field-nya tidak pernah ketemu & kolom di blade kosong. */
const LABEL_PREFIX = /^\s*(?:\d+\s*[.)]|[a-zA-Z][.)]\s+)\s*/;
function fieldLabelKey(label) { return norm(String(label ?? "").replace(LABEL_PREFIX, "")); }

/* Isian berulang -> field backend bernomor. Cocok bila field_key = <base>_<n>, atau key/label berakhiran angka n
   yang bagian depannya bermakna sama dengan <base> (nik_pindah_1, "NIK Pindah 1", nik_anggota_1, dst). */
function rowTarget(backendFields, base, n, used) {
  const sigBase = signature(base);
  const hit = backendFields.find((f) => {
    const k = String(f.field_key);
    if (used.has(k)) return false;
    if (k === `${base}_${n}`) return true;
    const mk = k.match(/^(.*?)[_\s-]?(\d+)$/);
    if (mk && mk[1] && Number(mk[2]) === n && signature(mk[1]) === sigBase) return true;
    const ml = String(f.field_label ?? "").match(/^(.*?)[\s(]*(\d+)\)?\s*$/);
    return !!(ml && ml[1].trim() && Number(ml[2]) === n && signature(ml[1]) === sigBase);
  });
  return hit ? String(hit.field_key) : null;
}

/* Form memecah "Tempat" & "Tanggal Lahir" jadi 2 isian, sedangkan blade/backend sering hanya punya SATU field
   "Tempat/Tanggal Lahir" (ttl). Bila ada tepat satu field gabungan yang belum terpakai, isi dengan "Serang 16-07-1998". */
const fmtDate = (v) => { const m = String(v ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : String(v ?? ""); };
const PD_PREFIXES = ["", "father", "mother", "child", "deceased", "groom", "bride", "husband", "wife", "witness1", "witness2"];
function combinePlaceDate(fields, backendFields, normalized, used) {
  for (const p of PD_PREFIXES) {
    const place = fields[p ? `${p}BirthPlace` : "birthPlace"] ?? fields[p ? `${p}PlaceOfBirth` : "placeOfBirth"];
    const date = fields[p ? `${p}BirthDate` : "birthDate"] ?? fields[p ? `${p}DateOfBirth` : "dateOfBirth"];
    if (!place && !date) continue;
    const sigs = new Set([signature(`${p} tempat tanggal lahir`), signature(`${p} ttl`)]);
    const hits = backendFields.filter((f) => !used.has(String(f.field_key)) && (sigs.has(signature(f.field_key)) || sigs.has(signature(f.field_label))));
    if (hits.length !== 1) continue;
    const k = String(hits[0].field_key);
    normalized[k] = [place, date ? fmtDate(date) : ""].filter(Boolean).join(" ");
    used.add(k);
  }
}
/* Opsi select bernomor di form ("2. Pendidikan") belum tentu sama dengan opsi di backend ("Pendidikan"), dan backend
   menolak nilai di luar opsinya ("Nilai field ... tidak valid"). Nilai bernomor disamakan dengan opsi backend yang
   cocok (abaikan nomor di depan & huruf besar/kecil); bila backend tidak punya padanan, nomornya dibuang. Nilai tanpa
   nomor, atau field tanpa daftar opsi, tidak diubah. Blade membaca angkanya kembali dari label (lihat blade pindah). */
const NUMBERED = /^\s*\d+\s*[.)\-:]\s*/;
const bareLabel = (v) => String(v ?? "").replace(NUMBERED, "").trim();
function backendOptionList(f) {
  // Nama properti opsi bisa berbeda antar versi backend; ambil yang pertama berisi.
  let opts = [f?.options, f?.field_options, f?.option_list, f?.choices, f?.values, f?.options_json].find((v) => v !== undefined && v !== null && v !== "");
  if (typeof opts === "string") {
    try { opts = JSON.parse(opts); } catch { opts = opts.split(/\r?\n|,/).map((x) => x.trim()).filter(Boolean); }
  }
  if (opts && !Array.isArray(opts) && typeof opts === "object") opts = Object.entries(opts).map(([value, label]) => ({ value, label }));
  return Array.isArray(opts) ? opts.map((o) => (o && typeof o === "object" ? { value: o.value ?? o.label, label: o.label ?? o.value } : { value: o, label: o })) : [];
}
export function matchBackendOption(value, backendField) {
  if (typeof value !== "string" || !NUMBERED.test(value)) return value;
  const options = backendOptionList(backendField);
  if (!options.length) return value;
  if (options.some((o) => String(o.value) === value)) return value;
  const number = Number(value.match(/\d+/)[0]);
  const want = norm(bareLabel(value));
  const sameLabel = (o) => norm(bareLabel(o.value)) === want || norm(bareLabel(o.label)) === want;
  const hit =
    options.find(sameLabel) ??
    options.find((o) => want.startsWith("lainnya") && norm(bareLabel(o.value)).startsWith("lainnya")) ??
    options.find((o) => String(o.value).trim() === String(number)) ?? // backend memakai angka saja
    options.find((o) => { const n = norm(bareLabel(o.value)); return n.length > 3 && (n.startsWith(want) || want.startsWith(n)); }) ??
    (number >= 1 && number <= options.length ? options[number - 1] : null); // urutan opsi backend = urutan nomor di form
  return hit ? String(hit.value) : bareLabel(value);
}

export function mapFieldsToBackend(fields = {}, backendFields = [], slug = "", labels = {}) {
  const allowed = new Set(backendFields.map(f => String(f.field_key)));
  const byLabel = new Map(backendFields.map(f => [fieldLabelKey(f.field_label), String(f.field_key)]));
  const normalized = {};
  const unresolved = [];
  const rowMissed = [];
  const used = new Set(); // satu field backend hanya dipakai satu isian (mis. "Tujuan" tidak ditimpa "Keperluan")
  const free = (k) => k && !used.has(String(k));
  // key yang tanda tangannya kembar dalam satu surat tidak boleh dicocokkan otomatis (ambigu) -> pakai override
  const sigCount = {};
  Object.keys(fields).forEach((k) => { const sg = signature(k); sigCount[sg] = (sigCount[sg] || 0) + 1; });
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === "") continue;
    // isian berulang (rows) -> field backend bernomor (data/letterFieldMap.js: ROW_OVERRIDES)
    const rowCfg = Array.isArray(value) ? rowsFor(slug, key) : null;
    if (rowCfg) {
      if (value.length > rowCfg.max) console.warn(`[letter-create] ${slug}.${key}: ${value.length} baris, backend hanya menampung ${rowCfg.max}. Sisanya tidak tersimpan.`);
      value.slice(0, rowCfg.max).forEach((row, i) => {
        for (const [col, base] of Object.entries(rowCfg.columns)) {
          const v = row?.[col];
          if (v === undefined || v === null || v === "") continue;
          const bk = rowTarget(backendFields, base, i + 1, used);
          if (bk) { normalized[bk] = v; used.add(bk); }
          else rowMissed.push(`${key}[${i + 1}].${col} -> ${base}_${i + 1}`);
        }
      });
      continue;
    }
    // 0) override manual (data/letterFieldMap.js)
    let target = EXTRA_OVERRIDES[slug]?.[key] ?? overrideFor(slug, key);
    if (target && !allowed.has(target)) target = backendFields.find(f => norm(f.field_key) === norm(target) || fieldLabelKey(f.field_label) === norm(target))?.field_key ?? null;
    if (target && used.has(String(target))) target = null;
    // 0b) label "Pergi ke" selalu ke field backend "Pergi Ke" (bukan "Tujuan"), apa pun key-nya (destination / travelTo)
    const lab = labels[key];
    if (!target && isPergiLabel(lab)) {
      target = backendFields.find(f => free(f.field_key) && /\bpergi\b|pergi_?ke/i.test(`${f.field_key} ${f.field_label}`))?.field_key ?? null;
      if (!target) { unresolved.push(key); continue; } // jangan pernah jatuh ke "tujuan"
    }
    // 0c) key generik (destination) dengan label lain ("Tujuan", dst): cocokkan lewat label
    if (!target && LABEL_FIRST_KEYS.has(key) && lab) target = matchBySignature(lab, backendFields, f => free(f) && !/pergi/i.test(f));
    // 1) label UI persis/ternormalisasi ke label backend. Ini penting untuk 79+ template
    // karena key komponen frontend kadang berbahasa Inggris, sedangkan field_key backend snake_case.
    if (!target && lab) {
      const normalizedLabel = fieldLabelKey(lab);
      const exactLabel = backendFields.find(f => free(f.field_key) && fieldLabelKey(f.field_label) === normalizedLabel);
      if (exactLabel) target = exactLabel.field_key;
      // Cocokkan label dengan sinonim/token backend untuk variasi kecil seperti
      // "Tanggal Lahir Pemilik" vs field_key `tanggal_lahir_pemilik`.
      if (!target) target = matchBySignature(lab, backendFields, f => free(f));
    }
    // 2) key persis / snake_case / alias
    const candidates = [key, snake(key), ...(aliases[key] || [])];
    if (!target) target = candidates.find(c => allowed.has(c) && free(c));
    // 3) kandidat dinormalisasi vs field_key ATAU label backend
    if (!target) {
      for (const c of candidates) {
        const nc = norm(c);
        const hit = backendFields.find(f => free(f.field_key) && (norm(f.field_key) === nc || norm(f.field_label) === nc));
        if (hit) { target = hit.field_key; break; }
      }
    }
    // 4) kata-per-kata Indonesia<->Inggris, urutan bebas (fatherNik == nik_ayah == "NIK Ayah")
    if (!target && sigCount[signature(key)] === 1) target = matchBySignature(key, backendFields, free);
    if (!target) target = byLabel.get(fieldLabelKey(key));
    if (target) { normalized[target] = value instanceof File ? undefined : value; used.add(String(target)); }
    else unresolved.push(key);
  }
  for (const f of backendFields) {
    const k = String(f.field_key);
    if (f.is_required && !used.has(k) && !normalized[k]) {
      const v = wilayahFor(f);
      if (v) { normalized[k] = v; used.add(k); }
    }
  }
  combinePlaceDate(fields, backendFields, normalized, used);
  if (rowMissed.length) console.warn(`[letter-create] ${slug}: baris tidak ketemu field backend-nya (nama field bernomor di backend: ${backendFields.filter((f) => /\d+$/.test(String(f.field_key))).map((f) => f.field_key).join(", ") || "tidak ada"})`, rowMissed);
  const byKey = new Map(backendFields.map((f) => [String(f.field_key), f]));
  for (const k of Object.keys(normalized)) normalized[k] = matchBackendOption(normalized[k], byKey.get(k));
  return { fields: Object.fromEntries(Object.entries(normalized).filter(([, v]) => v !== undefined)), unresolved };
}
export async function resolveLetterType(letter) {
  const backendCode = String(getBackendLetterCode(letter.slug, letter.code) ?? "").trim().toUpperCase();
  const types = await loadTypes();
  const found = types.find(t => String(t.letter_code ?? t.code ?? "").trim().toUpperCase() === backendCode);
  if (!found) throw new Error(`Tipe surat "${letter.title}" (kode ${backendCode || "-"}) belum terdaftar di backend.`);
  const id = found.letter_type_id ?? found.id;
  const backendFields = await getFields(id);
  return { id, backendFields };
}

function firstValue(fields, keys) {
  for (const key of keys) {
    const value = fields?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
}

function applicantFrom(fields) {
  const applicantName = firstValue(fields, ["name", "applicantName", "reporterName", "groomName", "brideName", "childName", "deceasedName", "headOfFamilyName", "fatherName", "motherName"]);
  const applicantNik = firstValue(fields, ["nik", "applicantNik", "reporterNik", "groomNik", "brideNik", "childNik", "deceasedNik", "fatherNik", "motherNik"]);
  const applicantAddress = firstValue(fields, ["address", "applicantAddress", "reporterAddress", "groomAddress", "brideAddress", "deceasedAddress", "fatherAddress", "motherAddress", "originAddress"]);
  const applicantPhone = firstValue(fields, ["whatsapp", "applicantPhone", "phone", "reporterPhone"]);

  if (!applicantName || !applicantNik || !applicantAddress) throw new Error("Lengkapi nama, NIK, dan alamat pemohon sebelum mengirim surat.");
  return { applicantName, applicantNik, applicantAddress, applicantPhone };
}

function resolveDocumentId(label, documents) {
  const normalizedLabel = normalize(label);
  const exact = documents.find((document) => normalize(document.document_name) === normalizedLabel);
  if (exact) return exact.letter_type_document_id;
  const aliases = [["kk", "kk"], ["kartutanda", "ktp"], ["ktp", "ktp"], ["pasfoto", "foto"]];
  const alias = aliases.find(([needle]) => normalizedLabel.includes(needle));
  if (alias) {
    const match = documents.find((document) => normalize(document.document_name).includes(alias[1]));
    if (match) return match.letter_type_document_id;
  }
  const fallback = documents.find((document) => !document.is_required && /lain|pendukung|tambahan/i.test(document.document_name));
  return fallback?.letter_type_document_id ?? documents[0]?.letter_type_document_id ?? null;
}

async function uploadFiles(requestId, files, documents) {
  for (const item of files ?? []) {
    const documentId = resolveDocumentId(item.label, documents);
    if (!documentId) throw new Error(`Dokumen ${item.label} belum memiliki konfigurasi backend.`);
    const formData = new FormData();
    formData.append("letter_type_document_id", String(documentId));
    formData.append("file", item.file, item.file.name);
    try {
      await api.post(`/letter-requests/${requestId}/attachments`, formData);
    } catch (error) {
      throw new Error(`Upload dokumen "${item.label}" gagal: ${getLetterRequestError(error, "file ditolak backend.")}`, { cause: error });
    }
  }
}

async function submitOne(letter) {
  const type = await resolveLetterType(letter);
  const fields = cleanValue(letter.fields ?? {});
  const applicant = applicantFrom(fields);
  // Simpan juga key asli dari form admin. Sebagian tipe surat lama memakai
  // kontrak field camelCase yang berbeda dari metadata backend; backend akan
  // menormalisasikannya saat membangun preview PDF. Field canonical hasil
  // adapter tetap menimpa key yang sama agar kontrak baru diprioritaskan.
  const formData = {
    ...fields,
    ...backendFormData(fields, type.fields ?? [], letter.fieldDefinitions ?? []),
  };
  let created;
  const { body, config } = buildBody({ letterTypeId, applicant, fields: mapped.fields, files: letter.files, internal });
  const { body, config } = buildBody({ letterTypeId, applicant, fields: mapped.fields, files: letter.files });
  try {
    created = await unwrap(api.post("/letter-requests", {
      letter_type_id: type.letter_type_id,
      applicant_name: String(applicant.applicantName),
      applicant_nik: String(applicant.applicantNik),
      applicant_phone: normalizePhone(applicant.applicantPhone),
      applicant_address: String(applicant.applicantAddress),
      source: LETTER_SOURCE,
      form_data: formData,
    }));
  } catch (error) {
    throw new Error(`Data pengajuan ditolak: ${getLetterRequestError(error, "periksa isian surat dan identitas pemohon.")}`, { cause: error });
  }
  await uploadFiles(created.letter_request_id, letter.files, type.documents ?? []);
  return { title: letter.title, code: created.request_code, request: created };
}

export async function submitSingleLetter(payload) {
  const result = await saveOne(payload);
  return { id: result.id, code: result.code };
}
export async function submitLetterBundle(payload) {
  const codes = [];
  for (const letter of payload.letters) {
    try { codes.push(await saveOne(letter)); }
    catch (err) {
      if (!codes.length) throw err;
      throw new Error(`${err.message} (${codes.length} surat sebelumnya sudah tersimpan: ${codes.map(c => c.code).join(", ")}).`);
    }
  }
  return { codes };
}