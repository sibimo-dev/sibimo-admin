// Surat Penawaran Sewa Kontrak Gedung (jenis Balasan, surat internal kantor kalurahan).
// Template PDF: letters/replies/lease-offer-letter.blade.php  (backend SPSKG)
// Key mengikuti variabel blade:
//   $recipient                 → recipientName          (Yth.)
//   $recipient_address         → recipientAddress       (baris "Di")
//   $lease['building_name']    → leaseBuildingName
//   $lease['building_address'] → leaseBuildingAddress
//   $lease['duration_years']   → leaseDurationYears
// Yang SENGAJA bukan field (ditulis titik-titik di blade untuk diisi tangan): nama/jabatan/alamat penandatangan,
// tanggal berakhir sewa, nominal sewa & terbilang. Nomor surat ($number), kota & tanggal ($signature) diisi sistem.
import { f, opt } from "@/data/letterFields";

export const sections = [
  {
    title: "Tujuan Surat",
    fields: [
      f.text("recipientName", "Ditujukan kepada (Yth.)", { span: 2, placeholder: "Nama / jabatan pihak yang dituju" }),
      f.text("recipientAddress", "Lokasi tujuan surat (baris \"Di\")", { span: 2, optional: true }),
    ],
  },
  {
    title: "Objek Sewa",
    fields: [
      f.text("leaseBuildingName", "Nama gedung yang ditawarkan", { default: "Gedung BRI Unit Ngemplak II", span: 2 }),
      f.area("leaseBuildingAddress", "Alamat gedung", { span: 2 }),
      f.text("leaseDurationYears", "Lama sewa (tahun)", { placeholder: "Contoh: 5" }),
    ],
  },
];

export const documents = [
  "Surat permintaan dari pihak penyewa",
  opt("Dokumen kepemilikan aset (sertifikat / Letter C)"),
];

export const meta = { title: "Surat Penawaran Sewa Kontrak", code: "SPS" };