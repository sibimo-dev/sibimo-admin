// Surat Tindak Lanjut Permohonan Izin (jenis Balasan, surat internal kantor kalurahan).
// CATATAN: berkas ini TIDAK ada di public (folder replies/ belum ada di sana), jadi isiannya disusun baru
// dari judul surat. Cocokkan dengan template Blade-nya, lalu sesuaikan isian di bawah bila perlu.
import { f, DOC, pemohonRingkas } from "@/data/letterFields";

export const sections = [
  pemohonRingkas([f.text("permitType", "Jenis izin yang dimohonkan", { placeholder: "Contoh: Izin keramaian, izin usaha", span: 2 })]),
  {
    title: "Surat Permohonan Izin",
    fields: [
      f.text("requestNumber", "Nomor surat permohonan"),
      f.date("requestDate", "Tanggal surat permohonan"),
      f.text("requestSubject", "Perihal surat permohonan", { span: 2 }),
    ],
  },
  {
    title: "Tindak Lanjut",
    fields: [
      f.select("followUpResult", "Hasil tindak lanjut", ["Disetujui", "Ditolak", "Perlu dilengkapi"]),
      f.date("followUpDate", "Tanggal tindak lanjut"),
      f.area("followUpContent", "Isi tanggapan / tindak lanjut", { span: 2 }),
      f.area("followUpConditions", "Syarat atau ketentuan lanjutan", { span: 2, optional: true }),
    ],
  },
  {
    title: "Tujuan Surat",
    fields: [
      f.text("destination", "Surat ditujukan kepada", { span: 2 }),
      f.text("carbonCopy", "Tembusan", { span: 2, optional: true }),
    ],
  },
];

export const documents = ["Surat permohonan izin dari pemohon", DOC.ktp];

export const meta = { title: "Surat Tindak Lanjut Permohonan Izin", code: "TLP" };
