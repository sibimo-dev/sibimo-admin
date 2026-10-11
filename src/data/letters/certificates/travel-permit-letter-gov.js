// Disalin dari public: views/services/letters/certificates/travel-permit-letter-gov.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Keterangan Jalan admin bisa memilih akan menggunakan kop pemerintah atau kop lurah
import { f, pemohon, keperluan, DOC, opt } from "@/data/letterFields";

export const sections = [
  pemohon([f.kk("kkNumber", "Nomor KK"), f.text("phone", "Nomor telepon", { placeholder: "Contoh: 081234567890" })]),
  keperluan("Tujuan perjalanan", "Tempat tujuan"),
];

export const documents = [
  DOC.ktp,
  DOC.kk,
  DOC.rt,
  opt("Surat tugas/undangan dari instansi"),
];

export const meta = {"title": "Surat Keterangan Jalan", "code": "IPI"};
