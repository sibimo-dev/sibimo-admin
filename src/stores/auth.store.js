import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authService from '@/services/auth.service'

/**
 * auth.store - satu-satunya sumber kebenaran soal status login.
 * Dipakai oleh: router guard (index.js), Navbar.vue, dan halaman
 * Login/Register. Modul lain (surat, berita, dst) cukup baca
 * `authStore.user` kalau perlu, tidak perlu bikin store login sendiri.
 */
export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('sibimo_token') || null)

  const storedUser = localStorage.getItem('sibimo_user')
  
  const user = ref(
    storedUser && storedUser !== 'undefined'
      ? JSON.parse(storedUser)
      : null
  )

  const isAuthenticated = computed(() => !!token.value)
  
  async function login(credentials) {
    const { data } = await authService.login(credentials)
  
    token.value = data.data.token
    user.value = data.data.user
  
    localStorage.setItem('sibimo_token', data.data.token)
    localStorage.setItem('sibimo_user', JSON.stringify(data.data.user))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('sibimo_token')
    localStorage.removeItem('sibimo_user')
  }

  return { token, user, isAuthenticated, login, logout }
})
