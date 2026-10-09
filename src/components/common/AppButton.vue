<script setup>
import { computed } from 'vue'
import Button from 'primevue/button'

const props = defineProps({
  label: { type: String, default: '' },
  icon: { type: String, default: null },
  variant: {
    type: String,
    default: 'primary',
    // primary | dark | secondary | gold | outline | soft | text | ghost | link
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
  primary: { severity: undefined, gradient: 'primary' },
  dark: { severity: 'contrast' },

  secondary: { severity: undefined, gradient: 'secondary' },
  gold: { severity: undefined, gradient: 'secondary' },
  outline: { severity: undefined, outlined: true },
  soft: { severity: undefined, text: true, soft: true },
  text: { severity: undefined, text: true },
  ghost: { severity: 'secondary', text: true },
  link: { severity: undefined, link: true },
  danger: { severity: 'danger', gradient: 'danger' },
  'danger-ghost': { severity: 'danger', text: true },
  success: { severity: 'success', gradient: 'success' },
  warning: { severity: 'warn', gradient: 'warning' },
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
const gradient = computed(() => config.value.gradient ?? null)

const buttonClass = computed(() => ({
  'app-btn-soft': isSoft.value,
  'app-btn-rounded-icon': props.roundedIcon,
  [`app-btn-gradient-${gradient.value}`]: !!gradient.value && !text.value && !link.value && !outlined.value,
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
/* ===== Soft variant ===== */
.app-btn-soft {
  background: var(--p-primary-50) !important;
  color: var(--p-primary-700) !important;
  border-color: transparent !important;
}
.app-btn-soft:not(:disabled):hover {
  background: var(--p-primary-100) !important;
}

/* ===== Rounded icon-only button ===== */
.app-btn-rounded-icon {
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
}

:deep(.p-button-link .p-button-label) {
  color: var(--p-primary-600) !important;
}
:deep(.p-button-link:not(:disabled):hover .p-button-label) {
  color: var(--p-primary-700) !important;
}

/* ===== Gradient variants - biar tidak flat/monoton ===== */
.app-btn-gradient-primary {
  background: linear-gradient(135deg, var(--p-primary-400), var(--p-primary-700)) !important;
  border: none !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--p-primary-700) 35%, transparent);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.app-btn-gradient-primary:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--p-primary-700) 45%, transparent);
}

.app-btn-gradient-secondary {
  background: linear-gradient(135deg, var(--p-secondary-300), var(--p-secondary-600)) !important;
  border: none !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--p-secondary-600) 35%, transparent);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.app-btn-gradient-secondary:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--p-secondary-600) 45%, transparent);
}

.app-btn-gradient-danger {
  background: linear-gradient(135deg, var(--p-danger-400), var(--p-danger-600)) !important;
  border: none !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--p-danger-600) 35%, transparent);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.app-btn-gradient-danger:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--p-danger-600) 45%, transparent);
}

.app-btn-gradient-success {
  background: linear-gradient(135deg, var(--p-success-400), var(--p-success-600)) !important;
  border: none !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--p-success-600) 35%, transparent);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.app-btn-gradient-success:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--p-success-600) 45%, transparent);
}

.app-btn-gradient-warning {
  background: linear-gradient(135deg, var(--p-warn-400), var(--p-warn-600)) !important;
  border: none !important;
  color: #1c1300 !important; /* warning tetap kuning terang -> teks gelap, bukan putih */
  box-shadow: 0 2px 8px color-mix(in srgb, var(--p-warn-600) 35%, transparent);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.app-btn-gradient-warning:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--p-warn-600) 45%, transparent);
}

:deep(.p-button) {
  border-radius: 10px;
}

/* ===== Mobile: kecilkan padding & font tombol secara default ===== */
@media (max-width: 767px) {
  :deep(.p-button) {
    font-size: 0.8125rem; /* 13px */
    padding: 0.5rem 0.75rem;
  }
  :deep(.p-button .p-button-icon) {
    font-size: 0.8125rem;
  }
  .app-btn-rounded-icon {
    width: 2rem;
    height: 2rem;
  }
}
</style>