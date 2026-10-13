// Disalin dari public: views/services/letters/married-man/never-married-certificate-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Keterangan Belum Pernah Menikah
import { DOC, f, pemohon } from "@/data/letterFields";

export const sections = [{ ...pemohon([f.text("alias", "Nama alias (bila ada)", { optional: true })]), title: "Data Catin Pria" }];

export const documents = [DOC.ktp, DOC.kk, DOC.rt];

export const meta = {"title": "Surat Keterangan Belum Pernah Menikah", "code": "KBP"};
