<script setup>
/**
 * AppButton - wrapper tipis di atas PrimeVue Button.
 * Tujuannya: satu tempat untuk atur varian tombol supaya konsisten
 * di semua modul (surat, berita, galeri, dll), tanpa tiap dev
 * menebak-nebak class/severity sendiri.
 *
 * Contoh pakai:
 *   <AppButton label="Simpan" variant="primary" @click="save" />
 *   <AppButton label="Hapus" variant="danger" icon="pi pi-trash" />
 *
 * Icon-only bulat (mis. tombol kembali, aksi di atas thumbnail foto):
 *   <AppButton icon="pi pi-arrow-left" variant="ghost" rounded aria-label="Kembali" />
 */
import { computed } from 'vue'
import Button from 'primevue/button'

const props = defineProps({
  label: { type: String, default: '' },
  icon: { type: String, default: null },
  variant: {
    type: String,
    default: 'primary', // primary | secondary | danger | ghost
  },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  size: { type: String, default: null }, // small | large
  type: { type: String, default: 'button' },
  // Tombol icon-only berbentuk lingkaran penuh (dipetakan langsung ke
  // prop `rounded` PrimeVue Button). Dipakai supaya tombol bulat di atas
  // gambar/kartu tidak perlu di-hand-roll pakai <button> + class manual.
  rounded: { type: Boolean, default: false },
  ariaLabel: { type: String, default: null },
})

defineEmits(['click'])

const severityMap = {
  primary: undefined, // default PrimeVue = warna primary tema
  secondary: 'secondary',
  danger: 'danger',
  ghost: 'secondary',
}

// "Ghost" di PrimeVue = tombol tanpa fill/border, cuma teks+icon (prop `text`),
// bukan outlined. outlined+contrast sebelumnya malah menghasilkan tombol
// outline gelap, bukan tampilan ghost yang transparan.
const text = computed(() => props.variant === 'ghost')
const severity = computed(() => severityMap[props.variant])
</script>

<template>
  <Button
    :label="label"
    :icon="icon"
    :severity="severity"
    :text="text"
    :rounded="rounded"
    :aria-label="ariaLabel"
    :loading="loading"
    :disabled="disabled"
    :size="size"
    :type="type"
    @click="$emit('click', $event)"
  />
</template>