import api from './api'

const unwrap = (request) => request.then((response) => response.data.data)
const multipart = { headers: { 'Content-Type': 'multipart/form-data' } }

const buildFormData = (payload) => {
  const data = new FormData()
  const append = (key, value) => data.append(key, value ?? '')

  append('name', payload.name)
  append('address', payload.address)
  append('category', payload.category)
  append('status', payload.status)
  append('funding_source', payload.funding_source)
  append('budget', payload.budget)
  append('volume', payload.volume)
  append('volume_unit', payload.volume_unit)
  append('executor', payload.executor)
  append('year', payload.year)
  append('start_date', payload.start_date)
  append('target_date', payload.target_date)
  append('description', payload.description)
  append('latitude', payload.latitude)
  append('longitude', payload.longitude)
  append('end_latitude', payload.end_latitude)
  append('end_longitude', payload.end_longitude)

  if (payload.cover_image_file) data.append('cover_image', payload.cover_image_file)

  // Progress photos: existing items keep their progress_id, new ones carry a file.
  ;(payload.progress ?? []).forEach((item, index) => {
    if (item.id) data.append(`progress[${index}][progress_id]`, item.id)
    data.append(`progress[${index}][percentage]`, item.percentage ?? 0)
    if (item.image_file instanceof File) {
      data.append(`progress_photos[${item.percentage}]`, item.image_file)
    }
  })
  
  return data
}

export const getDevelopments = () => unwrap(api.get('/developments'))
export const getDevelopment = (id) => unwrap(api.get(`/developments/${id}`))
export const createDevelopment = (payload) =>
  unwrap(api.post('/developments', buildFormData(payload), multipart))
export const updateDevelopment = (id, payload) => {
  const data = buildFormData(payload)
  data.append('_method', 'PUT')
  return unwrap(api.post(`/developments/${id}`, data, multipart))
}
export const deleteDevelopment = (id) => unwrap(api.delete(`/developments/${id}`))