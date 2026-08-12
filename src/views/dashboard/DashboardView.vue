<script setup>
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()

// Data dummy -- ganti dengan data asli dari API begitu backend siap
const summary = [
  { label: 'Surat Diajukan Bulan Ini', value: 128, icon: 'pi pi-file', color: 'text-primary-600', bg: 'bg-primary-50' },
  { label: 'Menunggu Verifikasi', value: 14, icon: 'pi pi-clock', color: 'text-warning-600', bg: 'bg-warning-50' },
  { label: 'Aduan Belum Ditanggapi', value: 5, icon: 'pi pi-comments', color: 'text-danger-600', bg: 'bg-danger-50' },
  { label: 'Total Warga Terdaftar', value: 3420, icon: 'pi pi-users', color: 'text-secondary-600', bg: 'bg-secondary-50' },
]
</script>

<template>
  <div>
    <h1 class="page-title">Selamat datang, {{ authStore.user?.nama || 'Admin' }} 👋</h1>
    <p class="page-subtitle">Ringkasan aktivitas SIBIMO hari ini</p>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="item in summary" :key="item.label" class="card">
        <div
          class="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
          :class="item.bg"
        >
          <i :class="[item.icon, item.color]" class="text-lg" />
        </div>
        <p class="text-2xl font-bold text-neutral-900">{{ item.value }}</p>
        <p class="text-sm text-neutral-500">{{ item.label }}</p>
      </div>
    </div>
  </div>
</template>
