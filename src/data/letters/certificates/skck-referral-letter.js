// Disalin dari public: views/services/letters/certificates/skck-referral-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Keterangan Mohon SKCK
import { f, pemohon, keperluan, DOC, opt } from "@/data/letterFields";

export const sections = [
  pemohon(),
  keperluan("Keperluan", "Pergi ke (instansi tujuan)"),
  { title: "Keterangan Tambahan", fields: [f.text("occupationNote", "Keterangan pekerjaan", { placeholder: "Contoh: Karyawan swasta di PT ...", optional: true })] },
];

export const documents = [
  DOC.ktp,
  DOC.kk,
  DOC.rt,
  opt(DOC.pasFoto),
];

export const meta = {"title": "Surat Keterangan Mohon SKCK", "code": "SKCK"};
