import api from "./api";
import { getBackendLetterCode } from "@/data/letterBackendMap";

export const LETTER_SOURCE = "Manual (Kelurahan)";

let letterTypesPromise;
const unwrap = (request) => request.then((response) => response.data.data);
const normalize = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

function normalizePhone(value) {
  const phone = String(value ?? "").trim();
  if (!phone) return null;
  return phone.replace(/[\s().-]/g, "");
}

export function getLetterRequestError(error, fallback = "Pengajuan surat gagal dikirim.") {
  const response = error?.response?.data;
  const validationErrors = response?.errors && typeof response.errors === "object"
    ? Object.values(response.errors).flat().filter(Boolean)
    : [];
  const validationMessage = [...new Set(validationErrors)].join(" ");
  return validationMessage || response?.message || error?.message || fallback;
}

function cleanValue(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.map(cleanValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cleanValue(item)]));
  return value;
}

const snakeCase = (value) => String(value ?? "")
  .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
  .toLowerCase();

const COMMON_FIELD_ALIASES = {
  // Data perjalanan dinas (SPPD). Label pada form admin memakai nama
  // Inggris, sedangkan letter_type_fields memakai key Indonesia.
  pejabat_berwenang: ["issuingOfficial"],
  nama_pegawai: ["employeeName"],
  pangkat_golongan: ["employeeRank"],
  jabatan: ["employeePosition"],
  maksud_perjalanan: ["purpose"],
  alat_angkutan: ["transport"],
  tempat_berangkat: ["departurePlace"],
  tempat_tujuan: ["destinationPlace"],
  tanggal_berangkat: ["departureDate"],
  tanggal_kembali: ["returnDueDate"],
  pengikut: ["companions"],
  anggaran_instansi: ["budgetAgency"],
  anggaran_mata_anggaran: ["budgetItem"],
  keterangan_lain: ["notes"],

  // Key umum yang namanya berubah antara form public/admin dan schema surat.
  tempat_lahir: ["birthPlace"],
  birth_place: ["birthPlace"],
  tanggal_lahir: ["birthDate"],
  birth_date: ["birthDate"],
  jenis_kelamin: ["gender"],
  status_perkawinan: ["maritalStatus"],
  status_pernikahan: ["maritalStatus"],
  kewarganegaraan: ["nationality"],
  pendidikan_terakhir: ["education"],
  pendidikan: ["education"],
  pekerjaan: ["occupation"],
  agama: ["religion"],
  alamat: ["address", "domicileAddress", "businessAddress"],
  pergi_ke: ["destination", "travelTo", "destinationPlace"],
  keperluan: ["purpose", "necessity", "need", "reason"],
  tujuan: ["destination", "travelTo", "destinationPlace"],
  maksud_dan_tujuan: ["purpose", "necessity", "need", "reason"],
  tujuan_ke: ["destination", "travelTo", "destinationPlace"],
  penghasilan: ["income"],
  dipergunakan_untuk: ["purpose"],
  nama_kepala_keluarga: ["headOfFamily", "headOfFamilyName", "householdHead"],
  nomor_kk: ["kkNumber", "familyCardNumber", "hostFamilyCardNumber"],
  nomor_kartu_keluarga: ["kkNumber", "familyCardNumber"],
  nomor_telepon_usaha: ["phone"],
  alamat_domisili_usaha: ["domicileAddress"],
  alamat_usaha: ["businessAddress"],
  jenis_usaha: ["businessType"],
  jenis_usaha_kegiatan: ["businessType"],
  status_bangunan: ["buildingStatus"],
  kegunaan_bangunan: ["buildingUsage"],
  nama_perusahaan: ["companyName"],
  nama_penanggung_jawab: ["responsiblePerson"],
  jumlah_karyawan: ["employeeCount"],
  alasan_pindah: ["relocationReason", "relocationReasonOther"],
  jenis_kepindahan: ["relocationType"],
  status_kk_tidak_pindah: ["originKkStatus"],
  status_kk_pindah: ["destinationKkStatus"],
  alamat_asal: ["originAddress"],
  alamat_tujuan: ["destinationAddress", "destinationAddressLine1"],
  desa_asal: ["originVillage"],
  kecamatan_asal: ["originDistrict"],
  kabupaten_asal: ["originRegency"],
  provinsi_asal: ["originProvince"],
  desa_tujuan: ["village", "destinationVillage"],
  kecamatan_tujuan: ["district", "destinationDistrict"],
  kabupaten_tujuan: ["destinationRegency"],
  provinsi_tujuan: ["destinationProvince"],
  alasan_kuasa: ["grantorCondition", "reason"],
  instansi_tujuan: ["destination", "purposeLocation"],
  nama_ibu: ["motherName"],
  nama_ayah: ["fatherName"],
  nama_anak: ["childName"],
  nik_ibu: ["motherNik"],
  nik_ayah: ["fatherNik"],
  nik_anak: ["childNik"],
  alamat_ibu: ["motherAddress"],
  alamat_ayah: ["fatherAddress"],
  pekerjaan_ibu: ["motherOccupation"],
  pekerjaan_ayah: ["fatherOccupation"],
  kewarganegaraan_ibu: ["motherNationality"],
  kewarganegaraan_ayah: ["fatherNationality"],
  tanggal_meninggal: ["deathDate"],
  tempat_meninggal: ["deathPlace"],
  tanggal_pernikahan: ["marriageDate"],
  tanggal_perkawinan: ["marriageDate"],
  nama_pasangan_terdahulu: ["previousSpouseName", "exHusbandName"],

  // Form pengantar nikah memakai prefix `akad`, sedangkan field PDF/backend
  // menyimpan data akad dengan prefix `ceremony`.
  ceremony_day: ["akadDay"],
  ceremony_date: ["akadDate"],
  ceremony_time: ["akadTime"],
  ceremony_place: ["akadPlace"],

  // Surat kuasa memakai key backend yang membedakan pemberi dan penerima,
  // sedangkan form admin memakai blok `name` dan `attorneyName`.
  nama_pemberi_kuasa: ["name"],
  nik_pemberi_kuasa: ["nik"],
  tempat_lahir_pemberi_kuasa: ["birthPlace"],
  tanggal_lahir_pemberi_kuasa: ["birthDate"],
  pekerjaan_pemberi_kuasa: ["occupation"],
  alamat_pemberi_kuasa: ["address"],
  nama_penerima_kuasa: ["attorneyName"],
  nik_penerima_kuasa: ["attorneyNik"],
  tempat_lahir_penerima_kuasa: ["attorneyBirthPlace"],
  tanggal_lahir_penerima_kuasa: ["attorneyBirthDate"],
  pekerjaan_penerima_kuasa: ["attorneyOccupation"],
  alamat_penerima_kuasa: ["attorneyAddress"],
  rt_penerima_kuasa: ["attorneyRt"],
  rw_penerima_kuasa: ["attorneyRw"],

  // Field keluarga/orang tua pada tipe surat nikah backend.
  groom_father_name: ["fatherName", "groomFatherName"],
  groom_father_nik: ["fatherNik", "groomFatherNik"],
  groom_father_birth_place: ["fatherBirthPlace", "groomFatherBirthPlace"],
  groom_father_birth_date: ["fatherBirthDate", "groomFatherBirthDate"],
  groom_father_nationality: ["fatherNationality", "groomFatherNationality"],
  groom_father_religion: ["fatherReligion", "groomFatherReligion"],
  groom_father_occupation: ["fatherOccupation", "groomFatherOccupation"],
  groom_father_address: ["fatherAddress", "groomFatherAddress"],
  groom_mother_name: ["motherName", "groomMotherName"],
  groom_mother_nik: ["motherNik", "groomMotherNik"],
  groom_mother_birth_place: ["motherBirthPlace", "groomMotherBirthPlace"],
  groom_mother_birth_date: ["motherBirthDate", "groomMotherBirthDate"],
  groom_mother_nationality: ["motherNationality", "groomMotherNationality"],
  groom_mother_religion: ["motherReligion", "groomMotherReligion"],
  groom_mother_occupation: ["motherOccupation", "groomMotherOccupation"],
  groom_mother_address: ["motherAddress", "groomMotherAddress"],
  bride_father_name: ["brideFatherName"],
  bride_father_nik: ["brideFatherNik"],
  bride_father_birth_place: ["brideFatherBirthPlace"],
  bride_father_birth_date: ["brideFatherBirthDate"],
  bride_father_nationality: ["brideFatherNationality"],
  bride_father_religion: ["brideFatherReligion"],
  bride_father_occupation: ["brideFatherOccupation"],
  bride_father_address: ["brideFatherAddress"],
  bride_mother_name: ["brideMotherName"],
  bride_mother_nik: ["brideMotherNik"],
  bride_mother_birth_place: ["brideMotherBirthPlace"],
  bride_mother_birth_date: ["brideMotherBirthDate"],
  bride_mother_nationality: ["brideMotherNationality"],
  bride_mother_religion: ["brideMotherReligion"],
  bride_mother_occupation: ["brideMotherOccupation"],
  bride_mother_address: ["brideMotherAddress"],

  // Metadata tambahan untuk tipe surat yang memakai tabel/array di PDF.
  perbedaan_nama: ["otherName"],
  perbedaan_alamat: ["otherAddress"],
  perbedaan_nik: ["otherNik"],
  applicant_name: ["name", "applicantName"],
  applicant_nik: ["nik", "applicantNik"],
  origin_kk_number: ["originKkNumber", "kkNumber"],
  origin_head_of_family: ["originHeadOfFamily", "headOfFamily"],
  register_year: ["registerYear"],
  rows: ["people"],
  family_members: ["familyMembers"],
  education_changes: ["educationChanges"],
  job_changes: ["jobChanges"],
  religion_changes: ["religionChanges"],
  other_changes: ["otherChanges"],
  change_types: ["changeTypes"],
  other_element_label: ["otherElementLabel"],
};

