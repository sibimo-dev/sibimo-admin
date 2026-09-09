<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { createCitizen, deleteCitizen as removeCitizen, getCitizen, updateCitizen } from '@/services/citizen.service'
import { updateListCache } from '@/services/list-cache'

import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()

const citizenId = computed(() => route.params.id ?? null)
const isEditMode = computed(() => citizenId.value !== null)

const pageTitle = computed(() => (
  isEditMode.value ? 'Edit Data Warga' : 'Tambah Data Warga'
))

const mainButtonLabel = computed(() => (
  isEditMode.value ? 'Perbarui' : 'Simpan'
))

const genderOptions = ['Laki-laki', 'Perempuan']
const recordTypeOptions = ['PENDUDUK', 'MATI', 'PINDAH', 'ORANG LUAR']
const recordEventOptions = ['Lahir01', 'Datang01', 'Pindah01', 'Mati01']
const bloodTypeOptions = ['A', 'B', 'AB', 'O']
const certificateOptions = ['Ada', 'Belum Ada']
const disabilityOptions = ['Tidak Ada', 'Ada']
const nationalityOptions = ['WNI', 'WNA']
const educationOptions = ['Tidak Sekolah', 'SD', 'SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3']
const maritalStatusOptions = ['Belum Menikah', 'Menikah', 'Cerai Hidup', 'Cerai Mati']
const religionOptions = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya']
const statusOptions = [
  { label: 'Active', value: 'Active' },
  { label: 'Pindah', value: 'Pindah' },
]

const fullName = ref('')
const recordType = ref('PENDUDUK')
const recordEvent = ref('Lahir01')
const nationalId = ref('')
const familyCardNumber = ref('')
const dusun = ref('')
const rt = ref('')
const rw = ref('')
const gender = ref('Laki-laki')
const birthPlace = ref('')
const birthDate = ref(null)
const age = ref(null)
const birthCertificateStatus = ref('')
const birthCertificateNumber = ref('')
const bloodType = ref('')
const phoneNumber = ref('')
const address = ref('')
const occupation = ref('')
const education = ref('SMA/SMK')
const maritalStatus = ref('Belum Menikah')
const marriageCertificateStatus = ref('')
const marriageCertificateNumber = ref('')
const marriageDate = ref(null)
const divorceCertificateStatus = ref('')
const divorceCertificateNumber = ref('')
const divorceDate = ref(null)
const familyRelationship = ref('')
const physicalDisability = ref('')
const disabilityStatus = ref('')
const religion = ref('Islam')
const motherNationalId = ref('')
const motherName = ref('')
const fatherNationalId = ref('')
const fatherName = ref('')
const nationality = ref('WNI')
const ktpAddress = ref('')

const status = ref('Active')
const statusOpen = ref(true)

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')

const statusLabelMap = {
  Active: 'Active',
  Pindah: 'Pindah',
}

const statusDisplay = computed(() => (
  statusLabelMap[status.value] ?? status.value
))

// Helper: format Date object -> 'YYYY-MM-DD' buat dikirim ke backend
function toApiDate(date) {
  if (!date) return null
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().split('T')[0]
}

function fromApiDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

// GANTI: dari hardcode dummy -> fetch data asli dari API
async function fetchCitizenDetail() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await getCitizen(citizenId.value)

    recordType.value = data.record_type ?? 'PENDUDUK'
    recordEvent.value = data.record_event ?? 'Lahir01'
    fullName.value = data.full_name ?? ''
    nationalId.value = data.national_id ?? ''
    familyCardNumber.value = data.family_card_number ?? ''
    dusun.value = data.dusun ?? ''
    rt.value = data.rt ?? ''
    rw.value = data.rw ?? ''
    gender.value = data.gender ?? 'Laki-laki'
    birthPlace.value = data.birth_place ?? ''
    birthDate.value = fromApiDate(data.birth_date)
    age.value = data.age ?? null
    birthCertificateStatus.value = data.birth_certificate_status ?? ''
    birthCertificateNumber.value = data.birth_certificate_number ?? ''
    bloodType.value = data.blood_type ?? ''
    phoneNumber.value = data.phone_number ?? ''
    address.value = data.address ?? ''
    occupation.value = data.occupation ?? ''
    education.value = data.education ?? 'SMA/SMK'
    maritalStatus.value = data.marital_status ?? 'Belum Menikah'
    marriageCertificateStatus.value = data.marriage_certificate_status ?? ''
    marriageCertificateNumber.value = data.marriage_certificate_number ?? ''
    marriageDate.value = fromApiDate(data.marriage_date)
    divorceCertificateStatus.value = data.divorce_certificate_status ?? ''
    divorceCertificateNumber.value = data.divorce_certificate_number ?? ''
    divorceDate.value = fromApiDate(data.divorce_date)
    familyRelationship.value = data.family_relationship ?? ''
    physicalDisability.value = data.physical_disability ?? ''
    disabilityStatus.value = data.disability_status ?? ''
    religion.value = data.religion ?? 'Islam'
    motherNationalId.value = data.mother_national_id ?? ''
    motherName.value = data.mother_name ?? ''
    fatherNationalId.value = data.father_national_id ?? ''
    fatherName.value = data.father_name ?? ''
    nationality.value = data.nationality ?? 'WNI'
    ktpAddress.value = data.ktp_address ?? data.address ?? ''
    status.value = data.status ?? 'Active'
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Gagal memuat detail data warga.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!isEditMode.value) return
  fetchCitizenDetail()
})

