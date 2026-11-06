import api from './api'

// Import dapat memproses sampai 1.000 baris per berkas. Timeout ini hanya
// dipakai oleh request import, bukan seluruh request API aplikasi.
export const CITIZEN_IMPORT_TIMEOUT = 5 * 60 * 1000

export async function getCitizens(params = {}, config = {}) {
  const response = await api.get('/citizens', { params, ...config })
  return response.data
}

export async function getCitizenNationalIds(config = {}) {
  const response = await api.get('/citizens/national-ids', config)
  return response.data.data
}

export async function getCitizen(id) {
  const response = await api.get(`/citizens/${id}`)
  return response.data.data
}

export async function getCitizenByNik(nik) {
  const response = await api.get(`/citizens/by-nik/${nik}`)
  return response.data.data
}

export async function getRecordEventCounters(year) {
  const response = await api.get('/citizens/record-event-counters', { params: year ? { year } : undefined })
  return response.data.data
}

export async function refreshCitizenAges() {
  const response = await api.post('/citizens/refresh-ages')
  return response.data
}

export async function validateCitizenImport(file, config = {}) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/citizens/import/validate', formData, {
    timeout: CITIZEN_IMPORT_TIMEOUT,
    ...config,
  })
  return response.data
}

export async function updateCitizenRelations(relations, config = {}) {
  const response = await api.post('/citizens/import/relations', { relations }, {
    timeout: CITIZEN_IMPORT_TIMEOUT,
    ...config,
  })
  return response.data
}

export async function createCitizen(payload, config = {}) {
  const response = await api.post('/citizens', payload, config)
  return response.data.data
}

export async function updateCitizen(id, payload) {
  const response = await api.put(`/citizens/${id}`, payload)
  return response.data.data
}

export async function deleteCitizen(id) {
  const response = await api.delete(`/citizens/${id}`)
  return response.data.data
}

export async function getCitizenDocuments(citizenId, params = {}) {
  const response = await api.get(`/citizens/${citizenId}/documents`, { params })
  return response.data.data
}

export async function uploadCitizenDocument(citizenId, formData) {
  const response = await api.post(`/citizens/${citizenId}/documents`, formData)
  return response.data.data
}

export async function updateCitizenDocument(citizenId, documentId, formData) {
  const response = await api.post(`/citizens/${citizenId}/documents/${documentId}`, formData)
  return response.data.data
}

export async function deleteCitizenDocument(citizenId, documentId) {
  const response = await api.delete(`/citizens/${citizenId}/documents/${documentId}`)
  return response.data.data
}

export async function downloadCitizenDocument(citizenId, documentId) {
  const response = await api.get(`/citizens/${citizenId}/documents/${documentId}/download`, {
    responseType: 'blob',
  })
  return response.data
}
