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
  const user = ref(JSON.parse(localStorage.getItem('sibimo_user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)

  async function login(credentials) {
    const { data } = await authService.login(credentials)
    token.value = data.token
    user.value = data.user
    localStorage.setItem('sibimo_token', data.token)
    localStorage.setItem('sibimo_user', JSON.stringify(data.user))
  }

  async function fetchCurrentUser() {
    if (!token.value) return null

    try {
      const { data } = await authService.getCurrentUser()
      user.value = data.data.user
      localStorage.setItem('sibimo_user', JSON.stringify(user.value))
      return user.value
    } catch (error) {
      logout()
      throw error
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('sibimo_token')
    localStorage.removeItem('sibimo_user')
  }

  return { token, user, isAuthenticated, login, fetchCurrentUser, logout }
})
