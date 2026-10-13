// Surat Balasan Penelitian (jenis Balasan, surat internal kantor kalurahan).
// CATATAN: berkas ini TIDAK ada di public, jadi isiannya disusun baru dari judul surat.
// Cocokkan dengan template Blade-nya, lalu sesuaikan isian di bawah bila perlu.
import { f, DOC, opt } from "@/data/letterFields";

export const sections = [
  {
    title: "Surat Permohonan Penelitian",
    fields: [
      f.text("requestNumber", "Nomor surat permohonan"),
      f.date("requestDate", "Tanggal surat permohonan"),
      f.text("requestInstitution", "Asal instansi / perguruan tinggi", { span: 2 }),
    ],
  },
  {
    title: "Data Peneliti",
    fields: [
      f.text("researcherName", "Nama peneliti"),
      f.text("researcherNumber", "NIM / NIP / NIDN"),
      f.text("researcherStudyProgram", "Program studi / jurusan"),
      f.text("researcherPhone", "Nomor telepon", { optional: true }),
    ],
  },
  {
    title: "Rencana Penelitian",
    fields: [
      f.area("researchTitle", "Judul penelitian", { span: 2 }),
      f.text("researchLocation", "Lokasi penelitian", { span: 2 }),
      f.date("researchStartDate", "Tanggal mulai penelitian"),
      f.date("researchEndDate", "Tanggal selesai penelitian"),
    ],
  },
  {
    title: "Tanggapan",
    fields: [
      f.select("responseResult", "Hasil tanggapan", ["Diizinkan", "Tidak diizinkan"]),
      f.area("responseConditions", "Ketentuan selama penelitian", { span: 2, optional: true }),
      f.text("destination", "Surat ditujukan kepada", { span: 2 }),
    ],
  },
];

export const documents = [
  "Surat pengantar penelitian dari instansi / perguruan tinggi",
  opt("Proposal / rencana penelitian"),
  opt(DOC.ktp),
];

export const meta = { title: "Surat Balasan Penelitian", code: "BIP" };
