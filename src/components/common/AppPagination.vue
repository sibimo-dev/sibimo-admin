<script setup>
/**
 * AppPagination - dipakai untuk halaman list yang TIDAK pakai AppDataTable,
 * misal grid galeri foto (kartu, bukan tabel). Kalau halamanmu pakai
 * AppDataTable, kamu tidak perlu komponen ini -- paginator sudah built-in.
 *
 * Contoh pakai:
 *   <AppPagination
 *     :total="totalItem"
 *     :rows="itemPerHalaman"
 *     :first="offsetSaatIni"
 *     @page="({ first, rows }) => fetchData(first, rows)"
 *   />
 */
import Paginator from 'primevue/paginator'

defineProps({
  total: { type: Number, required: true },
  rows: { type: Number, default: 12 },
  first: { type: Number, default: 0 },
})

defineEmits(['page'])
</script>

<template>
  <Paginator
    :totalRecords="total"
    :rows="rows"
    :first="first"
    @page="(e) => $emit('page', e)"
  />
</template>
