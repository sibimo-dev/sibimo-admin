// Disalin dari public: views/services/letters/letter-c/land-origin-certificate-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Keterangan Asal Tanah
// Template PDF: letters/letter-c/land-origin-certificate-letter.blade.php
import { DOC, DOC_LETTER_C, DOC_PBB, f } from "@/data/letterFields";

export const sections = [
  {
    title: "Data Sertifikat Hak Milik",
    fields: [
      f.text("certificateNumber", "Nomor Sertifikat Hak Milik"),
      f.text("ownerName", "Tertulis atas nama"),
      f.text("area", "Luas tanah (m²)", { placeholder: "Contoh: 250" }),
      f.text("areaInWords", "Luas (dengan huruf)", { placeholder: "Contoh: dua ratus lima puluh" }),
      f.text("measurementLetterNumber", "Nomor surat ukur", { optional: true }),
      f.date("measurementLetterDate", "Tanggal surat ukur", { optional: true }),
      f.text("hamlet", "Terletak di Dusun"),
    ],
  },
];

export const documents = [DOC.ktp, DOC.kk, DOC_LETTER_C, DOC_PBB];

export const meta = {"title": "Surat Keterangan Asal Tanah", "code": "KAT"};
