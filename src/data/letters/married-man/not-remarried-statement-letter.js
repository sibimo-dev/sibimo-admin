// Disalin dari public: views/services/letters/married-man/not-remarried-statement-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Keterangan Belum Menikah Lagi
import { DOC, eduNat, f, opt, pemohon } from "@/data/letterFields";

export const sections = [{ ...pemohon(eduNat()), title: "Data Catin Pria" }, { title: "Data Pendaftaran Nikah", fields: [f.text("registrationNumber", "Nomor pendaftaran", { optional: true }), f.date("registrationDate", "Tanggal pendaftaran", { optional: true })] }];

export const documents = [DOC.ktp, DOC.kk, opt("Akta cerai/surat kematian pasangan terdahulu")];

export const meta = {"title": "Surat Keterangan Belum Menikah Lagi", "code": "PBM"};
