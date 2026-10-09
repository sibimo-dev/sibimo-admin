<script setup>
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import SidebarMenu from './SidebarMenu.vue'

const authStore = useAuthStore()
const uiStore = useUiStore()
</script>

<template>
  <!-- Desktop: sidebar statis, collapsible -->
  <aside
    class="hidden md:flex h-screen bg-white border-r border-neutral-100 flex-col transition-all duration-200 shrink-0"
    :class="uiStore.sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'"
  >
    <div class="h-16 flex items-center justify-between px-4 border-b border-neutral-100">
      <span
        v-if="!uiStore.sidebarCollapsed"
        class="font-bold italic text-lg text-primary-800 tracking-tight"
      >
        Menu
      </span>
      <Button
        :icon="uiStore.sidebarCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'"
        text
        rounded
        severity="secondary"
        aria-label="Ciutkan/lebarkan sidebar"
        @click="uiStore.toggleSidebar()"
      />
    </div>

    <SidebarMenu :collapsed="uiStore.sidebarCollapsed" />

    <div class="border-t border-neutral-100 p-3">
      <div class="flex items-center gap-2.5 px-1">
        <div
          class="w-7 h-7 rounded-full flex items-center justify-center bg-primary-600 text-white text-xs font-semibold shrink-0"
        >
          {{ (authStore.user?.nama || 'Admin Desa').charAt(0).toUpperCase() }}
        </div>
        <div v-if="!uiStore.sidebarCollapsed" class="leading-tight overflow-hidden">
          <p class="text-sm font-semibold text-neutral-900 truncate">
            {{ authStore.user?.nama || 'Admin Desa' }}
          </p>
          <p class="text-xs text-neutral-400">SIBIMO v1.0</p>
        </div>
      </div>
    </div>
  </aside>

  <!-- Mobile: sidebar sebagai Drawer overlay -->
  <Drawer
    v-model:visible="uiStore.mobileSidebarOpen"
    position="left"
    class="!w-[280px] md:hidden"
    :pt="{ content: { class: '!pt-0' } }"
  >
    <template #header>
      <span class="font-bold italic text-lg text-primary-800 tracking-tight">Menu</span>
    </template>

    <SidebarMenu :collapsed="false" @navigate="uiStore.closeMobileSidebar()" />
  </Drawer>
</template>