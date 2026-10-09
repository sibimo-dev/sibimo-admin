import api from './api'

const unwrap = (request) => request.then((response) => response.data.data)

export const getLetterTypes = () => unwrap(api.get('/letter-types'))
export const getLetterType = (id) => unwrap(api.get('/letter-types/' + id))
export const createLetterType = (payload) => unwrap(api.post('/letter-types', payload))
export const updateLetterType = (id, payload) => unwrap(api.put('/letter-types/' + id, payload))
export const deleteLetterType = (id) => unwrap(api.delete('/letter-types/' + id))

export const getSigners = () => unwrap(api.get('/signers'))

export const getDocuments = (letterTypeId) =>
  unwrap(api.get('/letter-types/' + letterTypeId + '/documents'))
export const createDocument = (letterTypeId, payload) =>
  unwrap(api.post('/letter-types/' + letterTypeId + '/documents', payload))
export const updateDocument = (id, payload) =>
  unwrap(api.put('/letter-type-documents/' + id, payload))
export const deleteDocument = (id) =>
  unwrap(api.delete('/letter-type-documents/' + id))

export const getFields = (letterTypeId) =>
  unwrap(api.get('/letter-types/' + letterTypeId + '/fields'))
export const createField = (letterTypeId, payload) =>
  unwrap(api.post('/letter-types/' + letterTypeId + '/fields', payload))
export const updateField = (id, payload) =>
  unwrap(api.put('/letter-type-fields/' + id, payload))
export const deleteField = (id) =>
  unwrap(api.delete('/letter-type-fields/' + id))

