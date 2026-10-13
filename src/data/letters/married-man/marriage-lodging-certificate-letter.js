// Disalin dari public: views/services/letters/married-man/marriage-lodging-certificate-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Keterangan Numpang Nikah
import { DOC, N7, eduNat, f, opt, pemohon, person } from "@/data/letterFields";

export const sections = [{ ...pemohon([f.text("applicantBin", "Bin/Binti (nama ayah)"), ...eduNat()]), title: "Data Catin Pria" },
     person("spouse", "Data Catin Wanita", N7, [f.text("spouseBin", "Binti (nama ayah)")])];

export const documents = [DOC.ktp, DOC.kk, DOC.rt, opt("Fotokopi KTP calon pasangan")];

export const meta = {"title": "Surat Keterangan Numpang Nikah", "code": "KNN"};
