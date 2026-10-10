// Disalin dari public: views/services/letters/certificates/domicile-certificate.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Keterangan Domisili
// Template PDF: letters/domicile-certificate.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { f, DOC } from "@/data/letterFields";

// Langkah 1: isian disesuaikan urut dengan template surat
export const sections = [
  {
    title: "Data Perusahaan/Yayasan",
    fields: [
      f.text("companyName", "Nama Perusahaan/Yayasan"),
      f.text("businessActivity", "Jenis Usaha/Kegiatan"),
      f.select("buildingStatus", "Status Bangunan", ["Milik Sendiri", "Sewa/Kontrak", "Pinjam Pakai"]),
      f.text("buildingUsage", "Kegunaan Bangunan", { placeholder: "Contoh: Kantor, Toko, Gudang" }),
      f.text("responsiblePerson", "Nama Penanggung Jawab/Pimpinan"),
      f.text("employeeCount", "Jumlah Karyawan", { placeholder: "Contoh: 5 orang" }),
      f.text("phone", "Nomor Telepon/HP"),
      f.area("domicileAddress", "Alamat domisili", { span: 2 }),
    ],
  },
  {
    title: "Identitas Pemilik",
    fields: [
      f.text("name", "Nama"),
      f.text("birthPlaceDate", "Tempat/Tgl. Lahir", { placeholder: "Contoh: Sleman, 17 Agustus 1990" }),
      f.text("nik", "NIK"),
      f.select("gender", "Jenis Kelamin", ["Laki-laki", "Perempuan"]),
      f.select("maritalStatus", "Status Perkawinan", ["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"]),
      f.select("religion", "Agama", ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"]),
      f.area("address", "Alamat", { span: 2 }),
    ],
  },
];

// Langkah 2: dokumen pendukung (hanya FC KTP & FC KK)
export const documents = [
  DOC.ktp,
  DOC.kk,
];

export const meta = {"title": "Surat Keterangan Domisili", "code": "KDM"};
