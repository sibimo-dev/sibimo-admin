// Disalin dari public: views/services/letters/cover-letters/general-cover-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Surat Pengantar Umum
// Template PDF: letters/general-cover-letter.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { f, OPT, DOC } from "@/data/letterFields";

// Langkah 1: isian sesuai surat yang diajukan
// Judul tiap bagian = kalimat pada surat, supaya warga paham isian ini nanti tertulis di mana.
// (Nama dan jabatan pejabat penandatangan diisi oleh kelurahan, bukan warga.)
export const sections = [
  {
    // Surat: Nama, Tempat/Tgl. Lahir, NIK, Jenis Kelamin, Status Perkawinan, Agama, Pekerjaan, Alamat
    title: "Dengan ini menerangkan bahwa",
    hint: "Terisi otomatis dari data warga. Koreksi bila ada yang tidak sesuai.",
    fields: [
      f.text("name", "Nama", { from: "fullName" }),
      f.text("birthPlace", "Tempat Lahir", { from: "birthPlace" }),
      f.date("birthDate", "Tanggal Lahir", { from: "birthDate" }),
      f.nik("nik", "NIK", { from: "nik" }),
      f.select("gender", "Jenis Kelamin", OPT.gender, { from: "gender" }),
      f.select("maritalStatus", "Status Perkawinan", OPT.marital, { from: "maritalStatus" }),
      f.select("religion", "Agama", OPT.religion, { from: "religion" }),
      f.select("occupation", "Pekerjaan", OPT.occupation, { from: "occupation", editable: true }),
      f.area("address", "Alamat", { from: "address", span: 2 }),
    ],
  },
  {
    // Surat: Pergi, Keperluan
    title: "Pergi ke dan keperluan",
    hint: "Surat akan ditutup dengan kalimat: \"berhubung maksud yang bersangkutan, mohon yang berwenang memberikan bantuan serta fasilitas seperlunya.\"",
    fields: [
      f.text("destination", "Pergi ke", { span: 2, placeholder: "Contoh: Bank BRI, Kantor Kecamatan, Sekolah, dst." }),
      f.area("purpose", "Keperluan", { span: 2, placeholder: "Jelaskan untuk apa surat pengantar ini diperlukan" }),
    ],
  },
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [
  DOC.ktp,
  DOC.kk,
  DOC.rt,
];

export const meta = {"title": "Surat Pengantar Umum", "code": "PGU"};
