<script setup>
import { ref } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Navbar from '@/components/layout/Navbar.vue'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import Toast from 'primevue/toast'

const mobileSidebarOpen = ref(false)
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- print:hidden -- sidebar navigasi tidak relevan saat mencetak struk/laporan -->
    <div class="print:hidden">
      <Sidebar :mobile-open="mobileSidebarOpen" @close="mobileSidebarOpen = false" />
    </div>

    <div class="flex-1 flex flex-col overflow-hidden min-w-0">
      <div class="print:hidden">
        <Navbar @toggle-sidebar="mobileSidebarOpen = !mobileSidebarOpen" />
      </div>

      <!-- print:overflow-visible & print:p-0 -- supaya area cetak (yang markup-nya
           "hidden print:block" di masing-masing halaman) tidak kepotong tinggi
           layar atau punya padding ekstra yang tidak perlu saat print -->
      <main class="flex-1 overflow-y-auto p-4 md:p-6 print:overflow-visible print:p-0">
        <router-view />
      </main>
    </div>

    <!-- Dipasang sekali di sini, dipakai semua modul lewat useConfirm()/useToast() -->
    <AppConfirmDialog />
    <Toast />
  </div>
</template>