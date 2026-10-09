// Disalin dari public: views/services/letters/marriage-women/n5.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Ubah isian surat ini di sini saja; paket & register ikut berubah.
// Surat Izin Orang Tua
// Template PDF: letters/marriage-women/letters/n5.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { DOC, N7, calonIstri, calonSuami, ortuNikah } from "@/data/letterFields";

// Langkah 1: isian sesuai surat yang diajukan
export const sections = [ortuNikah("brideFather", "Data Ayah Calon Istri", "Bin (nama ayah dari ayah)"), ortuNikah("brideMother", "Data Ibu Calon Istri", "Binti (nama ayah dari ibu)"), calonIstri(N7), calonSuami(N7)];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = ["Fotokopi KTP ayah dan ibu calon istri", DOC.kk];

export const meta = {"title": "Surat Izin Orang Tua", "code": "N5"};
