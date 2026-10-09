// Disalin dari public: views/services/letters/applications/family-biodata.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Formulir Biodata Penduduk WNI (Per Keluarga)
// Template PDF: letters/family-biodata-form.blade.php
// Bagian "Diisi Oleh Petugas" (Provinsi, Kab, Kecamatan, Desa, Dusun, Nomor KK)
// tidak diisi pemohon, dibiarkan kosong di PDF dan diisi/diedit admin.
import { f, OPT, pemohonRingkas, opt } from "@/data/letterFields";

// Opsi tambahan khusus formulir ini
const ADA_TIDAK = ["Ada", "Tidak Ada"];
const GOL_DARAH = ["A", "B", "AB", "O", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Tidak Tahu"];
const KELAINAN = ["Tidak Ada", "Kelainan Fisik", "Kelainan Mental", "Fisik dan Mental"];
const CACAT = ["Tidak Ada", "Cacat Fisik", "Cacat Netra/Buta", "Cacat Rungu/Wicara", "Cacat Mental/Jiwa", "Cacat Fisik dan Mental", "Cacat Lainnya"];

// Langkah 1: isian sesuai formulir
export const sections = [
  // DATA KEPALA KELUARGA
  pemohonRingkas([
    f.text("postalCode", "Kode Pos"),
    f.text("rt", "RT"),
    f.text("rw", "RW"),
    f.text("memberCount", "Jumlah Anggota Keluarga (orang)"),
    f.text("phone", "Telepon"),
  ]),

  // DATA KELUARGA
  {
    title: "Data Keluarga",
    fields: [
      f.rows("members", "Daftar anggota keluarga", [
        // Tabel 1 (kolom 2-6)
        { key: "name", label: "Nama Lengkap" },
        { key: "nik", label: "Nomor KTP/Nopen" },
        { key: "previousAddress", label: "Alamat Sebelumnya", optional: true },
        { key: "passportNumber", label: "Nomor Paspor", optional: true },
        { key: "passportExpiry", label: "Tanggal Berakhir Paspor", type: "date", optional: true },

        // Tabel 2 (kolom 7-21), "Umur" dihitung otomatis di template
        { key: "gender", label: "Jenis Kelamin", type: "select", options: OPT.gender },
        { key: "birthPlace", label: "Tempat Lahir" },
        { key: "birthDate", label: "Tanggal Lahir", type: "date" },
        { key: "birthCertStatus", label: "Akta Lahir/Surat Lahir", type: "select", options: ADA_TIDAK },
        { key: "birthCertNumber", label: "Nomor Akta Kelahiran/Surat Kenal Lahir", optional: true },
        { key: "bloodType", label: "Golongan Darah", type: "select", options: GOL_DARAH },
        { key: "religion", label: "Agama", type: "select", options: OPT.religion },
        { key: "maritalStatus", label: "Status Perkawinan", type: "select", options: OPT.marital },
        { key: "marriageCertStatus", label: "Akta Perkawinan/Buku Nikah", type: "select", options: ADA_TIDAK },
        { key: "marriageCertNumber", label: "Nomor Akta Perkawinan/Buku Nikah", optional: true },
        { key: "marriageDate", label: "Tanggal Perkawinan", type: "date", optional: true },
        { key: "divorceCertStatus", label: "Akta Cerai/Surat Cerai", type: "select", options: ADA_TIDAK },
        { key: "divorceCertNumber", label: "Nomor Akta Perceraian/Surat Cerai", optional: true },
        { key: "divorceDate", label: "Tanggal Perceraian", type: "date", optional: true },

        // Tabel 3 (kolom 22-30)
        { key: "shdk", label: "Status Hubungan dalam Keluarga", type: "select", options: OPT.shdk },
        { key: "disorder", label: "Kelainan Fisik & Mental", type: "select", options: KELAINAN },
        { key: "disability", label: "Penyandang Cacat", type: "select", options: CACAT },
        { key: "education", label: "Pendidikan Terakhir", type: "select", options: OPT.education },
        { key: "occupation", label: "Pekerjaan" },
        { key: "motherNik", label: "NIK Ibu", optional: true },
        { key: "motherName", label: "Nama Lengkap Ibu" },
        { key: "fatherNik", label: "NIK Ayah", optional: true },
        { key: "fatherName", label: "Nama Lengkap Ayah" },
      ], { max: 8 }),
    ],
  },
];

// Langkah 2: dokumen pendukung (string biasa, keterangan ditulis di dalam label)
// opt(...) = tidak wajib / jika berkaitan
export const documents = [
  "Fotokopi Kartu Keluarga (KK terbaru yang masih berlaku)",
  "Fotokopi KTP/KIA (KTP untuk usia 17 tahun ke atas, KIA untuk anak yang belum punya KTP)",
  "Fotokopi Akta Kelahiran (anggota keluarga yang didaftarkan)",
  opt("Fotokopi Buku Nikah/Akta Perkawinan (wajib jika ada anggota keluarga yang berstatus kawin, cerai hidup, atau cerai mati; lewati jika semua belum kawin)"),
  opt("Fotokopi Akta Perceraian (hanya jika ada anggota keluarga yang berstatus cerai)"),
  opt("Surat/Dokumen Pindah (hanya jika ada anggota keluarga yang pindah datang dari daerah lain)"),
  opt("Dokumen Lainnya (tambahan jika diperlukan untuk mendukung perubahan data)"),
];

export const meta = {"title": "Formulir Biodata Penduduk WNI (Per Keluarga)", "code": "BDK"};
