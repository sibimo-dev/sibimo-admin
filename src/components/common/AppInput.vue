<script setup>
import { computed, ref } from 'vue'
import InputText from 'primevue/inputtext'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  type: { type: String, default: 'text' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])

const showPassword = ref(false)

const isPassword = computed(() => props.type === 'password')

const inputType = computed(() => {
  if (!isPassword.value) return props.type
  return showPassword.value ? 'text' : 'password'
})

function togglePassword() {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" class="text-sm font-medium text-neutral-700">
      {{ label }}
      <span v-if="required" class="text-danger-500">*</span>
    </label>

    <div class="relative">
      <InputText
        :modelValue="modelValue"
        :type="inputType"
        :placeholder="placeholder"
        :disabled="disabled"
        :invalid="!!error"
        :class="['w-full', isPassword ? 'pr-10' : '']"
        @update:modelValue="(val) => $emit('update:modelValue', val)"
      />

      <button
        v-if="isPassword"
        type="button"
        tabindex="-1"
        class="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="disabled"
        @click="togglePassword"
      >
        <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-sm" />
      </button>
    </div>

    <span v-if="error" class="text-xs text-danger-500">{{ error }}</span>
  </div>
</template>