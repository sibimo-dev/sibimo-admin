// Disalin dari public: views/services/letters/married-man/marriage-introduction-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Pengantar Nikah
import { DOC, eduNat, f, ortuNikah, pemohon } from "@/data/letterFields";

export const sections = [{ ...pemohon([...eduNat(), f.text("previousSpouseName", "Nama istri/suami terdahulu (bila ada)", { optional: true })]), title: "Data Catin Pria" },
     ortuNikah("father", "Data Ayah Catin", "Bin (nama ayah dari ayah)"), ortuNikah("mother", "Data Ibu Catin", "Binti (nama ayah dari ibu)")];

export const documents = [DOC.ktp, DOC.kk, DOC.rt, DOC.aktaLahir];

export const meta = {"title": "Pengantar Nikah", "code": "PNK"};
