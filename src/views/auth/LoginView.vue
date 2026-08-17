<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({ email: '', password: '' })
const errors = reactive({ email: '', password: '' })
const loading = ref(false)
const serverError = ref('')

async function handleLogin() {
  errors.email = form.email ? '' : 'Email wajib diisi'
  errors.password = form.password ? '' : 'Password wajib diisi'
  if (errors.email || errors.password) return

  loading.value = true
  serverError.value = ''
  try {
    await authStore.login(form)
    router.push('/dashboard')
  } catch (err) {
    serverError.value = err.response?.data?.message || 'Login gagal, cek email/password.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="card">
    <h1 class="page-title text-center">Masuk ke SIBIMO Admin</h1>
    <p class="page-subtitle text-center">Kalurahan Bimomartani</p>

    <form class="flex flex-col gap-4" @submit.prevent="handleLogin">
      <AppInput v-model="form.email" type="email" label="Email" :error="errors.email" required />
      <AppInput
        v-model="form.password"
        type="password"
        label="Password"
        :error="errors.password"
        required
      />

      <p v-if="serverError" class="text-sm text-danger-500">{{ serverError }}</p>

      <AppButton label="Masuk" variant="primary" type="submit" :loading="loading" class="w-full" />
    </form>

   
  </div>
</template>
