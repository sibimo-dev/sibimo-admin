import api from './api'

export async function login(credentials) {
  return api.post('/auth/login', {
    login: credentials.email,
    password: credentials.password,
  })
}

export async function register(payload) {
  return api.post('/auth/register', payload)
}

export async function logout() {
  return api.post('/auth/logout')
}