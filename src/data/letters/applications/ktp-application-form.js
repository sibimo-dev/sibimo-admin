// Disalin dari public: views/services/letters/applications/ktp-application-form.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca halaman register (data/registrationLetters.js).
// Surat Permohonan KTP (F-107)
// Template PDF: letters/ktp-application-form.blade.php
// Mengikuti formulir PDF. Yang TIDAK menjadi field (diisi sistem/petugas): Pemerintah Provinsi/Kabupaten,
// Kecamatan, Desa, tanggal surat, serta tanggal tanda tangan. Nama penandatangan Dukuh dan Camat (Mengetahui) bersifat OPSIONAL; Lurah/Petugas Kalurahan tidak jadi field (ada di otorisasi)
// (section "Nama Penandatangan"); tanda tangan Pemohon memakai Nama Lengkap di atas.
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { f, DOC, opt, signerNames } from "@/data/letterFields";

// Langkah 1: urutan mengikuti formulir: jenis permohonan, Nama Lengkap, No KK, NIK, Alamat, RT, RW
export const sections = [
  { title: "Jenis Permohonan", fields: [f.select("applicationType", "Permohonan KTP", ["Baru", "Perpanjangan", "Penggantian"])] },
  {
    title: "Data Pemohon",
    hint: "Terisi otomatis dari data warga. Koreksi bila ada yang tidak sesuai.",
    fields: [
      f.text("name", "Nama Lengkap", { from: "fullName" }),
      f.kk("kkNumber", "No KK"),
      f.nik("nik", "NIK", { from: "nik" }),
      f.area("address", "Alamat", { from: "address", span: 2 }),
      f.text("rt", "RT"),
      f.text("rw", "RW"),
    ],
  },
  // TTD (4): 1. Pemohon (= name di atas)  2. Dukuh  3. Camat  4. Lurah/Petugas kalurahan
  signerNames(["hamletHead", "districtHead"], "Opsional. Tanda tangan Pemohon memakai Nama Lengkap di atas. Isi nama Dukuh dan Camat bila ingin dicetak; kosongkan bila ditulis tangan."),
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
// Pas foto 3x4 dan spesimen tanda tangan/cap jempol adalah kotak isian di formulir PDF, jadi diunggah pemohon.
export const documents = [
  DOC.kk,
  "Pas foto 3x4",
  "Spesimen tanda tangan atau cap jempol",
  opt("Surat keterangan kehilangan dari kepolisian (bila KTP hilang)"),
  opt("KTP lama (bila rusak/perpanjangan)"),
];

export const meta = {"title": "Surat Permohonan KTP", "code": "KTP"};