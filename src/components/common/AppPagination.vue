<script setup>

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
