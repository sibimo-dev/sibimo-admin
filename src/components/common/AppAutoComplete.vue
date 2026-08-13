<script setup>
/**
 * AppAutocomplete - "cari sambil ketik" dengan label + error, pasangan
 * dari AppSelect tapi untuk data yang jumlahnya banyak (misal daftar
 * warga/citizens) supaya nggak perlu scroll dropdown panjang.
 *
 * Dipakai di form manapun yang butuh pilih 1 warga dari tabel `citizens`
 * (Peminjaman Buku, Pengajuan Surat, Pengaduan, dll) -- bukan cuma
 * Perpustakaan, karena `citizens` adalah tabel bersama semua modul.
 *
 * Contoh pakai:
 *   <AppAutocomplete
 *     v-model="form.citizen_id"
 *     label="Nama Anggota"
 *     :options="anggotaList"
 *     option-label="full_name"
 *     option-value="citizen_id"
 *     placeholder="Ketik nama warga..."
 *   />
 *
 * Untuk data besar dari API (bukan dummy lokal), ganti isi function
 * `search()` di bawah dengan panggilan service + debounce, alih-alih
 * filter array lokal.
 */
import { ref, computed } from 'vue'
import AutoComplete from 'primevue/autocomplete'

const props = defineProps({
  modelValue: { type: [Number, String], default: null }, // menyimpan ID (citizen_id), bukan object
  label: { type: String, default: '' },
  options: { type: Array, required: true }, // array object lengkap, misal daftar citizens
  optionLabel: { type: String, default: 'label' }, // field yang ditampilkan, misal 'full_name'
  optionValue: { type: String, default: 'value' }, // field yang jadi ID, misal 'citizen_id'
  placeholder: { type: String, default: 'Ketik untuk mencari...' },
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

function search(event) {
  const query = event.query.toLowerCase().trim()
  // TODO kalau datanya dari API (bukan dummy lokal): panggil service di sini,
  // misal `searchCitizens(query)`, lalu isi `suggestions.value` dari hasilnya.
  suggestions.value = !query
    ? props.options.slice(0, 10) // tampilkan 10 pertama kalau belum ngetik apa-apa
    : props.options.filter((o) => String(o[props.optionLabel]).toLowerCase().includes(query))
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
      <template #option="{ option }">
        <div>
          <p class="text-sm">{{ option[optionLabel] }}</p>
        </div>
      </template>
    </AutoComplete>
    <span v-if="error" class="text-xs text-red-500">{{ error }}</span>
  </div>
</template>
