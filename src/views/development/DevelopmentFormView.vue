<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import {
  useDevelopmentStore,
  DEVELOPMENT_CATEGORIES,
  DEVELOPMENT_STATUSES,
  DEVELOPMENT_VOLUME_UNITS,
} from '@/stores/development.store'
import { getDevelopment } from '@/services/development.service'

import Card from 'primevue/card'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import AppInput from '@/components/common/AppInput.vue'
import AppLocationPicker from '@/components/common/AppLocationPicker.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const developmentStore = useDevelopmentStore()

const isEdit = computed(() => !!route.params.id)
const saving = ref(false)

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const form = reactive({
  name: '',
  address: '',
  category: null,
  status: 'perencanaan',
  funding_source: '',
  budget: null,
  volume: null,
  volume_unit: 'meter',
  executor: '',
  year: new Date().getFullYear(),
  start_date: null,
  target_date: null,
  description: '',
  start_point: null,
  end_point: null,
  cover_image_file: null,
  progress: [],
})

const coverPreview = ref(null)
const errors = reactive({
  name: '',
  category: '',
  year: '',
  start_date: '',
  target_date: '',
})

const pageTitle = computed(() => (isEdit.value ? 'Edit Pembangunan' : 'Tambah Pembangunan'))
const mainButtonLabel = computed(() => (isEdit.value ? 'Perbarui' : 'Simpan'))

/* --------------------------------- Helpers --------------------------------- */

function toPoint(lat, lng) {
  if (lat == null || lng == null || lat === '' || lng === '') return null
  return { lat: Number(lat), lng: Number(lng) }
}

function parseDate(value) {
  return value ? new Date(`${String(value).slice(0, 10)}T00:00:00`) : null
}

function toDateString(date) {
  if (!date) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

let progressUid = 0

function createProgressItem(data = {}) {
  progressUid += 1
  return {
    uid: progressUid,
    id: data.id ?? null,
    percentage: data.percentage ?? 0,
    image_file: null,
    preview: data.preview ?? null,
  }
}

// Progress photos are fixed to three slots: 0%, 50%, and 100%.
const PROGRESS_PERCENTAGES = [0, 50, 100]
form.progress = PROGRESS_PERCENTAGES.map((percentage) => createProgressItem({ percentage }))

onMounted(async () => {
  if (!isEdit.value) return

  const existing = await getDevelopment(route.params.id)
  if (!existing) return

  form.name = existing.name
  form.address = existing.address ?? ''
  form.category = existing.category ?? null
  form.status = existing.status ?? 'perencanaan'
  form.funding_source = existing.funding_source ?? ''
  form.budget = existing.budget != null ? Number(existing.budget) : null
  form.volume = existing.volume != null ? Number(existing.volume) : null
  form.volume_unit = existing.volume_unit ?? 'meter'
  form.executor = existing.executor ?? ''
  form.year = existing.year ?? new Date().getFullYear()
  form.start_date = parseDate(existing.start_date)
  form.target_date = parseDate(existing.target_date)
  form.description = existing.description ?? ''
  form.start_point = toPoint(existing.latitude, existing.longitude)
  form.end_point = toPoint(existing.end_latitude, existing.end_longitude)
  coverPreview.value = existing.cover_image ?? null
  form.progress = PROGRESS_PERCENTAGES.map((percentage) => {
    const entry = (existing.progress ?? []).find((item) => Number(item.percentage) === percentage)
    return createProgressItem({
      id: entry?.progress_id,
      percentage,
      preview: entry?.image,
    })
  })
})

/* -------------------------------- Cover photo ------------------------------- */

function handleCoverFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  if (file.size > MAX_IMAGE_SIZE) {
    toast.add({ severity: 'error', summary: `Foto "${file.name}" melebihi 5MB`, life: 3000 })
    return
  }

  form.cover_image_file = file
  const reader = new FileReader()
  reader.onload = () => {
    coverPreview.value = reader.result
  }
  reader.readAsDataURL(file)
}

/* ----------------------------- Progress photos ----------------------------- */

