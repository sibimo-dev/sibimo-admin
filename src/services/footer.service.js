import api from './api'

const unwrap = (request) => request.then((response) => response.data?.data ?? null)

export const getFooterSettings = () => unwrap(api.get('/footer-settings'))

export function saveFooterSettings({ id, payload, logo = null, stamp = null }) {
  const formData = new FormData()
  formData.append('village_name', payload.village_name ?? '')
  formData.append('description', payload.description ?? '')
  formData.append('address', payload.address ?? '')
  formData.append('phone', payload.phone ?? '')
  formData.append('email', payload.email ?? '')
  formData.append('social_media', JSON.stringify(payload.social_media ?? []))

  if (logo) formData.append('logo', logo)
  if (stamp) formData.append('stamp', stamp)

  if (id) {
    formData.append('_method', 'PUT')
    return unwrap(api.post(`/footer-settings/${id}`, formData))
  }

  return unwrap(api.post('/footer-settings', formData))
}
