import api from './api'

export async function getCitizens() {
  const response = await api.get('/citizens')
  return response.data.data
}

export async function getCitizen(id) {
  const response = await api.get(`/citizens/${id}`)
  return response.data.data
}

export async function createCitizen(payload) {
  const response = await api.post('/citizens', payload)
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
