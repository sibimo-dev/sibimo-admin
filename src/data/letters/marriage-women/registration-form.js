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
const isWaliNasab = (form) => String(form.waliType ?? "").trim() === "Wali Nasab";

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
  {
    title: "Data Wali Nikah",
    fields: [
      f.select("waliType", "Wali Nikah", ["Ayah Kandung", "Wali Nasab"], { default: "Ayah Kandung" }),
      ...[
        f.text("waliName", "Nama"),
        f.text("waliBin", "Bin (nama ayah wali)"),
        f.text("waliNik", "NIK"),
        f.text("waliBirthPlace", "Tempat Lahir"),
        f.date("waliBirthDate", "Tanggal Lahir"),
        f.text("waliNationality", "Kewarganegaraan"),
        f.select("waliReligion", "Agama", ["Islam"]),
        f.text("waliOccupation", "Pekerjaan"),
        f.text("waliAddress", "Alamat"),
        f.select("waliRelation", "Hubungan Wali dengan Catin Wanita", [
          "Kakek (ayah dari ayah)",
          "Saudara laki-laki kandung",
          "Saudara laki-laki seayah",
          "Keponakan laki-laki",
          "Paman (saudara ayah)",
          "Lainnya",
        ]),
        f.select("waliReason", "Sebab wali bukan ayah kandung", [
          "Ayah kandung meninggal dunia",
          "Ayah kandung tidak diketahui keberadaannya",
          "Ayah kandung tidak memenuhi syarat sebagai wali",
          "Ayah kandung berhalangan / uzur",
          "Anak di luar nikah / ayah tidak sah sebagai wali",
          "Lainnya",
        ]),
      ].map((field) => ({ ...field, showIf: isWaliNasab })),
    ],
  },
  onlyWhen(optional(person("groomPrev", "Data Istri Terdahulu Catin Pria (bila duda)", N7, [f.text("groomPrevBin", "Bin/Binti (nama ayah)"), f.text("groomPrevParentName", "Nama orang tua istri terdahulu"), f.date("groomPrevDeathDate", "Tanggal Meninggal"), f.text("groomPrevDeathPlace", "Tempat Meninggal")])), isDuda),
  onlyWhen(optional(person("bridePrev", "Data Suami Terdahulu Catin Wanita (bila janda)", ["name", "nik"], [f.text("bridePrevBin", "Bin (nama ayah)"), f.date("bridePrevDeathDate", "Tanggal Meninggal"), f.text("bridePrevDeathPlace", "Tempat Meninggal")])), isJanda),
];

export const documents = [
  DOC.ktp,
  DOC.kk,
  DOC.aktaLahir,
  DOC.pasFoto,
  opt("Fotokopi KTP orang tua kedua calon"),
  opt("Fotokopi KTP wali nasab (bila wali bukan ayah kandung)"),
  opt("Akta cerai/surat kematian pasangan terdahulu"),
  opt("Akta kematian ayah kandung (bila wali nasab karena ayah meninggal)"),
];

export const meta = {"title": "Data Isian Pendaftaran Nikah", "code": "FPN"};
