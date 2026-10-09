// Disalin dari public: views/services/letters/birth/birth-certificate-power-of-attorney.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Ubah isian surat ini di sini saja; paket & register ikut berubah.
// Surat Kuasa
// Template PDF: letters/birth/birth-certificate-power-of-attorney.blade.php
// Nama field (key) = variabel di blade (aturan penamaan: lihat komentar di data/letterFields.js).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.

import { arrange, DOC, OPT, f, opt } from "@/data/letterFields";

// Langkah 1: isian sesuai surat yang diajukan
export const sections = arrange(
  [
    // $grantor = $birth['father'] → fatherName, fatherOccupation, fatherAddress
    { title: "Pemberi Kuasa (Ayah)", fields: [f.text("fatherName", "Nama Lengkap", { from: "asFather:fullName" }), f.select("fatherOccupation", "Pekerjaan", OPT.occupation, { from: "asFather:occupation", editable: true }), f.area("fatherAddress", "Alamat", { from: "asFather:address", span: 2 })] },
    // Penerima kuasa = pelapor → diisi petugas/admin kalurahan, bukan warga.
    // $childName = $birth['child']['name'] → childName
    { title: "Data Anak", fields: [f.text("childName", "Nama Anak")] },
  ],
  {
    // Urutan blok (judul). Pindahkan baris untuk mengubah urutan.
    order: [
      "Pemberi Kuasa (Ayah)",
      "Data Anak",
    ],
    // Urutan isian di tiap blok (key = variabel blade). Pindahkan baris untuk mengatur posisi.
    // Taruh key blok lain di sini untuk memindahkannya ke blok ini.
    fields: {
      "Pemberi Kuasa (Ayah)": [
        "fatherName",        // Nama Lengkap
        "fatherOccupation",  // Pekerjaan
        "fatherAddress",     // Alamat
      ],
      "Data Anak": [
        "childName",  // Nama Anak
      ],
    },
    // Ubah label/placeholder/span satu isian khusus surat ini. Contoh:
    // patch: { childBirthOrder: { placeholder: "Contoh: Kedua" } },
    // Buang isian dari surat ini. Contoh:
    // drop: ["childWeight"],
  },
);

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = ["Fotokopi KTP pemberi kuasa", "Fotokopi KTP penerima kuasa", DOC.kk, opt("Surat keterangan lahir")];

export const meta = {"title": "Surat Kuasa", "code": "KAK"};
