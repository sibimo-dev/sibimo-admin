// Disalin dari public: views/services/letters/married-man/marriage-introduction-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Pengantar Nikah
import { DOC, eduNat, f, ortuNikah, pemohon } from "@/data/letterFields";

const onlyWhen = (section, predicate) => ({
  ...section,
  fields: section.fields.map((field) => ({
    ...field,
    showIf: (form) => predicate(form) && (!field.showIf || field.showIf(form)),
  })),
});
const isDuda = (form) => /duda|cerai\s*(hidup|mati)/i.test(String(form.groomStatus ?? form.maritalStatus ?? "").trim());

const catinPria = pemohon([
  ...eduNat(),
  ...onlyWhen({ fields: [f.text("previousSpouseName", "Nama istri terdahulu (bila ada)", { optional: true })] }, isDuda).fields,
]);
catinPria.title = "Data Catin Pria";
catinPria.fields = catinPria.fields.map((field) =>
  field.key === "maritalStatus"
    ? f.select("maritalStatus", "Status Perkawinan", ["Jejaka", "Duda", "Beristri"], { from: "maritalStatus" })
    : field
);

export const sections = [
  catinPria,
  ortuNikah("father", "Data Ayah Catin", "Bin (nama ayah dari ayah)"),
  ortuNikah("mother", "Data Ibu Catin", "Binti (nama ayah dari ibu)"),
];

export const documents = [DOC.ktp, DOC.kk, DOC.rt, DOC.aktaLahir];

export const meta = {"title": "Pengantar Nikah", "code": "PNK"};
