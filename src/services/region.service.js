
import api from './api'

const unwrap = (request) => request.then((response) => response.data.data)

export const getRegions = () => unwrap(api.get('/regions'))
export const createRegion = (payload) => unwrap(api.post('/regions', payload))
export const updateRegion = (id, payload) => unwrap(api.put(`/regions/${id}`, payload))
export const deleteRegion = (id) => unwrap(api.delete(`/regions/${id}`))
export const updateRw = (id, payload) => unwrap(api.put(`/rws/${id}`, payload))
export const updateRt = (id, payload) => unwrap(api.put(`/rts/${id}`, payload))

// Mengambil data wilayah beserta hierarki dusun, RW, dan RT
export async function getRegionAreas() {
  const { data } = await api.get('/region-areas')
  return data.data
}
