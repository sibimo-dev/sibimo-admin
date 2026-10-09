<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as authService from '@/services/auth.service'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const form = reactive({ nama: '', email: '', password: '' })
const errors = reactive({ nama: '', email: '', password: '' })
const loading = ref(false)
const serverError = ref('')

async function handleRegister() {
  errors.nama = form.nama ? '' : 'Nama wajib diisi'
  errors.email = form.email ? '' : 'Email wajib diisi'
  errors.password = form.password ? '' : 'Password wajib diisi'
  if (errors.nama || errors.email || errors.password) return

  loading.value = true
  serverError.value = ''
  try {
    await authService.register(form)
    router.push('/login')
  } catch (err) {
    serverError.value = err.response?.data?.message || 'Registrasi gagal.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="card">
    <h1 class="page-title text-center">Daftar Akun Admin</h1>
    <p class="page-subtitle text-center">SIBIMO - Kalurahan Bimomartani</p>

    <form class="flex flex-col gap-4" @submit.prevent="handleRegister">
      <AppInput v-model="form.nama" label="Nama Lengkap" :error="errors.nama" required />
      <AppInput v-model="form.email" type="email" label="Email" :error="errors.email" required />
      <AppInput
        v-model="form.password"
        type="password"
        label="Password"
        :error="errors.password"
        required
      />

      <p v-if="serverError" class="text-sm text-danger-500">{{ serverError }}</p>

      <AppButton label="Daftar" variant="primary" type="submit" :loading="loading" class="w-full" />
    </form>

    <p class="text-center text-sm text-neutral-500 mt-4">
      Sudah punya akun?
      <router-link to="/login" class="text-primary-600 font-medium">Masuk</router-link>
    </p>
  </div>
</template>
