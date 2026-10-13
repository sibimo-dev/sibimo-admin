import api from './api'

const unwrap = (request) => request.then((response) => response.data.data)

export const getComplaints = () => unwrap(api.get('/complaints'))
export const getComplaint = (id) => unwrap(api.get(`/complaints/${id}`))
export const updateComplaintStatus = (id, payload) => unwrap(api.post(`/complaints/${id}/status`, payload))
export const getComplaintStatusHistories = (id) => unwrap(api.get(`/complaints/${id}/status-histories`))
export const getComplaintAttachments = (id) => unwrap(api.get(`/complaints/${id}/attachments`))
export const uploadComplaintAttachment = (id, file) => {
  const form = new FormData()
  form.append('file', file)
  return unwrap(api.post(`/complaints/${id}/attachments`, form, { headers: { 'Content-Type': 'multipart/form-data' } }))
}
