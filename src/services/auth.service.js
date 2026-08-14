/**
 * auth.service - MODE PROTOTYPE (dummy, tanpa backend Laravel).
 *
 * Login/register di bawah ini SENGAJA tidak memanggil API asli --
 * cukup untuk demo/prototype supaya bisa login tanpa backend nyala.
 * Data user & token tetap disimpan ke localStorage lewat auth.store.js,
 * jadi status login tetap "nyantol" walau halaman di-refresh.
 *
 * Kredensial dummy untuk login:
 *   email    : admin@sibimo.id
 *   password : admin123
 *
 * CATATAN UNTUK NANTI (kalau backend sudah siap):
 * Ganti isi fungsi login/register/logout di bawah ini dengan pemanggilan
 * `api` asli (lihat komentar "GANTI KE API ASLI" di tiap fungsi). Struktur
 * return value (`{ data: { token, user } }`) SUDAH disamakan dengan bentuk
 * response axios asli, jadi auth.store.js dan LoginView.vue TIDAK perlu
 * diubah sama sekali saat nanti pindah ke API asli.
 */
// import api from './api' // <- aktifkan lagi saat sudah pindah ke API asli

const DUMMY_ACCOUNT = {
  email: 'superadmin@sibimo.id',
  password: 'spadmin123',
  user: {
    id: 1,
    nama: 'Super Admin',
    email: 'superadmin@sibimo.id',
    role: 'super-admin',
  },
}

// Delay palsu, biar UI loading state (spinner tombol) kelihatan jalan
// seperti manggil API beneran, bukan langsung instan.
function fakeDelay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function login(credentials) {
  // GANTI KE API ASLI: return api.post('/auth/login', credentials)
  await fakeDelay()

  if (
    credentials.email === DUMMY_ACCOUNT.email &&
    credentials.password === DUMMY_ACCOUNT.password
  ) {
    return {
      data: {
        token: 'dummy-token-' + Date.now(),
        user: DUMMY_ACCOUNT.user,
      },
    }
  }

  // Dilempar dalam bentuk mirip error axios, supaya LoginView.vue
  // (yang baca err.response?.data?.message) tidak perlu diubah.
  throw {
    response: {
      data: { message: 'Email atau password salah. Gunakan admin@sibimo.id / admin123.' },
    },
  }
}

export async function register(payload) {
  // GANTI KE API ASLI: return api.post('/auth/register', payload)
  await fakeDelay()
  return {
    data: {
      message: 'Registrasi dummy berhasil (belum tersambung ke backend).',
      user: { ...payload, id: Date.now() },
    },
  }
}

export async function logout() {
  // GANTI KE API ASLI: return api.post('/auth/logout')
  await fakeDelay(150)
  return { data: { message: 'Logout dummy berhasil.' } }
}
