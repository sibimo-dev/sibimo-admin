/* Logika form yang dipakai LetterWizard (1 surat) dan BundleWizard (banyak surat). Disalin dari public (isi sama).
   Tidak ada tampilan di sini — hanya fungsi murni supaya mudah dites. */

export const MAX_FILE_MB = 5;
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
   `prefix` dipakai supaya id unik antar surat di dalam satu paket. */
export function normalizeDocs(documents = [], prefix = "") {
  return documents.map((d, i) => {
    const base = typeof d === "string" ? { label: d, optional: false } : { optional: false, ...d };
    return { ...base, id: prefix ? `${prefix}::${i}` : i };
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