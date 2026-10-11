// Disalin dari public: views/services/letters/applications/kia-application-form.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Formulir Permohonan Penerbitan Kartu Identitas Anak (KIA)
// Template PDF: letters/kia-application-form.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { f, OPT } from "@/data/letterFields";

// Langkah 1: isian sesuai formulir (kunci mengikuti $kia di template PDF)
// Urutan mengikuti formulir: NIK, Nama, Tempat/Tgl Lahir, Jenis Kelamin, Gol. Darah,
// No. KK, Nama Kepala Keluarga, No. Akta Kelahiran, Agama, Kewarganegaraan, Alamat (RT/RW, Kelurahan, Kecamatan)
export const sections = [
  {
    title: "Data Anak",
    fields: [
      f.nik("nik", "NIK"),
      f.text("name", "Nama Lengkap"),
      f.text("birthPlace", "Tempat Lahir"),
      f.date("birthDate", "Tanggal Lahir"),
      f.select("gender", "Jenis Kelamin", OPT.gender),
      f.select("bloodType", "Golongan Darah", ["A", "B", "AB", "O", "Tidak Tahu"], { optional: true }),
    ],
  },
  {
    title: "Data Keluarga",
    fields: [
      f.kk("kkNumber", "Nomor Kartu Keluarga"),
      f.text("householdHead", "Nama Kepala Keluarga"),
      f.text("birthCertNumber", "Nomor Akta Kelahiran"),
    ],
  },
  {
    title: "Agama & Kewarganegaraan",
    fields: [
      f.select("religion", "Agama", OPT.religion),
      f.text("citizenship", "Kewarganegaraan", { default: "WNI" }),
    ],
  },
  {
    title: "Alamat",
    fields: [
      f.text("rt", "RT"),
      f.text("rw", "RW"),
      f.text("village", "Kelurahan", { default: "Bimomartani" }),
      f.text("district", "Kecamatan", { default: "Ngemplak" }),
    ],
  },
];

// Langkah 2: dokumen pendukung (string biasa, keduanya wajib)
export const documents = [
  "Fotokopi Kartu Keluarga (KK)",
  "Fotokopi KTP",
];

export const meta = {"title": "Formulir Permohonan Penerbitan KIA", "code": "KIA"};
