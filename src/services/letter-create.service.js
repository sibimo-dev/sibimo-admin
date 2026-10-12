import api from "./api";
import { getBackendLetterCode } from "@/data/letterBackendMap";

export const LETTER_SOURCE = "Manual (Kelurahan)";

let letterTypesPromise;
const unwrap = (request) => request.then((response) => response.data.data);
const normalize = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

function cleanValue(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.map(cleanValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cleanValue(item)]));
  return value;
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
    await api.post(`/letter-requests/${requestId}/attachments`, formData);
  }
}

async function submitOne(letter) {
  const type = await resolveLetterType(letter);
  const fields = cleanValue(letter.fields ?? {});
  const applicant = applicantFrom(fields);
  const allowedKeys = new Set((type.fields ?? []).map((field) => field.field_key));
  const formData = Object.fromEntries(Object.entries(fields).filter(([key]) => allowedKeys.has(key)));
  const created = await unwrap(api.post("/letter-requests", {
    letter_type_id: type.letter_type_id,
    applicant_name: String(applicant.applicantName),
    applicant_nik: String(applicant.applicantNik),
    applicant_phone: applicant.applicantPhone ? String(applicant.applicantPhone) : null,
    applicant_address: String(applicant.applicantAddress),
    source: LETTER_SOURCE,
    form_data: formData,
  }));
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
