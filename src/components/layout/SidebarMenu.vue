<script setup>
/**
 * SidebarMenu - isi navigasi admin SIBIMO, dipakai bareng oleh Sidebar.vue
 * (versi statis desktop) dan Drawer mobile-nya. Dipisah dari Sidebar.vue
 * supaya markup menu tidak perlu ditulis dua kali.
 *
 * Dibangun di atas <PanelMenu> asli PrimeVue (bukan <div>/<button> manual),
 * dengan #item template kustom mengikuti pola resmi PrimeVue untuk integrasi
 * vue-router (item.route -> router-link) + highlight halaman aktif.
 *
 
 */
import { useRoute } from 'vue-router'
import PanelMenu from 'primevue/panelmenu'

defineProps({
  // Saat collapsed, cuma icon yang tampil (dipakai versi desktop saja).
  collapsed: { type: Boolean, default: false },
})

const emit = defineEmits(['navigate'])
const route = useRoute()


const menuGroups = [
  {
    label: 'Utama',
    showLabel: false,
    items: [{ label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' }],
  },
  {
    label: 'Persuratan', // Dev A
    showLabel: false,
    items: [
      {
        label: 'Persuratan',
        icon: 'pi pi-file',
        items: [
          { label: 'Pengelolaan Surat', route: '/surat' },
          { label: 'Verifikasi Surat', route: '/surat/verifikasi' },
          { label: 'Otorisasi Surat', route: '/surat/otorisasi' },
          { label: 'Tipe Surat', route: '/tipe-surat' },
        ],
      },
    ],
  },
  {
    label: 'Pengaduan', // Dev A
    showLabel: false,
    items: [
      {
        label: 'Pengaduan',
        icon: 'pi pi-comments',
        items: [
          { label: 'Daftar Aduan', route: '/aduan' },
          { label: 'Tanggapan Aduan', route: '/aduan/tanggapan' },
        ],
      },
    ],
  },
  {
    label: 'Konten Publik', // Dev B
    showLabel: false,
    items: [
      { label: 'Berita & Pengumuman', icon: 'pi pi-megaphone', route: '/berita' },
      {
        label: 'Kelola Agenda',
        icon: 'pi pi-calendar',
        items: [
          { label: 'List Agenda', route: '/agenda' },
          { label: 'Kalender Agenda', route: '/agenda/kalender' },
        ],
      },
      { label: 'Kelola Potensi', icon: 'pi pi-star', route: '/potensi' },
    ],
  },
  {
    label: 'Data Desa', // Dev B
    showLabel: false,
    items: [
      { label: 'Data Wilayah', icon: 'pi pi-globe', route: '/wilayah' },
      { label: 'Kelola Data Warga', icon: 'pi pi-users', route: '/warga' },
    ],
  },
  {
    label: 'Galeri & Perpustakaan', // Dev C
    showLabel: false,
    items: [
      { label: 'Kelola Gallery', icon: 'pi pi-images', route: '/galeri' },
      {
        label: 'Kelola Perpustakaan',
        icon: 'pi pi-book',
        items: [
          { label: 'Peminjaman', route: '/perpustakaan/peminjaman' },
          { label: 'Pengembalian', route: '/perpustakaan/pengembalian' },
        ],
      },
    ],
  },
  {
    label: 'Profil Desa', // Dev C
    showLabel: false,
    items: [
      {
        label: 'Profile Desa',
        icon: 'pi pi-building',
        items: [
          { label: 'Sejarah', route: '/profil-desa/sejarah' },
          { label: 'Visi & Misi', route: '/profil-desa/visi-misi' },
          { label: 'Struktur Organisasi', route: '/profil-desa/struktur' },
          { label: 'Data Wilayah', route: '/wilayah' },
        ],
      },
    ],
  },
  {
    label: 'User Management', // Dev A
    showLabel: true,
    items: [{ label: 'List Admin', icon: 'pi pi-user-edit', route: '/pengguna' }],
  },
]

function isActive(to) {
  if (!to) return false
  return route.path === to || route.path.startsWith(to + '/')
}

function groupHasActiveChild(item) {
  return item.items?.some((c) => isActive(c.route))
}

function handleNavigate(navigate, event) {
  navigate(event)
  emit('navigate')
}
</script>

<template>
  <nav class="flex-1 overflow-y-auto py-3 px-2">
    <div v-for="group in menuGroups" :key="group.label" class="mb-1">
      <p
        v-if="group.showLabel && !collapsed"
        class="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400"
      >
        {{ group.label }}
      </p>

      <PanelMenu :model="group.items" class="sidebar-panelmenu" :class="{ 'is-collapsed': collapsed }">
        <template #item="{ item, hasSubmenu }">
          <router-link
            v-if="item.route"
            v-slot="{ href, navigate, isActive: linkActive }"
            :to="item.route"
            custom
          >
            <a
              :href="href"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              :class="
                linkActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-neutral-700 hover:bg-neutral-50'
              "
              @click="handleNavigate(navigate, $event)"
              "
            >
              <i v-if="item.icon" :class="item.icon" class="text-base shrink-0" />
              <span v-if="!collapsed" class="flex-1">{{ item.label }}</span>
            </a>
          </router-link>

          <a
            v-else
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors"
            :class="
              groupHasActiveChild(item)
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-neutral-700 hover:bg-neutral-50'
            "
          >
            <i v-if="item.icon" :class="item.icon" class="text-base shrink-0" />
            <span v-if="!collapsed" class="flex-1 text-left">{{ item.label }}</span>
            <i
              v-if="hasSubmenu && !collapsed"
              class="pi pi-angle-down text-xs text-neutral-400"
            />
          </a>
        </template>
      </PanelMenu>
    </div>
  </nav>
</template>

<style scoped>
/* PanelMenu bawaan punya padding/border sendiri; kita rapikan supaya
   menyatu visual dengan sidebar custom (bukan tampil sebagai "panel" terpisah). */
.sidebar-panelmenu :deep(.p-panelmenu-panel) {
  border: none;
  background: transparent;
}
.sidebar-panelmenu :deep(.p-panelmenu-header-content) {
  background: transparent;
  border: none;
  box-shadow: none;
}
.sidebar-panelmenu :deep(.p-panelmenu-content) {
  background: transparent;
  border: none;
  padding-left: 1.75rem;
}
.sidebar-panelmenu.is-collapsed :deep(.p-panelmenu-submenu) {
  display: none;
}
</style>