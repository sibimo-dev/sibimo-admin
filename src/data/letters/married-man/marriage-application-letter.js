// Disalin dari public: views/services/letters/married-man/marriage-application-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Permohonan Kehendak Nikah
import { DOC, akad, calonPengantin, pemohonRingkas } from "@/data/letterFields";

export const sections = [{ ...pemohonRingkas(), title: "Data Catin Pria" }, { ...calonPengantin(), title: "Data Catin Pria dan Catin Wanita" }, akad()];

export const documents = [DOC.ktp, DOC.kk, "Fotokopi KTP calon pasangan", DOC.pasFoto, DOC.aktaLahir, "Surat keterangan wali nikah"];

export const meta = {"title": "Permohonan Kehendak Nikah", "code": "KHN"};
