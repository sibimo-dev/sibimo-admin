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
