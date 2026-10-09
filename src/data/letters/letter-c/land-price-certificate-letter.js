// Disalin dari public: views/services/letters/letter-c/land-price-certificate-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Keterangan Harga Tanah
// Template PDF: letters/letter-c/land-price-certificate-letter.blade.php
import { DOC, DOC_PBB, f } from "@/data/letterFields";

export const sections = [
  {
    title: "Data Tanah",
    fields: [
      f.text("certificateNumber", "No. Sertifikat/NIB"),
      f.text("area", "Luas tanah (m²)", { placeholder: "Contoh: 250" }),
      f.text("ownerName", "Nama Pemilik"),
    ],
  },
  {
    title: "Letak Tanah",
    fields: [
      f.text("hamlet", "Padukuhan"),
      f.text("village", "Kalurahan/Desa", { placeholder: "Contoh: Bimomartani" }),
      f.text("district", "Kapanewon", { placeholder: "Contoh: Ngemplak" }),
      f.text("city", "Kota/Kabupaten", { placeholder: "Contoh: Sleman" }),
    ],
  },
  {
    title: "Harga Tanah Pasaran Berkisar",
    fields: [
      f.text("priceMin", "Harga terendah (Rp)", { placeholder: "Contoh: 1.500.000" }),
      f.text("priceMax", "Harga tertinggi (Rp)", { placeholder: "Contoh: 2.500.000" }),
    ],
  },
];

export const documents = [DOC.ktp, DOC.kk, DOC_PBB, "Fotokopi sertifikat/bukti kepemilikan tanah"];

export const meta = {"title": "Surat Keterangan Harga Tanah", "code": "KHT"};
