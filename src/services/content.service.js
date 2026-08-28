import api from './api'

const unwrap = (request) => request.then((response) => response.data.data)
const crud = (path) => ({
  list: () => unwrap(api.get(path)),
  get: (id) => unwrap(api.get(`${path}/${id}`)),
  create: (payload) => unwrap(api.post(path, payload)),
  update: (id, payload) => unwrap(api.put(`${path}/${id}`, payload)),
  remove: (id) => unwrap(api.delete(`${path}/${id}`)),
})
const newsFormData = (payload) => {
  const data = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') data.append(key, value)
  })
  return data
}
const potentialFormData = (payload) => {
  const data = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') data.append(key, value)
  })
  return data
}
export const newsService = {
  list: () => unwrap(api.get('/news')),
  get: (id) => unwrap(api.get(`/news/${id}`)),
  create: (payload) => unwrap(api.post('/news', newsFormData(payload), { headers: { 'Content-Type': 'multipart/form-data' } })),
  update: (id, payload) => {
    if (!payload.thumbnail) return unwrap(api.put(`/news/${id}`, { ...payload, thumbnail: undefined }))
    const data = newsFormData(payload)
    data.append('_method', 'PUT')
    return unwrap(api.post(`/news/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }))
  },
  remove: (id) => unwrap(api.delete(`/news/${id}`)),
}
export const newsCategoryService = { list: () => unwrap(api.get('/news-categories')) }
export const agendaService = crud('/agendas')
export const potentialService = {
  list: () => unwrap(api.get('/village-potentials')),
  get: (id) => unwrap(api.get(`/village-potentials/${id}`)),
  create: (payload) => unwrap(api.post('/village-potentials', potentialFormData(payload), { headers: { 'Content-Type': 'multipart/form-data' } })),
  update: (id, payload) => {
    const data = potentialFormData(payload)
    data.append('_method', 'PUT')
    return unwrap(api.post(`/village-potentials/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }))
  },
  remove: (id) => unwrap(api.delete(`/village-potentials/${id}`)),
}
export const serviceService = crud('/services')
export const feedbackService = crud('/feedbacks')
