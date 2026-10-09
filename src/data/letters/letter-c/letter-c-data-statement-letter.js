// Disalin dari public: views/services/letters/letter-c/letter-c-data-statement-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Pernyataan Permohonan Data Letter C
// Template PDF: letters/letter-c/letter-c-data-statement-letter.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { f, opt } from "@/data/letterFields";

// Langkah 1: isian disesuaikan urut dengan template surat
export const sections = [
  {
    title: "Data Pemohon",
    fields: [
      f.text("name", "Nama"),
      f.text("nik", "NIK"),
      f.text("birthPlaceDate", "Tempat/Tgl. Lahir", { placeholder: "Contoh: Sleman, 17 Agustus 1990" }),
      f.select("gender", "Jenis Kelamin", ["Laki-laki", "Perempuan"]),
      f.area("address", "Alamat", { span: 2 }),
      f.text("occupation", "Pekerjaan"),
    ],
  },
  {
    title: "Data Letter C",
    fields: [
      f.text("hamlet", "Padukuhan letak Letter C"),
      f.select("purposeType", "Keperluan", ["Warisan", "Konversi"]),
      f.text("letterCOwnerName", "Nama pemilik Letter C"),
      f.text("hamletHeadName", "Nama Dukuh yang mengetahui", { optional: true }),
    ],
  },
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
// Untuk WARISAN: akta kematian, SPPT-PBB, KTP & KK ahli waris
// Untuk KONVERSI: KTP & KK pemilik C, SPPT-PBB
export const documents = [
  "Fotokopi SPPT-PBB tanah",
  opt("[Warisan] Akta kematian pemilik C kakung dan putri (sebelum 2010 boleh Surat Keterangan Kematian)"),
  opt("[Warisan] Fotokopi KTP & KK ahli waris (jika ahli waris sudah meninggal: akta kematian ahli waris + KTP & KK ahli warisnya)"),
  opt("[Konversi] Fotokopi KTP & KK pemilik Letter C"),
];

export const meta = {"title": "Surat Pernyataan Permohonan Data Letter C", "code": "PLC"};
