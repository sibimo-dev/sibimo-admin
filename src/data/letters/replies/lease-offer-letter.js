// Surat Penawaran Sewa Kontrak Gedung BRI Unit Ngemplak II (jenis Balasan, surat internal kantor kalurahan).
// CATATAN: berkas ini TIDAK ada di public, jadi isiannya disusun baru dari judul surat.
// Cocokkan dengan template Blade-nya, lalu sesuaikan isian di bawah bila perlu.
import { f, opt } from "@/data/letterFields";

export const sections = [
  {
    title: "Surat Permintaan dari Pihak Penyewa",
    fields: [
      f.text("requestNumber", "Nomor surat permintaan"),
      f.date("requestDate", "Tanggal surat permintaan"),
      f.text("requestSubject", "Perihal surat permintaan", { span: 2, optional: true }),
    ],
  },
  {
    title: "Pihak Penyewa",
    fields: [
      f.text("tenantName", "Nama instansi penyewa", { default: "PT Bank Rakyat Indonesia (Persero) Tbk Unit Ngemplak II", span: 2 }),
      f.text("tenantRepresentative", "Nama pimpinan / penerima surat"),
      f.text("tenantPosition", "Jabatan"),
      f.area("tenantAddress", "Alamat instansi penyewa", { span: 2 }),
    ],
  },
  {
    title: "Objek Sewa",
    fields: [
      f.text("propertyName", "Nama objek sewa", { default: "Gedung BRI Unit Ngemplak II", span: 2 }),
      f.area("propertyAddress", "Alamat / lokasi objek sewa", { span: 2 }),
      f.text("buildingArea", "Luas bangunan (m²)"),
      f.text("landArea", "Luas tanah (m²)", { optional: true }),
    ],
  },
  {
    title: "Penawaran Sewa",
    fields: [
      f.text("rentPrice", "Harga sewa", { placeholder: "Contoh: Rp 50.000.000" }),
      f.text("rentPeriod", "Jangka waktu sewa", { placeholder: "Contoh: 5 tahun" }),
      f.date("rentStartDate", "Tanggal mulai sewa"),
      f.area("paymentTerms", "Cara pembayaran", { span: 2 }),
      f.area("otherTerms", "Ketentuan lain", { span: 2, optional: true }),
    ],
  },
];

export const documents = [
  "Surat permintaan dari pihak penyewa",
  opt("Dokumen kepemilikan aset (sertifikat / Letter C)"),
];

export const meta = { title: "Surat Penawaran Sewa Kontrak Gedung BRI Unit Ngemplak II", code: "SPS" };
