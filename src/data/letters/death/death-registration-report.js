// Disalin dari public: views/services/letters/death/death-registration-report.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Ubah isian surat ini di sini saja; paket & register ikut berubah.
// Pelaporan Pencatatan Kematian
// Template PDF: letters/death/death-registration-report.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { PELAPOR_REGISTRATION_DEATH, dokJenazah, deathDeceased, deathParent, deathWitness, keluarga, pelapor } from "@/data/letterFields";

// Langkah 1: Jenazah (Jenis Kelamin/Anak Ke, Tanggal & Jam Kematian), Ibu & Ayah (TTL/Umur, alamat), Pelapor (diisi petugas/admin, khusus admin), Saksi (Tgl Lahir/Umur)
export const sections = [
  keluarga(),
  deathDeceased(["nik", "name", "gender", "childOrder", "birthPlace", "birthDate", "age", "religion", "occupation", "address", "deathDate", "deathTime", "deathCause", "deathPlace", "informant"]),
  deathParent("mother", "Data Ibu", ["nik", "name", "birthPlace", "birthDate", "age", "address"]),
  deathParent("father", "Data Ayah", ["nik", "name", "birthPlace", "birthDate", "age", "address"]),
  pelapor(PELAPOR_REGISTRATION_DEATH),
  deathWitness(1, ["nik", "name", "birthDate", "ageOptional", "address"]),
  deathWitness(2, ["nik", "name", "birthDate", "ageOptional", "address"]),
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = dokJenazah();

export const meta = {"title": "Pelaporan Pencatatan Kematian", "code": "PCK"};