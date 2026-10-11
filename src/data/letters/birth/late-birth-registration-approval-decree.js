// Disalin dari public: views/services/letters/birth/late-birth-registration-approval-decree.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Ubah isian surat ini di sini saja; paket & register ikut berubah.
// Surat Pencatatan Kelahiran Terlambat
// Template PDF: letters/birth/late-birth-registration-approval-decree.blade.php
// Nama field (key) = variabel di blade (aturan penamaan: lihat komentar di data/letterFields.js).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.

import { arrange, DOC, DOC_LAHIR, opt, birthChild, birthFather, birthMother } from "@/data/letterFields";

// Langkah 1: isian sesuai surat yang diajukan
export const sections = arrange(
  [
    birthChild(["name", "nik", "gender", "birthOrder", "birthPlace", "birthDate"]),
    birthMother(["name"], "Data Ibu"),
    birthFather(["name"], "Data Ayah"),
  ],
  {
    // Urutan blok (judul). Pindahkan baris untuk mengubah urutan.
    order: [
      "Data Bayi/Anak",
      "Data Ibu",
      "Data Ayah",
    ],
    // Urutan isian di tiap blok (key = variabel blade). Pindahkan baris untuk mengatur posisi.
    // Taruh key blok lain di sini untuk memindahkannya ke blok ini.
    fields: {
      "Data Bayi/Anak": [
        "childName",        // Nama Lengkap Anak
        "childNik",         // NIK Anak
        "childGender",      // Jenis Kelamin
        "childBirthOrder",  // Kelahiran/Anak ke-
        "childBirthPlace",  // Tempat Kelahiran
        "childBirthDate",   // Tanggal Lahir
      ],
      "Data Ibu": [
        "motherName",  // Nama Lengkap
      ],
      "Data Ayah": [
        "fatherName",  // Nama Lengkap
      ],
    },
    // Ubah label/placeholder/span satu isian khusus surat ini. Contoh:
    // patch: { childBirthOrder: { placeholder: "Contoh: Kedua" } },
    // Buang isian dari surat ini. Contoh:
    // drop: ["childWeight"],
  },
);

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [DOC_LAHIR, DOC.kk, "Fotokopi KTP ayah dan ibu", DOC.akta, opt("Surat pernyataan keterlambatan pelaporan")];

export const meta = {"title": "Surat Pencatatan Kelahiran Terlambat", "code": "SKT"};
