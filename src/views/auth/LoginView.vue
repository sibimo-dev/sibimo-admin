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
  <div class="fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
    
    <svg
      class="absolute inset-0 w-full h-full z-0"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#233A73" />
          <stop offset="55%" stop-color="#1179C6" />
          <stop offset="100%" stop-color="#3fb6d3" />
        </linearGradient>

        
        <pattern id="dots" width="64" height="64" patternUnits="userSpaceOnUse">
          <circle cx="8" cy="8" r="3" fill="#ffffff" fill-opacity="0.10" />
          <circle cx="40" cy="32" r="5" fill="#ffffff" fill-opacity="0.07" />
          <circle cx="20" cy="52" r="2.5" fill="#ffffff" fill-opacity="0.12" />
        </pattern>
      </defs>

      <rect x="0" y="0" width="1600" height="900" fill="url(#sky)" />
      <rect x="0" y="0" width="1600" height="900" fill="url(#dots)" />

      <!-- Beberapa lingkaran besar samar sebagai aksen, boleh dihapus kalau terlalu ramai -->
      <circle cx="200" cy="150" r="220" fill="#ffffff" fill-opacity="0.04" />
      <circle cx="1420" cy="720" r="280" fill="#ffffff" fill-opacity="0.05" />
      <circle cx="1300" cy="120" r="120" fill="#ffffff" fill-opacity="0.06" />
      <circle cx="120" cy="760" r="150" fill="#ffffff" fill-opacity="0.05" />
    </svg>

    
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
          <AppInput v-model="form.email" type="email" label="Email" :error="errors.email" required />
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
  </div>
</template>