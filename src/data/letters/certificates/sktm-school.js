// Disalin dari public: views/services/letters/certificates/sktm-school.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Keterangan Tidak Mampu Sekolah
import { f, pemohon, person, DOC, opt } from "@/data/letterFields";

export const sections = [
  pemohon(),
  person("student", "Data Siswa", ["name", "nik", "birth", "gender", "address"], [f.text("studentEducation", "Jenjang pendidikan"), f.text("studentClass", "Kelas/Semester", { placeholder: "Contoh: VII / Ganjil" })]),
  {
      title: "Keterangan Ekonomi",
      fields: [
        f.text("income", "Penghasilan per bulan", { placeholder: "Contoh: Rp 1.000.000 (kosongkan jika tidak ada)", optional: true }),
        f.text("category", "Kategori", { placeholder: "Contoh: Pra Sejahtera" }),
        f.text("kkmNumber", "Nomor KKM/KRM", { optional: true }),
      ],
    },
];

export const documents = [
  DOC.ktp,
  DOC.kk,
  DOC.rt,
  "Surat keterangan siswa / kartu pelajar",
  opt("Fotokopi kartu bantuan (KKS/KIP/PKH)"),
];

export const meta = {"title": "Surat Keterangan Tidak Mampu Sekolah", "code": "SKTS"};