function handleProgressFile(item, event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  if (file.size > MAX_IMAGE_SIZE) {
    toast.add({ severity: 'error', summary: `Foto "${file.name}" melebihi 5MB`, life: 3000 })
    return
  }

  item.image_file = file
  const reader = new FileReader()
  reader.onload = () => {
    item.preview = reader.result
  }
  reader.readAsDataURL(file)
}

/* ------------------------------- Submit flow ------------------------------- */

function validate() {
  errors.name = form.name.trim() ? '' : 'Nama kegiatan wajib diisi'
  errors.category = form.category ? '' : 'Kategori wajib dipilih'
  errors.year = form.year ? '' : 'Tahun anggaran wajib diisi'
  errors.start_date = form.start_date ? '' : 'Tanggal mulai wajib diisi'
  errors.target_date =
    form.start_date && form.target_date && form.target_date < form.start_date
      ? 'Target selesai tidak boleh sebelum tanggal mulai'
      : ''

  if (Object.values(errors).some(Boolean)) return false

  return true
}

async function handleSubmit() {
  if (!validate()) return
  saving.value = true
  try {
    const payload = {
      name: form.name,
      address: form.address,
      category: form.category,
      status: form.status,
      funding_source: form.funding_source,
      budget: form.budget,
      volume: form.volume,
      volume_unit: form.volume_unit,
      executor: form.executor,
      year: form.year,
      start_date: toDateString(form.start_date),
      target_date: toDateString(form.target_date),
      description: form.description,
      latitude: form.start_point?.lat ?? null,
      longitude: form.start_point?.lng ?? null,
      end_latitude: form.end_point?.lat ?? null,
      end_longitude: form.end_point?.lng ?? null,
      cover_image_file: form.cover_image_file,
      // Slots without a photo are skipped, only filled ones are saved.
      progress: form.progress.filter((item) => item.preview),
    }

    if (isEdit.value) {
      await developmentStore.update(route.params.id, payload)
    } else {
      await developmentStore.create(payload)
    }

    toast.add({
      severity: 'success',
      summary: isEdit.value
        ? 'Data pembangunan berhasil diperbarui'
        : 'Data pembangunan berhasil ditambahkan',
      life: 2000,
    })
    router.push({ name: 'development-list' })
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  router.push({ name: 'development-list' })
}
</script>

<template>
  <div class="min-h-full text-slate-800">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 class="m-0 text-[22px] font-bold text-slate-900">
        {{ pageTitle }}
      </h1>
    </div>

    <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div class="flex flex-col gap-5">
        <!-- Activity information -->
        <Card>
          <template #title>
            <span class="text-base font-semibold text-slate-900">Informasi Kegiatan</span>
          </template>
          <template #content>
            <div class="flex flex-col gap-5">
              <div class="flex flex-col gap-2">
                <label for="name" class="text-[13px] font-semibold text-slate-700">
                  Nama Kegiatan <span class="text-danger-500">*</span>
                </label>
                <AppInput
                  id="name"
                  v-model="form.name"
                  placeholder="Contoh: Rehabilitasi Jalan Lingkungan Padukuhan Sorasan"
                  :error="errors.name"
                  required
                />
              </div>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label for="category" class="text-[13px] font-semibold text-slate-700">
                    Kategori <span class="text-danger-500">*</span>
                  </label>
                  <Select
                    id="category"
                    v-model="form.category"
                    :options="DEVELOPMENT_CATEGORIES"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Pilih kategori"
                    :invalid="!!errors.category"
                    class="w-full"
                  />
                  <small v-if="errors.category" class="text-danger-500">{{ errors.category }}</small>
                </div>

                <div class="flex flex-col gap-2">
                  <label for="status" class="text-[13px] font-semibold text-slate-700">
                    Status <span class="text-danger-500">*</span>
                  </label>
                  <Select
                    id="status"
                    v-model="form.status"
                    :options="DEVELOPMENT_STATUSES"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                  />
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <label for="address" class="text-[13px] font-semibold text-slate-700">
                  Alamat / Lokasi
                </label>
                <AppInput
                  id="address"
                  v-model="form.address"
                  placeholder="Contoh: Padukuhan Sorasan, RT 04/RW 25"
                />
              </div>

              <div class="flex flex-col gap-2">
                <label for="description" class="text-[13px] font-semibold text-slate-700">
                  Deskripsi Kegiatan
                </label>
                <Textarea
                  id="description"
                  v-model="form.description"
                  rows="4"
                  autoResize
                  placeholder="Jelaskan cakupan dan tujuan kegiatan (opsional)"
                  class="w-full"
                />
              </div>
            </div>
          </template>
        </Card>

        <!-- Budget and executor -->
        <Card>
          <template #title>
            <span class="text-base font-semibold text-slate-900">Anggaran &amp; Pelaksana</span>
          </template>
          <template #content>
            <div class="flex flex-col gap-5">
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label for="budget" class="text-[13px] font-semibold text-slate-700">
                    Anggaran
                  </label>
                  <InputNumber
                    id="budget"
                    v-model="form.budget"
                    mode="currency"
                    currency="IDR"
                    locale="id-ID"
                    :maxFractionDigits="0"
                    :min="0"
                    class="w-full"
                    inputClass="w-full"
                  />
                </div>

                <div class="flex flex-col gap-2">
                  <label for="volume" class="text-[13px] font-semibold text-slate-700">
                    Volume
                  </label>
                  <div class="flex gap-2">
                    <InputNumber
                      id="volume"
                      v-model="form.volume"
                      :min="0"
                      :maxFractionDigits="2"
                      class="min-w-0 flex-1"
                      inputClass="w-full"
                    />
                    <Select
                      v-model="form.volume_unit"
                      :options="DEVELOPMENT_VOLUME_UNITS"
                      editable
                      placeholder="Satuan"
                      class="w-32 shrink-0"
                      aria-label="Satuan volume"
                    />
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label for="funding_source" class="text-[13px] font-semibold text-slate-700">
                    Sumber Dana
                  </label>
                  <AppInput
                    id="funding_source"
                    v-model="form.funding_source"
                    placeholder="Contoh: Dana Desa"
                  />
                </div>

                <div class="flex flex-col gap-2">
                  <label for="executor" class="text-[13px] font-semibold text-slate-700">
                    Pelaksana
                  </label>
                  <AppInput
                    id="executor"
                    v-model="form.executor"
                    placeholder="Contoh: TPK Kalurahan"
                  />
                </div>
              </div>

              <div class="flex flex-col gap-2 sm:max-w-[calc(50%-10px)]">
                <label for="year" class="text-[13px] font-semibold text-slate-700">
                  Tahun Anggaran <span class="text-danger-500">*</span>
                </label>
                <InputNumber
                  id="year"
                  v-model="form.year"
                  :useGrouping="false"
                  :min="2000"
                  :max="2100"
                  :invalid="!!errors.year"
                  class="w-full"
                  inputClass="w-full"
                />
                <small v-if="errors.year" class="text-danger-500">{{ errors.year }}</small>
              </div>
            </div>
          </template>
        </Card>

        <!-- Schedule -->
        <Card>
          <template #title>
            <span class="text-base font-semibold text-slate-900">Jadwal</span>
          </template>
          <template #content>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label for="start_date" class="text-[13px] font-semibold text-slate-700">
                  Mulai <span class="text-danger-500">*</span>
                </label>
                <DatePicker
                  id="start_date"
                  v-model="form.start_date"
                  dateFormat="dd/mm/yy"
                  showIcon
                  iconDisplay="input"
                  :invalid="!!errors.start_date"
                  class="w-full"
                />
                <small v-if="errors.start_date" class="text-danger-500">{{ errors.start_date }}</small>
              </div>

              <div class="flex flex-col gap-2">
                <label for="target_date" class="text-[13px] font-semibold text-slate-700">
                  Target Selesai
                </label>
                <DatePicker
                  id="target_date"
                  v-model="form.target_date"
                  dateFormat="dd/mm/yy"
                  showIcon
                  iconDisplay="input"
                  :minDate="form.start_date"
                  :invalid="!!errors.target_date"
                  class="w-full"
                />
                <small v-if="errors.target_date" class="text-danger-500">{{ errors.target_date }}</small>
              </div>
            </div>
          </template>
        </Card>

        <!-- Location -->
        <Card>
          <template #title>
            <span class="text-base font-semibold text-slate-900">Lokasi di Peta</span>
          </template>
          <template #content>
            <AppLocationPicker v-model:start="form.start_point" v-model:end="form.end_point" />
          </template>
        </Card>

        <!-- Cover photo -->
        <Card>
          <template #title>
            <span class="text-base font-semibold text-slate-900">Foto Utama</span>
          </template>
          <template #content>
            <div class="flex flex-col gap-2">
              <label
                class="group relative flex aspect-[16/9] cursor-pointer items-center justify-center overflow-hidden rounded-xl transition-colors"
                :class="
                  coverPreview
                    ? 'border border-slate-200 bg-slate-50'
                    : 'border-2 border-dashed border-primary-200 bg-primary-50/40 hover:bg-primary-50'
                "
              >
                <img
                  v-if="coverPreview"
                  :src="coverPreview"
                  alt="Foto utama pembangunan"
                  class="h-full w-full object-cover"
                />
                <div v-else class="flex flex-col items-center text-slate-500">
                  <i class="pi pi-cloud-upload mb-2 text-3xl text-primary-400" />
                  <p class="m-0 text-sm">
                    <span class="font-medium text-primary-600">Klik untuk unggah foto utama</span>
                  </p>
                  <p class="mt-1 text-xs text-slate-400">JPG atau PNG, maks. 5MB</p>
                </div>

                <span
                  v-if="coverPreview"
                  class="absolute inset-0 flex items-center justify-center bg-slate-900/0 text-sm font-medium text-white opacity-0 transition-colors group-hover:bg-slate-900/40 group-hover:opacity-100"
                >
                  Ganti foto
                </span>

                <input type="file" accept="image/*" class="hidden" @change="handleCoverFile" />
              </label>
              <small class="text-xs text-slate-400">
                Tampil sebagai foto besar di halaman detail dan sampul pada daftar pembangunan.
              </small>
            </div>
          </template>
        </Card>

        <!-- Progress photos -->
        <Card>
          <template #title>
            <span class="text-base font-semibold text-slate-900">Foto Progres Pembangunan</span>
          </template>
          <template #content>
            <p class="m-0 mb-3 text-xs text-slate-400">
              Tampil sebagai foto kecil berlabel persentase di bawah foto utama. Slot yang belum diberi foto tidak akan disimpan.
            </p>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label
                v-for="item in form.progress"
                :key="item.uid"
                class="group relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-xl transition-colors"
                :class="
                  item.preview
                    ? 'border border-slate-200 bg-slate-50'
                    : 'border-2 border-dashed border-primary-200 bg-primary-50/40 hover:bg-primary-50'
                "
              >
                <img
                  v-if="item.preview"
                  :src="item.preview"
                  :alt="`Foto progres ${item.percentage}%`"
                  class="h-full w-full object-cover"
                />
                <div v-else class="flex flex-col items-center text-slate-400">
                  <i class="pi pi-cloud-upload mb-1 text-3xl text-primary-400" />
                  <span class="text-xs">Klik untuk unggah foto</span>
                </div>

                <span
                  class="absolute left-2 top-2 z-10 rounded-md bg-white/90 px-2 py-0.5 text-xs font-bold text-slate-700 shadow-sm"
                >
                  {{ item.percentage }}%
                </span>

                <span
                  v-if="item.preview"
                  class="absolute inset-0 flex items-center justify-center bg-slate-900/0 text-sm font-medium text-white opacity-0 transition-colors group-hover:bg-slate-900/40 group-hover:opacity-100"
                >
                  Ganti foto
                </span>

                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleProgressFile(item, $event)"
                />
              </label>
            </div>
          </template>
        </Card>
      </div>

      <aside class="flex flex-col gap-3.5 lg:sticky lg:top-4">
        <Card>
          <template #content>
            <div class="flex gap-2.5">
              <Button
                label="Batal"
                severity="secondary"
                outlined
                class="flex-1"
                type="button"
                @click="handleCancel"
              />

              <Button
                :label="mainButtonLabel"
                class="flex-1"
                type="button"
                :loading="saving"
                @click="handleSubmit"
              />
            </div>
          </template>
        </Card>
      </aside>
    </div>
  </div>
</template>