const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, '')

export function mediaUrl(value) {
  if (!value) return ''
  const source = String(value)

  if (/^https?:\/\//i.test(source)) return source
  if (source.startsWith('/storage/')) return `${apiOrigin}${source}`
  if (source.startsWith('storage/')) return `${apiOrigin}/${source}`

  return `${apiOrigin}/storage/${source.replace(/^\/+/, '')}`
}
