import { ref } from 'vue'
import * as letterRequestService from '@/services/letter-request.service'

const rows = ref([])
const loading = ref(false)
const error = ref(null)

const statusLabels = {
  submitted: 'Pending',
  verified: 'Diverifikasi',
  authorized: 'Disetujui',
  completed: 'Selesai',
  rejected: 'Ditolak',
}
const statusValues = Object.fromEntries(
  Object.entries(statusLabels).map(([value, label]) => [label, value]),
)

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID')
}

function normalizeRequest(item) {
  const type = item.letter_type ?? {}
  const signer = type.signer ?? {}
  const verifier = item.verifier ?? {}
  const authorizedSigner = item.authorized_signer ?? {}

  return {
    ...item,
    id: item.letter_request_id,
    requestId: item.request_code,
    citizenName: item.applicant_name,
    citizenId: item.applicant_nik,
    citizenPhone: item.applicant_phone ?? '',
    citizenAddress: item.applicant_address ?? '',
    purpose: type.letter_name ?? '-',
    category: type.category ?? '-',
    letterTypeId: item.letter_type_id,
    letterNumber: item.letter_number ?? '',
    signatureType: item.signature_type === 'digital' ? 'Digital' : 'Manual',
    status: statusLabels[item.status] ?? item.status,
    backendStatus: item.status,
    verifiedBy: verifier.full_name ?? '-',
    authorizedBy: authorizedSigner.name ?? '-',
    signerName: signer.name ?? '-',
    source: item.source ?? '-',
    notes: item.notes ?? '',
    formData: item.form_data ?? {},
    attachments: item.attachments ?? [],
    statusHistories: item.status_histories ?? [],
    date: formatDate(item.submitted_at),
    dateValue: item.submitted_at,
  }
}

function upsertRow(item) {
  const normalized = normalizeRequest(item)
  const index = rows.value.findIndex(
    (row) => String(row.id) === String(normalized.id),
  )
  if (index === -1) rows.value.push(normalized)
  else rows.value[index] = normalized
  return normalized
}

async function fetchRows() {
  loading.value = true
  error.value = null
  try {
    rows.value = (await letterRequestService.getLetterRequests()).map(normalizeRequest)
    return rows.value
  } catch (err) {
    error.value = err
    throw err
  } finally {
    loading.value = false
  }
}

async function fetchById(id) {
  return upsertRow(await letterRequestService.getLetterRequest(id))
}

async function addSurat(payload) {
  return upsertRow(await letterRequestService.createLetterRequest(payload))
}

async function updateSurat(id, payload) {
  return upsertRow(await letterRequestService.updateLetterRequest(id, payload))
}

async function removeSurat(id) {
  await letterRequestService.deleteLetterRequest(id)
  rows.value = rows.value.filter((row) => String(row.id) !== String(id))
}

function getByRequestId(requestId) {
  return rows.value.find((row) => row.requestId === requestId) || null
}

function getSuratById(id) {
  return rows.value.find((row) => String(row.id) === String(id)) || null
}

async function verifySurat(id, status, notes) {
  return upsertRow(await letterRequestService.verifyLetterRequest(id, {
    status,
    notes,
  }))
}

async function authorizeSurat(id, payload) {
  return upsertRow(await letterRequestService.authorizeLetterRequest(id, payload))
}

async function updateStatus(requestId, payload) {
  const row = getByRequestId(requestId)
  if (!row) return null
  const backendStatus = statusValues[payload.status] ?? payload.status
  if (backendStatus === 'verified' || backendStatus === 'rejected') {
    return verifySurat(row.id, backendStatus, payload.notes)
  }
  return row
}

const getStatusHistories = letterRequestService.getStatusHistories
const getAttachments = letterRequestService.getAttachments
const uploadAttachment = letterRequestService.uploadAttachment

export function useLetterStore() {
  return {
    rows,
    loading,
    error,
    fetchRows,
    fetchById,
    addSurat,
    updateSurat,
    removeSurat,
    getByRequestId,
    getSuratById,
    updateStatus,
    verifySurat,
    authorizeSurat,
    getStatusHistories,
    getAttachments,
    uploadAttachment,
  }
}
