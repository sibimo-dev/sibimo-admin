const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, '')

export function mediaUrl(value) {
  if (!value) return ''
  const source = String(value).trim()
  if (!source) return ''

  if (source.startsWith('data:') || source.startsWith('blob:')) {
    return source
  }

  if (/^https?:\/\//i.test(source)) {
    try {
      const url = new URL(source)
      if (['localhost', '127.0.0.1'].includes(url.hostname) && url.pathname.startsWith('/storage/')) {
        return `${apiOrigin}${url.pathname}${url.search}`
      }
    } catch {
      // URL tidak valid, kembalikan apa adanya
    }
    return source
  }

  if (source.startsWith('/storage/')) return `${apiOrigin}${source}`
  if (source.startsWith('storage/')) return `${apiOrigin}/${source}`

  return `${apiOrigin}/storage/${source.replace(/^\/+/, '')}`
}