const PERSON_PREFIXES = {
  ayah: ["father", "brideFather", "groomFather"],
  ibu: ["mother", "brideMother", "groomMother"],
};

function aliasesForField(fieldKey) {
  const aliases = [...(COMMON_FIELD_ALIASES[fieldKey] ?? [])];
  const personMatch = String(fieldKey).match(/^(nama|nik|ttl|kewarganegaraan|agama|pekerjaan|alamat)_(ayah|ibu)$/);
  if (personMatch) {
    const [, kind, person] = personMatch;
    for (const prefix of PERSON_PREFIXES[person] ?? []) {
      if (kind === "nama") aliases.push(`${prefix}Name`);
      if (kind === "nik") aliases.push(`${prefix}Nik`);
      if (kind === "ttl") aliases.push(`${prefix}BirthPlace`, `${prefix}BirthDate`);
      if (kind === "kewarganegaraan") aliases.push(`${prefix}Nationality`);
      if (kind === "agama") aliases.push(`${prefix}Religion`);
      if (kind === "pekerjaan") aliases.push(`${prefix}Occupation`);
      if (kind === "alamat") aliases.push(`${prefix}Address`);
    }
  }
  return aliases;
}

export function backendFormData(fields, backendFields, fieldDefinitions = []) {
  const output = {};
  const values = new Map(Object.entries(fields));
  const snakeValues = new Map(Object.entries(fields).map(([key, value]) => [snakeCase(key), value]));
  const localKeysByLabel = new Map();
  const localKeysBySectionAndLabel = new Map();

  for (const definition of fieldDefinitions ?? []) {
    const label = normalize(definition?.label);
    if (!label) continue;
    const current = localKeysByLabel.get(label);
    localKeysByLabel.set(label, current === undefined ? definition.key : null);
    const signature = `${normalize(definition?.section)}:${label}`;
    const sectionCurrent = localKeysBySectionAndLabel.get(signature);
    localKeysBySectionAndLabel.set(signature, sectionCurrent === undefined ? definition.key : null);
  }

  for (const field of backendFields ?? []) {
    const backendKey = String(field.field_key);
    const label = normalize(field.field_label);
    const sectionLabelKey = localKeysBySectionAndLabel.get(`${normalize(field.section_name)}:${label}`);
    const labelKey = localKeysByLabel.get(label);
    const candidates = [backendKey, snakeCase(backendKey), ...aliasesForField(backendKey), sectionLabelKey, labelKey].filter(Boolean);
    const matchingKey = candidates.find((key) => values.has(key) && values.get(key) !== undefined && values.get(key) !== "")
      ?? candidates.find((key) => snakeValues.has(key) && snakeValues.get(key) !== undefined && snakeValues.get(key) !== "");

    if (matchingKey) {
      const directValue = values.has(matchingKey) ? values.get(matchingKey) : snakeValues.get(matchingKey);
      if (backendKey.startsWith("ttl_") && Array.isArray(aliasesForField(backendKey))) {
        const person = backendKey.endsWith("_ayah") ? PERSON_PREFIXES.ayah : PERSON_PREFIXES.ibu;
        const birthPlaceKey = person.map((prefix) => `${prefix}BirthPlace`).find((key) => values.has(key) && values.get(key));
        const birthDateKey = person.map((prefix) => `${prefix}BirthDate`).find((key) => values.has(key) && values.get(key));
        const birthPlace = birthPlaceKey ? values.get(birthPlaceKey) : "";
        const birthDate = birthDateKey ? values.get(birthDateKey) : "";
        output[backendKey] = [birthPlace, birthDate].filter(Boolean).join(", ") || directValue;
      } else {
        output[backendKey] = directValue;
      }
    }
  }

  return output;
}

