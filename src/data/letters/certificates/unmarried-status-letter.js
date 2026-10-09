// Disalin dari public: views/services/letters/certificates/unmarried-status-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Keterangan Belum Kawin
import { person, DOC } from "@/data/letterFields";

export const sections = [
  person("applicant", "Data Pemohon", ["name", "nik", "birth", "gender", "religion", "occupation", "address"]),
];

export const documents = [
  DOC.ktp,
  DOC.kk,
  DOC.rt,
];

export const meta = {"title": "Surat Keterangan Belum Kawin", "code": "KSB"};
