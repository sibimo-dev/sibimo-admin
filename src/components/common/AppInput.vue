<script setup>
/**
 * AppInput - text input dengan label + pesan error terpasang.
 * Dipakai di semua form (login, tipe surat, berita, profil desa, dst)
 * supaya style label/error konsisten, tidak tiap dev bikin markup sendiri.
 *
 * Contoh pakai:
 *   <AppInput v-model="form.judul" label="Judul Berita" :error="errors.judul" required />
 */
import InputText from 'primevue/inputtext'

defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  type: { type: String, default: 'text' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" class="text-sm font-medium text-neutral-700">
      {{ label }}
      <span v-if="required" class="text-danger-500">*</span>
    </label>
    <InputText
      :modelValue="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :invalid="!!error"
      class="w-full"
      @update:modelValue="(val) => $emit('update:modelValue', val)"
    />
    <span v-if="error" class="text-xs text-danger-500">{{ error }}</span>
  </div>
</template>
