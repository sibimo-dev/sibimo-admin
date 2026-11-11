<script setup>

import { ref, watch } from 'vue'

import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'
import { serviceHoursService } from '@/services/content.service'

const props = defineProps({
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'saved'])

const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

// day_of_week: 1 = Monday ... 7 = Sunday
function defaultHours() {
  return dayLabels.map((label, index) => ({
    day_of_week: index + 1,
    label,
    is_closed: index >= 5,
    open_time: '08:00',
    close_time: index === 4 ? '11:00' : '15:00',
  }))
}

const hours = ref(defaultHours())
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')

async function loadHours() {
  loading.value = true
  try {
    const data = await serviceHoursService.list()
    if (Array.isArray(data) && data.length > 0) {
      hours.value = defaultHours().map((day) => {
        const saved = data.find(item => Number(item.day_of_week) === day.day_of_week)
        return saved
          ? {
              ...day,
              is_closed: Boolean(saved.is_closed),
              open_time: (saved.open_time ?? day.open_time).slice(0, 5),
              close_time: (saved.close_time ?? day.close_time).slice(0, 5),
            }
          : day
      })
    }
  } catch (error) {
    errorMessage.value = 'Jam pelayanan belum dapat dimuat.'
    console.error('Failed to load service hours:', error)
  } finally {
    loading.value = false
  }
}

// Reload the latest saved hours every time the dialog opens
watch(
  () => props.visible,
  (open) => {
    if (!open) return
    hours.value = defaultHours()
    errorMessage.value = ''
    loadHours()
  }
)

function validate() {
  for (const day of hours.value) {
    if (day.is_closed) continue
    if (!day.open_time || !day.close_time) {
      return `Jam buka dan tutup hari ${day.label} wajib diisi.`
    }
    if (day.close_time <= day.open_time) {
      return `Jam tutup hari ${day.label} harus setelah jam buka.`
    }
  }
  return ''
}

async function save() {
  errorMessage.value = validate()
  if (errorMessage.value) return

  saving.value = true
  try {
    await serviceHoursService.save({
      hours: hours.value.map(({ day_of_week, is_closed, open_time, close_time }) => ({
        day_of_week,
        is_closed,
        open_time: is_closed ? null : open_time,
        close_time: is_closed ? null : close_time,
      })),
    })
    emit('saved')
    close()
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? 'Gagal menyimpan jam pelayanan.'
  } finally {
    saving.value = false
  }
}

function close() {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :draggable="false"
    :closable="!saving"
    header="Jam Pelayanan"
    :style="{ width: '34rem' }"
    :breakpoints="{ '640px': '95vw' }"
    @update:visible="emit('update:visible', $event)"
  >
    <p class="m-0 mb-4 text-[13px] text-neutral-500">
      Jam pelayanan ditampilkan di teks berjalan pada situs publik.
    </p>

    <div v-if="loading" class="py-10 text-center text-neutral-400">Memuat data...</div>

    <div v-else class="flex flex-col gap-2.5">

      <div
        v-for="day in hours"
        :key="day.day_of_week"
        class="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 px-3.5 py-2.5"
      >
        <span class="w-16 text-[13px] font-semibold text-neutral-700">{{ day.label }}</span>

        <div class="flex items-center gap-2">
          <ToggleSwitch v-model="day.is_closed" :inputId="`closed-${day.day_of_week}`" />
          <label :for="`closed-${day.day_of_week}`" class="text-[13px] text-neutral-500">Libur</label>
        </div>

        <div v-if="!day.is_closed" class="ml-auto flex items-center gap-2">
          <InputText
            v-model="day.open_time"
            type="time"
            class="rounded-lg border border-neutral-300 px-2 py-1.5 text-[13px]"
          />
          <span class="text-neutral-400">–</span>
          <InputText
            v-model="day.close_time"
            type="time"
            class="rounded-lg border border-neutral-300 px-2 py-1.5 text-[13px]"
          />
        </div>

        <span v-else class="ml-auto text-[13px] text-neutral-400">Tutup</span>
      </div>

      <p v-if="errorMessage" class="m-0 mt-1 text-[13px] text-danger-600">{{ errorMessage }}</p>
    </div>

    <template #footer>
      <Button
        label="Batal"
        severity="secondary"
        outlined
        :disabled="saving"
        class="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:bg-neutral-100"
        @click="close"
      />
      <Button
        label="Simpan"
        icon="pi pi-check"
        :loading="saving"
        :disabled="loading"
        class="rounded-lg border border-primary-700 bg-primary-700 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-primary-800"
        @click="save"
      />
    </template>
  </Dialog>
</template>