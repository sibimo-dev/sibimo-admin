<script setup>
import { computed } from 'vue'
import Button from 'primevue/button'

const props = defineProps({
  label: { type: String, default: '' },
  icon: { type: String, default: null },
  variant: {
    type: String,
    default: 'primary',
    // primary | dark | secondary | outline | soft | text | ghost | link
    // | danger | success | warning | neutral | light
  },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  size: { type: String, default: null }, // small | large
  type: { type: String, default: 'button' },
  rounded: { type: Boolean, default: false },
  roundedIcon: { type: Boolean, default: false },
  ariaLabel: { type: String, default: null },
})

defineEmits(['click'])


const variantMap = {
  primary: { severity: undefined },
  dark: { severity: 'contrast' },
  secondary: { severity: 'secondary' },
  outline: { severity: undefined, outlined: true },
  soft: { severity: undefined, text: true, soft: true },
  text: { severity: undefined, text: true },
  ghost: { severity: 'secondary', text: true },
  link: { severity: undefined, link: true },
  danger: { severity: 'danger' },
  'danger-ghost': { severity: 'danger', text: true },
  success: { severity: 'success' },
  warning: { severity: 'warn' },
  neutral: { severity: 'secondary', outlined: true },
  light: { severity: 'secondary', text: true },
}

const config = computed(() => variantMap[props.variant] ?? variantMap.primary)
const severity = computed(() => config.value.severity)
const outlined = computed(() => config.value.outlined ?? false)
const text = computed(() => config.value.text ?? false)
const link = computed(() => config.value.link ?? false)
const isSoft = computed(() => config.value.soft ?? false)
const isRounded = computed(() => props.rounded || props.roundedIcon)

const buttonClass = computed(() => ({
  'app-btn-soft': isSoft.value,
  'app-btn-rounded-icon': props.roundedIcon,
}))
</script>

<template>
  <Button
    :label="label"
    :icon="icon"
    :severity="severity"
    :outlined="outlined"
    :text="text"
    :link="link"
    :rounded="isRounded"
    :class="buttonClass"
    :aria-label="ariaLabel"
    :loading="loading"
    :disabled="disabled"
    :size="size"
    :type="type"
    @click="$emit('click', $event)"
  />
</template>

<style scoped>

.app-btn-soft {
  background: var(--p-primary-50) !important;
  color: var(--p-primary-700) !important;
  border-color: transparent !important;
}
.app-btn-soft:not(:disabled):hover {
  background: var(--p-primary-100) !important;
}

.app-btn-rounded-icon {
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
}
</style>