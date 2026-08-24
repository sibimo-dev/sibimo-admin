<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import PanelMenu from 'primevue/panelmenu'

const props = defineProps({
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
    label: 'Persuratan',
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
    label: 'Pengaduan',
    showLabel: false,
    items: [{ label: 'Kelola Aduan', icon: 'pi pi-comments', route: '/complaint' }],
  },
  {
    label: 'Konten Publik',
    showLabel: false,
    items: [
      { label: 'Berita & Pengumuman', icon: 'pi pi-megaphone', route: '/news' },
      { label: 'Kelola Agenda', icon: 'pi pi-calendar', route: '/agenda' },
      { label: 'Kelola Potensi', icon: 'pi pi-star', route: '/village-potential' },
    ],
  },
  {
    label: 'Data Desa',
    showLabel: false,
    items: [{ label: 'Kelola Data Warga', icon: 'pi pi-users', route: '/citizen' }],
  },
  {
    label: 'Galeri & Perpustakaan',
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
    label: 'Profil Desa',
    showLabel: false,
    items: [
      {
        label: 'Profile Desa',
        icon: 'pi pi-building',
        items: [
          { label: 'Sejarah', route: '/village-profile/history' },
          { label: 'Visi & Misi', route: '/village-profile/vision-mission' },
          { label: 'Struktur Organisasi', route: '/village-profile/organizational-structure' },
          { label: 'Data Wilayah', route: '/village-profile/region' },
        ],
      },
    ],
  },
  {
    label: 'User Management',
    showLabel: true,
    items: [{ label: 'List Admin', icon: 'pi pi-user-edit', route: '/user-management' }],
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

/* ------------------- Flyout mengambang saat collapsed ------------------- */

const flyout = ref(null) // { item, top, left }

function isFlyoutOpen(item) {
  return flyout.value?.item === item
}

function toggleFlyout(item, targetEl) {
  if (flyout.value && flyout.value.item === item) {
    flyout.value = null
    return
  }
  const rect = targetEl.getBoundingClientRect()
  flyout.value = {
    item,
    top: rect.top,
    left: rect.right + 8, // jarak sedikit dari sidebar
  }
}

function closeFlyout() {
  flyout.value = null
}

// Kalau ada submenu & sidebar collapsed, cegah PanelMenu expand ke bawah,
// ganti dengan flyout mengambang di samping.
function handleGroupClick(item, hasSubmenu, event) {
  if (props.collapsed && hasSubmenu) {
    event.preventDefault()
    event.stopPropagation()
    toggleFlyout(item, event.currentTarget)
  } else {
    closeFlyout()
  }
}

function handleFlyoutNavigate(navigate, event) {
  navigate(event)
  closeFlyout()
  emit('navigate')
}

function handleClickOutside(e) {
  if (!flyout.value) return
  if (e.target.closest('.sidebar-flyout')) return
  if (e.target.closest('nav')) return
  closeFlyout()
}

// Tutup flyout begitu sidebar di-expand lagi (biar tidak nyangkut)
watch(
  () => props.collapsed,
  () => closeFlyout(),
)

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

/* ------------------------- Kelas warna item menu ------------------------- */
// Collapsed: kotak ikon rounded, aktif => biru solid + ikon putih.
// Expanded: gaya lama (border kiri + background biru muda).

function itemButtonClass(active) {
  const base =
    'flex items-center gap-3 rounded-lg text-[15px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-1'

  if (props.collapsed) {
    return [
      base,
      'justify-center w-11 h-11 mx-auto rounded-xl border-0',
      active ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100',
    ]
  }

  return [
    base,
    'px-3 py-2.5 border-l-[3px]',
    active
      ? 'bg-blue-50 text-blue-700 border-blue-600'
      : 'text-neutral-700 border-transparent hover:bg-neutral-100 hover:border-neutral-300',
  ]
}

function itemIconClass(active) {
  if (props.collapsed) {
    return active ? 'text-white' : 'text-neutral-500'
  }
  return active ? 'text-blue-700' : 'text-neutral-500'
}

// Kelas untuk item link di dalam flyout mengambang.
// Background flyout sudah biru penuh, jadi item "aktif" dibedakan dengan
// overlay putih transparan, bukan warna biru terpisah.
function flyoutItemClass(active) {
  return active ? 'bg-white/15 text-white' : 'text-blue-50 hover:bg-white/10'
}

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
              :class="itemButtonClass(linkActive)"
              @click="handleNavigate(navigate, $event)"
            >
              <i
                v-if="item.icon"
                :class="[item.icon, itemIconClass(linkActive)]"
                class="text-[20px] shrink-0"
              ></i>
              <span v-if="!collapsed" class="flex-1">{{ item.label }}</span>
            </a>
          </router-link>

          <a
            v-else
            :class="itemButtonClass(groupHasActiveChild(item) || isFlyoutOpen(item))"
            class="cursor-pointer"
            @click="handleGroupClick(item, hasSubmenu, $event)"
          >
            <i
              v-if="item.icon"
              :class="[item.icon, itemIconClass(groupHasActiveChild(item) || isFlyoutOpen(item))]"
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

    <Teleport to="body">
      <div
        v-if="flyout"
        class="sidebar-flyout fixed z-50 min-w-[220px] rounded-lg bg-blue-600 shadow-xl py-2"
        :style="{ top: flyout.top + 'px', left: flyout.left + 'px' }"
      >
        <p class="px-3 pb-1.5 mb-1 text-[13px] font-bold text-white border-b border-white/20">
          {{ flyout.item.label }}
        </p>
        <router-link
          v-for="child in flyout.item.items"
          :key="child.route"
          v-slot="{ href, navigate, isActive: linkActive }"
          :to="child.route"
          custom
        >
          <a
            :href="href"
            class="block px-3 py-2 mx-1 rounded-md text-[14px] font-medium transition-colors"
            :class="flyoutItemClass(linkActive)"
            @click="handleFlyoutNavigate(navigate, $event)"
          >
            {{ child.label }}
          </a>
        </router-link>
      </div>
    </Teleport>
  </nav>
</template>