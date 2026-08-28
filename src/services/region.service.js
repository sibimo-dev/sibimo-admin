import api from './api'
const unwrap = (request) => request.then((response) => response.data.data)
export const getRegions = () => unwrap(api.get('/regions'))
export const createRegion = (payload) => unwrap(api.post('/regions', payload))
export const updateRegion = (id, payload) => unwrap(api.put(`/regions/${id}`, payload))
export const deleteRegion = (id) => unwrap(api.delete(`/regions/${id}`))
