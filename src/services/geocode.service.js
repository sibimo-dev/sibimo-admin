// Address -> coordinates lookup using OpenStreetMap Nominatim (the same data as the map tiles).
// Usage policy: max 1 request per second and no search-as-you-type, so call this only
// on blur / Enter / button click, never on every keystroke.

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

// Added to every query so short addresses resolve inside the kalurahan
const AREA_CONTEXT = 'Bimomartani, Ngemplak, Sleman, Daerah Istimewa Yogyakarta'

// Only accept results inside this box (Sleman, Yogyakarta city, and nearby Bantul)
// so an address never jumps to a same-named street in another city.
const VIEWBOX = { left: 110.25, top: -7.55, right: 110.6, bottom: -7.9 }

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Nominatim does not understand RT/RW, so drop them and tidy the commas
function cleanAddress(address) {
  return address
    .replace(/\bRT\.?\s*\d+\s*(\/\s*RW\.?\s*\d+)?/gi, '')
    .replace(/\bRW\.?\s*\d+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*,(\s*,)+/g, ',')
    .replace(/^[\s,]+|[\s,]+$/g, '')
}

async function search(query) {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'id',
    'accept-language': 'id',
    viewbox: `${VIEWBOX.left},${VIEWBOX.top},${VIEWBOX.right},${VIEWBOX.bottom}`,
    bounded: '1',
  })

  const response = await fetch(`${NOMINATIM_URL}?${params}`)
  if (!response.ok) throw new Error(`Geocoding failed with status ${response.status}`)

  const results = await response.json()
  const first = Array.isArray(results) ? results[0] : null
  if (!first) return null

  return { lat: Number(first.lat), lng: Number(first.lon) }
}

/**
 * @param {string} address Free-text address typed by the admin
 * @returns {Promise<{ lat: number, lng: number } | null>} null when nothing was found
 */
export async function geocodeAddress(address) {
  const cleaned = cleanAddress(String(address ?? '').trim())
  if (!cleaned) return null

  const firstSegment = cleaned.split(',')[0].trim()
  const attempts = [`${cleaned}, ${AREA_CONTEXT}`]
  if (firstSegment && firstSegment !== cleaned) attempts.push(`${firstSegment}, ${AREA_CONTEXT}`)

  for (let index = 0; index < attempts.length; index += 1) {
    if (index > 0) await wait(1100) // respect the 1 request/second limit
    const point = await search(attempts[index])
    if (point) return point
  }

  return null
}