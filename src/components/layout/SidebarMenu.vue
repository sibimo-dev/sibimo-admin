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
 * Styling PanelMenu (panel/header/content bawaan) dikustom lewat prop `pt`
 * (Pass Through) berisi class Tailwind, bukan CSS scoped — supaya semua
 * styling konsisten satu sumber (Tailwind) dan tetap "resmi" ala PrimeVue.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PanelMenu from 'primevue/panelmenu'

const props = defineProps({
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
          { label: 'Pengelolaan Surat', route: '/letter' },
          { label: 'Verifikasi Surat', route: '/letter/verification' },
          { label: 'Otorisasi Surat', route: '/letter/authorization' },
          { label: 'Tipe Surat', route: '/letter-type' },
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
          { label: 'Daftar Aduan', route: '/complaint' },
          { label: 'Tanggapan Aduan', route: '/complaint/response' },
        ],
      },
    ],
  },
  {
    label: 'Konten Publik', // Dev B
    showLabel: false,
    items: [
      { label: 'Berita & Pengumuman', icon: 'pi pi-megaphone', route: '/news' },
      {
        label: 'Kelola Agenda',
        icon: 'pi pi-calendar',
        items: [
          { label: 'List Agenda', route: '/agenda' },
          { label: 'Kalender Agenda', route: '/agenda/calendar' },
        ],
      },
      { label: 'Kelola Potensi', icon: 'pi pi-star', route: '/village-potential' },
    ],
  },
  {
    label: 'Data Desa', // Dev B
    showLabel: false,
    items: [
      { label: 'Data Wilayah', icon: 'pi pi-globe', route: '/wilayah' },
      { label: 'Kelola Data Warga', icon: 'pi pi-users', route: '/citizen' },
    ],
  },
  {
    label: 'Galeri & Perpustakaan', // Dev C
    showLabel: false,
    items: [
      { label: 'Kelola Gallery', icon: 'pi pi-images', route: '/gallery' },
      {
        label: 'Kelola Perpustakaan',
        icon: 'pi pi-book',
        items: [
          { label: 'Katalog Buku', route: '/library/catalog' },
          { label: 'Peminjaman', route: '/library/loan' },
          { label: 'Pengembalian', route: '/library/return' },
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
          { label: 'Sejarah', route: '/village-profile/history' },
          { label: 'Visi & Misi', route: '/village-profile/vision-mission' },
          { label: 'Struktur Organisasi', route: '/village-profile/organizational-structure' },
          { label: 'Data Wilayah', route: '/region' },
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

// Semua override tampilan bawaan PanelMenu (panel/header/content) lewat
// Pass Through, isinya murni class Tailwind — tidak ada CSS terpisah.
const panelMenuPt = computed(() => ({
  root: { class: 'flex flex-col w-full' },
  panel: { class: 'relative border-0 bg-transparent mb-0 shadow-none' },
  header: { class: 'relative border-0 bg-transparent shadow-none p-0' },
  headerContent: { class: 'border-0 bg-transparent shadow-none p-0' },
  contentContainer: { class: 'border-0 bg-transparent shadow-none overflow-hidden' },
  content: {
    class: [
      'border-y-0 border-r-0 bg-transparent shadow-none pb-0 overflow-hidden',
      props.collapsed ? 'pl-0 ml-0 border-l-0 pt-0' : 'pl-6 ml-3 border-l border-neutral-200 pt-1.5',
    ],
  },
  rootList: { class: 'p-0 m-0 gap-1 flex flex-col' },
  item: { class: 'border-0 bg-transparent shadow-none' },
  itemContent: { class: 'border-0 bg-transparent shadow-none p-0' },
  submenu: { class: props.collapsed ? 'hidden' : 'p-0 m-0 flex flex-col gap-0.5' },
}))
</script>

<template>
  <nav class="flex-1 overflow-y-auto py-3 px-2">
    <div v-for="group in menuGroups" :key="group.label" class="mb-1">
      <p
        v-if="group.showLabel && !collapsed"
        class="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wide text-neutral-500"
      >
        {{ group.label }}
      </p>

      <PanelMenu :model="group.items" :pt="panelMenuPt" unstyled>
        <template #item="{ item, hasSubmenu }">
          <router-link
            v-if="item.route"
            v-slot="{ href, navigate, isActive: linkActive }"
            :to="item.route"
            custom
          >
            <a
              :href="href"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-semibold border-l-[3px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-1"
              :class="
                linkActive
                  ? 'bg-blue-50 text-blue-800 border-blue-700'
                  : 'text-neutral-700 border-transparent hover:bg-neutral-100 hover:border-neutral-300'
              "
              @click="handleNavigate(navigate, $event)"
            >
              <i
                v-if="item.icon"
                :class="[item.icon, linkActive ? 'text-blue-700' : 'text-neutral-500']"
                class="text-[20px] shrink-0"
              ></i>
              <span v-if="!collapsed" class="flex-1">{{ item.label }}</span>
            </a>
          </router-link>

          <a
            v-else
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-semibold cursor-pointer border-l-[3px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-1"
            :class="
              groupHasActiveChild(item)
                ? 'bg-blue-50 text-blue-800 border-blue-700'
                : 'text-neutral-700 border-transparent hover:bg-neutral-100 hover:border-neutral-300'
            "
          >
            <i
              v-if="item.icon"
              :class="[item.icon, groupHasActiveChild(item) ? 'text-blue-700' : 'text-neutral-500']"
              class="text-[20px] shrink-0"
            ></i>
            <span v-if="!collapsed" class="flex-1 text-left">{{ item.label }}</span>
            <i
              v-if="hasSubmenu && !collapsed"
              class="pi pi-angle-down text-sm text-neutral-500 transition-transform"
            ></i>
          </a>
        </template>
      </PanelMenu>
    </div>
  </nav>
</template>