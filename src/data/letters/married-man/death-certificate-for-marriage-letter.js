// Disalin dari public: views/services/letters/married-man/death-certificate-for-marriage-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Keterangan Kematian untuk catin duda
import { DOC, f, pemohon, person } from "@/data/letterFields";

export const sections = [
  { ...pemohon([f.text("applicantBin", "Bin (nama ayah)"), f.text("nationality", "Kewarganegaraan", { default: "WNI" })]), title: "Data Catin Pria" },
  person("deceased", "Data Pasangan Terdahulu (Almarhum/ah)", ["name", "nik", "birth", "nationality", "religion", "occupation", "address"], [f.text("deceasedBinti", "Binti (nama ayah)"), f.date("deathDate", "Tanggal Meninggal"), f.text("deathPlace", "Tempat Meninggal")]),
];

export const documents = [DOC.suratKematian, DOC.ktp, DOC.kk, DOC.rt];

export const meta = {"title": "Surat Keterangan Kematian", "code": "KKN"};
