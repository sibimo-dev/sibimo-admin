// Surat Balasan Penelitian (jenis Balasan, surat internal kantor kalurahan).
// Template PDF: letters/replies/research-response-letter.blade.php  (backend SBP)
// Key mengikuti variabel blade:
//   $recipient                  → recipientName          (Yth.; baris "Di" tetap "Di Tempat")
//   $ref_number                 → refLetterNumber        (nomor surat saudara)
//   $researcher['name']         → researcherName         (Nama Mahasiswa)
//   $researcher['nim']          → researcherNim
//   $researcher['study_program']→ researcherStudyProgram
//   $researcher['faculty']      → researcherFaculty
// Nomor surat, kota & tanggal, dan penandatangan diisi sistem.
import { f, DOC, opt } from "@/data/letterFields";

export const sections = [
  {
    title: "Tujuan Surat",
    fields: [
      f.text("recipientName", "Ditujukan kepada (Universitas/Instansi)", { span: 2 }),
      f.text("refLetterNumber", "Nomor surat saudara", { span: 2 }),
    ],
  },
  {
    title: "Data Mahasiswa Peneliti",
    fields: [
      f.text("researcherName", "Nama Mahasiswa", { span: 2 }),
      f.text("researcherNim", "NIM"),
      f.text("researcherStudyProgram", "Program Studi"),
      f.text("researcherFaculty", "Fakultas", { span: 2 }),
    ],
  },
];

export const documents = [
  "Surat pengantar penelitian dari instansi / perguruan tinggi",
  opt("Proposal / rencana penelitian"),
  opt(DOC.ktp),
];

export const meta = { title: "Surat Balasan Penelitian", code: "BIP" };