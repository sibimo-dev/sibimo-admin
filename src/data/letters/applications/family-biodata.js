// Disalin dari public: views/services/letters/applications/family-biodata.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Formulir Biodata Penduduk WNI (Per Keluarga)
// Template PDF: letters/family-biodata-form.blade.php
// Bagian "Diisi Oleh Petugas": Provinsi, Kab, Kecamatan, Desa dipatenkan di template PDF backend
// (34 DIY / 04 Sleman / 11 Ngemplak / 020 Bimomartani) dan bagian lainnya juga sudah tetap di blade, jadi bukan field.
// Satu-satunya yang tetap berupa isian: Nama Dusun/Dukuh/Kampung.
import { f, OPT, codeOptions, pemohonRingkas, opt, signerNames } from "@/data/letterFields";

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
const ADA = "2";           // kode "Ada" untuk akta (11, 16, 19) dan kelainan (23)
const KAWIN = "2";         // kode status perkawinan
const CERAI_HIDUP = "3";
const CERAI_MATI = "4";
const PERNAH_KAWIN = [KAWIN, CERAI_HIDUP, CERAI_MATI]; // semua status selain Belum Kawin

// Ketergantungan antar kolom (sama dengan form Data Warga): kolom yang tidak berlaku DIKUNCI dan dikosongkan,
// baru terbuka bila datanya memang ada.
//   Belum Kawin / belum dipilih -> data kawin, cerai, dan kematian pasangan terkunci
//   Kawin                       -> data kawin terbuka; cerai & kematian pasangan terkunci
//   Cerai Hidup                 -> data kawin + cerai terbuka; kematian pasangan terkunci
//   Cerai Mati                  -> data kawin + tanggal/tempat kematian pasangan terbuka; data cerai terkunci
const noBirthCert = (row) => row.birthCertStatus !== ADA;
const noMarriage = (row) => !PERNAH_KAWIN.includes(row.maritalStatus);
const notDivorced = (row) => row.maritalStatus !== CERAI_HIDUP;
const notWidowed = (row) => row.maritalStatus !== CERAI_MATI;
// Nomor akta hanya diisi bila statusnya "Ada" (kode 2), bukan sekadar karena sudah pernah kawin/cerai.
const noMarriageNumber = (row) => noMarriage(row) || row.marriageCertStatus !== ADA;
const noDivorceNumber = (row) => notDivorced(row) || row.divorceCertStatus !== ADA;
const noDisorder = (row) => row.disorder !== ADA;

// Langkah 1: isian sesuai formulir
export const sections = [
  // DIISI OLEH PETUGAS: hanya Nama Dusun/Dukuh/Kampung (pilih dari data dusun atau ketik manual); kode wilayah dipatenkan di template PDF.
  {
    title: "Dusun (Diisi Oleh Petugas)",
    hint: "Pilih dari data dusun/dukuh yang tersedia atau ketik nama secara manual.",
    fields: [f.hamlet("hamlet", "Dusun/Dukuh/Kampung", { from: "dusun" })],
  },

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
        { key: "marriageCertStatus", label: "Akta Perkawinan/Buku Nikah", type: "select", options: KODE.certificate, optional: true, disabledWhen: noMarriage },
        { key: "marriageCertNumber", label: "Nomor Akta Perkawinan/Buku Nikah", optional: true, disabledWhen: noMarriageNumber },
        { key: "marriageDate", label: "Tanggal Perkawinan", type: "date", optional: true, disabledWhen: noMarriage },
        { key: "divorceCertStatus", label: "Akta Cerai/Surat Cerai", type: "select", options: KODE.certificate, optional: true, disabledWhen: notDivorced },
        { key: "divorceCertNumber", label: "Nomor Akta Perceraian/Surat Cerai", optional: true, disabledWhen: noDivorceNumber },
        { key: "divorceDate", label: "Tanggal Perceraian", type: "date", optional: true, disabledWhen: notDivorced },
        // Hanya untuk Cerai Mati (pasangan meninggal)
        { key: "spouseDeathDate", label: "Tanggal Kematian Pasangan", type: "date", optional: true, disabledWhen: notWidowed },
        { key: "spouseDeathPlace", label: "Tempat Kematian Pasangan", optional: true, disabledWhen: notWidowed },

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