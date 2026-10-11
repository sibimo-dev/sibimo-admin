// Disalin dari public: views/services/letters/declarations/population-service-authorization-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Surat Kuasa Dalam Pelayanan Administrasi Kependudukan (F.1.07)
// Template PDF: letters/population-service-authorization-letter.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { f, OPT, person, DOC } from "@/data/letterFields";

// Langkah 1: isian sesuai surat yang diajukan
export const sections = [
  {
    // Surat (pemberi kuasa): Nama, NIK, Tempat & Tanggal Lahir, Pekerjaan, Alamat
    title: "Data Pemberi Kuasa",
    hint: "Terisi otomatis dari data warga. Koreksi bila ada yang tidak sesuai.",
    fields: [
      f.text("name", "Nama Lengkap", { from: "fullName" }),
      f.nik("nik", "NIK", { from: "nik" }),
      f.text("birthPlace", "Tempat Lahir", { from: "birthPlace" }),
      f.date("birthDate", "Tanggal Lahir", { from: "birthDate" }),
      f.select("occupation", "Pekerjaan", OPT.occupation, { from: "occupation", editable: true }),
      f.area("address", "Alamat", { from: "address", span: 2 }),
    ],
  },
  // Surat (yang diberi kuasa): Nama, NIK, Tempat & Tanggal Lahir, Pekerjaan, Alamat
  person("attorney", "Data Penerima Kuasa (yang Diberi Kuasa)", ["name", "nik", "birth", "occupation", "address"]),
  {
    // Surat: "... dikarenakan kondisi saya dalam keadaan ......"
    title: "Alasan Pemberian Kuasa",
    hint: "Pilih salah satu alasan atau ketik sendiri.",
    fields: [
      f.select("grantorCondition", "Kondisi pemberi kuasa saat ini", ["Sakit", "Lanjut usia", "Penyandang disabilitas", "Berada di luar daerah/luar negeri", "Berhalangan hadir"], { editable: true, span: 2 }),
    ],
  },
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [
  DOC.ktp,
  "Fotokopi KTP penerima kuasa",
  DOC.kk,
];

export const meta = {"title": "Surat Kuasa Dalam Pelayanan Administrasi Kependudukan", "code": "KPK"};
