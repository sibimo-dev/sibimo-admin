// Disalin dari public: views/services/letters/death/death-report.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Ubah isian surat ini di sini saja; paket & register ikut berubah.
// Laporan Kematian
// Template PDF: letters/death/death-report.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { DOC, deathDeceased, deathSigner } from "@/data/letterFields";

// Langkah 1: Yang Bertanda Tangan (umur dihitung dari tanggal lahir) + Dengan Ini Melaporkan Kematian
export const sections = [
  deathSigner(["nik", "name", "birthDate", "occupation", "address", "relation"]),
  deathDeceased(
    ["name", "nik", "kk", "gender", "birthPlace", "religion", "occupation", "address", "childOrder", "deathDate", "deathDay", "deathTime", "deathCause", "deathCauseDetail", "informant", "deathPlace", "deathCity"],
    "Dengan Ini Melaporkan Kematian",
    { birthPlace: "Tempat Dilahirkan", deathPlace: "Tempat Meninggal" },
  ),
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [DOC.suratKematian, DOC.kk, "Fotokopi KTP almarhum/almarhumah", "Fotokopi KTP pelapor"];

export const meta = {"title": "Laporan Kematian", "code": "PLM"};
