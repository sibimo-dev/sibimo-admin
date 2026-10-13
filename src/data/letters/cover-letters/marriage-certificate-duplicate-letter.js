// Disalin dari public: views/services/letters/cover-letters/marriage-certificate-duplicate-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Surat Pengantar Duplikat Nikah (format "SURAT KETERANGAN")
// Template PDF: letters/marriage-certificate-duplicate-letter.blade.php
// Mengikuti formulir PDF. Yang TIDAK menjadi field (diisi petugas/sistem): Nomor surat, "Yang bertanda tangan"
// (Nama & Jabatan pejabat), tanggal, serta tanda tangan a.n Lurah / Carik u.b. Kamituwa.
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { f, pemohon, DOC, opt } from "@/data/letterFields";

// Langkah 1: "Dengan ini menerangkan": Nama, NIK, Tempat Tgl Lahir, Jenis Kelamin, Agama, Status,
// Pekerjaan, Alamat (pemohon(), terisi otomatis dari data warga), lalu Tujuan dan Keperluan.
export const sections = [
  pemohon(),
  {
    title: "Tujuan & Keperluan",
    fields: [
      f.text("destination", "Tujuan", { span: 2, placeholder: "Contoh: KUA Kapanewon Ngemplak" }),
      f.area("purpose", "Keperluan", { span: 2, placeholder: "Contoh: Pengurusan duplikat buku nikah karena hilang/rusak" }),
    ],
  },
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [
  DOC.ktp,
  DOC.kk,
  opt("Surat kehilangan dari kepolisian (bila hilang)"),
  opt("Fotokopi buku nikah (bila rusak)"),
];

export const meta = {"title": "Surat Pengantar Duplikat Nikah", "code": "DAN"};
