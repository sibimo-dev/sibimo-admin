import axios from 'axios'

/**
 * Instance Axios utama. SEMUA service module (surat.service.js,
 * berita.service.js, dst) WAJIB import dari sini, jangan bikin
 * `axios.create()` baru sendiri-sendiri -- supaya base URL dan
 * auth header seragam di seluruh aplikasi.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    Accept: 'application/json',
  },
})

// Sisipkan token otomatis di setiap request kalau sudah login
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sibimo_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Kalau token expired/invalid (401), lempar balik ke halaman login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sibimo_token')
      localStorage.removeItem('sibimo_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
