// Disalin dari public: views/services/letters/death/death-data-statement.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Ubah isian surat ini di sini saja; paket & register ikut berubah.
// Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) Kebenaran Data Kematian
// Template PDF: letters/death/death-data-statement.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { DOC, deathDeceased, deathSigner } from "@/data/letterFields";

// Langkah 1: Yang Bertanda Tangan (umur dihitung dari tanggal lahir) + Identitas Yang Dilaporkan
export const sections = [
  deathSigner(["nik", "name", "birthPlace", "birthDate", "occupation", "address"]),
  deathDeceased(["name", "nik", "birthPlace", "birthDate", "deathDate", "deathDay", "deathTime", "deathPlace"], "Identitas Yang Dilaporkan", { deathPlace: "Tempat Meninggal" }),
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [DOC.suratKematian, DOC.ktp, DOC.kk];

export const meta = {"title": "Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) Kebenaran Data Kematian", "code": "PDM"};
