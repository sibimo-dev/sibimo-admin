<script setup>
// Simpan di: src/components/citizen/CitizenPersonFields.vue
// Isian data satu orang (ayah, ibu, suami/istri). Cukup isi NIK; bila NIK sudah
// terdaftar di data warga, field lain terisi otomatis dan terkunci.
import { computed } from 'vue'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import AutoComplete from 'primevue/autocomplete'

const props = defineProps({
  model: { type: Object, required: true },
  idPrefix: { type: String, required: true },
  title: { type: String, default: '' },
  label: { type: String, default: '' },
  religionOptions: { type: Array, default: () => [] },
  nationalityOptions: { type: Array, default: () => [] },
  occupationSuggestions: { type: Array, default: () => [] },
})

defineEmits(['update:nik', 'search-occupation'])

const labelClass = 'text-[13px] font-semibold text-neutral-700'
const inputClass = 'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:bg-neutral-100 disabled:text-neutral-400'
const selectClass = 'w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 [&.p-disabled]:bg-neutral-100'
const selectPt = { label: { class: 'px-3 py-2.5' } }
const datePt = { pcInputText: { root: { class: 'w-full px-3 py-2.5' } } }

const lowerLabel = computed(() => props.label.toLowerCase())
const nikInvalid = computed(() => props.model.nationalId !== '' && !/^\d{16}$/.test(props.model.nationalId))
const hint = computed(() => {
  if (nikInvalid.value) return { tone: 'error', text: `NIK ${props.label} harus tepat 16 digit angka.` }
  if (props.model.fromRegistry) return { tone: 'ok', text: 'Data ditemukan di data warga. Hanya NIK yang bisa diubah.' }
  if (/^\d{16}$/.test(props.model.nationalId)) return { tone: 'warn', text: 'NIK belum terdaftar di data warga. Lengkapi data secara manual.' }
  return { tone: 'idle', text: 'Isi NIK terlebih dulu. Bila sudah terdaftar (termasuk beda KK), data lain terisi otomatis.' }
})
const hintClass = computed(() => ({
  error: 'text-red-600',
  ok: 'text-emerald-700',
  warn: 'text-amber-700',
  idle: 'text-neutral-500',
}[hint.value.tone]))
</script>

<template>
  <div class="flex flex-col gap-4 rounded-lg border border-neutral-200 p-4">
    <div class="text-[13px] font-semibold text-neutral-800">{{ title }}</div>

    <div class="flex flex-col gap-2">
      <label :class="labelClass" :for="`${idPrefix}NationalId`">NIK {{ label }}</label>
      <InputText
        :id="`${idPrefix}NationalId`"
        :modelValue="model.nationalId"
        maxlength="16"
        inputmode="numeric"
        :placeholder="`16 digit NIK ${lowerLabel}`"
        :invalid="nikInvalid"
        :class="[inputClass, nikInvalid ? '!border-red-500 focus:!ring-red-100' : '']"
        @update:modelValue="$emit('update:nik', $event)"
      />
      <small class="text-xs" :class="hintClass">{{ hint.text }}</small>
    </div>

    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div class="flex flex-col gap-2">
        <label :class="labelClass" :for="`${idPrefix}Name`">Nama Lengkap {{ label }}</label>
        <InputText :id="`${idPrefix}Name`" v-model="model.fullName" :disabled="model.fromRegistry" :placeholder="`Nama ${lowerLabel}`" :class="inputClass" />
      </div>
      <div class="flex flex-col gap-2">
        <label :class="labelClass" :for="`${idPrefix}BirthPlace`">
          Tempat Lahir <span class="font-normal text-neutral-400">(Opsional)</span>
        </label>
        <InputText :id="`${idPrefix}BirthPlace`" v-model="model.birthPlace" :disabled="model.fromRegistry" placeholder="Tempat lahir" :class="inputClass" />
      </div>
      <div class="flex flex-col gap-2">
        <label :class="labelClass" :for="`${idPrefix}BirthDate`">
          Tanggal Lahir <span class="font-normal text-neutral-400">(Opsional)</span>
        </label>
        <DatePicker :id="`${idPrefix}BirthDate`" v-model="model.birthDate" :disabled="model.fromRegistry" dateFormat="dd/mm/yy" :manualInput="true" showIcon iconDisplay="input" :class="selectClass" :pt="datePt" />
      </div>
      <div class="flex flex-col gap-2">
        <label :class="labelClass" :for="`${idPrefix}Occupation`">
          Pekerjaan <span class="font-normal text-neutral-400">(Opsional)</span>
        </label>
        <AutoComplete
          :id="`${idPrefix}Occupation`"
          v-model="model.occupation"
          :suggestions="occupationSuggestions"
          dropdown
          :forceSelection="false"
          :disabled="model.fromRegistry"
          placeholder="Cari pekerjaan atau kode"
          class="w-full"
          inputClass="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]"
          @complete="$emit('search-occupation', $event)"
        />
      </div>
      <div class="flex flex-col gap-2">
        <label :class="labelClass" :for="`${idPrefix}Religion`">
          Agama <span class="font-normal text-neutral-400">(Opsional)</span>
        </label>
        <Select :id="`${idPrefix}Religion`" v-model="model.religion" :options="religionOptions" optionLabel="label" optionValue="value" placeholder="Pilih agama" :disabled="model.fromRegistry" :class="selectClass" :pt="selectPt" />
      </div>
      <div class="flex flex-col gap-2">
        <label :class="labelClass" :for="`${idPrefix}Nationality`">
          Kewarganegaraan <span class="font-normal text-neutral-400">(Opsional)</span>
        </label>
        <Select :id="`${idPrefix}Nationality`" v-model="model.nationality" :options="nationalityOptions" :disabled="model.fromRegistry" :class="selectClass" :pt="selectPt" />
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <label :class="labelClass" :for="`${idPrefix}Address`">
        Alamat <span class="font-normal text-neutral-400">(Opsional)</span>
      </label>
      <InputText :id="`${idPrefix}Address`" v-model="model.address" :disabled="model.fromRegistry" :placeholder="`Alamat ${lowerLabel}`" :class="inputClass" />
    </div>
  </div>
</template>