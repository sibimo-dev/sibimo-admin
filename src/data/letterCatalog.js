/* Katalog surat untuk halaman Tambah Surat (admin).
   Beda dengan public: kategori Perintah (SPPD) dan Balasan (3 surat) TAMPIL di sini karena dipakai petugas.
   Surat yang sudah masuk paket (nikah, kelahiran, kematian, Letter C, pindah WNI) tidak jadi kartu terpisah,
   dan surat penduduk/tinggal sementara hanya lewat Pendaftaran Warga Baru (sama seperti di public). */
import { LETTER_CATEGORIES, LETTER_INDEX } from "./letterIndex";
import { BUNDLE_SERVICES, isBundledLetter } from "./letterBundles";

export { LETTER_CATEGORIES as CATALOG_CATEGORIES };

const NON_RESIDENT_SLUGS = new Set(["temporary-resident-request", "temporary-stay-application-form"]);
const INTERNAL_CATEGORIES = new Set(["perintah", "balasan"]); // surat internal kantor, tidak diajukan warga

const CATEGORY_ICON = {
  permohonan: "pi pi-file-edit",
  pernyataan: "pi pi-verified",
  keterangan: "pi pi-id-card",
  perintah: "pi pi-send",
  pengantar: "pi pi-envelope",
  balasan: "pi pi-reply",
};

const single = ([slug, group, category, title, code]) => ({
  slug,
  group,
  category,
  title,
  shortCode: code,
  icon: CATEGORY_ICON[category],
  internal: INTERNAL_CATEGORIES.has(category),
  description: INTERNAL_CATEGORIES.has(category) ? `Buat ${title} (surat internal kantor).` : `Tambah pengajuan ${title}.`,
  keywords: [code],
});

export const SINGLE_LETTERS = LETTER_INDEX.map(single).filter((s) => !NON_RESIDENT_SLUGS.has(s.slug) && !isBundledLetter(s));

export const CATALOG_SERVICES = [...BUNDLE_SERVICES, ...SINGLE_LETTERS];
