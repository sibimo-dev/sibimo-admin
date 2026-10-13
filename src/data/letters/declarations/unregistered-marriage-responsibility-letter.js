// Disalin dari public: views/services/letters/declarations/unregistered-marriage-responsibility-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Surat Pernyataan Tanggung Jawab Mutlak Perkawinan Belum Tercatat (F.1.07)
// Template PDF: letters/unregistered-marriage-responsibility-letter.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { f, OPT, person, DOC, opt } from "@/data/letterFields";

// Langkah 1: isian sesuai surat yang diajukan
export const sections = [
  // Surat: Nama, NIK, Tempat & Tanggal Lahir, Pekerjaan, Alamat (suami = Pihak Pertama, istri = Pihak Kedua)
  person("husband", "Data Suami (Pihak Pertama)", ["name", "nik", "birth", "occupation", "address"]),
  person("wife", "Data Istri (Pihak Kedua)", ["name", "nik", "birth", "occupation", "address"]),
  {
    title: "Data Perkawinan",
    fields: [f.date("marriageDate", "Tanggal Perkawinan Dilaksanakan")],
  },
  {
    // Surat: saksi I dan saksi II (Nama, NIK)
    title: "Saksi-saksi Perkawinan",
    fields: [
      f.text("witness1Name", "Nama Saksi I"),
      f.nik("witness1Nik", "NIK Saksi I"),
      f.text("witness2Name", "Nama Saksi II"),
      f.nik("witness2Nik", "NIK Saksi II"),
    ],
  },
  {
    // Surat: tabel anak (No, Nama, Nomor Akta Kelahiran, SHDK) maksimal 7 baris
    title: "Anak dari Perkawinan",
    hint: "Isi bila ada anak. Lewati bila belum punya anak.",
    fields: [
      f.rows("children", "Daftar anak", [
        { key: "name", label: "Nama" },
        { key: "birthCertificateNumber", label: "Nomor Akta Kelahiran (opsional)", optional: true },
        { key: "shdk", label: "SHDK", type: "select", options: OPT.shdk, default: "Anak" },
      ], { optional: true, max: 7 }),
    ],
  },
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [
  "Fotokopi KTP suami dan istri",
  DOC.kk,
  opt(DOC.ktpSaksi),
];

export const meta = {"title": "Surat Pernyataan Tanggung Jawab Mutlak Perkawinan Belum Tercatat", "code": "PNB"};
