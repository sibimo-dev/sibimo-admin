import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * ui.store - state UI yang dipakai lintas komponen layout (Sidebar, Navbar).
 * Dipisah dari komponen supaya Navbar (tombol hamburger di mobile) dan
 * Sidebar (tombol collapse di desktop) sama-sama bisa buka/tutup sidebar
 * yang sama, tanpa prop-drilling atau event lintas komponen.
 *
 * - sidebarCollapsed : mode desktop, sidebar menyempit jadi icon-only.
 * - mobileSidebarOpen: mode mobile/tablet kecil, sidebar tampil sebagai
 *   Drawer (overlay) dari PrimeVue.
 */
export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false)
  const mobileSidebarOpen = ref(false)

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function toggleMobileSidebar() {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
  }

  function closeMobileSidebar() {
    mobileSidebarOpen.value = false
  }

  return {
    sidebarCollapsed,
    mobileSidebarOpen,
    toggleSidebar,
    toggleMobileSidebar,
    closeMobileSidebar,
  }
})