// Disalin dari public: views/services/letters/applications/relocation-cover-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca halaman register (data/registrationLetters.js).
// Surat Pengantar Permohonan Pindah WNI (F.1-25)
// Template PDF: letters/relocation-cover-letter.blade.php
// Yang TIDAK menjadi field (diisi petugas/sistem): kode wilayah (Provinsi, Kab/Kota, Kecamatan, Desa/Kelurahan; dipatenkan di PDF),
// Dusun, Nomor surat (471.21/...), tanggal, serta tanda tangan Petugas Registrasi dan a.n Lurah.
// Isian sama persis dengan Formulir Keterangan Pindah WNI (kunci field sama) agar digabung 1 halaman saat register.
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { f, OPT, DOC, opt, alamat, kodeWilayah, wilayahDropdown, BIMOMARTANI } from "@/data/letterFields";

// Langkah 1: urutan mengikuti formulir PDF
export const sections = [
  // Kode Dusun + dropdown Dusun/Dukuh/Kampung asal (key originHamlet, terisi dari dusun warga) ada di blok petugas ini, untuk mengisi PDF.
  kodeWilayah({ hamlet: true, hamletCode: true, hamletKey: "originHamlet", hamletOptional: true }, "Kode Dusun (Diisi Oleh Petugas)"),
  {
    title: "Data Daerah Asal",
    fields: [
      f.kk("kkNumber", "Nomor Kartu Keluarga", { from: "familyCardNumber" }),
      f.text("headOfFamily", "Nama Kepala Keluarga", { from: "headOfFamilyName" }),
    ],
  },
  // Alamat asal: dropdown (boleh diketik), default Bimomartani/Ngemplak/Sleman/DIY
  wilayahDropdown(
    alamat("origin", "Alamat Daerah Asal", {
      from: "address",
      phoneFrom: "phoneNumber",
      fieldFrom: {
        rt: "rt",
        hamlet: "dusun",
        rw: "rw",
        village: "village",
        district: "district",
        regency: "regency",
        province: "province",
        postalCode: "postalCode",
        phone: "phoneNumber",
      },
      defaults: BIMOMARTANI,
      hamlet: false, // Dusun asal sudah ada di blok "Kode Dusun" di atas (key sama: originHamlet), jangan dobel
      scopeKey: "relocationTypeLabel",
    }),
    "origin",
    "relocationTypeLabel",
    BIMOMARTANI,
  ),
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
  {
    title: "Data Kepindahan",
    fields: [
      f.select("relocationReason", "Alasan Pindah", OPT.relocationReason),
      f.text("relocationReasonOther", "Sebutkan alasan lainnya", { showIf: (form) => String(form.relocationReason || "").startsWith("7") }),
      f.select("relocationTypeLabel", "Cakupan Kepindahan (subjudul formulir)", OPT.relocationScope, { default: OPT.relocationScope[0], span: 2 }),
    ],
  },
  // Alamat tujuan: dropdown (boleh diketik), kosong / dipilih sendiri. Dusun diketik manual.
  wilayahDropdown(
    alamat("destination", "Alamat Tujuan Pindah", { scopeKey: "relocationTypeLabel" }),
    "destination",
    "relocationTypeLabel",
    {},
  ),
  {
    title: "Jenis Kepindahan & Status KK",
    fields: [
      f.select("relocationType", "Jenis Kepindahan", OPT.relocationType, { span: 2 }),
      f.select("originKkStatus", "Status KK bagi yang tidak pindah", OPT.kkStatusNo),
      f.select("destinationKkStatus", "Status Nomor KK bagi yang pindah", OPT.kkStatusNo),
    ],
  },
  {
    title: "Keluarga yang Pindah",
    fields: [
      f.rows("familyMembers", "Anggota keluarga yang pindah", [
        { key: "nik", label: "NIK" },
        { key: "name", label: "Nama" },
        { key: "validUntil", label: "Masa berlaku KTP s/d", type: "date", optional: true, lifetime: true },
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