// Disalin dari public: views/services/letters/applications/population-occurrence-registration.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Formulir Pendaftaran Peristiwa Kependudukan (F-1.02)
// Template PDF: letters/population-occurrence-registration-form.blade.php
// Mengikuti formulir PDF: I Data Pemohon, II Jenis Permohonan (KK, KTP-el, KIA, Perubahan Data),
// III Persyaratan yang Dilampirkan. Yang TIDAK menjadi field (diisi sistem/petugas): tanggal ("Sleman, ....").
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { f, DOC, opt } from "@/data/letterFields";

// Langkah 1: isian sesuai surat yang diajukan
export const sections = [
  // I. Data Pemohon: Nama Lengkap, NIK, Nomor KK
  {
    title: "I. Data Pemohon",
    hint: "Terisi otomatis dari data warga. Koreksi bila ada yang tidak sesuai.",
    fields: [
      f.text("name", "Nama Lengkap", { from: "fullName" }),
      f.nik("nik", "Nomor Induk Kependudukan", { from: "nik" }),
      f.kk("familyCardNumber", "Nomor Kartu Keluarga"),
    ],
  },
  // II. Jenis Permohonan: 4 kelompok pada formulir, berbentuk ceklis bertingkat; pilih minimal satu
  {
    title: "II. Jenis Permohonan",
    hint: "Centang satu atau lebih sesuai kebutuhan.",
    requireOne: true,
    fields: [
      f.checks("kkTypes", "I. Kartu Keluarga", [
        { heading: "A. Baru" },
        { value: "Baru: Membentuk keluarga baru", label: "1. Membentuk keluarga baru", indent: true },
        { value: "Baru: Penggantian kepala keluarga", label: "2. Penggantian kepala keluarga", indent: true },
        { value: "Baru: Pisah KK", label: "3. Pisah KK", indent: true },
        { value: "Baru: Pindah datang", label: "4. Pindah datang", indent: true },
        { value: "Baru: WNI LN karena pindah", label: "5. WNI LN karena pindah", indent: true },
        { value: "Baru: Rentan adminduk", label: "6. Rentan adminduk", indent: true },
        { heading: "B. Perubahan Data" },
        { value: "Perubahan data: Menumpang dalam KK", label: "1. Menumpang dalam KK", indent: true },
        { value: "Perubahan data: Peristiwa penting", label: "2. Peristiwa penting", indent: true },
        { value: "Perubahan data: Perubahan elemen data yang tercantum dalam KK", label: "3. Perubahan elemen data yang tercantum dalam KK", indent: true },
        { heading: "C. Hilang/Rusak" },
        { value: "Hilang/Rusak: Hilang", label: "1. Hilang", indent: true },
        { value: "Hilang/Rusak: Rusak", label: "2. Rusak", indent: true },
      ], { cols: 1, optional: true }),
      f.checks("ktpElTypes", "II. KTP-el", [
        { value: "Baru", label: "A. Baru" },
        { value: "Pindah datang", label: "B. Pindah datang" },
        { heading: "C. Hilang/Rusak" },
        { value: "Hilang/Rusak: Hilang", label: "1. Hilang", indent: true },
        { value: "Hilang/Rusak: Rusak", label: "2. Rusak", indent: true },
        { value: "Perpanjangan ITAP", label: "D. Perpanjangan ITAP" },
        { value: "Perubahan status kewarganegaraan", label: "E. Perubahan status kewarganegaraan" },
        { value: "Luar domisili", label: "F. Luar domisili" },
        { value: "Transmigrasi", label: "G. Transmigrasi" },
      ], { cols: 1, optional: true }),
      f.checks("kiaTypes", "III. Kartu Identitas Anak / KIA", [
        { value: "Baru", label: "A. Baru" },
        { heading: "B. Hilang/Rusak" },
        { value: "Hilang/Rusak: Hilang", label: "1. Hilang", indent: true },
        { value: "Hilang/Rusak: Rusak", label: "2. Rusak", indent: true },
        { value: "Perpanjangan ITAP", label: "C. Perpanjangan ITAP" },
        { value: "Lainnya", label: "D. Lainnya" },
      ], { cols: 1, optional: true }),
      f.checks("dataChangeTypes", "IV. Perubahan Data", [
        { value: "KK", label: "A. KK" },
        { value: "KTP-el", label: "B. KTP-el" },
        { value: "KIA", label: "C. KIA" },
        { value: "Formulir perubahan data", label: "1) Formulir perubahan data", indent: true },
        { value: "Bukti perubahan data", label: "2) Bukti perubahan data", indent: true },
      ], { cols: 1, optional: true }),
    ],
  },
  // III. Persyaratan yang dilampirkan (16 kotak pada formulir, urutan baris demi baris seperti di PDF)
  {
    title: "III. Persyaratan yang Dilampirkan",
    hint: "Centang persyaratan yang Anda lampirkan.",
    fields: [
      f.checks("requirements", "Persyaratan yang dilampirkan", [
        "KK lama/rusak",
        "Surat keterangan/bukti perubahan peristiwa kependudukan dan peristiwa penting",
        "Buku nikah/kutipan akta perkawinan",
        "SPTJM perkawinan/perceraian belum tercatat",
        "Kutipan akta perceraian",
        "Akta kematian",
        "Surat keterangan pindah",
        "Surat pernyataan penyebab terjadinya hilang atau rusak",
        "Surat keterangan pindah luar negeri",
        "Surat keterangan pindah dari Perwakilan RI",
        "KTP-el rusak",
        "Surat pernyataan bersedia menerima sebagai anggota keluarga",
        "Dokumen perjalanan",
        "Surat kuasa pengasuhan anak dari orang tua/wali",
        "Surat keterangan hilang dari kepolisian",
        "Kartu Izin Tinggal Tetap",
      ], { optional: true }),
    ],
  },
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [
  DOC.ktp,
  DOC.kk,
  opt("Dokumen persyaratan lain sesuai yang dicentang di atas"),
];

export const meta = {"title": "Formulir Pendaftaran Peristiwa Kependudukan", "code": "PPK"};
