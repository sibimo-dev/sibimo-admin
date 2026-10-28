// Surat Pernyataan Tanggung Jawab Mutlak Kebenaran Data Kelahiran (SPTJM Data Kelahiran)
// Template PDF: letters/birth/birth-data-responsibility-statement.blade.php
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
//
// Nama field (key) = variabel di blade (aturan penamaan: lihat komentar di data/letterFields.js):
//   $applicant['nik'|'name'|'birth'|'occupation'|'address']      → nik, name, birthPlace + birthDate, occupation, address
//   $child[...]                                                  → childNik, childName, childBirthPlace + childBirthDate, childOccupation, childAddress
//   $mother[...] / $father[...]                                  → motherName, motherNik, ... / fatherName, fatherNik, ...
//   $birth_attendant[...]                                        → birthAttendantName, birthAttendantNik, ...
//   $witnesses[0] / $witnesses[1] (name, nik)                    → witness1Name, witness1Nik / witness2Name, witness2Nik
//   $signature (city, name = Ulu-Ulu)                            → TIDAK jadi field (diisi sistem/otorisasi)
//
// TTD (4): 1. Yang menyatakan (= name pemohon)  2. Saksi I (witness1Name)  3. Saksi II (witness2Name)
//          4. a.n Lurah / Ulu-Ulu → tidak jadi field (ditangani di otorisasi surat).
// → semua penandatangan yang perlu nama sudah punya isian di bawah, jadi tidak perlu field penandatangan tambahan.
import { arrange, DOC, DOC_LAHIR, OPT, f, opt, birthChild, birthFather, birthMother } from "@/data/letterFields";

// Bagian data orang tua yang dicetak di kertas: Nama, NIK, Tempat/Tanggal Lahir, Pekerjaan, Alamat.
const PARENT_PARTS = ["name", "nik", "birthPlace", "birthDate", "occupation", "address"];

// Saksi: hanya Nama & NIK (key sama dengan blok saksi di surat kelahiran lain → terisi sekali untuk satu paket).
const saksi = (n) => ({
  title: `Data Saksi ${n}`,
  fields: [f.text(`witness${n}Name`, "Nama Lengkap"), f.nik(`witness${n}Nik`)],
});

// Anak: Nama, NIK (opsional bila belum ada), Tempat & Tanggal Lahir dari helper bersama.
const anak = birthChild(["name", "nik", "birthPlace", "birthDate"], "Data Anak");

// Langkah 1: isian sesuai surat yang diajukan
export const sections = arrange(
  [
    // $applicant = yang bertanda tangan (terisi otomatis dari data warga)
    {
      title: "Data Pemohon",
      hint: "Yang bertanda tangan di bawah ini. Terisi otomatis dari data warga. Koreksi bila ada yang tidak sesuai.",
      fields: [
        f.nik("nik", "NIK", { from: "nik" }),
        f.text("name", "Nama Lengkap", { from: "fullName" }),
        f.text("birthPlace", "Tempat Lahir", { from: "birthPlace" }),
        f.date("birthDate", "Tanggal Lahir", { from: "birthDate" }),
        f.occupation("occupation", "Pekerjaan", { from: "occupation" }),
        f.area("address", "Alamat", { from: "address", span: 2 }),
      ],
    },
    // $child = yang dinyatakan (anak kandung)
    {
      ...anak,
      hint: "Anak yang dinyatakan sebagai anak kandung dari ibu dan ayah di bawah.",
      fields: [
        ...anak.fields, // childName, childNik (opsional), childBirthPlace, childBirthDate
        f.occupation("childOccupation", "Pekerjaan", { default: "Belum/Tidak Bekerja" }),
        f.area("childAddress", "Alamat", { span: 2 }),
      ],
    },
    // $mother, $father = anak kandung dari (terisi otomatis sesuai jenis kelamin NIK pemohon)
    birthMother(PARENT_PARTS, "Data Ibu Kandung"),
    birthFather(PARENT_PARTS, "Data Ayah Kandung"),
    // $birth_attendant = yang lahir dengan penolong kelahiran
    {
      title: "Data Penolong Kelahiran",
      hint: "Orang yang menolong persalinan (dokter, bidan, dukun, dst.).",
      fields: [
        f.text("birthAttendantName", "Nama Lengkap"),
        f.nik("birthAttendantNik"),
        f.text("birthAttendantBirthPlace", "Tempat Lahir"),
        f.date("birthAttendantBirthDate", "Tanggal Lahir"),
        f.text("birthAttendantOccupation", "Pekerjaan", { placeholder: "Contoh: Bidan" }),
        f.area("birthAttendantAddress", "Alamat", { span: 2 }),
      ],
    },
    // $witnesses[0], $witnesses[1]
    saksi(1),
    saksi(2),
  ],
  {
    // Urutan blok (judul). Pindahkan baris untuk mengubah urutan.
    order: [
      "Data Pemohon",
      "Data Anak",
      "Data Ibu Kandung",
      "Data Ayah Kandung",
      "Data Penolong Kelahiran",
      "Data Saksi 1",
      "Data Saksi 2",
    ],
    // Urutan isian di tiap blok (key = variabel blade). Pindahkan baris untuk mengatur posisi.
    fields: {
      "Data Pemohon": [
        "nik",         // NIK (di kertas NIK paling atas)
        "name",        // Nama Lengkap
        "birthPlace",  // Tempat Lahir
        "birthDate",   // Tanggal Lahir
        "occupation",  // Pekerjaan
        "address",     // Alamat
      ],
      "Data Anak": [
        "childName",        // Nama Lengkap
        "childNik",         // NIK
        "childBirthPlace",  // Tempat Lahir
        "childBirthDate",   // Tanggal Lahir
        "childOccupation",  // Pekerjaan
        "childAddress",     // Alamat
      ],
      "Data Ibu Kandung": [
        "motherName",        // Nama Ibu
        "motherNik",         // NIK
        "motherBirthPlace",  // Tempat Lahir
        "motherBirthDate",   // Tanggal Lahir
        "motherOccupation",  // Pekerjaan
        "motherAddress",     // Alamat
      ],
      "Data Ayah Kandung": [
        "fatherName",        // Nama Ayah
        "fatherNik",         // NIK
        "fatherBirthPlace",  // Tempat Lahir
        "fatherBirthDate",   // Tanggal Lahir
        "fatherOccupation",  // Pekerjaan
        "fatherAddress",     // Alamat
      ],
    },
    // Ubah label/placeholder/span satu isian khusus surat ini.
    patch: {
      motherName: { label: "Nama Ibu" },
      fatherName: { label: "Nama Ayah" },
    },
  },
);

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [DOC.ktp, DOC.kk, "Fotokopi KTP ayah dan ibu", opt(DOC.ktpSaksi), opt(DOC_LAHIR)];

export const meta = {"title": "Surat Pernyataan Tanggung Jawab Mutlak Kebenaran Data Kelahiran", "code": "PDL"};
