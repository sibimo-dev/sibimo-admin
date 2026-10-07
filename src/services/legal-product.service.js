import api from './api'

const unwrap = (request) => request.then((response) => response.data.data)
const multipart = { headers: { 'Content-Type': 'multipart/form-data' } }

const buildFormData = (payload) => {
  const data = new FormData()
  data.append('title', payload.title)
  data.append('category', payload.category ?? '')
  data.append('status', payload.status ?? '')
  data.append('number', payload.number ?? '')
  data.append('year', payload.year ?? '')
  data.append('description', payload.description ?? '')
  if (payload.document_file) data.append('document', payload.document_file)
  return data
}

export const getLegalProducts = () => unwrap(api.get('/legal-products'))
export const getLegalProduct = (id) => unwrap(api.get(`/legal-products/${id}`))
export const createLegalProduct = (payload) =>
  unwrap(api.post('/legal-products', buildFormData(payload), multipart))
export const updateLegalProduct = (id, payload) => {
  const data = buildFormData(payload)
  data.append('_method', 'PUT')
  return unwrap(api.post(`/legal-products/${id}`, data, multipart))
}
export const deleteLegalProduct = (id) => unwrap(api.delete(`/legal-products/${id}`))