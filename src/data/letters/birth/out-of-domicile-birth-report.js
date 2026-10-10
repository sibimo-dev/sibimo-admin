// Disalin dari public: views/services/letters/birth/out-of-domicile-birth-report.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Ubah isian surat ini di sini saja; paket & register ikut berubah.
// Laporan Kelahiran Luar Domisili
// Template PDF: letters/birth/out-of-domicile-birth-report.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { arrange, birthHamlet, birthReportSections, dokBayi } from "@/data/letterFields";

// Langkah 1: isian sesuai surat yang diajukan. PELAPOR tidak ada di sini: diisi petugas/admin kalurahan.
export const sections = arrange(
  [birthHamlet(), ...birthReportSections()],
  {
    // Urutan blok (judul). Pindahkan baris untuk mengubah urutan.
    order: [
      "Dusun / Dukuh",
      "Data Keluarga",
      "Data Bayi/Anak",
      "Data Ibu Kandung",
      "Data Ayah Kandung",
      "Data Saksi 1",
      "Data Saksi 2",
    ],
    // Urutan isian di tiap blok (key = variabel blade). Pindahkan baris untuk mengatur posisi.
    // Taruh key blok lain di sini untuk memindahkannya ke blok ini.
    fields: {
      "Dusun / Dukuh": [
        "hamletName",      // Nama Dusun (Dukuh)
        "hamletHeadName",  // Nama Dukuh (untuk tanda tangan)
      ],
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
        "motherRtRw",           // RT / RW
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
        "fatherRtRw",         // RT / RW
        "fatherNationality",  // Kewarganegaraan
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
export const documents = dokBayi();

export const meta = {"title": "Laporan Kelahiran Luar Domisili", "code": "PLD"};
