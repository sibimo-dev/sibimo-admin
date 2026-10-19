/* Logika form yang dipakai LetterWizard (1 surat) dan BundleWizard (banyak surat). Disalin dari public (isi sama).
   Tidak ada tampilan di sini — hanya fungsi murni supaya mudah dites. */

export const MAX_FILE_MB = 5;
// Admin: SEMUA dokumen pendukung opsional. Pemohon yang datang langsung ke kalurahan bisa menyerahkan berkas fisik (hardfile).
export const DOCS_OPTIONAL = true;
export const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];

export const toDate = (v) => (v instanceof Date ? v : v ? new Date(v) : null);
export const isFilled = (v) =>
  v instanceof Date ? !Number.isNaN(v.getTime()) : Array.isArray(v) ? v.length > 0 : String(v ?? "").trim() !== "";
export const emptyRow = (columns) => Object.fromEntries(columns.map((c) => [c.key, c.default ?? ""]));
export const visible = (field, form) => !field.showIf || field.showIf(form);

export const fmtDate = (d) =>
  d instanceof Date && !Number.isNaN(d.getTime())
    ? d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "";

export function display(field, v) {
  if (field.type === "date") return fmtDate(v) || "-";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "-";
  return isFilled(v) ? String(v) : "-";
}

export const filledRows = (field, form) => form[field.key].filter((r) => Object.values(r).some(isFilled));

/* Normalisasi daftar dokumen: "Nama" atau { label, optional } → { id, label, optional }.
   Mendukung fungsi dinamis (form) => [] dan prefix unik untuk paket surat. */
export function normalizeDocs(documents = [], prefix = "", form = null) {
  const list = typeof documents === "function" ? documents(form) : documents;
  if (!Array.isArray(list)) return [];
  const seen = new Map();
  return list.map((d, i) => {
    const base = typeof d === "string" ? { label: d, optional: false } : { optional: false, ...d };
    const labelKey = base.label || String(i);
    const count = seen.get(labelKey) || 0;
    seen.set(labelKey, count + 1);
    const uniqueKey = count === 0 ? labelKey : `${labelKey}_${count}`;
    const id = base.id ?? (prefix ? `${prefix}::${uniqueKey}` : uniqueKey);
    // Admin: semua dokumen dipaksa opsional, apa pun isi `documents` di data/letters/*.
    return { ...base, optional: DOCS_OPTIONAL || !!base.optional, id };
  });
}

/* Isi form dari data warga (field.from) / default. Di admin `lookup` belum disambungkan ke data warga (mengembalikan undefined),
   jadi isian hanya terisi dari default. Sambungkan nanti bila pencarian warga sudah ada. Aman dipanggil berkali-kali dan untuk
   banyak surat sekaligus: kunci yang sama dipakai bersama, nilai yang sudah diisi tidak ditimpa. */
export function fillForm(form, sections, lookup = () => undefined) {
  for (const section of sections) {
    for (const field of section.fields) {
      if (field.type === "rows") {
        if (!(field.key in form)) form[field.key] = Array.from({ length: field.min ?? (field.optional ? 0 : 1) }, () => emptyRow(field.columns));
        continue;
      }
      if (field.type === "checks") {
        if (!(field.key in form)) form[field.key] = [];
        continue;
      }
      let value = field.default ?? "";
      if (field.from) {
        const fromStore = lookup(field.from);
        if (fromStore) value = field.type === "date" ? toDate(fromStore) : fromStore;
      }
      if (!(field.key in form) || (!isFilled(form[field.key]) && isFilled(value))) form[field.key] = value;
    }
  }
  return form;
}

/* ---------- Isian dari data warga (pencarian NIK) ----------
   `resident` = hasil services/resident-lookup.service.js. Kunci `from` biasa (fullName, nik, address, ...) membaca langsung;
   `asFather:x` / `asMother:x` hanya terisi bila jenis kelamin warga cocok (laki-laki → blok Ayah, perempuan → blok Ibu).
   Jenis kelamin dibandingkan secara longgar (huruf besar/kecil, "L"/"P", "Male"/"Female", dst.). */
const MALE = ["laki-laki", "laki laki", "l", "male", "pria"];
const FEMALE = ["perempuan", "p", "female", "wanita"];

export function makeResidentLookup(resident) {
  return (key) => {
    if (!resident) return undefined;
    const m = /^as(Father|Mother):(.+)$/.exec(key);
    if (!m) return resident[key];
    const g = String(resident.gender ?? "").trim().toLowerCase();
    const role = MALE.includes(g) ? "Father" : FEMALE.includes(g) ? "Mother" : null;
    return role === m[1] ? resident[m[2]] : undefined;
  };
}

/* Untuk field `select`: samakan nilai dari data warga dengan pilihan di form (tanpa peduli huruf besar/kecil),
   supaya "ISLAM" cocok dengan opsi "Islam". Bila tidak ada yang cocok, nilai aslinya dipakai apa adanya. */
const matchOption = (field, raw) =>
  field.type === "select" && Array.isArray(field.options)
    ? field.options.find((o) => String(o).toLowerCase() === String(raw).trim().toLowerCase()) ?? raw
    : raw;

