// Disalin dari public: views/services/letters/declarations/population-document-statement-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Pernyataan Tidak Memiliki Dokumen Kependudukan (F.1-04)
// Template PDF: letters/population-document-statement-letter.blade.php
import { f, DOC } from "@/data/letterFields";

// Langkah 1: isian sesuai surat yang diajukan
export const sections = [
  {
    // Surat: Nama, Alamat (RT/RW), Tempat & Tanggal Lahir, Nama Ibu, Nama Ayah
    title: "Data Pemohon",
    hint: "Terisi otomatis dari data warga. Koreksi bila ada yang tidak sesuai.",
    fields: [
      f.text("name", "Nama Lengkap", { from: "fullName" }),
      f.nik("nik", "NIK", { from: "nik" }),  // NIK Tidak ditampilkan di surat, tapi tetap diisi untuk keperluan validasi data warga.
      f.area("address", "Alamat (RT/RW, Kalurahan, Kapanewon)", { from: "address", span: 2 }),
      f.text("birthPlace", "Tempat Lahir", { from: "birthPlace" }),
      f.date("birthDate", "Tanggal Lahir", { from: "birthDate" }),
      f.text("motherName", "Nama Ibu"),
      f.text("fatherName", "Nama Ayah"),
    ],
  },
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [
  DOC.ktp,
  DOC.kk,
];

export const meta = {"title": "Surat Pernyataan Tidak Memiliki Dokumen Kependudukan", "code": "PDK"};
