<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Menu from 'primevue/menu'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()
const menuRef = ref()

const displayName = computed(() => (
  authStore.user?.full_name
  || authStore.user?.username
  || authStore.user?.email
  || 'Admin Desa'
))
const displayInitial = computed(() => displayName.value.trim().charAt(0).toUpperCase())

const menuItems = [
  {
    label: 'Keluar',
    icon: 'pi pi-sign-out',
    command: () => {
      authStore.logout()
      router.push('/login')
    },
  },
]

function toggleMenu(event) {
  menuRef.value.toggle(event)
}
</script>

<template>
  <header
    class="h-16 bg-white border-b border-neutral-100 flex items-center justify-between px-4 md:px-6 gap-3"
  >
    <div class="flex items-center gap-3 min-w-0">
      <Button
        icon="pi pi-bars"
        text
        rounded
        severity="secondary"
        class="md:hidden! shrink-0"
        aria-label="Buka menu"
        @click="uiStore.toggleMobileSidebar()"
      />

      <span class="w-px h-6 bg-neutral-100 hidden md:inline" />

      <div class="min-w-0">
        <p class="m-0 text-sm font-semibold text-neutral-900 truncate">
          SIBIMO Admin
        </p>
        <p class="m-0 text-xs text-neutral-500 truncate hidden sm:block">
          Kalurahan Bimomartani
        </p>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <span class="w-px h-6 bg-neutral-100" />

      <button
        class="flex items-center gap-2 text-sm text-neutral-700 hover:bg-neutral-50 px-2 py-1.5 rounded-lg transition-colors"
        @click="toggleMenu"
      >
        <div
          class="w-7 h-7 rounded-full flex items-center justify-center bg-primary-600 text-white text-xs font-semibold shrink-0"
        >
          {{ displayInitial }}
        </div>
        <span class="font-medium text-neutral-900 hidden sm:inline">{{
          displayName
        }}</span>
        <i class="pi pi-chevron-down text-xs text-neutral-400" />
      </button>
      <Menu ref="menuRef" :model="menuItems" :popup="true" />
    </div>
  </header>
</template>