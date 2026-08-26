<script setup>

import { ref, computed } from 'vue'
import AutoComplete from 'primevue/autocomplete'

const props = defineProps({
  modelValue: { type: [Number, String], default: null }, 
  label: { type: String, default: '' },
  options: { type: Array, required: true }, 
  optionLabel: { type: String, default: 'label' }, 
  optionValue: { type: String, default: 'value' }, 
  searchFields: { type: Array, default: null }, 
  placeholder: { type: String, default: 'Ketik untuk mencari...' },
  emptyMessage: { type: String, default: 'Tidak ada hasil ditemukan' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const suggestions = ref([])

const selectedObject = computed({
  get() {
    return props.options.find((o) => o[props.optionValue] === props.modelValue) || null
  },
  set(obj) {
    emit('update:modelValue', obj ? obj[props.optionValue] : null)
  },
})


const effectiveSearchFields = computed(() => (props.searchFields?.length ? props.searchFields : [props.optionLabel]))

function search(event) {
  const query = event.query.toLowerCase().trim()
  suggestions.value = !query
    ? props.options.slice(0, 10) 
    : props.options.filter((o) =>
        effectiveSearchFields.value.some((field) =>
          String(o[field] ?? '').toLowerCase().includes(query),
        ),
      )
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" class="text-sm font-medium text-neutral-700">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <AutoComplete
      v-model="selectedObject"
      :suggestions="suggestions"
      :option-label="optionLabel"
      :placeholder="placeholder"
      :disabled="disabled"
      :invalid="!!error"
      dropdown
      class="w-full"
      input-class="w-full"
      @complete="search"
    >
      <template #option="slotProps">
        <slot name="option" v-bind="slotProps">
          <div>
            <p class="text-sm">{{ slotProps.option[optionLabel] }}</p>
          </div>
        </slot>
      </template>
      <template #empty>
        <div class="px-3 py-2 text-sm text-neutral-400">{{ emptyMessage }}</div>
      </template>
    </AutoComplete>
    <span v-if="error" class="text-xs text-red-500">{{ error }}</span>
  </div>
</template>