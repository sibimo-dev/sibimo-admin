import api from './api'

export async function login(credentials) {
  return api.post('/auth/login', {
    login: credentials.login,
    password: credentials.password,
  })
}

export async function getCurrentUser() {
  return api.get('/auth/me')
}

export async function logout() {
  return api.post('/auth/logout')
}
