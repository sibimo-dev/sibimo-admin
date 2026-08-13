<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Menu from 'primevue/menu'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import Breadcrumb from './Breadcrumb.vue'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()
const menuRef = ref()

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
      <!-- Hanya tampil di layar kecil, buka Sidebar sebagai Drawer -->
       <Button
       icon="pi pi-bars"
       text
       rounded
       class="md:hidden !text-primary-600 hover:!bg-primary-50 hover:!text-primary-700"
       aria-label="Buka menu"
       @click="uiStore.toggleMobileSidebar()"/>
      <Breadcrumb class="min-w-0" 
      />
    </div>

    <div class="flex items-center gap-3">
      <Button
      icon="pi pi-bell"
      text
      rounded
      class="!text-primary-600 hover:!bg-primary-50 hover:!text-primary-700"
      aria-label="Notifikasi"
      />

      <span class="w-px h-6 bg-neutral-100" />

      <button
        class="flex items-center gap-2 text-sm text-neutral-700 hover:bg-neutral-50 px-2 py-1.5 rounded-lg transition-colors"
        @click="toggleMenu"
      >
        <div
          class="w-7 h-7 rounded-full flex items-center justify-center bg-primary-600 text-white text-xs font-semibold shrink-0"
        >
          {{ (authStore.user?.nama || 'Admin').charAt(0).toUpperCase() }}
        </div>
        <span class="font-medium text-neutral-900">{{
          authStore.user?.nama || 'Admin'
        }}</span>
        <i class="pi pi-chevron-down text-xs text-neutral-400" />
      </button>
      <Menu ref="menuRef" :model="menuItems" :popup="true" />
    </div>
  </header>
</template>