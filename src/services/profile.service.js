import api from './api'

const unwrap = (request) => request.then((response) => response.data?.data ?? null)

function unwrapCollection(request) {
  return request.then((response) => {
    const data = response.data?.data
    const rows = (Array.isArray(data) ? data : (data ? [data] : [])).map((row) => {
      const normalized = { ...row }
      for (const field of ['points', 'photos', 'missions', 'levels']) {
        if (typeof normalized[field] !== 'string') continue
        try {
          const parsed = JSON.parse(normalized[field])
          normalized[field] = parsed
        } catch {
          normalized[field] = []
        }
      }
      return normalized
    })
    return rows.sort((a, b) => {
      const aPublished = a?.status === 'Published' ? 1 : 0
      const bPublished = b?.status === 'Published' ? 1 : 0
      return bPublished - aPublished
    })
  })
}

export const getHistories = () => unwrapCollection(api.get('/histories'))
export const getVisionMissions = () => unwrapCollection(api.get('/vision-missions'))
export const getOrganizationalStructures = () => unwrapCollection(api.get('/organizational-structures'))

export function saveHistory({ id, payload, files = [] }) {
  const formData = new FormData()
  formData.append('title', payload.title ?? '')
  formData.append('year_founded', String(payload.year_founded ?? ''))
  formData.append('status', payload.status ?? 'Draft')
  if (payload.published_at) formData.append('published_at', payload.published_at)
  formData.append('points', JSON.stringify(payload.points ?? []))
  formData.append('photos_data', JSON.stringify(payload.photos ?? []))

  files.forEach(({ token, file }) => {
    if (token && file) formData.append(`photos[${token}]`, file)
  })

  if (id) {
    formData.append('_method', 'PUT')
    return unwrap(api.post(`/histories/${id}`, formData))
  }

  return unwrap(api.post('/histories', formData))
}

export function saveVisionMission({ id, payload }) {
  const body = {
    title: payload.title ?? '',
    vision: payload.vision ?? '',
    missions: payload.missions ?? [],
    status: payload.status ?? 'Draft',
    published_at: payload.published_at ?? null,
  }

  return id
    ? unwrap(api.put(`/vision-missions/${id}`, body))
    : unwrap(api.post('/vision-missions', body))
}

export function saveOrganizationalStructure({ id, payload, files = [] }) {
  const formData = new FormData()
  formData.append('title', payload.title ?? '')
  formData.append('status', payload.status ?? 'Draft')
  if (payload.published_at) formData.append('published_at', payload.published_at)
  formData.append('levels', JSON.stringify(payload.levels ?? []))

  files.forEach(({ token, file }) => {
    if (token && file) formData.append(`photos[${token}]`, file)
  })

  if (id) {
    formData.append('_method', 'PUT')
    return unwrap(api.post(`/organizational-structures/${id}`, formData))
  }

  return unwrap(api.post('/organizational-structures', formData))
}
