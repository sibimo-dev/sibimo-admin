import api from './api'

const unwrap = (request) => request.then((response) => response.data.data)
const formData = (payload) => { const data = new FormData(); data.append('title', payload.title); data.append('description', payload.description ?? ''); if (payload.image_file) data.append('image', payload.image_file); return data }
export const getGalleries = () => unwrap(api.get('/galleries'))
export const getGallery = (id) => unwrap(api.get(`/galleries/${id}`))
export const createGallery = (payload) => unwrap(api.post('/galleries', formData(payload), { headers: { 'Content-Type': 'multipart/form-data' } }))
export const updateGallery = (id, payload) => { const data = formData(payload); data.append('_method', 'PUT'); return unwrap(api.post(`/galleries/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })) }
export const deleteGallery = (id) => unwrap(api.delete(`/galleries/${id}`))
