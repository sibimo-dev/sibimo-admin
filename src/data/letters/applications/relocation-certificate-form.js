// Disalin dari public: views/services/letters/applications/relocation-certificate-form.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.

import { f, OPT, DOC, opt, alamat } from "@/data/letterFields";

const ORIGIN_WILAYAH = {
  village: "Bimomartani",
  district: "Ngemplak",
  regency: "Sleman",
  province: "Daerah Istimewa Yogyakarta",
};

// Langkah 1: urutan mengikuti formulir PDF
export const sections = [
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
      hamlet: "dusun",
      village: "village",
      district: "district",
      regency: "regency",
      province: "province",
      postalCode: "postalCode",
      phone: "phoneNumber",
    },
    defaults: ORIGIN_WILAYAH,
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
      ], { max: 7 }),
    ],
  },
];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = [
  DOC.ktp,
  DOC.kk,
  DOC.rt,
  opt("Surat keterangan pekerjaan/sekolah di tempat tujuan"),
];

export const meta = {"title": "Formulir Keterangan Pindah WNI", "code": "SKP"};
