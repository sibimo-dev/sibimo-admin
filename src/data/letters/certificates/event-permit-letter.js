// Disalin dari public: views/services/letters/certificates/event-permit-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Keterangan Keramaian
// Template PDF: letters/event-permit-letter.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { f, DOC } from "@/data/letterFields";

// Langkah 1: isian disesuaikan urut dengan template surat
export const sections = [
  {
    title: "Data Pemohon",
    fields: [
      f.text("name", "Nama"),
      f.text("birthPlaceDate", "Tempat/Tgl. Lahir", { placeholder: "Contoh: Sleman, 17 Agustus 1990" }),
      f.text("nik", "NIK"),
      f.select("gender", "Jenis Kelamin", ["Laki-laki", "Perempuan"]),
      f.select("maritalStatus", "Status Perkawinan", ["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"]),
      f.select("religion", "Agama", ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"]),
      f.text("occupation", "Pekerjaan"),
      f.area("address", "Alamat", { span: 2 }),
      f.text("destination", "Pergi ke", { placeholder: "Contoh: Bimomartani, Ngemplak, Sleman" }),
      f.text("necessity", "Keperluan", { placeholder: "Contoh: Mengadakan acara pernikahan" }),
    ],
  },
  {
    title: "Kegiatan/Acara",
    fields: [
      f.date("eventDate", "Pada Hari/Tanggal"),
      f.time("eventTime", "Jam"),
      f.text("eventPlace", "Tempat"),
      f.text("eventParticipants", "Peserta", { placeholder: "Contoh: Warga sekitar, ± 200 orang" }),
      f.text("eventObjective", "Tujuan"),
      f.text("responsiblePerson", "Penanggung Jawab"),
    ],
  },
];

// Langkah 2: dokumen pendukung (hanya FC KTP & FC KK)
export const documents = [
  DOC.ktp,
  DOC.kk,
];

export const meta = {"title": "Surat Keterangan Keramaian", "code": "IZK"};
