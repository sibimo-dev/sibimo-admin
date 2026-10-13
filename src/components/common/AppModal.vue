<script setup>

import Dialog from 'primevue/dialog'
import AppButton from './AppButton.vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true }, // v-model buka/tutup
  title: { type: String, default: '' },
  width: { type: String, default: '32rem' },
  loading: { type: Boolean, default: false },
  hideFooter: { type: Boolean, default: false },
  saveLabel: { type: String, default: 'Simpan' },
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

function close() {
  emit('update:modelValue', false)
  emit('cancel')
}
</script>

<template>
  <Dialog
    :visible="modelValue"
    modal
    :header="title"
    :style="{ width }"
    class="mx-3 md:mx-0"
    @update:visible="(val) => emit('update:modelValue', val)"
  >
    <div class="flex flex-col gap-4 py-2">
      <slot />
    </div>

    <template v-if="!hideFooter" #footer>
      <AppButton label="Batal" variant="ghost" @click="close" />
      <AppButton :label="saveLabel" variant="primary" :loading="loading" @click="emit('save')" />
    </template>
  </Dialog>
</template>

<style scoped>
/* ===== Mobile: dialog tidak mepet ke tepi layar & header/font lebih ringkas ===== */
@media (max-width: 767px) {
  :deep(.p-dialog) {
    width: calc(100vw - 1.5rem) !important;
    max-width: 100%;
  }
  :deep(.p-dialog-header) {
    padding: 0.9rem 1rem;
    font-size: 0.95rem;
  }
  :deep(.p-dialog-content) {
    padding: 0.75rem 1rem;
  }
  :deep(.p-dialog-footer) {
    padding: 0.75rem 1rem;
  }
}
</style>