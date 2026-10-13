// Disalin dari public: views/services/letters/certificates/sktm-general.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Keterangan Tidak Mampu
import { f, pemohon, keperluan, DOC, opt } from "@/data/letterFields";

export const sections = [
  pemohon(),
  {
      title: "Keterangan Ekonomi",
      fields: [
        f.text("income", "Penghasilan per bulan", { placeholder: "Contoh: Rp 1.000.000 (kosongkan jika tidak ada)", optional: true }),
        f.text("category", "Kategori", { placeholder: "Contoh: Pra Sejahtera" }),
        f.text("kkmNumber", "Nomor KKM/KRM", { optional: true }),
      ],
    },
  keperluan(),
];

export const documents = [
  DOC.ktp,
  DOC.kk,
  DOC.rt,
  opt("Fotokopi kartu bantuan (KKS/KIP/PKH)"),
];

export const meta = {"title": "Surat Keterangan Tidak Mampu", "code": "SKTM"};
