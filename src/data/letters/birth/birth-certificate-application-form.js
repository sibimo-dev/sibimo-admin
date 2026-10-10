// Disalin dari public: views/services/letters/birth/birth-certificate-application-form.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Ubah isian surat ini di sini saja; paket & register ikut berubah.
// Permohonan Akta Kelahiran
// Template PDF: letters/birth/birth-certificate-application-form.blade.php
// Nama field (key) = variabel di blade (aturan penamaan: lihat komentar di data/letterFields.js).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.

import { arrange, DOC, DOC_LAHIR, opt, PELAPOR_APPLICATION, BIRTH_MARRIAGE_APPLICATION, BIRTH_PARENT_BRIEF, birthChild, birthFather, birthDocumentsChecklist, birthMother, birthFamily, birthParentsMarriage, pelapor } from "@/data/letterFields";

// Langkah 1: isian sesuai surat yang diajukan. F. "Data Pelapor" diisi petugas/admin kalurahan (khusus admin, tidak ada di form public).
export const sections = arrange(
  [
    birthFamily(),
    birthChild(["nik", "name", "birthPlace", "birthDate", "gender"]),
    birthMother(BIRTH_PARENT_BRIEF, "Data Ibu Kandung"),
    birthFather(BIRTH_PARENT_BRIEF, "Data Ayah Kandung"),
    birthParentsMarriage(BIRTH_MARRIAGE_APPLICATION),
    pelapor(PELAPOR_APPLICATION),
    birthDocumentsChecklist(),
  ],
  {
    // Urutan blok (judul). Pindahkan baris untuk mengubah urutan.
    order: [
      "Data Keluarga",
      "Data Bayi/Anak",
      "Data Ibu Kandung",
      "Data Ayah Kandung",
      "Data Perkawinan Orang Tua",
      "Data Pelapor",
      "Dokumen yang Dilampirkan",
    ],
    // Urutan isian di tiap blok (key = variabel blade). Pindahkan baris untuk mengatur posisi.
    // Taruh key blok lain di sini untuk memindahkannya ke blok ini.
    fields: {
      "Data Keluarga": [
        "familyCardNumber",  // Nomor KK
        "headOfFamilyName",  // Nama Kepala Keluarga
      ],
      "Data Bayi/Anak": [
        "childNik",         // NIK Anak
        "childName",        // Nama Lengkap Anak
        "childBirthPlace",  // Tempat Kelahiran
        "childBirthDate",   // Tanggal Lahir
        "childGender",      // Jenis Kelamin
      ],
      "Data Ibu Kandung": [
        "motherNik",      // NIK
        "motherName",     // Nama Lengkap
        "motherAddress",  // Alamat
        "motherRt",     // RT
        "motherRw",     // RW
      ],
      "Data Ayah Kandung": [
        "fatherNik",      // NIK
        "fatherName",     // Nama Lengkap
        "fatherAddress",  // Alamat
        "fatherRt",     // RT
        "fatherRw",     // RW
      ],
      "Data Perkawinan Orang Tua": [
        "marriageCertificateNumber",  // Nomor Kutipan Akta Perkawinan
        "marriageDate",               // Tanggal Pernikahan
      ],
      "Data Pelapor": [
        "reporterNik",            // NIK
        "reporterName",           // Nama Lengkap
        "reporterAddress",        // Alamat
        "reporterPhone",          // No HP / Telepon / Email Aktif
        "reporterApplicationDate",// Tanggal Permohonan
      ],
      "Dokumen yang Dilampirkan": [
        "documents",  // Dokumen yang dilampirkan
      ],
    },
    // Ubah label/placeholder/span satu isian khusus surat ini. Contoh:
    // patch: { childBirthOrder: { placeholder: "Contoh: Kedua" } },
    // Buang isian dari surat ini. Contoh:
    // drop: ["childWeight"],
  },
);

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [DOC_LAHIR, DOC.kk, "Fotokopi KTP ayah dan ibu/wali/pelapor", DOC.akta, DOC.ktpSaksi, opt("Surat kuasa dan fotokopi KTP penerima kuasa"), opt("Fotokopi paspor (bagi WNI bukan penduduk/orang asing)"), opt("SPTJM kebenaran data kelahiran"), opt("SPTJM kebenaran sebagai pasangan suami istri")];

export const meta = {"title": "Permohonan Akta Kelahiran", "code": "AKL"};