async function getLetterTypes() {
  letterTypesPromise ??= unwrap(api.get("/letter-types"));
  return letterTypesPromise;
}

async function resolveLetterType(letter) {
  const code = getBackendLetterCode(letter.slug, letter.code);
  const types = await getLetterTypes();
  const summary = types.find((item) => String(item.code).toUpperCase() === code.toUpperCase());
  if (!summary) throw new Error(`Tipe surat ${code} belum tersedia di backend. Jalankan seeder tipe surat terlebih dahulu.`);
  return unwrap(api.get(`/letter-types/${summary.letter_type_id}`));
}

function firstValue(fields, keys) {
  for (const key of keys) {
    const value = fields?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
}

function applicantFrom(fields) {
  const applicantName = firstValue(fields, ["name", "applicantName", "reporterName", "groomName", "brideName", "childName", "deceasedName", "headOfFamilyName", "fatherName", "motherName"]);
  const applicantNik = firstValue(fields, ["nik", "applicantNik", "reporterNik", "groomNik", "brideNik", "childNik", "deceasedNik", "fatherNik", "motherNik"]);
  const applicantAddress = firstValue(fields, ["address", "applicantAddress", "reporterAddress", "groomAddress", "brideAddress", "deceasedAddress", "fatherAddress", "motherAddress", "originAddress"]);
  const applicantPhone = firstValue(fields, ["whatsapp", "applicantPhone", "phone", "reporterPhone"]);

  if (!applicantName || !applicantNik || !applicantAddress) throw new Error("Lengkapi nama, NIK, dan alamat pemohon sebelum mengirim surat.");
  return { applicantName, applicantNik, applicantAddress, applicantPhone };
}

function resolveDocumentId(label, documents) {
  const normalizedLabel = normalize(label);
  const exact = documents.find((document) => normalize(document.document_name) === normalizedLabel);
  if (exact) return exact.letter_type_document_id;
  const aliases = [["kk", "kk"], ["kartutanda", "ktp"], ["ktp", "ktp"], ["pasfoto", "foto"]];
  const alias = aliases.find(([needle]) => normalizedLabel.includes(needle));
  if (alias) {
    const match = documents.find((document) => normalize(document.document_name).includes(alias[1]));
    if (match) return match.letter_type_document_id;
  }
  const fallback = documents.find((document) => !document.is_required && /lain|pendukung|tambahan/i.test(document.document_name));
  return fallback?.letter_type_document_id ?? documents[0]?.letter_type_document_id ?? null;
}

async function uploadFiles(requestId, files, documents) {
  for (const item of files ?? []) {
    const documentId = resolveDocumentId(item.label, documents);
    if (!documentId) throw new Error(`Dokumen ${item.label} belum memiliki konfigurasi backend.`);
    const formData = new FormData();
    formData.append("letter_type_document_id", String(documentId));
    formData.append("file", item.file, item.file.name);
    try {
      await api.post(`/letter-requests/${requestId}/attachments`, formData);
    } catch (error) {
      throw new Error(`Upload dokumen "${item.label}" gagal: ${getLetterRequestError(error, "file ditolak backend.")}`, { cause: error });
    }
  }
}

async function submitOne(letter) {
  const type = await resolveLetterType(letter);
  const fields = cleanValue(letter.fields ?? {});
  const applicant = applicantFrom(fields);
  // Simpan juga key asli dari form admin. Sebagian tipe surat lama memakai
  // kontrak field camelCase yang berbeda dari metadata backend; backend akan
  // menormalisasikannya saat membangun preview PDF. Field canonical hasil
  // adapter tetap menimpa key yang sama agar kontrak baru diprioritaskan.
  const formData = {
    ...fields,
    ...backendFormData(fields, type.fields ?? [], letter.fieldDefinitions ?? []),
  };
  let created;
  try {
    created = await unwrap(api.post("/letter-requests", {
      letter_type_id: type.letter_type_id,
      applicant_name: String(applicant.applicantName),
      applicant_nik: String(applicant.applicantNik),
      applicant_phone: normalizePhone(applicant.applicantPhone),
      applicant_address: String(applicant.applicantAddress),
      source: LETTER_SOURCE,
      form_data: formData,
    }));
  } catch (error) {
    throw new Error(`Data pengajuan ditolak: ${getLetterRequestError(error, "periksa isian surat dan identitas pemohon.")}`, { cause: error });
  }
  await uploadFiles(created.letter_request_id, letter.files, type.documents ?? []);
  return { title: letter.title, code: created.request_code, request: created };
}

export async function submitSingleLetter(payload) {
  return submitOne(payload);
}

export async function submitLetterBundle(payload) {
  const codes = [];
  for (const letter of payload.letters ?? []) codes.push(await submitOne(letter));
  return { codes };
}
