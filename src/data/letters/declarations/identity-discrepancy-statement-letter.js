// Disalin dari public: views/services/letters/declarations/identity-discrepancy-statement-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Pernyataan Beda Nama/Identitas
// Template PDF: letters/identity-discrepancy-statement-letter.blade.php
import { f, DOC, opt } from "@/data/letterFields";

// Langkah 1: isian sesuai surat yang diajukan
export const sections = [
  {
    // Surat: Nama Lengkap, NIK, Alamat Sesuai KTP
    title: "Data Pemohon (sesuai KTP)",
    lead: "Saya yang bertanda tangan di bawah ini:",
    hint: "Terisi otomatis dari data warga. Koreksi bila ada yang tidak sesuai.",
    fields: [
      f.text("name", "Nama Lengkap", { from: "fullName" }),
      f.nik("nik", "NIK", { from: "nik" }),
      f.area("address", "Alamat Sesuai KTP", { from: "address", span: 2 }),
    ],
  },
  {
    // Surat: "terdapat perbedaan Nama/NIK/Alamat dalam ..." lalu Nama, Alamat, NIK
    title: "Data yang Berbeda",
    lead: "Dengan ini menyatakan dengan sebenarnya bahwa terdapat perbedaan Nama/NIK/Alamat dalam:",
    hint: "Tulis persis seperti yang tercantum di dokumen yang berbeda, termasuk bila ada salah ketik. Bila ada data yang sama dengan KTP, tulis sama.",
    fields: [
      f.text("otherName", "Nama pada dokumen"),
      f.area("otherAddress", "Alamat pada dokumen", { span: 2 }),
      f.nik("otherNik", "NIK pada dokumen", { placeholder: "Sesuai tulisan di dokumen" }),
    ],
  },
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
// KTP & KK wajib. Unggah dokumen yang memuat nama/identitas berbeda (sesuai yang Anda punya).
export const documents = [
  DOC.ktp,
  DOC.kk,
  opt("Fotokopi SHM / Letter C"),
  opt("Fotokopi SPPT PBB"),
  opt("Dokumen lain yang namanya berbeda (ijazah, akta, dll)"),
];

export const meta = {"title": "Surat Pernyataan Beda Nama/Identitas", "code": "PPI"};
