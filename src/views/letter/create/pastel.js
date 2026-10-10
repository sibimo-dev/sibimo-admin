/* Tema warna Tambah Surat (admin): mengikuti palet admin (primary biru + abu slate).
   Nama hue (sky, rose, ...) tetap diterima supaya kode salinan public tidak perlu diubah,
   tetapi semuanya dipetakan ke satu tema yang sama. Warna lain hanya untuk status (hijau/merah/kuning) di komponen. */

const THEME = {
  card: "bg-white border-slate-200",
  cardHover: "hover:border-primary-300 hover:shadow-md",
  bar: "bg-primary-300",
  blob: "bg-primary-50",
  icon: "bg-primary-100 text-primary-700",
  pill: "bg-primary-50 text-primary-700 ring-1 ring-primary-200",
  soft: "bg-primary-50/50 border-primary-100",
  softer: "bg-slate-50 border-slate-200",
  dot: "bg-primary-500",
  text: "text-primary-700",
  textStrong: "text-primary-900",
  selected: "ring-2 ring-primary-400 border-primary-300 bg-primary-50",
  idle: "bg-white border-slate-200 hover:border-primary-300 hover:bg-primary-50/50",
  segOn: "bg-primary-500",
  segNow: "bg-primary-600",
  segOff: "bg-slate-200",
  circleDone: "bg-primary-500 text-white border-primary-500",
  circleNow: "bg-white text-primary-700 border-primary-500 ring-4 ring-primary-100",
  hero: "from-primary-50 via-white to-white",
  chipOn: "bg-primary-600 border-primary-600 text-white shadow-sm",
  chipOff: "bg-white border-slate-200 text-slate-600 hover:bg-primary-50 hover:border-primary-200",
  drop: "border-primary-300 bg-primary-50/50",
  btn: "", // tombol memakai warna primary bawaan PrimeVue (preset admin)
};

const NAMES = ["rose", "orange", "amber", "emerald", "teal", "sky", "violet", "fuchsia", "lime", "indigo"];
export const HUES = Object.fromEntries(NAMES.map((n) => [n, THEME]));
export const HUE_ORDER = NAMES;
export const SECTION_HUES = ["sky"];
export const hue = () => THEME;
export const hueOf = () => "sky";

export const CATEGORY_HUES = { permohonan: "sky", keterangan: "sky", pengantar: "sky", balasan: "sky", pernyataan: "sky", perintah: "sky" };
export const hueForCategory = () => "sky";
