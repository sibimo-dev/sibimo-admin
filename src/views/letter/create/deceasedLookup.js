/* Isi otomatis surat kematian dari NIK JENAZAH (isian "NIK" blok Data Jenazah, key deceasedNik; BUKAN NIK pemohon):
     - data jenazah       : deceasedName, deceasedGender, deceasedBirthPlace, deceasedBirthDate, deceasedReligion,
                            deceasedOccupation, deceasedAddress (umur dihitung otomatis dari tanggal lahir)
     - data keluarga      : familyCardNumber (Nomor KK) dan headOfFamilyName (Nama Kepala Keluarga) mengikuti data KK jenazah
     - data ibu dan ayah  : motherNik/Name/BirthPlace/BirthDate/Occupation/Address/Nationality, dan father... sama
   Nomor KK yang diketik manual (tanpa NIK jenazah) juga mencari nama kepala keluarganya (lihat findHeadByKk).
   Hanya mengisi isian yang memang ada di surat itu, jadi file surat tidak perlu diubah satu per satu.
   Isian yang sudah diketik manual tidak ditimpa; isian yang terisi otomatis dari NIK jenazah sebelumnya diganti /
   dikosongkan saat NIK berubah. Penanda isian otomatis disimpan di autoFilled.__deceased (supaya tidak tercampur
   dengan isian otomatis dari pencarian NIK pemohon). */
import { isFilled, toDate, matchCode } from "./formLogic";
import { getCitizens } from "@/services/citizen.service";

export const DECEASED_NIK_KEY = "deceasedNik";
export const KK_KEY = "familyCardNumber";
export const HEAD_KEY = "headOfFamilyName";

// key isian jenazah → properti data warga (lihat toResident di resident-lookup.service.js)
const SELF = {
  [KK_KEY]: "familyCardNumber",
  [HEAD_KEY]: "headOfFamilyName",
  deceasedName: "fullName",
  deceasedGender: "gender",
  deceasedBirthPlace: "birthPlace",
  deceasedBirthDate: "birthDate",
  deceasedAge: "age",
  deceasedReligion: "religion",
  deceasedOccupation: "occupation",
  deceasedAddress: "address",
};
// bagian isian orang tua (setelah prefix mother / father) → properti data warga
const PARENT_PARTS = {
  Nik: "nik",
  Name: "fullName",
  BirthPlace: "birthPlace",
  BirthDate: "birthDate",
  Age: "age",
  Occupation: "occupation",
  Address: "address",
  Nationality: "nationality",
};
const ROLES = ["mother", "father"];
const bareJob = (v) => String(v ?? "").replace(/^\s*\d+\s*[.)\-:]\s*/, "").trim();
const normNik = (v) => String(v ?? "").replace(/\D/g, "");

const allFields = (sections) => sections.flatMap((s) => s.fields ?? []);
export const hasDeceasedLookup = (sections) => allFields(sections).some((x) => x.key === DECEASED_NIK_KEY);

/* key isian → { field, role?, prop }. Hanya isian yang ada di surat ini. */
function targets(sections) {
  const byKey = new Map(allFields(sections).map((x) => [x.key, x]));
  const list = [];
  for (const [key, prop] of Object.entries(SELF)) if (byKey.has(key)) list.push({ field: byKey.get(key), prop, group: "self" });
  for (const role of ROLES) {
    for (const [part, prop] of Object.entries(PARENT_PARTS)) {
      const key = `${role}${part}`;
      if (byKey.has(key)) list.push({ field: byKey.get(key), prop, group: role });
    }
  }
  return list;
}

const marks = (autoFilled) => (autoFilled.__deceased ??= {});

/* Kosongkan isian yang tadinya terisi otomatis dari NIK jenazah (NIK dihapus / berubah / tidak ditemukan). */
export function clearDeceasedData(form, sections, autoFilled = {}) {
  const cleared = [];
  const m = marks(autoFilled);
  for (const { field } of targets(sections)) {
    if (!m[field.key]) continue;
    form[field.key] = field.default ?? "";
    delete autoFilled[field.key];
    delete m[field.key];
    cleared.push(field.key);
  }
  return cleared;
}