function goBack() {
  router.push({ name: 'citizen-list' })
}

// GANTI: beneran kirim ke API (POST buat tambah baru, PUT buat update)
async function saveCitizen() {
  saving.value = true
  errorMessage.value = ''

  const payload = {
    record_type: recordType.value,
    record_event: recordEvent.value,
    full_name: fullName.value,
    national_id: nationalId.value,
    family_card_number: familyCardNumber.value,
    dusun: dusun.value,
    rt: rt.value,
    rw: rw.value,
    gender: gender.value,
    birth_place: birthPlace.value,
    birth_date: toApiDate(birthDate.value),
    age: age.value,
    birth_certificate_status: birthCertificateStatus.value,
    birth_certificate_number: birthCertificateNumber.value,
    blood_type: bloodType.value,
    phone_number: phoneNumber.value,
    address: address.value,
    occupation: occupation.value,
    education: education.value,
    marital_status: maritalStatus.value,
    marriage_certificate_status: marriageCertificateStatus.value,
    marriage_certificate_number: marriageCertificateNumber.value,
    marriage_date: toApiDate(marriageDate.value),
    divorce_certificate_status: divorceCertificateStatus.value,
    divorce_certificate_number: divorceCertificateNumber.value,
    divorce_date: toApiDate(divorceDate.value),
    family_relationship: familyRelationship.value,
    physical_disability: physicalDisability.value,
    disability_status: disabilityStatus.value,
    religion: religion.value,
    mother_national_id: motherNationalId.value,
    mother_name: motherName.value,
    father_national_id: fatherNationalId.value,
    father_name: fatherName.value,
    nationality: nationality.value,
    ktp_address: ktpAddress.value,
    status: status.value,
  }

  try {
    const saved = isEditMode.value
      ? await updateCitizen(citizenId.value, payload)
      : await createCitizen(payload)

    updateListCache('citizens', items => {
      if (isEditMode.value) {
        return items.map(item => item.citizen_id === Number(citizenId.value)
          ? { ...item, ...saved }
          : item)
      }

      return [saved, ...items]
    })
    router.push({ name: 'citizen-list' })
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Gagal menyimpan data warga.'
  } finally {
    saving.value = false
  }
}

