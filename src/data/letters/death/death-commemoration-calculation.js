// Disalin dari public: views/services/letters/death/death-commemoration-calculation.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Ubah isian surat ini di sini saja; paket & register ikut berubah.
// Perhitungan Selamatan 3 Hari Sampai 1000 Hari
// Template PDF: letters/death/death-commemoration-calculation.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { DOC, deathDeceased, opt } from "@/data/letterFields";

// Langkah 1: Nama, Alamat, Hari Meninggal, Jam. Perhitungan selamatan dihitung sistem dari tanggal.
export const sections = [
  deathDeceased(["name", "address", "deathDate", "deathDay", "deathTime"], "Data Almarhum/ah", { name: "Nama" }),
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [DOC.ktp, opt(DOC.suratKematian)];

export const meta = {"title": "Perhitungan Selamatan 3 Hari Sampai 1000 Hari", "code": "HPK"};
