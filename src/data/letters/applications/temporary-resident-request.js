// Surat Permohonan Menjadi Penduduk Sementara / SKTS
import { f, pemohon, DOC, signerNames } from "@/data/letterFields";

const wilayah = (prefix) => [
  f.text(`${prefix}Village`, "Desa/Kelurahan"),
  f.text(`${prefix}District`, "Kecamatan"),
  f.text(`${prefix}Regency`, "Kabupaten"),
  f.text(`${prefix}Province`, "Provinsi"),
];

export const sections = [
  pemohon([f.text("education", "Pendidikan", { placeholder: "Contoh: SMA / S1" })]),

  {
    title: "Alamat Asal",
    fields: [f.area("originAddress", "Alamat Asal", { span: 2 }), ...wilayah("origin")],
  },

  {
    title: "Alasan",
    fields: [f.area("reason", "Alasan menjadi penduduk sementara", { span: 2 })],
  },

  {
    title: "Menjadi Penduduk Sementara di",
    fields: [
      f.area("destinationAddress", "Alamat", { span: 2 }),
      f.text("rt", "RT"),
      f.text("rw", "RW"),
      f.text("hamlet", "Dusun"),
      f.text("village", "Kalurahan", { placeholder: "Contoh: Bimomartani" }),
      f.text("district", "Kapanewon", { placeholder: "Contoh: Ngemplak" }),
    ],
  },

  {
    title: "Keluarga yang Dituju",
    fields: [
      f.text("hostName", "Kami akan menjadi keluarga dari", { placeholder: "Nama kepala keluarga yang dituju", span: 2 }),
      f.kk("hostFamilyCardNumber", "Nomor KK keluarga yang dituju"),
      f.text("familyMemberCount", "Jumlah keluarga yang turut (orang)", { placeholder: "Contoh: 2" }),
      f.rows("familyMembers", "Nama dan NIK keluarga yang turut (maks. 5 orang)", [
        { key: "name", label: "Nama" },
        { key: "nik", label: "NIK" },
      ], { max: 5 }),
    ],
  },

  signerNames(["hamletHead", "districtHead"], "Opsional. Tanda tangan Pemohon memakai Nama Lengkap di atas. Isi nama Dukuh dan Camat bila ingin dicetak; kosongkan bila ditulis tangan."),
];

export const documents = [
  DOC.ktp,
  DOC.kk,
  DOC.rt,
  "Surat keterangan kos/kontrak/tempat tinggal",
  "Fotokopi KK keluarga yang dituju",
];

export const meta = {"title": "Surat Permohonan Menjadi Penduduk Sementara / SKTS", "code": "PPS"};