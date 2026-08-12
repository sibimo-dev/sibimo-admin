<script setup>
/**
 * AdminLayout - kerangka untuk SEMUA halaman setelah login.
 * Jangan taruh sidebar/navbar lagi di masing-masing view -- cukup
 * di sini sekali. Halaman modul (surat, berita, dll) cukup isi
 * <router-view /> lewat routing yang pakai layout ini.
 *
 * Status buka/tutup sidebar di layar mobile disimpan di sini (bukan di
 * Sidebar atau Navbar sendiri-sendiri), supaya kedua komponen itu bisa
 * saling "bicara": tombol hamburger di Navbar men-toggle, Sidebar baca
 * statusnya untuk tampil/sembunyi.
 */
import { ref } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Navbar from '@/components/layout/Navbar.vue'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import Toast from 'primevue/toast'

const mobileSidebarOpen = ref(false)
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <Sidebar :mobile-open="mobileSidebarOpen" @close="mobileSidebarOpen = false" />

    <div class="flex-1 flex flex-col overflow-hidden min-w-0">
      <Navbar @toggle-sidebar="mobileSidebarOpen = !mobileSidebarOpen" />

      <main class="flex-1 overflow-y-auto p-4 md:p-6">
        <router-view />
      </main>
    </div>

    <!-- Dipasang sekali di sini, dipakai semua modul lewat useConfirm()/useToast() -->
    <AppConfirmDialog />
    <Toast />
  </div>
</template>
