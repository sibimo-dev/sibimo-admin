// Disalin dari public: views/services/letters/marriage-women/registration-form.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Ubah isian surat ini di sini saja; paket & register ikut berubah.
// Data Isian Pendaftaran Nikah
// Template PDF: letters/marriage-women/letters/registration-form.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { DOC, akad, calonIstri, calonSuami } from "@/data/letterFields";

// Langkah 1: isian sesuai surat yang diajukan
export const sections = [akad(), calonSuami(), calonIstri()];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [DOC.ktp, DOC.kk, DOC.aktaLahir, DOC.pasFoto];

export const meta = {"title": "Data Isian Pendaftaran Nikah", "code": "FPN"};
