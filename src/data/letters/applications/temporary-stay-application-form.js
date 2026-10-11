// Disalin dari public: views/services/letters/applications/temporary-stay-application-form.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
import { f, pemohon, DOC, opt } from "@/data/letterFields";
// permohonan tinggal sementara

export const sections = [
  pemohon([f.kk("familyCardNumber", "Nomor KK")]),
  {
    title: "Wilayah Alamat Asal",
    fields: [
      f.text("originVillage", "Desa/Kelurahan"),
      f.text("originDistrict", "Kecamatan"),
      f.text("originRegency", "Kabupaten"),
      f.text("originProvince", "Provinsi"),
    ],
  },
  {
    title: "Tempat Tinggal Sementara",
    fields: [
      f.area("reason", "Alasan tinggal sementara", { span: 2 }),
      f.text("destinationAddressLine1", "Alamat yang dituju (baris 1)", { placeholder: "Contoh: nama dusun / lokasi / jalan", span: 2 }),
      f.text("destinationAddressLine2", "Alamat yang dituju (baris 2)", { placeholder: "Contoh: desa, kecamatan, kabupaten", span: 2 }),
    ],
  },
  {
    title: "Orang Tua / Wali / Keluarga Dekat",
    fields: [
      f.text("parentName", "Nama orang tua/wali/keluarga dekat"),
      f.area("parentAddress", "Alamat", { span: 2 }),
      f.text("parentVillage", "Desa/Kelurahan"),
      f.text("parentDistrict", "Kecamatan"),
      f.text("parentRegency", "Kabupaten"),
      f.text("parentProvince", "Provinsi"),
    ],
  },
  {
    title: "Penjamin di Alamat Baru",
    fields: [
      f.text("guarantorName", "Nama penjamin"),
      f.text("guarantorNik", "NIK penjamin"),
      f.area("guarantorAddress", "Alamat penjamin", { span: 2 }),
      f.text("guarantorVillage", "Desa/Kelurahan"),
      f.text("guarantorDistrict", "Kecamatan"),
      f.text("guarantorRegency", "Kabupaten"),
      f.text("guarantorProvince", "Provinsi"),
    ],
  },
  {
    title: "Anggota Keluarga yang Ikut Tinggal Sementara (maks. 5)",
    fields: [
      f.text("familyMember1Name", "Nama anggota 1", { optional: true }), f.text("familyMember1Nik", "NIK anggota 1", { optional: true }),
      f.text("familyMember2Name", "Nama anggota 2", { optional: true }), f.text("familyMember2Nik", "NIK anggota 2", { optional: true }),
      f.text("familyMember3Name", "Nama anggota 3", { optional: true }), f.text("familyMember3Nik", "NIK anggota 3", { optional: true }),
      f.text("familyMember4Name", "Nama anggota 4", { optional: true }), f.text("familyMember4Nik", "NIK anggota 4", { optional: true }),
      f.text("familyMember5Name", "Nama anggota 5", { optional: true }), f.text("familyMember5Nik", "NIK anggota 5", { optional: true }),
    ],
  },
];

export const documents = [
  DOC.ktp,
  DOC.kk,
  DOC.rt,
  opt("Surat keterangan kos/kontrak/tempat tinggal"),
  opt("Fotokopi KTP penjamin di alamat baru"),
];

export const meta = {"title": "Permohonan Tinggal Sementara", "code": "TSM"};
