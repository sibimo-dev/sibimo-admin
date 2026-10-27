// Disalin dari public: views/services/letters/certificates/bussiness-permit-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Keterangan Usaha
// Template PDF: letters/bussiness-permit-letter.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { f, DOC, OPT } from "@/data/letterFields";

// Langkah 1: isian disesuaikan urut dengan template surat
export const sections = [
  {
    title: "Data Pemohon",
    hint: "Terisi otomatis dari data warga. Koreksi bila ada yang tidak sesuai.",
    fields: [
      f.text("name", "Nama", { from: "fullName" }),
      f.text("birthPlaceDate", "Tempat/Tgl. Lahir", { from: "birthPlaceDate", placeholder: "Contoh: Sleman, 17 Agustus 1990" }),
      f.nik("nik", "NIK", { from: "nik" }),
      f.text("gender", "Jenis Kelamin", { from: "gender", placeholder: "1. Laki-laki / 2. Perempuan" }),
      f.text("maritalStatus", "Status Perkawinan", { from: "maritalStatus", placeholder: "Belum Kawin / Kawin / Cerai Hidup / Cerai Mati" }),
      f.text("occupation", "Pekerjaan", { from: "occupation" }),
      f.area("address", "Alamat", { from: "address", span: 2 }),
    ],
  },
  {
    title: "Data Usaha",
    fields: [
      f.text("businessType", "Jenis Usaha"),
      f.area("businessAddress", "Alamat Usaha", { span: 2 }),
    ],
  },
  {
    title: "Keperluan",
    fields: [
      f.text("purpose", "Dipergunakan untuk"),
    ],
  },
];

// Langkah 2: dokumen pendukung (hanya FC KTP & FC KK)
export const documents = [
  DOC.ktp,
  DOC.kk,
];

export const meta = {"title": "Surat Keterangan Usaha", "code": "IZU"};
