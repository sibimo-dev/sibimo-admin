// Disalin dari public: views/services/letters/birth/birth-report-form.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Ubah isian surat ini di sini saja; paket & register ikut berubah.
// Formulir Pelaporan Kelahiran (Untuk Mendapatkan Akta Kelahiran) — Kode F2.02
// Template PDF: letters/birth/birth-report-form.blade.php
// Nama field (key) = variabel di blade (aturan penamaan: lihat komentar di data/letterFields.js).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.

import { arrange, DOC, opt, birthReportSections } from "@/data/letterFields";

// Langkah 1: isian sesuai surat yang diajukan. Blok "Data Pelapor" diisi petugas/admin kalurahan (khusus admin, tidak ada di form public).
export const sections = arrange(
  birthReportSections(),
  {
    // Urutan blok (judul). Pindahkan baris untuk mengubah urutan.
    order: [
      "Data Keluarga",
      "Data Bayi/Anak",
      "Data Ibu Kandung",
      "Data Ayah Kandung",
      "Data Pelapor",
      "Data Saksi 1",
      "Data Saksi 2",
    ],
    // Urutan isian di tiap blok (key = variabel blade). Pindahkan baris untuk mengatur posisi.
    // Taruh key blok lain di sini untuk memindahkannya ke blok ini.
    fields: {
      "Data Keluarga": [
        "familyCardNumber",  // Nomor KK
        "headOfFamilyName",  // Nama Kepala Keluarga
      ],
      "Data Bayi/Anak": [
        "childNik",             // NIK Anak
        "childName",            // Nama Lengkap Anak
        "childGender",          // Jenis Kelamin
        "childDeliveryPlace",   // Tempat Dilahirkan
        "childBirthPlace",      // Tempat Kelahiran
        "childBirthDate",       // Tanggal Lahir
        "childBirthTime",       // Jam Kelahiran
        "childPlurality",       // Jenis Kelahiran
        "childBirthOrder",      // Kelahiran/Anak ke-
        "childBirthAttendant",  // Penolong Kelahiran
        "childWeight",          // Berat Bayi (Kg)
        "childLength",          // Panjang Bayi (Cm)
      ],
      "Data Ibu Kandung": [
        "motherNik",            // NIK
        "motherName",           // Nama Lengkap
        "motherBirthPlace",     // Tempat Lahir
        "motherBirthDate",      // Tanggal Lahir
        "motherOccupation",     // Pekerjaan
        "motherAddress",        // Alamat
        "motherRt",           // RT
        "motherRw",           // RW
        "motherNationality",    // Kewarganegaraan
        "marriageRecordPlace",  // Tempat Pencatatan Perkawinan
        "marriageRecordDate",   // Tanggal Pencatatan Perkawinan
      ],
      "Data Ayah Kandung": [
        "fatherNik",          // NIK
        "fatherName",         // Nama Lengkap
        "fatherBirthPlace",   // Tempat Lahir
        "fatherBirthDate",    // Tanggal Lahir
        "fatherOccupation",   // Pekerjaan
        "fatherAddress",      // Alamat
        "fatherRt",         // RT
        "fatherRw",         // RW
        "fatherNationality",  // Kewarganegaraan
      ],
      "Data Pelapor": [
        "reporterNik",            // NIK
        "reporterName",           // Nama Lengkap
        "reporterBirthPlace",     // Tempat Lahir
        "reporterBirthDate",      // Tanggal Lahir
        "reporterAge",            // Umur (tahun)
        "reporterOccupation",     // Pekerjaan
        "reporterAddress",        // Alamat
        "reporterReportDate",     // Tanggal Lapor
      ],
      "Data Saksi 1": [
        "witness1Nik",      // NIK
        "witness1Name",     // Nama Lengkap
        "witness1Age",      // Umur (tahun)
        "witness1Address",  // Alamat
      ],
      "Data Saksi 2": [
        "witness2Nik",      // NIK
        "witness2Name",     // Nama Lengkap
        "witness2Age",      // Umur (tahun)
        "witness2Address",  // Alamat
      ],
    },
    // Ubah label/placeholder/span satu isian khusus surat ini. Contoh:
    // patch: { childBirthOrder: { placeholder: "Contoh: Kedua" } },
    // Buang isian dari surat ini. Contoh:
    // drop: ["childWeight"],
  },
);

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [DOC.kk, "Fotokopi KTP ayah dan ibu", DOC.akta, opt("Surat keterangan lahir dari penolong kelahiran")];

export const meta = {"title": "Formulir Pelaporan Kelahiran", "code": "LPK"};