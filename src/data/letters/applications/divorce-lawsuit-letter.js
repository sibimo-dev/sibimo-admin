// Disalin dari public: views/services/letters/applications/divorce-lawsuit-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Permohonan Cerai (Gugat Cerai)
// Template PDF: letters/divorce-lawsuit-letter.blade.php
import { f, DOC, opt, OPT } from "@/data/letterFields";

// Helper: field biodata sesuai urutan di surat
// Urutan: Nama, Tempat tgl lhr, [Agama], Pekerjaan, Alamat
const biodata = (prefix, { religion = true, resident = false, relation = "" } = {}) => {
  const source = (key) => (relation ? `${relation}:${key}` : key);
  return [
    f.text(`${prefix}Name`, "Nama", resident ? { from: source("fullName") } : {}),
    f.text(`${prefix}Birth`, "Tempat, Tanggal Lahir", resident ? { from: source("birthPlaceDate") } : {}),
    ...(religion ? [f.text(`${prefix}Religion`, "Agama", resident ? { from: source("religion") } : {})] : []),
    f.text(`${prefix}Occupation`, "Pekerjaan", resident ? { from: source("occupation") } : {}),
    f.text(`${prefix}Address`, "Alamat", resident ? { from: source("address") } : {}),
  ];
};
const optionalBiodata = (prefix, options = {}) => biodata(prefix, options).map((field) => ({ ...field, optional: true }));

// Langkah 1: isian sesuai surat
export const sections = [
  // "Dengan ini menghadapkan seorang Laki-Laki / Perempuan"
  {
    title: "Data Orang yang Dihadapkan",
    fields: [
      f.nik("applicantNik", "NIK", { from: "nik" }),
      f.select("applicantGender", "Jenis Kelamin", OPT.gender, { from: "gender" }),
      ...biodata("applicant", { resident: true }),
    ],
  },

  // "Cerai/Rapak kepada Suaminya/Istrinya" (tanpa agama, ada Surat Nikah)
  {
    title: "Data Suami/Istri",
    fields: [
      ...biodata("spouse", { religion: false, resident: true, relation: "spouse" }),
      f.text("marriageCertNumber", "Surat Nikah (Nomor)", { from: "spouse:marriageCertificateNumber" }),
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
  { title: "Data Saksi 1 (Opsional)", fields: optionalBiodata("witness1") },
  { title: "Data Saksi 2 (Opsional)", fields: optionalBiodata("witness2") },
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [DOC.ktp, DOC.kk, DOC.akta, opt(DOC.bukti)];

export const meta = {"title": "Surat Permohonan Cerai", "code": "GCR"};
