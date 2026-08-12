import api from './api'

/**
 * Contoh pola service module. Tiap modul bikin file serupa, misal
 * surat.service.js, berita.service.js -- masing-masing cuma
 * berisi fungsi-fungsi yang manggil `api` dari file api.js.
 * JANGAN panggil axios langsung di dalam komponen .vue.
 */
export function login(credentials) {
  return api.post('/auth/login', credentials)
}

export function register(payload) {
  return api.post('/auth/register', payload)
}

export function logout() {
  return api.post('/auth/logout')
}
