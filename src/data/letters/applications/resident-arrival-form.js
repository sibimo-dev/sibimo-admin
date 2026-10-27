// Disalin dari public: views/services/letters/applications/resident-arrival-form.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Formulir Permohonan Pindah Datang WNI
import { f, OPT, pemohon, DOC, signerNames, kodeWilayahFields, wilayahByScope, wilayahDropdown, BIMOMARTANI } from "@/data/letterFields";

// scopeKey (opsional): bila diisi, Desa/Kecamatan/Kab/Provinsi berupa dropdown yang boleh diketik manual.
// Nilai awalnya ditentukan oleh wilayahDropdown (bukan lagi otomatis menurut Cakupan Kepindahan).
const alamatLengkap = (prefix, title, addressLabel = "Alamat", scopeKey) => ({
  title,
  fields: [
    f.area(`${prefix}Address`, addressLabel, { span: 2 }),
    f.text(`${prefix}Rt`, "RT"),
    f.text(`${prefix}Rw`, "RW"),
    ...(scopeKey
      ? wilayahByScope(prefix, scopeKey)
      : [
          f.text(`${prefix}Village`, "Desa/Kelurahan"),
          f.text(`${prefix}District`, "Kecamatan"),
          f.text(`${prefix}Regency`, "Kabupaten/Kota"),
          f.text(`${prefix}Province`, "Provinsi"),
        ]),
    f.text(`${prefix}PostalCode`, "Kode Pos", { optional: true }),
    f.text(`${prefix}Phone`, "Nomor Telepon", { optional: true }),
  ],
});

const KK_STATUS = ["1. Numpang KK", "2. Membuat KK Baru", "3. Nomor KK Tetap"];
const REASONS = [
  "1. Pekerjaan",
  "2. Pendidikan",
  "3. Keamanan",
  "4. Kesehatan",
  "5. Perumahan",
  "6. Keluarga",
  "7. Lainnya (sebutkan)",
];
const RELOCATION_TYPES = [
  "1. Kep. Keluarga",
  "2. Kep. Keluarga dan seluruh Angg. Keluarga",
  "3. Kep. Keluarga dan sbg Angg. Keluarga",
  "4. Anggota Keluarga",
];

export const sections = [
  {
    title: "Wilayah Tujuan (Diisi Oleh Petugas)",
    hint: "Kode wilayah sudah terisi default Kalurahan Bimomartani; ubah bila perlu. Pilih dusun/dukuh dari data yang tersedia atau ketik nama secara manual.",
    fields: kodeWilayahFields({ names: true, hamlet: true }),
  },

  pemohon(),

  {
    title: "Data KK Daerah Asal",
    fields: [
      f.kk("originKkNumber", "1. Nomor Kartu Keluarga (Asal)"),
      f.text("originHeadOfFamily", "2. Nama Kepala Keluarga (Asal)"),
    ],
  },

  {
    title: "Cakupan Kepindahan",
    hint: "Dipakai untuk subjudul formulir. Alamat Asal dipilih dari dropdown atau diketik manual.",
    fields: [
      f.select("relocationTypeLabel", "Cakupan Kepindahan", OPT.relocationScope, { default: OPT.relocationScope[0], span: 2 }),
    ],
  },

  // Alamat asal: dropdown (boleh diketik), kosong / dipilih sendiri
  wilayahDropdown(
    alamatLengkap("origin", "Alamat Asal", "Alamat", "relocationTypeLabel"),
    "origin",
    "relocationTypeLabel",
    {},
  ),

  {
    title: "Data Kepindahan",
    fields: [
      f.select("relocationReason", "Alasan Pindah", REASONS),
      f.select("originKkStatus", "Status KK bagi yang tidak Pindah", KK_STATUS),
      f.text("relocationReasonOther", "Sebutkan alasan lainnya", {
        span: 2,
        showIf: (form) => String(form.relocationReason || "").startsWith("7"),
      }),
      f.select("relocationType", "Jenis Kepindahan", RELOCATION_TYPES, { span: 2 }),
    ],
  },

  {
    title: "Data KK Daerah Tujuan",
    fields: [
      f.select("destinationKkStatus", "1. Status KK Bagi Yang Pindah", KK_STATUS),
      f.kk("destinationKkNumber", "2. Nomor Kartu Keluarga (Tujuan)"),
      f.text("destinationHeadOfFamily", "4. Nama Kepala Keluarga (Tujuan)"),
      f.date("arrivalDate", "5. Tanggal Kedatangan"),
    ],
  },

  // Alamat tujuan (di kalurahan ini): dropdown (boleh diketik), default Bimomartani/Ngemplak/Sleman/DIY
  wilayahDropdown(
    alamatLengkap("destination", "Alamat Tujuan (di kalurahan ini)", "Alamat yang Dituju", "relocationTypeLabel"),
    "destination",
    "relocationTypeLabel",
    BIMOMARTANI,
  ),

  {
    title: "Keluarga yang Datang",
    fields: [
      f.rows("familyMembers", "Anggota keluarga yang datang", [
        { key: "nik", label: "NIK" },
        { key: "name", label: "Nama" },
        { key: "shdk", label: "Status Hubungan dalam Keluarga", type: "select", options: OPT.shdk },
        { key: "validUntil", label: "Masa Berlaku KTP", type: "date", optional: true, lifetime: true },
      ], { max: 6, autoByType: "relocationType" }),
    ],
  },

  // TTD (3): 1. Petugas registrasi  2. Lurah Bimomartani  3. Pemohon (= Nama Lengkap pemohon di atas)
  signerNames(["registrar"], "Opsional. Tanda tangan Pemohon memakai Nama Lengkap di atas. Isi nama Petugas Registrasi bila ingin dicetak; kosongkan bila ditulis tangan."),
];

export const documents = [
  "Surat keterangan pindah (SKPWNI) dari daerah asal",
  DOC.ktp,
  DOC.kk,
  DOC.rt,
];

export const meta = {"title": "Formulir Permohonan Pindah Datang WNI", "code": "SKD"};