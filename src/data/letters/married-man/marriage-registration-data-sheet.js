// Disalin dari public: views/services/letters/married-man/marriage-registration-data-sheet.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Data Isian Pendaftaran Nikah
import { DOC, OPT, N7, akad, calonIstri, calonSuami, f, opt, optional, ortuNikah, person } from "@/data/letterFields";

const onlyWhen = (section, predicate) => ({
  ...section,
  fields: section.fields.map((field) => ({
    ...field,
    showIf: (form) => predicate(form) && (!field.showIf || field.showIf(form)),
  })),
});
const isDuda = (form) => /^(duda|cerai\s*(hidup|mati))$/i.test(String(form.groomStatus ?? "").trim());
const isJanda = (form) => /^(janda|cerai\s*(hidup|mati))$/i.test(String(form.brideStatus ?? "").trim());

export const sections = [
      akad(),
      { ...calonSuami(), title: "Data Catin Pria" },
      { title: "Pendidikan & Status Catin Pria", fields: [f.select("groomEducation", "Pendidikan Terakhir", OPT.education), f.select("groomStatus", "Status", ["Jejaka", "Duda", "Beristri"], { from: "maritalStatus" })] },
      ortuNikah("groomFather", "Data Ayah Catin Pria", "Bin (nama ayah dari ayah)"),
      ortuNikah("groomMother", "Data Ibu Catin Pria", "Binti (nama ayah dari ibu)"),
      { ...calonIstri(), title: "Data Catin Wanita" },
      { title: "Pendidikan & Status Catin Wanita", fields: [f.select("brideEducation", "Pendidikan Terakhir", OPT.education), f.select("brideStatus", "Status", ["Perawan", "Janda"], { from: "maritalStatus" })] },
      ortuNikah("brideFather", "Data Ayah Catin Wanita", "Bin (nama ayah dari ayah)"),
      ortuNikah("brideMother", "Data Ibu Catin Wanita", "Binti (nama ayah dari ibu)"),
      onlyWhen(optional(person("groomPrev", "Data Istri Terdahulu Catin Pria (bila duda)", N7, [f.text("groomPrevBin", "Bin/Binti (nama ayah)"), f.text("groomPrevParentName", "Nama orang tua istri terdahulu"), f.date("groomPrevDeathDate", "Tanggal Meninggal"), f.text("groomPrevDeathPlace", "Tempat Meninggal")])), isDuda),
      onlyWhen(optional(person("bridePrev", "Data Suami Terdahulu Catin Wanita (bila janda)", ["name", "nik"], [f.text("bridePrevBin", "Bin (nama ayah)"), f.date("bridePrevDeathDate", "Tanggal Meninggal"), f.text("bridePrevDeathPlace", "Tempat Meninggal")])), isJanda),
    ];

export const documents = [DOC.ktp, DOC.kk, DOC.aktaLahir, DOC.pasFoto, opt("Fotokopi KTP orang tua kedua calon"), opt("Akta cerai/surat kematian pasangan terdahulu")];

export const meta = {"title": "Data Isian Pendaftaran Nikah", "code": "DPN"};
