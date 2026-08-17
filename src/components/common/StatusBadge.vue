<script setup>
/**
 * StatusBadge - pill status kecil di tabel (Pending, Diverifikasi,
 * Disetujui, Ditolak, Published, Draft, Active, Deactive, dll).
 *
 * Contoh pakai:
 *   <StatusBadge label="Pending" variant="warning" />
 *   <StatusBadge label="Disetujui" variant="success" />
 *
 * Kalau statusnya belum ada di `variant`, kirim string bebas dan
 * komponen akan fallback ke warna netral (variant="neutral").
 */
defineProps({
  label: { type: String, required: true },
  variant: {
    type: String,
    default: 'neutral', // neutral | primary | secondary | success | warning | danger
  },
})

const styles = {
  neutral: 'bg-neutral-100 text-neutral-700',
  primary: 'bg-primary-100 text-primary-700',
  secondary: 'bg-secondary-100 text-secondary-700',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  danger: 'bg-danger-100 text-danger-700',
  dark: 'bg-neutral-900 text-white',
}
</script>

<template>
  <span class="status-badge" :class="styles[variant] || styles.neutral">
    {{ label }}
  </span>
</template>