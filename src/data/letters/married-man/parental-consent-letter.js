// Disalin dari public: views/services/letters/married-man/parental-consent-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Izin Orang Tua
import { DOC, ortuNikah } from "@/data/letterFields";

export const sections = [ortuNikah("father", "Data Ayah Catin Pria", "Bin (nama ayah dari ayah)"), ortuNikah("mother", "Data Ibu Catin Pria", "Binti (nama ayah dari ibu)"),
     ortuNikah("child", "Data Catin Pria (Anak yang Akan Menikah)", "Bin/Binti (nama ayah)"), ortuNikah("childSpouse", "Data Catin Wanita (Calon Pasangan Anak)", "Bin/Binti (nama ayah)")];

export const documents = ["Fotokopi KTP ayah dan ibu", "Fotokopi KTP anak", DOC.kk];

export const meta = {"title": "Surat Izin Orang Tua", "code": "SOT"};
