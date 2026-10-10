// Disalin dari public: views/services/letters/birth/birth-report-statement.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Ubah isian surat ini di sini saja; paket & register ikut berubah.
// Laporan Kelahiran
// Template PDF: letters/birth/birth-report-statement.blade.php
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.

import {
  DOC, OPT, f, opt,
  BIRTH_CHILD_STATEMENT, BIRTH_PARENT_STATEMENT,
  birthChild, birthFather, birthHamlet, birthMother, birthSigner,
} from "@/data/letterFields";

// Susunan form mengikuti kertas surat:
//   "Yang bertanda tangan di bawah ini saya"
//      NIK, Nama Lengkap, Tempat/Tanggal Lahir, Umur, Pekerjaan, Alamat (+ RT/RW)
//      Hubungan dengan si bayi
//   "Dengan ini melaporkan kelahiran seorang anak"
//      Dari Ibu / Alamat Ibu (+ RT/RW)  ·  Suami Dari / Alamat Ayah (+ RT/RW)
//
// Penanda tangan = ayah ATAU ibu.
//   • Blok "Yang Bertanda Tangan": pilih hubungan dulu, lalu muncul data lengkap orang tua tsb.
//   • Blok "Data Orang Tua": hanya orang tua yang TIDAK bertanda tangan (nama, alamat, RT/RW).
const ayahTtd = (form) => form.reporterRelationship === "Ayah";
const ibuTtd = (form) => form.reporterRelationship === "Ibu";
const bukanAyahTtd = (form) => !ayahTtd(form);
const bukanIbuTtd = (form) => !ibuTtd(form);

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const pick = (list, key) => {
  const found = list.find((x) => x.key === key);
  if (!found) console.warn(`[birth-report-statement] Isian "${key}" tidak ditemukan.`);
  return found;
};

// Gabungkan showIf bawaan field (bila ada) dengan showIf peran.
const withShowIf = (field, showIf) => ({
  ...field,
  showIf: field.showIf ? (form) => field.showIf(form) && showIf(form) : showIf,
});

// ---------- Orang tua yang TIDAK bertanda tangan ----------
const PARENT_PARTS = [...BIRTH_PARENT_STATEMENT, "age"];
const motherFields = birthMother(PARENT_PARTS, "Data Ibu").fields;
const fatherFields = birthFather(PARENT_PARTS, "Data Ayah").fields;

const otherFields = (list, role, showIf, labels) =>
  ["name", "address", "rt", "rw"]
    .map((part) => {
      const fld = pick(list, `${role}${cap(part)}`);
      return fld && withShowIf({ ...fld, label: labels[part] }, showIf);
    })
    .filter(Boolean);

// ---------- Orang tua yang bertanda tangan (dibuat langsung, urutan = urutan di kertas) ----------
const signerFields = (role, showIf) => {
  const from = role === "father" ? "asFather" : "asMother";
  return [
    f.nik(`${role}Nik`, "NIK", { from: `${from}:nik` }),
    f.text(`${role}Name`, "Nama Lengkap", { from: `${from}:fullName` }),
    f.text(`${role}BirthPlace`, "Tempat Lahir", { from: `${from}:birthPlace` }),
    f.date(`${role}BirthDate`, "Tanggal Lahir", { from: `${from}:birthDate` }),
    f.text(`${role}Age`, "Umur (tahun)", { placeholder: "Contoh: 30" }),
    f.select(`${role}Occupation`, "Pekerjaan", OPT.occupation, { from: `${from}:occupation`, editable: true }),
    f.area(`${role}Address`, "Alamat", { from: `${from}:address`, span: 2 }),
    f.text(`${role}Rt`, "RT", { placeholder: "Contoh: 003" }),
    f.text(`${role}Rw`, "RW", { placeholder: "Contoh: 005" }),
  ].map((fld) => withShowIf(fld, showIf));
};

// ---------- Tanggal lahir bayi: hari, tanggal, bulan (huruf), tahun ----------
const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const TANGGAL = Array.from({ length: 31 }, (_, i) => String(i + 1));

// Ganti satu isian "Tanggal Lahir" (childBirthDate) dengan 4 isian terpisah.
const withBirthDateParts = (section) => ({
  ...section,
  fields: section.fields.flatMap((x) =>
    x.key === "childBirthDate"
      ? [
          f.select("childBirthDayName", "Hari Lahir", HARI),
          f.select("childBirthDay", "Tanggal", TANGGAL),
          f.select("childBirthMonth", "Bulan", BULAN),
          f.text("childBirthYear", "Tahun", { digits: 4, placeholder: "Contoh: 2026" }),
        ]
      : [x]
  ),
});

const signer = birthSigner();

export const sections = [
  {
    ...signer,
    hint: "Orang tua yang membuat laporan ini. Pilih hubungan dengan si bayi dulu, lalu lengkapi datanya. Umur diisi dalam tahun.",
    fields: [
      { ...signer.fields[0], label: "Hubungan dengan si bayi" },
      ...signerFields("father", ayahTtd), // tampil bila penanda tangan = Ayah
      ...signerFields("mother", ibuTtd), // tampil bila penanda tangan = Ibu
    ],
  },
  {
    title: "Data Orang Tua",
    hint: "Isi data orang tua yang tidak bertanda tangan. Data penanda tangan sudah diisi pada blok di atas.",
    fields: [
      ...otherFields(motherFields, "mother", bukanIbuTtd, { name: "Dari Ibu (Nama Lengkap)", address: "Alamat Ibu", rt: "RT (Ibu)", rw: "RW (Ibu)" }),
      ...otherFields(fatherFields, "father", bukanAyahTtd, { name: "Suami Dari (Nama Lengkap)", address: "Alamat Ayah", rt: "RT (Ayah)", rw: "RW (Ayah)" }),
    ],
  },
  withBirthDateParts(birthChild(BIRTH_CHILD_STATEMENT, "Data Bayi/Anak & Keterangan Persalinan")),
  birthHamlet(),
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [DOC.kk, "Fotokopi KTP ayah dan ibu", DOC.akta, opt("Surat keterangan lahir dari penolong kelahiran")];

export const meta = {"title": "Laporan Kelahiran", "code": "PLK"};