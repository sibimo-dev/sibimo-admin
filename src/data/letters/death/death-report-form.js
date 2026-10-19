// Disalin dari public: views/services/letters/death/death-report-form.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Ubah isian surat ini di sini saja; paket & register ikut berubah.
// Formulir Pelaporan Kematian (Untuk Mendapatkan Akta Kematian)
// Template PDF: letters/death/death-report-form.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { DEATH_JENAZAH_FORM, PELAPOR_FULL, dokJenazah, deathDeceased, deathParent, deathWitness, keluarga, pelapor, f } from "@/data/letterFields";

// Langkah 1: No KK, Nama KK, Jenazah, Ibu, Ayah, Pelapor, Saksi I & II, Data Administrasi (Pelapor & Data Administrasi diisi petugas/admin kalurahan, khusus admin)
export const sections = [
  keluarga(),
  deathDeceased(DEATH_JENAZAH_FORM),
  deathParent("mother", "Data Ibu", ["nik", "name", "birthPlace", "birthDate", "occupation", "addressKtp", "nationality"]),
  deathParent("father", "Data Ayah", ["nik", "name", "birthPlace", "birthDate", "occupation", "address", "nationality"]),
  pelapor(PELAPOR_FULL),
  deathWitness(1),
  deathWitness(2),
  // "DATA ADMINISTRASI (di isi oleh petugas)" di kertas (di bawah Saksi I & II): 1. Jenis Pelaporan  2. Nama Petugas Register Desa (+ paraf petugas).
  {
    title: "Data Administrasi (Diisi Petugas)",
    hint: "Diisi petugas kalurahan. Jenis Pelaporan dicetak dengan pilihan lain dicoret; pilih dari daftar atau ketik sendiri. Nama petugas opsional; kosongkan bila ditulis tangan.",
    fields: [
      f.select("reportType", "Jenis Pelaporan", ["Rutin", "Terlambat"], { default: "Rutin", editable: true }),
      f.text("receivingOfficerName", "Nama Petugas Register Desa", { optional: true }),
    ],
  },
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = dokJenazah();

export const meta = {"title": "Formulir Pelaporan Kematian (Untuk Mendapatkan Akta Kematian)", "code": "LPM"};