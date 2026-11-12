// Disalin dari public: views/services/letters/marriage-women/n2.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// sections & documents di-export supaya juga dibaca paket surat (data/letterBundles.js) dan halaman register.
// Ubah isian surat ini di sini saja; paket & register ikut berubah.
// Permohonan Kehendak Nikah
// Template PDF: letters/marriage-women/letters/n2.blade.php
// 1 file = 1 surat. Isi `sections` (langkah 1) dan `documents` (langkah 2).
// Langkah 3 (cek ulang, ceklis dokumen asli, kirim, pop-up hasil) sudah ditangani LetterWizard.
import { DOC, akad, calonPengantin, opt, pemohonRingkas } from "@/data/letterFields";

const penandatanganKua = () => ({
  title: "Penandatangan KUA (opsional)",
  fields: [
    {
      key: "kua_head_name",
      label: "Nama Kepala KUA / Penghulu",
      type: "text",
      optional: true,
      placeholder: "Boleh dikosongkan",
    },
  ],
});

// Langkah 1: isian sesuai surat yang diajukan
export const sections = [pemohonRingkas(), calonPengantin(), akad(), penandatanganKua()];

// Langkah 2: dokumen pendukung (opt(...) = tidak wajib)
export const documents = ["Surat pengantar nikah dari desa/kelurahan (N1)", "Persetujuan calon mempelai (N3)", DOC.ktp, DOC.aktaLahir, DOC.kk, DOC.pasFoto, opt("Surat keterangan wali nikah")];

export const meta = {"title": "Permohonan Kehendak Nikah", "code": "N2"};
