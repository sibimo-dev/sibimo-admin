<script setup>
/**
 * Breadcrumb - dibaca otomatis dari `meta.breadcrumb` di file route.
 * Item yang punya halaman sendiri bisa diklik; tujuannya dicari otomatis dari route lain
 * yang meta.breadcrumb-nya persis sama (mis. ['Persuratan', 'Pengelolaan Surat'] -> /letter).
 * Item grup tanpa halaman (mis. "Persuratan") tampil sebagai teks biasa.
 * Tiap route WAJIB isi meta.breadcrumb, lihat contoh di router/modules/dashboard.routes.js
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const crumbs = computed(() => route.meta?.breadcrumb ?? [])
const sameCrumbs = (a, b) => a.length === b.length && a.every((v, i) => v === b[i])

function pathForCrumbs(list) {
  const hit = router
    .getRoutes()
    .find((r) => !r.redirect && !r.path.includes(':') && Array.isArray(r.meta?.breadcrumb) && sameCrumbs(r.meta.breadcrumb, list))
  return hit ? hit.path : null
}

// Item terakhir = halaman ini, bukan link.
const items = computed(() =>
  crumbs.value.map((label, i) => ({
    label,
    to: i < crumbs.value.length - 1 ? pathForCrumbs(crumbs.value.slice(0, i + 1)) : null,
  })),
)
</script>

<template>
  <nav class="text-sm text-neutral-500 flex flex-wrap items-center gap-2" aria-label="Breadcrumb">
    <router-link to="/" class="flex items-center hover:text-neutral-900" title="Ke Dashboard">
      <i class="pi pi-home text-xs" />
    </router-link>
    <span v-for="(crumb, i) in items" :key="i" class="flex items-center gap-2">
      <i class="pi pi-angle-right text-xs" />
      <router-link v-if="crumb.to" :to="crumb.to" class="hover:text-neutral-900 hover:underline">
        {{ crumb.label }}
      </router-link>
      <span v-else :class="i === items.length - 1 ? 'text-neutral-900 font-medium' : ''">
        {{ crumb.label }}
      </span>
    </span>
  </nav>
</template>