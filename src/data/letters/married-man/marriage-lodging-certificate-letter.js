// Disalin dari public: views/services/letters/married-man/marriage-lodging-certificate-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Keterangan Numpang Nikah
import { DOC, calonIstri, calonSuami, opt } from "@/data/letterFields";

export const sections = [{ ...calonSuami(), title: "Data Catin Pria" }, { ...calonIstri(), title: "Data Catin Wanita" }];

export const documents = [DOC.ktp, DOC.kk, DOC.rt, opt("Fotokopi KTP calon pasangan")];

export const meta = {"title": "Surat Keterangan Numpang Nikah", "code": "KNN"};
