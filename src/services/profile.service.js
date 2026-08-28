import api from './api'
const unwrap = (request) => request.then((response) => response.data.data)
export const getProfileSections = () => unwrap(api.get('/profile-sections'))
export const getProfileContents = () => unwrap(api.get('/profile-contents'))
export const getProfileContent = (id) => unwrap(api.get(`/profile-contents/${id}`))
export const createProfileContent = (payload) => unwrap(api.post('/profile-contents', payload))
export const updateProfileContent = (id, payload) => unwrap(api.put(`/profile-contents/${id}`, payload))
