// Disalin dari public: views/services/letters/applications/fuel-recommendation-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Rekomendasi Pembelian Jenis BBM Tertentu
// Template PDF: letters/fuel-recommendation-letter.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { f, pemohonRingkas, opt } from "@/data/letterFields";

// Langkah 1: isian disesuaikan urut dengan template surat
export const sections = [
  pemohonRingkas(),
  {
    title: "Data Penerima Rekomendasi",
    fields: [
      f.area("businessAddress", "Alamat Usaha", { span: 2 }),
      f.text("consumer", "Konsumen"),
      f.text("businessType", "Jenis Usaha Kegiatan"),
    ],
  },
  {
    title: "Kebutuhan BBM",
    fields: [
      f.rows("fuelItems", "Rincian kebutuhan BBM", [
        { key: "retailer", label: "Pengecer Solar" },
        { key: "type", label: "BBM Jenis Tertentu" },
        { key: "description", label: "Konsumen BBM Jenis Tertentu (Liter/Jam/Hari/Minggu/Bulanan)" },
      ], { max: 6 }),
      f.text("total", "Jumlah"),
    ],
  },
  {
    title: "Pemberian BBM Jenis Tertentu (Minyak Solar/Gas Oil)",
    fields: [
      f.text("volumeAllocation", "Alokasi Volume"),
      f.text("pickupLocation", "Tempat Pengambilan"),
      f.text("distributorNumber", "Nomor Lembaga Penyalur"),
      f.text("distributorLocation", "Lokasi"),
    ],
  },
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [
  "Fotokopi KTP",
  "NIB/Surat Keterangan Usaha",
  "Dokumen/Spesifikasi Alat atau Mesin",
  opt("Dokumen Pendukung Lainnya (jika diperlukan)"),
];

export const meta = {"title": "Surat Rekomendasi Pembelian Jenis BBM Tertentu", "code": "BBM"};
