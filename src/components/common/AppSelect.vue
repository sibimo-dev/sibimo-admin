<script setup>

import Select from 'primevue/select'

defineProps({
  modelValue: { type: [String, Number, Object], default: null },
  label: { type: String, default: '' },
  options: { type: Array, required: true }, // [{ label, value }]
  optionLabel: { type: String, default: 'label' },
  optionValue: { type: String, default: 'value' },
  placeholder: { type: String, default: 'Pilih salah satu' },
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
    <Select
      :modelValue="modelValue"
      :options="options"
      :optionLabel="optionLabel"
      :optionValue="optionValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :invalid="!!error"
      class="w-full text-sm md:text-base"
      @update:modelValue="(val) => $emit('update:modelValue', val)"
    />
    <span v-if="error" class="text-xs text-danger-500">{{ error }}</span>
  </div>
</template>