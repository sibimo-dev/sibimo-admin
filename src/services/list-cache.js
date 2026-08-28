// Cache in-memory ringan untuk mempertahankan baris tabel saat berpindah
// halaman. Request API tetap dijalankan di background agar database tetap
// menjadi sumber data terbaru.
const cache = new Map()

export function getDataCache(key) {
  return cache.get(key) ?? null
}

export function setDataCache(key, value) {
  cache.set(key, value)
}

export function getListCache(key) {
  const value = getDataCache(key)
  return Array.isArray(value) ? value : null
}

export function setListCache(key, value) {
  cache.set(key, Array.isArray(value) ? value : [])
}

export function updateListCache(key, updater) {
  const current = getListCache(key) ?? []
  setListCache(key, updater(current))
}
