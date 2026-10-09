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
    class="text-xs md:text-sm"
    @page="(e) => $emit('page', e)"
  />
</template>

<style scoped>
@media (max-width: 767px) {
  :deep(.p-paginator) {
    padding: 0.4rem;
  }
  :deep(.p-paginator .p-paginator-page),
  :deep(.p-paginator .p-paginator-next),
  :deep(.p-paginator .p-paginator-prev),
  :deep(.p-paginator .p-paginator-first),
  :deep(.p-paginator .p-paginator-last) {
    min-width: 1.75rem;
    height: 1.75rem;
  }
}
</style>