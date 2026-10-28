// Disalin dari public: views/services/letters/applications/family-biodata.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Formulir Biodata Penduduk WNI (Per Keluarga)
// Template PDF: letters/family-biodata-form.blade.php
// Bagian "Diisi Oleh Petugas" (Provinsi, Kab, Kecamatan, Desa, Dusun, Nomor KK)
// tidak diisi pemohon, dibiarkan kosong di PDF dan diisi/diedit admin.
import { f, OPT, codeOptions, kodeWilayah, pemohonRingkas, opt, signerNames } from "@/data/letterFields";

// Kolom bernomor di formulir cetak (7, 11, 13, 14, 15, 16, 19, 22, 23, 24, 25, 26):
// dropdown menampilkan "1. Laki-laki", tetapi NILAI yang disimpan (dan tercetak di pratinjau) hanya angkanya ("1").
// Urutan & nomor pilihan mengikuti kode resmi Dukcapil (lihat OPT.*Kode di data/letterFields.js).
const KODE = {
  gender: codeOptions(OPT.gender),                 // 7
  certificate: codeOptions(OPT.certificate),       // 11, 16, 19  (1 = Tidak Ada, 2 = Ada)
  bloodType: codeOptions(OPT.bloodType),           // 13
  religion: codeOptions(OPT.religionKode),         // 14
  marital: codeOptions(OPT.maritalKode),           // 15  (1 = Belum Kawin, 2 = Kawin, 3 = Cerai Hidup, 4 = Cerai Mati)
  shdk: codeOptions(OPT.shdk),                     // 22
  disability: codeOptions(OPT.disability),         // 23  (1 = Tidak Ada, 2 = Ada)
  disabilityType: codeOptions(OPT.disabilityType), // 24
  education: codeOptions(OPT.educationKode),       // 25
  occupation: codeOptions(OPT.occupationKode),     // 26
};
const ADA = "2";            // kode "Ada" untuk akta (11, 16, 19) dan kelainan (23)
const BELUM_KAWIN = "1";    // kode status perkawinan
const CERAI = ["3", "4"];   // Cerai Hidup, Cerai Mati

// Ketergantungan antar kolom (sama dengan form Data Warga): kolom yang tidak berlaku dinonaktifkan dan dikosongkan.
const noBirthCert = (row) => row.birthCertStatus !== ADA;
const neverMarried = (row) => row.maritalStatus === BELUM_KAWIN;
const notDivorced = (row) => !CERAI.includes(row.maritalStatus);
const noDisorder = (row) => row.disorder !== ADA;

// Langkah 1: isian sesuai formulir
export const sections = [
  // DISIAN OLEH PETUGAS: kode & nama Provinsi/Kab/Kecamatan/Desa (default), Nama Dusun (pilihan), Nomor KK
  kodeWilayah({ names: true, hamlet: true, kk: true }),

  // DATA KEPALA KELUARGA
  pemohonRingkas([
    f.text("postalCode", "Kode Pos"),
    f.text("rt", "RT"),
    f.text("rw", "RW"),
    f.text("memberCount", "Jumlah Anggota Keluarga (orang)", { from: "householdCount" }),
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
        { key: "gender", label: "Jenis Kelamin", type: "select", options: KODE.gender },
        { key: "birthPlace", label: "Tempat Lahir" },
        { key: "birthDate", label: "Tanggal Lahir", type: "date" },
        { key: "birthCertStatus", label: "Akta Lahir/Surat Lahir", type: "select", options: KODE.certificate },
        { key: "birthCertNumber", label: "Nomor Akta Kelahiran/Surat Kenal Lahir", optional: true, disabledWhen: noBirthCert },
        { key: "bloodType", label: "Golongan Darah", type: "select", options: KODE.bloodType },
        { key: "religion", label: "Agama", type: "select", options: KODE.religion },
        { key: "maritalStatus", label: "Status Perkawinan", type: "select", options: KODE.marital },
        { key: "marriageCertStatus", label: "Akta Perkawinan/Buku Nikah", type: "select", options: KODE.certificate, optional: true, disabledWhen: neverMarried },
        { key: "marriageCertNumber", label: "Nomor Akta Perkawinan/Buku Nikah", optional: true, disabledWhen: neverMarried },
        { key: "marriageDate", label: "Tanggal Perkawinan", type: "date", optional: true, disabledWhen: neverMarried },
        { key: "divorceCertStatus", label: "Akta Cerai/Surat Cerai", type: "select", options: KODE.certificate, optional: true, disabledWhen: notDivorced },
        { key: "divorceCertNumber", label: "Nomor Akta Perceraian/Surat Cerai", optional: true, disabledWhen: notDivorced },
        { key: "divorceDate", label: "Tanggal Perceraian", type: "date", optional: true, disabledWhen: notDivorced },

        // Tabel 3 (kolom 22-30)
        { key: "shdk", label: "Status Hubungan dalam Keluarga", type: "select", options: KODE.shdk },
        { key: "disorder", label: "Kelainan Fisik & Mental", type: "select", options: KODE.disability },
        { key: "disability", label: "Penyandang Cacat", type: "select", options: KODE.disabilityType, optional: true, disabledWhen: noDisorder },
        { key: "education", label: "Pendidikan Terakhir", type: "select", options: KODE.education },
        { key: "occupation", label: "Pekerjaan", type: "select", options: KODE.occupation, filter: true },
        { key: "motherNik", label: "NIK Ibu", optional: true },
        { key: "motherName", label: "Nama Lengkap Ibu" },
        { key: "fatherNik", label: "NIK Ayah", optional: true },
        { key: "fatherName", label: "Nama Lengkap Ayah" },
      ], {
        max: 8,
        // Terisi otomatis dari semua anggota KK yang terdaftar di Data Warga (kolom → properti hasil pencarian NIK).
        fromHousehold: {
          name: "fullName", nik: "nik", previousAddress: "previousAddress", passportNumber: "passportNumber", passportExpiry: "passportExpiryDate",
          gender: "gender", birthPlace: "birthPlace", birthDate: "birthDate",
          birthCertStatus: "birthCertificateStatus", birthCertNumber: "birthCertificateNumber",
          bloodType: "bloodType", religion: "religion", maritalStatus: "maritalStatus",
          marriageCertStatus: "marriageCertificateStatus", marriageCertNumber: "marriageCertificateNumber", marriageDate: "marriageDate",
          divorceCertStatus: "divorceCertificateStatus", divorceCertNumber: "divorceCertificateNumber", divorceDate: "divorceDate",
          shdk: "familyRelationship", disorder: "disabilityStatus", disability: "disabilityType",
          education: "education", occupation: "occupation",
          motherNik: "motherNationalId", motherName: "motherName", fatherNik: "fatherNationalId", fatherName: "fatherName",
        },
      }),
    ],
  },

  // TTD (4): 1. Petugas kecamatan  2. Kepala desa  3. Dukuh  4. Kepala keluarga (= Nama Lengkap di Data Kepala Keluarga)
  signerNames(["districtOfficer", "hamletHead"], "Opsional. Tanda tangan Kepala Keluarga memakai Nama Lengkap di atas. Isi nama Petugas Kecamatan dan Dukuh bila ingin dicetak; kosongkan bila ditulis tangan."),
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