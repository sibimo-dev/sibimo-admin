// Disalin dari public: views/services/letters/birth/birth-certificate-referral-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Ubah isian surat ini di sini saja; paket & register ikut berubah.
// Surat Keterangan Mohon Akta Kelahiran
// Template PDF: letters/birth/birth-certificate-referral-letter.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { arrange, DOC, f, pemohon } from "@/data/letterFields";

// Langkah 1: isian sesuai surat yang diajukan
export const sections = arrange(
  [pemohon(), { title: "Data Anak", fields: [f.text("childName", "Nama anak")] }],
  {
    // Urutan blok (judul). Pindahkan baris untuk mengubah urutan.
    order: [
      "Data Pemohon",
      "Data Anak",
    ],
    // Urutan isian di tiap blok (key = variabel blade). Pindahkan baris untuk mengatur posisi.
    // Taruh key blok lain di sini untuk memindahkannya ke blok ini.
    fields: {
      "Data Pemohon": [
        "name",           // Nama Lengkap
        "nik",            // NIK
        "birthPlace",     // Tempat Lahir
        "birthDate",      // Tanggal Lahir
        "gender",         // Jenis Kelamin
        "maritalStatus",  // Status Perkawinan
        "religion",       // Agama
        "occupation",     // Pekerjaan
        "address",        // Alamat
      ],
      "Data Anak": [
        "childName",  // Nama anak
      ],
    },
    // Ubah label/placeholder/span satu isian khusus surat ini. Contoh:
    // patch: { childBirthOrder: { placeholder: "Contoh: Kedua" } },
    // Buang isian dari surat ini. Contoh:
    // drop: ["childWeight"],
  },
);

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = ["Surat keterangan lahir dari dokter/bidan", DOC.ktp, DOC.kk, DOC.akta];

export const meta = {"title": "Surat Keterangan Mohon Akta Kelahiran", "code": "PAK"};
