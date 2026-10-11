// Disalin dari public: views/services/letters/death/death-report-form.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Ubah isian surat ini di sini saja; paket & register ikut berubah.
// Formulir Pelaporan Kematian (Untuk Mendapatkan Akta Kematian)
// Template PDF: letters/death/death-report-form.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { DEATH_JENAZAH_FORM, dokJenazah, deathDeceased, deathParent, deathWitness, keluarga } from "@/data/letterFields";

// Langkah 1: No KK, Nama KK, Jenazah, Ibu, Ayah, Saksi I & II (Pelapor diisi petugas)
export const sections = [
  keluarga(),
  deathDeceased(DEATH_JENAZAH_FORM),
  deathParent("mother", "Data Ibu", ["nik", "name", "birthPlace", "birthDate", "occupation", "addressKtp", "nationality"]),
  deathParent("father", "Data Ayah", ["nik", "name", "birthPlace", "birthDate", "occupation", "address", "nationality"]),
  deathWitness(1),
  deathWitness(2),
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = dokJenazah();

export const meta = {"title": "Formulir Pelaporan Kematian (Untuk Mendapatkan Akta Kematian)", "code": "LPM"};