/* Isi semua field yang punya `from` dari data warga. Isian yang sudah diketik manual TIDAK ditimpa; isian yang sebelumnya
   terisi otomatis (autoFilled) boleh diganti saat NIK diganti. Field `reporter*` (Data Pelapor) sengaja dilewati:
   pelapor diisi petugas, bukan otomatis dari data pemohon. Mengembalikan daftar kunci yang terisi. */
export function applyResident(form, sections, resident, autoFilled = {}) {
  const lookup = makeResidentLookup(resident);
  const filled = [];
  const norm = (v) => String(v ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  const identityAliases = [
    { from: "fullName", keys: ["name", "applicantName", "fullName", "nama", "namaPemohon", "namaLengkap"], labels: ["nama", "nama pemohon", "nama lengkap", "nama warga"] },
    { from: "nik", keys: ["nik", "applicantNik", "nationalId", "citizenNik"], labels: ["nik", "nik pemohon", "nomor induk kependudukan"] },
    { from: "address", keys: ["address", "applicantAddress", "alamat", "alamatPemohon"], labels: ["alamat", "alamat pemohon", "alamat sesuai ktp", "alamat tempat tinggal"] },
    { from: "birthPlaceDate", keys: ["birthPlaceDate", "tempatTanggalLahir"], labels: ["tempat/tgl lahir", "tempat tanggal lahir", "tempat dan tanggal lahir"] },
    { from: "birthPlace", keys: ["birthPlace", "tempatLahir"], labels: ["tempat lahir"] },
    { from: "birthDate", keys: ["birthDate", "tanggalLahir"], labels: ["tanggal lahir"] },
    { from: "gender", keys: ["gender", "jenisKelamin"], labels: ["jenis kelamin"] },
    { from: "maritalStatus", keys: ["maritalStatus", "statusPerkawinan"], labels: ["status perkawinan", "status pernikahan"] },
    { from: "religion", keys: ["religion", "agama"], labels: ["agama"] },
    { from: "occupation", keys: ["occupation", "pekerjaan"], labels: ["pekerjaan"] },
    { from: "phoneNumber", keys: ["phoneNumber", "phone", "whatsapp", "nomorTelepon", "noHp"], labels: ["nomor telepon", "telepon", "nomor hp", "whatsapp"] },
  ];
  for (const section of sections) {
    for (const field of section.fields) {
      if (field.type === "rows" || field.type === "checks" || /^reporter/i.test(field.key)) continue;
      const alias = identityAliases.find(a => a.keys.includes(field.key) || a.labels.some(l => norm(l) === norm(field.label)));
      const source = field.from || alias?.from;
      if (!source) continue;
      const raw = lookup(source);
      if (!isFilled(raw)) continue;
      const current = form[field.key];
      const manual = isFilled(current) && !autoFilled[field.key] && (field.default === undefined || current !== field.default);
      if (manual) continue;
      form[field.key] = field.type === "date" ? toDate(raw) : matchOption(field, raw);
      autoFilled[field.key] = true;
      if (!filled.includes(field.key)) filled.push(field.key);
    }
  }
  return filled;
}

/* Lokasi halaman Verifikasi + Otorisasi setelah surat disimpan: LetterDetailView (route `letter-detail`).
   Halaman itu membuka satu pengajuan per id; surat pertama yang dibuka. Untuk paket, seluruh id dibawa lewat
   `?with=<id>,<id>` supaya halaman detail menampilkan dropdown pilihan surat (pratinjau & unduh per surat). */
export const reviewLocation = (ids) => ({
  name: "letter-detail",
  params: { id: ids[0] },
  ...(ids.length > 1 ? { query: { with: ids.join(",") } } : {}),
});

/* ---------- Validasi ---------- */
export function validateFields(sections, form) {
  const e = {};
  for (const section of sections) {
    for (const field of section.fields) {
      if (!visible(field, form)) continue;
      const v = form[field.key];
      if (field.type === "rows") {
        const rows = v.filter((r) => Object.values(r).some(isFilled));
        if (!field.optional && rows.length < (field.min ?? 1)) e[field.key] = `${field.label} minimal ${field.min ?? 1} baris.`;
        else if (rows.some((r) => field.columns.some((c) => !c.optional && !isFilled(r[c.key])))) e[field.key] = "Lengkapi semua kolom pada setiap baris yang diisi.";
        continue;
      }
      if (!isFilled(v)) {
        if (!field.optional && !section.requireOne) e[field.key] = `${field.label} wajib diisi.`;
        continue;
      }
      if (field.digits && !new RegExp(`^\\d{${field.digits}}$`).test(String(v).trim())) e[field.key] = `${field.label} harus ${field.digits} digit angka.`;
      if (field.key === "whatsapp" && !/^(\+62|62|0)8\d{7,12}$/.test(String(v).replace(/[\s-]/g, ""))) e[field.key] = "Nomor WhatsApp tidak valid.";
    }
    // section.requireOne: minimal satu isian di section ini harus terisi (mis. jenis permohonan pada F-1.02)
    if (section.requireOne && !section.fields.some((x) => isFilled(form[x.key]))) e[section.fields[0].key] = "Pilih minimal satu jenis permohonan.";
  }
  return e;
}

export function validateDocs(docs, files) {
  const e = {};
  if (DOCS_OPTIONAL) return e;
  for (const d of docs) if (!files[d.id] && !d.optional) e[d.id] = `${d.label} wajib diunggah.`;
  return e;
}

/* Cek 1 file: kembalikan pesan error atau null. */
export function checkFile(file) {
  if (!file) return "File tidak terbaca.";
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `Ukuran file maksimal ${MAX_FILE_MB} MB (file ini ${(file.size / 1024 / 1024).toFixed(1)} MB).`;
  const okType = ACCEPTED_TYPES.includes(file.type) || /\.(pdf|jpe?g|png|webp|heic)$/i.test(file.name || "");
  if (!okType) return "Format file harus JPG, PNG, atau PDF.";
  return null;
}

export const fileSizeLabel = (file) => {
  const kb = file.size / 1024;
  return kb < 1024 ? `${Math.max(1, Math.round(kb))} KB` : `${(kb / 1024).toFixed(1)} MB`;
};

/* ---------- Isian otomatis antar surat ----------
   Banyak surat memakai kunci field berbeda untuk orang yang sama (mis. `name` = pemohon,
   `groomName` = calon suami). `aliases` = daftar pasangan kunci yang artinya sama; pasangan
   yang bersinggungan digabung jadi satu kelompok. */
export function buildAliasIndex(pairs = []) {
  const parent = new Map();
  const find = (k) => {
    if (!parent.has(k)) parent.set(k, k);
    while (parent.get(k) !== k) {
      parent.set(k, parent.get(parent.get(k)));
      k = parent.get(k);
    }
    return k;
  };
  for (const [a, b] of pairs) parent.set(find(a), find(b));
  const groups = new Map();
  for (const k of parent.keys()) {
    const r = find(k);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(k);
  }
  const index = {};
  for (const members of groups.values()) for (const k of members) index[k] = members;
  return index;
}

/* Isi field yang MASIH KOSONG dari kunci setara yang sudah terisi. Nilai yang sudah ada
   (termasuk hasil revisi pengguna) tidak pernah ditimpa. Mengembalikan daftar kunci yang terisi. */
export function applyAliases(form, sections, index) {
  const filled = [];
  for (const section of sections) {
    for (const field of section.fields) {
      if (field.type === "rows" || field.type === "checks") continue;
      if (!visible(field, form) || isFilled(form[field.key])) continue;
      const peer = (index[field.key] ?? []).find((k) => k !== field.key && isFilled(form[k]));
      if (!peer) continue;
      const v = form[peer];
      form[field.key] = v instanceof Date ? new Date(v.getTime()) : v;
      filled.push(field.key);
    }
  }
  return filled;
}

/* Area isi halaman admin adalah <main> yang bisa di-scroll (bukan window), jadi scroll ke atas lewat elemen itu. */
export function scrollTop() {
  const main = document.querySelector("main.overflow-y-auto");
  (main ?? window).scrollTo({ top: 0, behavior: "smooth" });
}

/* Data pemohon (NIK, nama, telepon, alamat) diambil dari field yang punya `from` yang sesuai (hasil pencarian NIK).
   Dipakai saat menyimpan pengajuan ke backend. `sections` = daftar section surat, `values` = isi form.
   PENTING: surat yang tidak punya field `from: "address"` menghasilkan applicant.address kosong → backend menolak (422). */
const APPLICANT_FROM = { nik: "nik", name: "fullName", phone: "phoneNumber", address: "address" };
const APPLICANT_LABELS = {
  nik: ["nik", "nik pemohon", "nomor induk kependudukan"],
  name: ["nama", "nama pemohon", "nama lengkap", "nama warga"],
  phone: ["nomor telepon", "telepon", "nomor hp", "whatsapp"],
  address: ["alamat", "alamat pemohon", "alamat sesuai ktp", "alamat tempat tinggal"],
};
const normalizeApplicantText = (v) => String(v ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
export function applicantOf(sections, values) {
  const fields = sections.flatMap((s) => s.fields ?? []);
  const pick = (kind, from) => {
    let f = fields.find((x) => x.from === from && String(values[x.key] ?? "").trim());
    if (!f) f = fields.find((x) => (APPLICANT_LABELS[kind] || []).some(label => normalizeApplicantText(label) === normalizeApplicantText(x.label)) && String(values[x.key] ?? "").trim());
    if (!f) f = fields.find((x) => {
      const k = normalizeApplicantText(x.key), labels = (APPLICANT_LABELS[kind] || []).map(normalizeApplicantText);
      return (labels.includes(k) || labels.some(label => normalizeApplicantText(x.label).includes(label))) && String(values[x.key] ?? "").trim();
    });
    return f ? String(values[f.key]).trim() : "";
  };
  return Object.fromEntries(Object.entries(APPLICANT_FROM).map(([k, from]) => [k, pick(k, from)]));
}