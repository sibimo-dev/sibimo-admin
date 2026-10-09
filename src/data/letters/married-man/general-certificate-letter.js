// Disalin dari public: views/services/letters/married-man/general-certificate-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Pengantar Tes Kesehatan
import { DOC, OPT, f, keperluan, pemohon } from "@/data/letterFields";

export const sections = [{ ...pemohon([f.select("education", "Pendidikan Terakhir", OPT.education), f.text("nationality", "Kewarganegaraan", { default: "WNI" }), f.text("behavior", "Kelakuan", { default: "Baik" })]), title: "Data Catin Pria" },
     keperluan("Keperluan", "Tujuan ke"),
     { title: "Keterangan Tambahan", fields: [f.date("validUntil", "Surat pengantar berlaku sampai tanggal"), f.area("additionalNote", "Keterangan lain-lain", { span: 2, optional: true })] }];

export const documents = [DOC.ktp, DOC.kk, DOC.rt];

export const meta = {"title": "Surat Pengantar Tes Kesehatan", "code": "KUM"};
