<script setup>

import { ref, computed } from 'vue'
import AutoComplete from 'primevue/autocomplete'

const props = defineProps({
  modelValue: { type: [Number, String], default: null }, // menyimpan ID (citizen_id), bukan object
  label: { type: String, default: '' },
  options: { type: Array, required: true }, // array object lengkap, misal daftar citizens
  optionLabel: { type: String, default: 'label' }, // field yang ditampilkan, misal 'full_name'
  optionValue: { type: String, default: 'value' }, // field yang jadi ID, misal 'citizen_id'
  searchFields: { type: Array, default: null }, // field(s) yang ikut dicocokkan saat mengetik, misal ['label', 'isbn']. Default: cuma optionLabel.
  placeholder: { type: String, default: 'Ketik untuk mencari...' },
  emptyMessage: { type: String, default: 'Tidak ada hasil ditemukan' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const suggestions = ref([])

// Object yang lagi dipilih (AutoComplete PrimeVue butuh full object, bukan cuma ID)
const selectedObject = computed({
  get() {
    return props.options.find((o) => o[props.optionValue] === props.modelValue) || null
  },
  set(obj) {
    emit('update:modelValue', obj ? obj[props.optionValue] : null)
  },
})

// Field-field yang ikut dicocokkan saat mencari -- default cuma optionLabel
// (perilaku lama tetap sama kalau prop searchFields tidak diisi).
const effectiveSearchFields = computed(() => (props.searchFields?.length ? props.searchFields : [props.optionLabel]))

function search(event) {
  const query = event.query.toLowerCase().trim()
  // TODO kalau datanya dari API (bukan dummy lokal): panggil service di sini,
  // misal `searchCitizens(query)`, lalu isi `suggestions.value` dari hasilnya.
  suggestions.value = !query
    ? props.options.slice(0, 10) // tampilkan 10 pertama kalau belum ngetik apa-apa
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