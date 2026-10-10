// Disalin dari public: views/services/letters/certificates/legalization-register.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Legalisasi
// Template PDF: letters/legalization-register.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { f, OPT, pemohonRingkas, DOC, opt } from "@/data/letterFields";

// Langkah 1: kolom `people` disesuaikan urut dengan kolom tabel register
export const sections = [
  pemohonRingkas(),
  { title: "Register", fields: [f.text("registerYear", "Tahun Register", { placeholder: "Contoh: 2026" })] },
  {
    title: "Data Penduduk yang Dilegalisasi",
    fields: [
      f.rows("people", "Daftar penduduk", [
        { key: "date", label: "Tanggal", type: "date" },
        { key: "kkNumber", label: "Nomor KK" },
        { key: "address", label: "Alamat" },
        { key: "rt", label: "RT" },
        { key: "rw", label: "RW" },
        { key: "nik", label: "NIK" },
        { key: "name", label: "Nama Lengkap" },
        { key: "gender", label: "L/P", type: "select", options: OPT.gender },
        { key: "birthPlace", label: "Tempat Lahir" },
        { key: "birthDate", label: "Tanggal Lahir", type: "date" },
        { key: "religion", label: "Agama", type: "select", options: OPT.religion },
        { key: "maritalStatus", label: "Status Kawin", type: "select", options: OPT.marital },
        { key: "familyStatus", label: "Status Hub dlm Keluarga", type: "select", options: OPT.shdk },
        { key: "education", label: "Pendidikan Terakhir", type: "select", options: OPT.education },
        { key: "occupation", label: "Jenis Pekerjaan" },
      ]),
    ],
  },
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [
  "Dokumen asli yang akan dilegalisasi",
  "Fotokopi dokumen yang akan dilegalisasi",
  "Fotokopi KTP-el",
  "Fotokopi KK",
  opt("Surat kuasa dan KTP penerima kuasa (jika dikuasakan)"),
];

export const meta = {"title": "Surat Legalisasi", "code": "LGL"};
