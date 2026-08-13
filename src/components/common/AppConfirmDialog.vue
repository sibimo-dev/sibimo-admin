<script setup>
/**
 * AppConfirmDialog - dialog konfirmasi generik untuk aksi yang butuh
 * "yakin?" dulu: hapus data, verifikasi surat, otorisasi, dll.
 *
 * Cara pakai PALING GAMPANG: pakai composable useConfirm() bawaan
 * PrimeVue langsung di halaman (lihat contoh di views/tipe-surat nanti),
 * lalu taruh <AppConfirmDialog /> SEKALI SAJA di AdminLayout.vue.
 * Kamu tidak perlu import komponen ini di tiap halaman.
 */
import ConfirmDialog from 'primevue/confirmdialog'
</script>

<template>
  <ConfirmDialog />
</template>
