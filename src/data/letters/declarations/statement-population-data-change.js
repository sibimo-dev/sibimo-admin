// Disalin dari public: views/services/letters/declarations/statement-population-data-change.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Surat Pernyataan Perubahan Elemen Data Kependudukan (F-1.06)
// Template PDF: letters/statement-population-data-change.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { f, OPT, DOC, opt } from "@/data/letterFields";

// Pilihan "Pendidikan Terakhir" mengikuti istilah pada KK.
const EDUCATION = [
  "Tidak/Belum Sekolah", "Belum Tamat SD/Sederajat", "Tamat SD/Sederajat", "SLTP/Sederajat", "SLTA/Sederajat",
  "Diploma I/II", "Akademi/Diploma III/S. Muda", "Diploma IV/Strata I", "Strata II", "Strata III",
];

// Tabel perubahan hanya tampil (dan wajib diisi) bila jenis perubahannya dicentang.
const CHANGES = { education: "Pendidikan Terakhir", job: "Pekerjaan", religion: "Agama", other: "Lainnya (status perkawinan, dll)" };
const changing = (type) => (form) => (form.changeTypes ?? []).includes(type);

const who = { key: "name", label: "Nama anggota keluarga" };
const basis = (label = "Dasar perubahan (mis. ijazah, akta nikah)") => ({ key: "basis", label });

// Langkah 1: isian sesuai surat yang diajukan
export const sections = [
  {
    // Surat: Nama, NIK, Nomor KK, Alamat
    title: "Data Pemohon (Kepala Keluarga)",
    hint: "Terisi otomatis dari data warga. Koreksi bila ada yang tidak sesuai.",
    fields: [
      f.text("name", "Nama Lengkap", { from: "fullName" }),
      f.nik("nik", "NIK", { from: "nik" }),
      f.kk("kkNumber", "Nomor KK"),
      f.area("address", "Alamat", { from: "address", span: 2 }),
    ],
  },
  {
    // Surat: tabel rincian KK (No, Nama, NIK, SHDK, Keterangan) maksimal 7 baris
    title: "Rincian Anggota Keluarga dalam KK",
    hint: "Cantumkan seluruh anggota KK, termasuk Anda sendiri, sesuai urutan di KK.",
    fields: [
      f.rows("familyMembers", "Daftar anggota KK", [
        { key: "name", label: "Nama" },
        { key: "nik", label: "NIK" },
        { key: "shdk", label: "SHDK", type: "select", options: OPT.shdk },
        { key: "note", label: "Keterangan (opsional)", optional: true },
      ], { max: 7 }),
    ],
  },
  {
    // Surat: A. Pendidikan dan Pekerjaan, B. Agama dan Perubahan Lainnya (semula / menjadi / dasar perubahan)
    title: "Perubahan Data",
    hint: "Pilih elemen data yang berubah, lalu isi tabelnya. Tulis nama persis seperti di daftar anggota KK di atas.",
    fields: [
      f.checks("changeTypes", "Elemen data yang berubah", Object.values(CHANGES)),

      f.rows("educationChanges", "A. Perubahan pendidikan terakhir", [
        who,
        { key: "before", label: "Semula (opsional)", type: "select", options: EDUCATION, optional: true },
        { key: "after", label: "Menjadi", type: "select", options: EDUCATION },
        basis(),
      ], { max: 7, showIf: changing(CHANGES.education) }),

      f.rows("jobChanges", "A. Perubahan pekerjaan", [
        who,
        { key: "before", label: "Semula (opsional)", optional: true },
        { key: "after", label: "Menjadi (mis. Petani/Pekebun)" },
        basis("Dasar perubahan (mis. surat keterangan)"),
      ], { max: 7, showIf: changing(CHANGES.job) }),

      f.rows("religionChanges", "B. Perubahan agama", [
        who,
        { key: "before", label: "Semula (opsional)", type: "select", options: OPT.religion, optional: true },
        { key: "after", label: "Menjadi", type: "select", options: OPT.religion },
        basis(),
      ], { max: 7, showIf: changing(CHANGES.religion) }),

      f.rows("otherChanges", "B. Perubahan lainnya", [
        who,
        { key: "element", label: "Elemen data (mis. Status Perkawinan)" },
        { key: "before", label: "Semula (opsional)", optional: true },
        { key: "after", label: "Menjadi (mis. Kawin)" },
        basis(),
        { key: "note", label: "Keterangan (mis. tanggal nikah)", optional: true },
      ], { max: 7, showIf: changing(CHANGES.other) }),
    ],
  },
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [
  DOC.ktp,
  DOC.kk,
  opt("Dokumen dasar perubahan (ijazah, akta nikah, surat keterangan, dll)"),
];

export const meta = {"title": "Surat Pernyataan Perubahan Elemen Data Kependudukan", "code": "PDP"};
