// Surat Penawaran Sewa Kontrak Gedung (jenis Balasan, surat internal kantor kalurahan).
// Template PDF: letters/replies/lease-offer-letter.blade.php  (backend SPSKG)
// Key mengikuti variabel blade:
//   $recipient                   → recipientName            (Yth.)
//   $recipient_address           → recipientAddress         (baris "Di")
//   $representative['name']      → representativeName       ("Yang bertanda tangan": Nama)
//   $representative['position']  → representativePosition   (Jabatan)
//   $representative['address']   → representativeAddress    (Alamat)
//   $lease['building_name']      → leaseBuildingName
//   $lease['building_address']   → leaseBuildingAddress
//   $lease['end_date']           → leaseEndDate             (tanggal berakhirnya masa sewa)
//   $lease['annual_rent']        → leaseAnnualRent          (nominal sewa per tahun, tanpa "Rp")
//   $lease['annual_rent_words']  → leaseAnnualRentWords     (terbilang)
//   $lease['duration_years']     → leaseDurationYears
// Diisi sistem: nomor surat ($number), kota & tanggal ($signature).
// TTD Lurah tetap di blade (tidak ada field).
import { f, opt } from "@/data/letterFields";

export const sections = [
  {
    title: "Tujuan Surat",
    fields: [
      f.text("recipientName", "Ditujukan kepada (Yth.)", {
        span: 2,
        placeholder: "Nama / jabatan pihak yang dituju",
      }),
      f.text("recipientAddress", "Lokasi tujuan surat (baris \"Di\")", {
        span: 2,
        optional: true,
      }),
    ],
  },
  {
    title: "Pihak yang Menawarkan",
    fields: [
      f.text("representativeName", "Nama", {
        span: 2,
      }),
      f.text("representativePosition", "Jabatan", {
        span: 2,
      }),
      f.text("representativeAddress", "Alamat", {
        span: 2,
      }),
    ],
  },
  {
    title: "Objek Sewa",
    fields: [
      f.text("leaseBuildingName", "Nama gedung yang ditawarkan", {
        span: 2,
      }),
      f.text("leaseBuildingAddress", "Alamat gedung", {
        span: 2,
      }),
      f.text("leaseEndDate", "Tanggal berakhirnya masa sewa", {
        placeholder: "Contoh: 31 Desember 2026",
      }),
      f.text("leaseDurationYears", "Lama sewa (tahun)", {
        placeholder: "Contoh: 5",
      }),
    ],
  },
  {
    title: "Nilai Sewa",
    fields: [
      f.text("leaseAnnualRent", "Sewa bangunan per tahun (Rp)", {
        placeholder: "Contoh: 50.000.000",
      }),
      f.text("leaseAnnualRentWords", "Terbilang", {
        span: 2,
        placeholder: "Contoh: lima puluh juta rupiah",
      }),
    ],
  },
];

export const documents = [
  "Surat permintaan dari pihak penyewa",
  opt("Dokumen kepemilikan aset (sertifikat / Letter C)"),
];

export const meta = { title: "Surat Penawaran Sewa Kontrak", code: "SPS" };