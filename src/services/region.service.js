
import api from './api'

const unwrap = (request) => request.then((response) => response.data.data)

// Padukuhan (Region)
export const getRegions = () => unwrap(api.get('/regions'))
export const createRegion = (payload) => unwrap(api.post('/regions', payload))
export const updateRegion = (id, payload) => unwrap(api.put(`/regions/${id}`, payload))
export const deleteRegion = (id) => unwrap(api.delete(`/regions/${id}`))

// Mengambil pohon hierarki wilayah: Padukuhan → RW → RT (lengkap dengan kepala dusun/RW/RT)
export async function getRegionAreas() {
  const { data } = await api.get('/region-areas')
  return data.data
}

// RW
export const createRw = (payload) => unwrap(api.post('/rws', payload))
export const updateRw = (id, payload) => unwrap(api.put(`/rws/${id}`, payload))
export const deleteRw = (id) => unwrap(api.delete(`/rws/${id}`))

// RT
export const createRt = (payload) => unwrap(api.post('/rts', payload))
export const updateRt = (id, payload) => unwrap(api.put(`/rts/${id}`, payload))
export const deleteRt = (id) => unwrap(api.delete(`/rts/${id}`))
