// Disalin dari public: views/services/letters/declarations/heir-power-of-attorney-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Kuasa Sidang Waris
// Template PDF: letters/heir-power-of-attorney-letter.blade.php

import { f, OPT, person, DOC, opt } from "@/data/letterFields";

// Langkah 1: isian sesuai surat yang diajukan
export const sections = [
  {
    // Surat Pihak Pertama: Nama, Tmpt/tgl Lahir, Jenis Kelamin, NIK, Alamat
    title: "Data Pemberi Kuasa / Ahli Waris (Pihak Pertama)",
    hint: "Terisi otomatis dari data warga. Koreksi bila ada yang tidak sesuai.",
    fields: [
      f.text("name", "Nama Lengkap", { from: "fullName" }),
      f.nik("nik", "NIK", { from: "nik" }),
      f.text("birthPlace", "Tempat Lahir", { from: "birthPlace" }),
      f.date("birthDate", "Tanggal Lahir", { from: "birthDate" }),
      f.select("gender", "Jenis Kelamin", OPT.gender, { from: "gender" }),
      f.area("address", "Alamat", { from: "address", span: 2 }),
    ],
  },
  // Surat Pihak Kedua: Nama, Tmpt/tgl Lahir, Jenis Kelamin, NIK, Alamat
  person("attorney", "Data Penerima Kuasa (Pihak Kedua)", ["name", "nik", "birth", "gender", "address"]),
  {
    // Surat: "ahli waris dari Almarhum/Almarhumah ... yang telah meninggal dunia di ..."
    title: "Data Pewaris (Almarhum/Almarhumah)",
    hint: "Pemberi kuasa bertindak sebagai ahli waris dari orang ini.",
    fields: [
      f.text("deceasedName", "Nama Pewaris"),
      f.text("deceasedDeathPlace", "Meninggal Dunia di", { span: 2 }),
    ],
  },
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [
  DOC.ktp,
  "Fotokopi KTP penerima kuasa",
  DOC.kk,
  opt(DOC.suratKematian),
  opt("Surat keterangan ahli waris"),
];

export const meta = {"title": "Surat Kuasa Sidang Waris", "code": "KAW"};
