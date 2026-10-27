// Disalin dari public: views/services/letters/certificates/unmarried-status-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Surat Keterangan Belum Kawin
import { DOC, f } from "@/data/letterFields";

export const sections = [
  {
    title: "Data Pemohon",
    hint: "Terisi otomatis dari data warga. Koreksi bila ada yang tidak sesuai.",
    fields: [
      f.text("applicantName", "Nama Lengkap", { from: "fullName" }),
      f.nik("applicantNik", "NIK", { from: "nik" }),
      f.text("applicantBirthPlace", "Tempat Lahir", { from: "birthPlace" }),
      f.date("applicantBirthDate", "Tanggal Lahir", { from: "birthDate" }),
      f.select("applicantGender", "Jenis Kelamin", ["Laki-laki", "Perempuan"], { from: "gender" }),
      f.select("applicantReligion", "Agama", ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu"], { from: "religion" }),
      f.select("applicantOccupation", "Pekerjaan", ["Belum/Tidak Bekerja", "Pelajar/Mahasiswa", "Ibu Rumah Tangga", "Petani", "Buruh", "Wiraswasta", "Karyawan Swasta", "PNS/ASN", "TNI/Polri", "Pensiunan"], { from: "occupation", editable: true }),
      f.area("applicantAddress", "Alamat", { from: "address", span: 2 }),
    ],
  },
];

export const documents = [
  DOC.ktp,
  DOC.kk,
  DOC.rt,
];

export const meta = {"title": "Surat Keterangan Belum Kawin", "code": "KSB"};
