<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'

const route = useRoute()
const router = useRouter()

const citizenId = computed(() => route.params.id ?? null)
const isEditMode = computed(() => citizenId.value !== null)

const pageTitle = computed(() => (
  isEditMode.value ? 'Edit Data Warga' : 'Tambah Data Warga'
))

const mainButtonLabel = computed(() => (
  isEditMode.value ? 'Perbarui' : 'Simpan'
))

const genderOptions = ['Laki-laki', 'Perempuan']
const statusOptions = [
  { label: 'Active', value: 'Active' },
  { label: 'Pindah', value: 'Pindah' },
]

const fullName = ref('')
const nationalId = ref('')
const familyCardNumber = ref('')
const gender = ref('Laki-laki')
const birthPlace = ref('')
const birthDate = ref(null)
const phoneNumber = ref('')
const address = ref('')

const status = ref('Active')
const statusOpen = ref(true)

const statusLabelMap = {
  Active: 'Active',
  Pindah: 'Pindah',
}

const statusDisplay = computed(() => (
  statusLabelMap[status.value] ?? status.value
))

onMounted(() => {
  if (!isEditMode.value) return

  fullName.value = 'Budi Santoso'
  nationalId.value = '3273123456789012'
  familyCardNumber.value = '3273120001112223'
  gender.value = 'Laki-laki'
  birthPlace.value = 'Yogyakarta'
  birthDate.value = new Date('1990-05-14')
  phoneNumber.value = '081234567890'
  address.value = 'Jl. Merdeka No. 1, RT 01/RW 02'
  status.value = 'Active'
})

function goBack() {
  router.push({ name: 'citizen-list' })
}

function saveCitizen() {
  router.push({ name: 'citizen-list' })
}

function deleteCitizen() {
  router.push({ name: 'citizen-list' })
}
</script>

<template>
  <div class="min-h-full px-6 py-6 text-neutral-800 lg:px-8">

    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 class="m-0 text-[22px] font-bold text-primary-900">
        {{ pageTitle }}
      </h1>

      <Button
        label="Kembali ke Daftar Warga"
        icon="pi pi-arrow-left"
        severity="secondary"
        outlined
        class="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
        @click="goBack"
      />
    </div>

    <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">

      <div class="flex flex-col gap-5 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">

        <div class="flex flex-col gap-2">
          <label class="text-[13px] font-semibold text-neutral-700" for="fullName">
            Nama Lengkap
          </label>

          <InputText
            id="fullName"
            v-model="fullName"
            placeholder="Nama lengkap warga"
            class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          />
        </div>

        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">

          <div class="flex flex-col gap-2">
            <label class="text-[13px] font-semibold text-neutral-700" for="nationalId">
              NIK
            </label>

            <InputText
              id="nationalId"
              v-model="nationalId"
              maxlength="16"
              inputmode="numeric"
              placeholder="16 digit NIK"
              class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-[13px] font-semibold text-neutral-700" for="familyCardNumber">
              Nomor KK
            </label>

            <InputText
              id="familyCardNumber"
              v-model="familyCardNumber"
              maxlength="16"
              inputmode="numeric"
              placeholder="16 digit nomor KK"
              class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            />
          </div>

        </div>

        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">

          <div class="flex flex-col gap-2">
            <label class="text-[13px] font-semibold text-neutral-700" for="gender">
              Jenis Kelamin
            </label>

            <Select
              id="gender"
              v-model="gender"
              :options="genderOptions"
              class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              :pt="{ label: { class: 'px-3 py-2.5' } }"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-[13px] font-semibold text-neutral-700" for="phoneNumber">
              Nomor Telepon
            </label>

            <InputText
              id="phoneNumber"
              v-model="phoneNumber"
              inputmode="tel"
              placeholder="08xxxxxxxxxx"
              class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            />
          </div>

        </div>

        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">

          <div class="flex flex-col gap-2">
            <label class="text-[13px] font-semibold text-neutral-700" for="birthPlace">
              Tempat Lahir
            </label>

            <InputText
              id="birthPlace"
              v-model="birthPlace"
              placeholder="Tempat lahir"
              class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-[13px] font-semibold text-neutral-700" for="birthDate">
              Tanggal Lahir
            </label>

            <DatePicker
              id="birthDate"
              v-model="birthDate"
              dateFormat="yy-mm-dd"
              showIcon
              iconDisplay="input"
              class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              :pt="{ pcInputText: { root: { class: 'w-full px-3 py-2.5' } } }"
            />
          </div>

        </div>

        <div class="flex flex-col gap-2">
          <label class="text-[13px] font-semibold text-neutral-700" for="address">
            Alamat
          </label>

          <Textarea
            id="address"
            v-model="address"
            rows="3"
            placeholder="Alamat lengkap warga"
            class="w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          />
        </div>

      </div>

      <aside class="flex flex-col gap-3.5">

        <div class="flex gap-2.5 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
          <Button
            label="Batal"
            severity="secondary"
            outlined
            class="flex-1 rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
            @click="goBack"
          />

          <Button
            :label="mainButtonLabel"
            class="flex-1 rounded-lg border border-primary-500 bg-primary-500 px-3.5 py-2.5 text-[13px] font-medium text-white hover:bg-primary-600"
            @click="saveCitizen"
          />
        </div>

        <div class="flex flex-col gap-2.5 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
          <button
            type="button"
            class="flex items-center justify-between bg-transparent p-0 text-left text-[13px] text-neutral-700"
            @click="statusOpen = !statusOpen"
          >
            <span>
              Status:
              <strong>{{ statusDisplay }}</strong>
            </span>

            <i
              class="pi pi-chevron-up text-[11px] text-neutral-400 transition-transform"
              :class="statusOpen ? 'rotate-180' : ''"
            />
          </button>

          <div v-show="statusOpen" class="flex flex-col gap-1.5">
            <Select
              v-model="status"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              :pt="{ label: { class: 'px-3 py-2.5' } }"
            />
          </div>
        </div>

        <Button
          v-if="isEditMode"
          label="Hapus Data Warga"
          icon="pi pi-trash"
          severity="secondary"
          outlined
          class="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
          @click="deleteCitizen"
        />

      </aside>
    </div>
  </div>
</template>