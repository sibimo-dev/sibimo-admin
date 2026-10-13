import api from './api'

const unwrap = (request) => request.then((response) => response.data.data)

export const getLetterRequests = () => unwrap(api.get('/letter-requests'))
export const getLetterRequest = (id) => unwrap(api.get('/letter-requests/' + id))
export const createLetterRequest = (payload) =>
  unwrap(api.post('/letter-requests', payload))
export const updateLetterRequest = (id, payload) =>
  unwrap(api.put('/letter-requests/' + id, payload))
export const deleteLetterRequest = (id) =>
  unwrap(api.delete('/letter-requests/' + id))

export const verifyLetterRequest = (id, payload) =>
  unwrap(api.post('/letter-requests/' + id + '/verify', payload))
export const authorizeLetterRequest = (id, payload) =>
  unwrap(api.post('/letter-requests/' + id + '/authorize', payload))

// PDF dirender backend dari template blade (resources/views/letters) sesuai tipe surat.
// Mendukung pemanggilan lama dengan boolean dan pemanggilan baru dengan object options.
export const getLetterPdf = async (id, options = {}) => {
  const download = typeof options === 'boolean' ? options : Boolean(options?.download)
  const response = await api.get('/letter-requests/' + id + '/pdf', {
    params: { download: download ? 1 : 0 },
    responseType: 'blob',
  })

  return response.data
}

export const downloadLetterPdf = (id) => getLetterPdf(id, { download: true })

export function openPdfBlob(blob) {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function downloadPdfBlob(blob, filename = 'surat.pdf') {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename || 'surat.pdf'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export const getStatusHistories = (id) =>
  unwrap(api.get('/letter-requests/' + id + '/status-histories'))
export const getAttachments = (id) =>
  unwrap(api.get('/letter-requests/' + id + '/attachments'))
export const uploadAttachment = (id, payload) =>
  unwrap(api.post('/letter-requests/' + id + '/attachments', payload))
