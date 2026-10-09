<script setup>
/**
 * FilterPopover - filter lanjutan untuk tabel Pengajuan Surat di Dashboard.
 * Beda mekanisme dari drawer sebelumnya: ini overlay kecil (Popover) yang
 * muncul nempel di tombol "Filter Lanjutan", bukan panel penuh dari sisi
 * layar. Dipanggil imperatif lewat ref: filterRef.value.toggle(event).
 */
import { ref, reactive } from 'vue'
import Popover from 'primevue/popover'
import Select from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import AppButton from '@/components/common/AppButton.vue'

defineExpose({ toggle })

const emit = defineEmits(['apply'])

const popoverRef = ref()

function toggle(event) {
  popoverRef.value.toggle(event)
}

const tahunOptions = [{ label: '2026', value: 2026 }, { label: '2025', value: 2025 }, { label: '2024', value: 2024 }]
const bulanOptions = [
  { label: 'Januari', value: 1 }, { label: 'Februari', value: 2 }, { label: 'Maret', value: 3 },
  { label: 'April', value: 4 }, { label: 'Mei', value: 5 }, { label: 'Juni', value: 6 },
  { label: 'Juli', value: 7 }, { label: 'Agustus', value: 8 }, { label: 'September', value: 9 },
  { label: 'Oktober', value: 10 }, { label: 'November', value: 11 }, { label: 'Desember', value: 12 },
]
const letterTypeOptions = [
  { label: 'Permohonan', value: 'Permohonan' },
  { label: 'Keterangan', value: 'Keterangan' },
  { label: 'Pengantar', value: 'Pengantar' },
  { label: 'Perintah', value: 'Perintah' },
  { label: 'Pernyataan', value: 'Pernyataan' },
]

const filter = reactive({
  tahun: 2026,
  bulan: null,
  letterType: [],
})

function handleReset() {
  filter.tahun = 2026
  filter.bulan = null
  filter.letterType = []
  emit('apply', { ...filter })
}

function handleApply() {
  emit('apply', { ...filter, letterType: [...filter.letterType] })
  popoverRef.value.hide()
}
</script>

<template>
  <Popover ref="popoverRef" class="!w-[300px]">
    <div class="flex flex-col gap-4">
      <p class="text-sm font-semibold text-neutral-900">Filter Lanjutan</p>

      <div>
        <label class="text-xs font-medium text-neutral-500 mb-1 block">Tahun</label>
        <Select v-model="filter.tahun" :options="tahunOptions" optionLabel="label" optionValue="value" class="w-full" />
      </div>

      <div>
        <label class="text-xs font-medium text-neutral-500 mb-1 block">Bulan</label>
        <Select
          v-model="filter.bulan"
          :options="bulanOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Semua bulan"
          showClear
          class="w-full"
        />
      </div>

      <div>
        <label class="text-xs font-medium text-neutral-500 mb-1 block">Jenis Surat</label>
        <MultiSelect
          v-model="filter.letterType"
          :options="letterTypeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Semua jenis"
          display="chip"
          class="w-full"
        />
      </div>

      <div class="flex justify-end gap-2 pt-2 border-t border-neutral-100">
        <AppButton label="Reset" variant="ghost" size="small" @click="handleReset" />
        <AppButton label="Terapkan" variant="primary" size="small" @click="handleApply" />
      </div>
    </div>
  </Popover>
</template>