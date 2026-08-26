<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({ login: '', password: '' })
const errors = reactive({ login: '', password: '' })
const loading = ref(false)
const serverError = ref('')

async function handleLogin() {
  errors.login = form.login ? '' : 'Email atau username wajib diisi'
  errors.password = form.password ? '' : 'Password wajib diisi'
  if (errors.login || errors.password) return

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

<<<<<<< Updated upstream
   
=======
    
    <div
      class="absolute inset-0 z-[1]"
      style="background: radial-gradient(120% 90% at 50% 42%, rgba(35,58,115,0.15) 0%, rgba(35,58,115,0.45) 65%, rgba(35,58,115,0.6) 100%)"
    />

    <!-- FORM LOGIN -->
    <div class="relative z-[2] w-full max-w-[460px] px-6">
      <div
        class="w-full rounded-2xl bg-white/97 backdrop-blur-md px-8 pt-9 pb-7 shadow-[0_30px_60px_-18px_rgba(10,25,33,0.55),0_0_0_1px_rgba(255,255,255,0.06)]"
      >
        <h1 class="text-center text-xl font-bold text-[#20302e] tracking-tight mb-1.5">
          Masuk ke SIBIMO Admin
        </h1>
        <p class="text-center text-sm text-[#6d7877] mb-6 leading-relaxed">
          Kalurahan Bimomartani, Kapanewon Ngemplak, Sleman
        </p>

        <form class="flex flex-col gap-4" @submit.prevent="handleLogin">
          <AppInput v-model="form.login" label="Email atau Username" :error="errors.login" required />
          <AppInput
            v-model="form.password"
            type="password"
            label="Password"
            :error="errors.password"
            required
          />

          <p v-if="serverError" class="text-sm text-[#b85c5c]">{{ serverError }}</p>

          <AppButton label="Masuk" variant="primary" type="submit" :loading="loading" class="w-full" />
        </form>

        <div class="mt-6 pt-4 border-t border-[#e1e5e4] text-[11.5px] text-[#6d7877] text-center leading-relaxed">
          Butuh bantuan akses? Hubungi Super Admin Kalurahan.<br />
          <b class="text-[#404e4c]">© 2026 Kalurahan Bimomartani</b>
        </div>
      </div>
    </div>

    <!-- Bottom caption -->
    <div class="absolute bottom-0 left-0 right-0 z-[2] text-center px-5 pb-6 sm:pb-7 text-white/72 text-xs">
      Melayani warga dengan lebih dekat &amp; transparan
    </div>
>>>>>>> Stashed changes
  </div>
</template>
