// Disalin dari public: views/services/letters/applications/divorce-lawsuit-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Permohonan Cerai (Gugat Cerai)
// Template PDF: letters/divorce-lawsuit-letter.blade.php
import { f, DOC, opt } from "@/data/letterFields";

// Helper: field biodata sesuai urutan di surat
// Urutan: Nama, Tempat tgl lhr, [Agama], Pekerjaan, Alamat
const biodata = (prefix, { religion = true } = {}) => [
  f.text(`${prefix}Name`, "Nama"),
  f.text(`${prefix}Birth`, "Tempat, Tanggal Lahir"),
  ...(religion ? [f.text(`${prefix}Religion`, "Agama")] : []),
  f.text(`${prefix}Occupation`, "Pekerjaan"),
  f.text(`${prefix}Address`, "Alamat"),
];

// Langkah 1: isian sesuai surat
export const sections = [
  // "Dengan ini menghadapkan seorang Laki-Laki / Perempuan"
  {
    title: "Data Orang yang Dihadapkan",
    fields: [
      f.select("applicantGender", "Jenis Kelamin", ["Laki-laki", "Perempuan"]),
      ...biodata("applicant"),
    ],
  },

  // "Cerai/Rapak kepada Suaminya/Istrinya" (tanpa agama, ada Surat Nikah)
  {
    title: "Data Suami/Istri",
    fields: [
      ...biodata("spouse", { religion: false }),
      f.text("marriageCertNumber", "Surat Nikah (Nomor)"),
    ],
  },

  // "Alasan ... Gugat Cerai/Rapak dikarenakan" (3 baris)
  {
    title: "Alasan Gugat Cerai",
    fields: [
      f.rows("reasons", "Alasan", [{ key: "text", label: "Alasan" }], { max: 3 }),
    ],
  },

  // "Dua orang saksi"
  { title: "Data Saksi 1", fields: biodata("witness1") },
  { title: "Data Saksi 2", fields: biodata("witness2") },
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [DOC.ktp, DOC.kk, DOC.akta, opt(DOC.bukti)];

export const meta = {"title": "Surat Permohonan Cerai", "code": "GCR"};