// GANTI: beneran hapus lewat API
function deleteCitizen() {
  confirm.require({
    message: `Hapus data warga "${fullName.value}" dengan NIK "${nationalId.value}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await removeCitizen(citizenId.value)
        router.push({ name: 'citizen-list' })
      } catch (err) {
        errorMessage.value = err.response?.data?.message || 'Gagal menghapus data warga.'
      }
    },
  })
}
</script>

<template>
  <div>

    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 class="m-0 text-2xl font-bold text-primary-900">
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

      <Card>
        <template #content>
          <div class="flex flex-col gap-5">

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
                <label class="text-[13px] font-semibold text-neutral-700" for="recordType">Jenis Data</label>
                <Select
                  id="recordType"
                  v-model="recordType"
                  :options="recordTypeOptions"
                  class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800"
                  :pt="{ label: { class: 'px-3 py-2.5' } }"
                />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="recordEvent">Peristiwa</label>
                <Select
                  id="recordEvent"
                  v-model="recordEvent"
                  :options="recordEventOptions"
                  class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800"
                  :pt="{ label: { class: 'px-3 py-2.5' } }"
                />
              </div>
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

            <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="dusun">Dusun</label>
                <InputText id="dusun" v-model="dusun" placeholder="Nama dusun" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="rt">RT</label>
                <InputText id="rt" v-model="rt" placeholder="RT" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="rw">RW</label>
                <InputText id="rw" v-model="rw" placeholder="RW" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
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
                <label class="text-[13px] font-semibold text-neutral-700" for="age">Umur</label>
                <InputText id="age" v-model="age" type="number" min="0" max="150" placeholder="Umur" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="bloodType">Golongan Darah</label>
                <Select id="bloodType" v-model="bloodType" :options="bloodTypeOptions" placeholder="Pilih golongan darah" class="w-full rounded-lg border border-neutral-300 bg-white text-[13px]" :pt="{ label: { class: 'px-3 py-2.5' } }" />
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="birthCertificateStatus">Akta Lahir</label>
                <Select id="birthCertificateStatus" v-model="birthCertificateStatus" :options="certificateOptions" placeholder="Pilih status" class="w-full rounded-lg border border-neutral-300 bg-white text-[13px]" :pt="{ label: { class: 'px-3 py-2.5' } }" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="birthCertificateNumber">Nomor Akta Lahir</label>
                <InputText id="birthCertificateNumber" v-model="birthCertificateNumber" placeholder="Nomor akta lahir" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
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

            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="marriageCertificateStatus">Akta Kawin</label>
                <Select id="marriageCertificateStatus" v-model="marriageCertificateStatus" :options="certificateOptions" placeholder="Pilih status" class="w-full rounded-lg border border-neutral-300 bg-white text-[13px]" :pt="{ label: { class: 'px-3 py-2.5' } }" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="marriageCertificateNumber">Nomor Akta Kawin</label>
                <InputText id="marriageCertificateNumber" v-model="marriageCertificateNumber" placeholder="Nomor akta kawin" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="marriageDate">Tanggal Kawin</label>
                <DatePicker id="marriageDate" v-model="marriageDate" dateFormat="yy-mm-dd" showIcon iconDisplay="input" class="w-full rounded-lg border border-neutral-300 bg-white text-[13px]" :pt="{ pcInputText: { root: { class: 'w-full px-3 py-2.5' } } }" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="familyRelationship">Hubungan Dalam Keluarga</label>
                <InputText id="familyRelationship" v-model="familyRelationship" placeholder="Contoh: Kepala Keluarga" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="divorceCertificateStatus">Akta Cerai</label>
                <Select id="divorceCertificateStatus" v-model="divorceCertificateStatus" :options="certificateOptions" placeholder="Pilih status" class="w-full rounded-lg border border-neutral-300 bg-white text-[13px]" :pt="{ label: { class: 'px-3 py-2.5' } }" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="divorceCertificateNumber">Nomor Akta Cerai</label>
                <InputText id="divorceCertificateNumber" v-model="divorceCertificateNumber" placeholder="Nomor akta cerai" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="divorceDate">Tanggal Cerai</label>
                <DatePicker id="divorceDate" v-model="divorceDate" dateFormat="yy-mm-dd" showIcon iconDisplay="input" class="w-full rounded-lg border border-neutral-300 bg-white text-[13px]" :pt="{ pcInputText: { root: { class: 'w-full px-3 py-2.5' } } }" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="nationality">Kewarganegaraan</label>
                <Select id="nationality" v-model="nationality" :options="nationalityOptions" class="w-full rounded-lg border border-neutral-300 bg-white text-[13px]" :pt="{ label: { class: 'px-3 py-2.5' } }" />
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">

              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="occupation">
                  Pekerjaan
                </label>

                <InputText
                  id="occupation"
                  v-model="occupation"
                  placeholder="Pekerjaan warga"
                  class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                />
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="education">
                  Pendidikan
                </label>

                <Select
                  id="education"
                  v-model="education"
                  :options="educationOptions"
                  class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  :pt="{ label: { class: 'px-3 py-2.5' } }"
                />
              </div>

            </div>

            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">

              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="maritalStatus">
                  Status Pernikahan
                </label>

                <Select
                  id="maritalStatus"
                  v-model="maritalStatus"
                  :options="maritalStatusOptions"
                  class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  :pt="{ label: { class: 'px-3 py-2.5' } }"
                />
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="religion">
                  Agama
                </label>

                <Select
                  id="religion"
                  v-model="religion"
                  :options="religionOptions"
                  class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  :pt="{ label: { class: 'px-3 py-2.5' } }"
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

            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="physicalDisability">Kelainan Fisik</label>
                <InputText id="physicalDisability" v-model="physicalDisability" placeholder="Kelainan fisik" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="disabilityStatus">Penyandang Cacat</label>
                <Select id="disabilityStatus" v-model="disabilityStatus" :options="disabilityOptions" placeholder="Pilih status" class="w-full rounded-lg border border-neutral-300 bg-white text-[13px]" :pt="{ label: { class: 'px-3 py-2.5' } }" />
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="motherName">Nama Lengkap Ibu</label>
                <InputText id="motherName" v-model="motherName" placeholder="Nama ibu" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="motherNationalId">NIK Ibu</label>
                <InputText id="motherNationalId" v-model="motherNationalId" maxlength="16" inputmode="numeric" placeholder="NIK ibu" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="fatherName">Nama Lengkap Ayah</label>
                <InputText id="fatherName" v-model="fatherName" placeholder="Nama ayah" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-neutral-700" for="fatherNationalId">NIK Ayah</label>
                <InputText id="fatherNationalId" v-model="fatherNationalId" maxlength="16" inputmode="numeric" placeholder="NIK ayah" class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px]" />
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-[13px] font-semibold text-neutral-700" for="ktpAddress">
                Alamat sesuai KTP
              </label>

              <Textarea
                id="ktpAddress"
                v-model="ktpAddress"
                rows="3"
                placeholder="Alamat lengkap sesuai KTP"
                class="w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              />
            </div>

          </div>
        </template>
      </Card>

      <aside class="flex flex-col gap-5">

        <Card>
          <template #content>
            <div class="flex gap-2.5">
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
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-2.5">
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
          </template>
        </Card>

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
