// Disalin dari public: views/services/letters/marriage-women/judge-guardian.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Ubah isian surat ini di sini saja; paket & register ikut berubah.
// Surat Keterangan Wali Hakim
// Template PDF: letters/marriage-women/letters/judge-guardian.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { DOC, calonIstri, calonSuami, f, opt } from "@/data/letterFields";

// Langkah 1: isian sesuai surat yang diajukan
export const sections = [calonIstri(), calonSuami(), { title: "Alasan Wali Hakim", fields: [f.area("judgeGuardianReason", "Sebab dilangsungkan dengan wali hakim", { span: 2 })] }];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [DOC.ktp, DOC.kk, DOC.rt, DOC.aktaLahir, opt("Surat keterangan kematian/ketiadaan wali")];

export const meta = {"title": "Surat Keterangan Wali Hakim", "code": "PWH"};
