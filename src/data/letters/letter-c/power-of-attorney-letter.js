// Disalin dari public: views/services/letters/letter-c/power-of-attorney-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Kuasa
// Template PDF: letters/letter-c/power-of-attorney-letter.blade.php
import { DOC, DOC_LETTER_C, DOC_PBB, f, signerNames } from "@/data/letterFields";

export const sections = [
  {
    title: "Data Pemberi Kuasa (Pihak Pertama)",
    fields: [
      f.text("name", "Nama"),
      f.text("birthPlaceDate", "Tempat/Tgl. Lahir", { placeholder: "Contoh: Sleman, 17 Agustus 1990" }),
      f.select("gender", "Jenis Kelamin", ["Laki-laki", "Perempuan"]),
      f.text("nik", "NIK"),
      f.area("address", "Alamat", { span: 2 }),
    ],
  },
  {
    title: "Data Pewaris (Almarhum/Almarhumah)",
    fields: [
      f.text("deceasedName", "Nama Almarhum/Almarhumah"),
      f.text("deceasedDeathPlace", "Meninggal dunia di"),
    ],
  },
  {
    title: "Data Penerima Kuasa (Pihak Kedua)",
    fields: [
      f.text("attorneyName", "Nama"),
      f.text("attorneyBirthPlaceDate", "Tempat/Tgl. Lahir", { placeholder: "Contoh: Sleman, 17 Agustus 1990" }),
      f.select("attorneyGender", "Jenis Kelamin", ["Laki-laki", "Perempuan"]),
      f.text("attorneyNik", "NIK"),
      f.area("attorneyAddress", "Alamat", { span: 2 }),
    ],
  },
  // TTD di xlsx (3): Penerima kuasa, Pemberi kuasa (keduanya sudah punya isian), Kalurahan/Notaris.
  // Kalurahan tidak jadi field (ada di otorisasi); nama Notaris opsional.
  signerNames(["notary"], "Opsional. Penerima dan Pemberi Kuasa memakai nama pada data di atas. Isi nama Notaris bila ingin dicetak; kosongkan bila ditulis tangan."),
];

export const documents = [DOC.ktp, DOC.kk, DOC_LETTER_C, DOC_PBB, DOC.suratKematian, "Fotokopi KTP penerima kuasa"];

export const meta = {"title": "Surat Kuasa", "code": "KLC"};
