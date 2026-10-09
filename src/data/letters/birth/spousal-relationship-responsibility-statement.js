// Disalin dari public: views/services/letters/birth/spousal-relationship-responsibility-statement.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Ubah isian surat ini di sini saja; paket & register ikut berubah.
// Surat Pernyataan Tanggung Jawab Mutlak Kebenaran Sebagai Pasangan Suami Istri
// Template PDF: letters/birth/spousal-relationship-responsibility-statement.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { arrange, DOC, f, birthSpouseApplicant, birthSpousePerson } from "@/data/letterFields";

// Langkah 1: isian sesuai surat yang diajukan. PELAPOR tidak ada di sini: diisi petugas/admin kalurahan.
export const sections = arrange(
  [
    birthSpouseApplicant(),
    birthSpousePerson("husband", "Data Suami"),
    birthSpousePerson("wife", "Data Istri"),
    { title: "Saksi", fields: [f.rows("marriageWitnesses", "Saksi", [{ key: "name", label: "Nama" }, { key: "nik", label: "NIK" }], { min: 2, max: 2 })] },
  ],
  {
    // Urutan blok (judul). Pindahkan baris untuk mengubah urutan.
    order: [
      "Data Pemohon",
      "Data Suami",
      "Data Istri",
      "Saksi",
    ],
    // Urutan isian di tiap blok (key = variabel blade). Pindahkan baris untuk mengatur posisi.
    // Taruh key blok lain di sini untuk memindahkannya ke blok ini.
    fields: {
      "Data Pemohon": [
        "name",                // Nama Lengkap
        "nik",                 // NIK
        "birthPlace",          // Tempat Lahir
        "birthDate",           // Tanggal Lahir
        "occupation",          // Pekerjaan
        "address",             // Alamat
        "kkNumber",            // Nomor KK
        "familyRelationship",  // Status hubungan keluarga
      ],
      "Data Suami": [
        "husbandName",        // Nama Lengkap
        "husbandNik",         // NIK
        "husbandBirthPlace",  // Tempat Lahir
        "husbandBirthDate",   // Tanggal Lahir
        "husbandOccupation",  // Pekerjaan
        "husbandAddress",     // Alamat
      ],
      "Data Istri": [
        "wifeName",        // Nama Lengkap
        "wifeNik",         // NIK
        "wifeBirthPlace",  // Tempat Lahir
        "wifeBirthDate",   // Tanggal Lahir
        "wifeOccupation",  // Pekerjaan
        "wifeAddress",     // Alamat
      ],
      "Saksi": [
        "marriageWitnesses",  // Saksi
      ],
    },
    // Ubah label/placeholder/span satu isian khusus surat ini. Contoh:
    // patch: { childBirthOrder: { placeholder: "Contoh: Kedua" } },
    // Buang isian dari surat ini. Contoh:
    // drop: ["childWeight"],
  },
);

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = ["Fotokopi KTP suami dan istri", DOC.kk, DOC.ktpSaksi];

export const meta = {"title": "Surat Pernyataan Tanggung Jawab Mutlak Kebenaran Sebagai Pasangan Suami Istri", "code": "PHS"};
