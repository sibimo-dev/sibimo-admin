<script setup>
// AuthLayout - dipakai khusus untuk halaman login & register.
// Sengaja tanpa sidebar/navbar karena user belum login.
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
    <div class="w-full max-w-md">
      <router-view />
    </div>
  </div>
</template>
