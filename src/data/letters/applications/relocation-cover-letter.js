// Disalin dari public: views/services/letters/applications/relocation-cover-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca halaman register (data/registrationLetters.js).
// Surat Pengantar Permohonan Pindah WNI (F.1-25), antar desa dalam satu kecamatan
// Template PDF: letters/relocation-cover-letter.blade.php
// Yang TIDAK menjadi field (diisi petugas/sistem): kode wilayah (Provinsi, Kab/Kota, Kecamatan, Desa/Kelurahan,
// Dusun), Nomor surat (471.21/...), tanggal, serta tanda tangan Petugas Registrasi dan a.n Lurah.
// Isian sama persis dengan Formulir Keterangan Pindah WNI (kunci field sama) agar digabung 1 halaman saat register.
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { f, OPT, DOC, opt, alamat, kodeWilayah } from "@/data/letterFields";

const ORIGIN_WILAYAH = {
  village: "Bimomartani",
  district: "Ngemplak",
  regency: "Sleman",
  province: "Daerah Istimewa Yogyakarta",
};

// Langkah 1: urutan mengikuti formulir PDF
export const sections = [
  // DIISI OLEH PETUGAS: kode wilayah (default). Nama wilayah diambil dari "Alamat Daerah Asal" di bawah; Dusun/Dukuh/Kampung diisi di blok ini (key originHamlet, sama seperti sebelumnya); Nomor KK dari "Data Daerah Asal".
  kodeWilayah({ names: false, hamlet: true, hamletCode: true, hamletKey: "originHamlet", hamletOptional: true }, "Kode Wilayah (Diisi Oleh Petugas)"),
  // DATA DAERAH ASAL: 1. Nomor KK, 2. Nama Kepala Keluarga
  {
    title: "Data Daerah Asal",
    fields: [
      f.kk("kkNumber", "Nomor Kartu Keluarga", { from: "familyCardNumber" }),
      f.text("headOfFamily", "Nama Kepala Keluarga", { from: "headOfFamilyName" }),
    ],
  },
  // 3. Alamat (RT, RW, Dusun, Desa, Kecamatan, Kab/Kota, Provinsi, Kode Pos, Telepon)
  //    Alamat asal = alamat pemohon → terisi otomatis dari data warga & dibaca sebagai applicant.address
  alamat("origin", "Alamat Daerah Asal", {
    from: "address",
    phoneFrom: "phoneNumber",
    fieldFrom: {
      rt: "rt",
      rw: "rw",
      village: "village",
      district: "district",
      regency: "regency",
      province: "province",
      postalCode: "postalCode",
      phone: "phoneNumber",
    },
    defaults: ORIGIN_WILAYAH,
    hamlet: false, // Dusun/Dukuh/Kampung asal ada di blok Kode Wilayah
  }),
  // 4. NIK Pemohon, 5. Tempat/Tanggal Lahir, 6. Nama Lengkap
  {
    title: "Data Pemohon",
    hint: "Terisi otomatis dari data warga. Koreksi bila ada yang tidak sesuai.",
    fields: [
      f.nik("nik", "NIK Pemohon", { from: "nik" }),
      f.text("birthPlace", "Tempat Lahir", { from: "birthPlace" }),
      f.date("birthDate", "Tanggal Lahir", { from: "birthDate" }),
      f.text("name", "Nama Lengkap", { from: "fullName" }),
    ],
  },
  // DATA KEPINDAHAN: 1. Alasan Pindah
  {
    title: "Data Kepindahan",
    fields: [
      f.select("relocationReason", "Alasan Pindah", OPT.relocationReason),
      f.text("relocationReasonOther", "Sebutkan alasan lainnya", { showIf: (form) => String(form.relocationReason || "").startsWith("7") }),
      f.select("relocationTypeLabel", "Cakupan Kepindahan (subjudul formulir)", OPT.relocationScope, { default: OPT.relocationScope[0], span: 2 }),
    ],
  },
  // 2. Alamat Tujuan Pindah
  alamat("destination", "Alamat Tujuan Pindah"),
  // 3. Jenis Kepindahan, 4. Status KK bagi yang tidak pindah, 5. Status Nomor KK bagi yang pindah
  {
    title: "Jenis Kepindahan & Status KK",
    fields: [
      f.select("relocationType", "Jenis Kepindahan", OPT.relocationType, { span: 2 }),
      f.select("originKkStatus", "Status KK bagi yang tidak pindah", OPT.kkStatusNo),
      f.select("destinationKkStatus", "Status Nomor KK bagi yang pindah", OPT.kkStatusNo),
    ],
  },
  // 6. Keluarga yang Pindah (tabel 7 baris: NIK, Nama, Masa Berlaku KTP s/d, SHDK)
  {
    title: "Keluarga yang Pindah",
    fields: [
      f.rows("familyMembers", "Anggota keluarga yang pindah", [
        { key: "nik", label: "NIK" },
        { key: "name", label: "Nama" },
        { key: "validUntil", label: "Masa berlaku KTP s/d", type: "date", optional: true },
        { key: "shdk", label: "SHDK", type: "select", options: OPT.shdk },
      ], { max: 7, autoByType: "relocationType" }),
    ],
  },
];

// Nama Petugas Registrasi (dicetak di kolom tanda tangan kiri; opsional, boleh dikosongkan lalu ditulis tangan)
export const officerSection = {
  title: "Petugas Registrasi",
  fields: [f.text("registrationOfficer", "Nama Petugas Registrasi", { optional: true })],
};
sections.push(officerSection);

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [
  DOC.ktp,
  DOC.kk,
  DOC.rt,
  opt("Surat keterangan pekerjaan/sekolah di tempat tujuan"),
];

export const meta = {"title": "Surat Pengantar Permohonan Pindah WNI", "code": "PPN"};