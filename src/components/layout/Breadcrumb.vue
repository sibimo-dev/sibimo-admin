<script setup>
/**
 * Breadcrumb - dibaca otomatis dari `meta.breadcrumb` di file route.
 * Supaya breadcrumb ini muncul benar, tiap route WAJIB isi meta.breadcrumb,
 * lihat contoh di router/modules/dashboard.routes.js
 */
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <nav class="text-sm text-neutral-500 flex items-center gap-2">
    <i class="pi pi-home text-xs" />
    <template v-if="route.meta?.breadcrumb">
      <span v-for="(crumb, i) in route.meta.breadcrumb" :key="i" class="flex items-center gap-2">
        <i v-if="i > 0" class="pi pi-angle-right text-xs" />
        <span
          :class="
            i === route.meta.breadcrumb.length - 1
              ? 'text-neutral-900 font-medium'
              : ''
          "
        >
          {{ crumb }}
        </span>
      </span>
    </template>
  </nav>
</template>
