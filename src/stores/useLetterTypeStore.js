import { ref } from 'vue'
import * as letterTypeService from '@/services/letter-type.service'

const rows = ref([])
const signers = ref([])
const loading = ref(false)
const error = ref(null)

function normalizeLetterType(type) {
  const signer = type.signer ?? {}
  return {
    ...type,
    signer_name: signer.name ?? type.signer_name ?? '-',
    signer_position: signer.position ?? type.signer_position ?? '-',
    document_count: type.document_count ?? type.documents_count ?? 0,
    documents: type.documents ?? [],
    fields: type.fields ?? [],
  }
}
function upsertRow(type) {
  const normalized = normalizeLetterType(type)
  const index = rows.value.findIndex(
    (row) => String(row.letter_type_id) === String(normalized.letter_type_id),
  )
  if (index === -1) rows.value.push(normalized)
  else rows.value[index] = normalized
  return normalized
}

async function fetchRows() {
  loading.value = true
  error.value = null
  try {
    rows.value = (await letterTypeService.getLetterTypes()).map(normalizeLetterType)
    return rows.value
  } catch (err) {
    error.value = err
    throw err
  } finally {
    loading.value = false
  }
}

async function fetchById(id) {
  return upsertRow(await letterTypeService.getLetterType(id))
}

async function fetchSigners() {
  signers.value = await letterTypeService.getSigners()
  return signers.value
}

function getById(id) {
  return rows.value.find((row) => String(row.letter_type_id) === String(id)) || null
}

async function addLetterType(payload) {
  return upsertRow(await letterTypeService.createLetterType(payload))
}

async function updateLetterType(id, payload) {
  return upsertRow(await letterTypeService.updateLetterType(id, payload))
}

async function removeLetterType(id) {
  await letterTypeService.deleteLetterType(id)
  rows.value = rows.value.filter(
    (row) => String(row.letter_type_id) !== String(id),
  )
}

const getDocuments = letterTypeService.getDocuments
const createDocument = letterTypeService.createDocument
const updateDocument = letterTypeService.updateDocument
const deleteDocument = letterTypeService.deleteDocument
const getFields = letterTypeService.getFields
const createField = letterTypeService.createField
const updateField = letterTypeService.updateField
const deleteField = letterTypeService.deleteField

export function useLetterTypeStore() {
  return {
    rows,
    signers,
    loading,
    error,
    fetchRows,
    fetchById,
    fetchSigners,
    getById,
    addLetterType,
    updateLetterType,
    removeLetterType,
    getDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    getFields,
    createField,
    updateField,
    deleteField,
  }
}
