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

export const getStatusHistories = (id) =>
  unwrap(api.get('/letter-requests/' + id + '/status-histories'))
export const getAttachments = (id) =>
  unwrap(api.get('/letter-requests/' + id + '/attachments'))
export const uploadAttachment = (id, payload) =>
  unwrap(api.post('/letter-requests/' + id + '/attachments', payload))