/* Nilai dari data warga → nilai yang cocok dengan jenis isiannya. Kosong ("") bila tidak ada / tidak cocok. */
function valueFor(field, key, raw) {
  if (!isFilled(raw)) return "";
  if (field.type === "date") return toDate(raw);
  if (field.type === "select") return matchCode(field, raw);
  if (field.type === "occupation" || key.endsWith("Occupation")) return bareJob(raw);
  return String(raw).trim();
}

/* resident = hasil findResidentByNik(NIK jenazah).
   Mengembalikan { filled: [key], self: bool, mother: bool, father: bool }  (true = datanya tercatat di database). */
export function fillDeceasedData(form, sections, resident, autoFilled = {}) {
  const m = marks(autoFilled);
  const filled = [];
  const exists = {
    self: !!resident,
    mother: !!resident?.mother && (isFilled(resident.mother.nik) || isFilled(resident.mother.fullName)),
    father: !!resident?.father && (isFilled(resident.father.nik) || isFilled(resident.father.fullName)),
  };
  for (const { field, prop, group } of targets(sections)) {
    const key = field.key;
    const source = group === "self" ? resident : resident?.[group];
    let raw = exists[group] ? source?.[prop] : undefined;
    // umur dihitung otomatis dari tanggal lahir (watcher di LetterFormFields); isi dari data hanya bila tanggal lahir tidak ada
    if (prop === "age" && isFilled(source?.birthDate)) raw = undefined;
    const value = valueFor(field, key, raw);
    const current = form[key];
    const manual = isFilled(current) && !autoFilled[key] && (field.default === undefined || current !== field.default);
    if (manual) continue;
    if (!isFilled(value)) {
      // NIK jenazah baru tidak punya data ini → buang isian otomatis dari NIK jenazah sebelumnya
      if (m[key]) {
        form[key] = field.default ?? "";
        delete autoFilled[key];
        delete m[key];
      }
      continue;
    }
    form[key] = value;
    autoFilled[key] = true;
    m[key] = true;
    filled.push(key);
  }
  return { filled, ...exists };
}

/* ---------- Nomor KK diketik manual → nama kepala keluarga menyesuaikan ---------- */
const firstFilled = (...values) => values.find((v) => String(v ?? "").trim() !== "") ?? "";

/* kk (16 digit) → nama kepala keluarga dari data warga | "" bila KK / kepala keluarga tidak ditemukan. */
export async function findHeadByKk(kk) {
  const result = await getCitizens();
  const list = Array.isArray(result) ? result : (result?.data ?? []);
  const members = list.filter((c) => normNik(firstFilled(c.family_card_number, c.familyCardNumber, c.kk_number, c.nomor_kk)) === normNik(kk));
  const head = members.find((c) => /kepala\s+keluarga/i.test(String(c.family_relationship ?? "")));
  return String(head?.full_name ?? "").trim();
}

/* Isi Nama Kepala Keluarga dari hasil findHeadByKk. Isian manual tidak ditimpa. */
export function fillHeadOfFamily(form, sections, name, autoFilled = {}) {
  const field = allFields(sections).find((x) => x.key === HEAD_KEY);
  if (!field) return false;
  const m = marks(autoFilled);
  const current = form[HEAD_KEY];
  const manual = isFilled(current) && !autoFilled[HEAD_KEY];
  if (manual) return false;
  if (!isFilled(name)) {
    if (m[HEAD_KEY]) {
      form[HEAD_KEY] = field.default ?? "";
      delete autoFilled[HEAD_KEY];
      delete m[HEAD_KEY];
    }
    return false;
  }
  form[HEAD_KEY] = name;
  autoFilled[HEAD_KEY] = true;
  m[HEAD_KEY] = true;
  return true;
}