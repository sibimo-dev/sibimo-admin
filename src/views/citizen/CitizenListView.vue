<script setup>

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import { FilterMatchMode } from '@primevue/core/api'
import { useConfirm } from 'primevue/useconfirm'
import { createCitizen, deleteCitizen as removeCitizen, getCitizens } from '@/services/citizen.service'
import { getListCache, setListCache } from '@/services/list-cache'

import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import FileUpload from 'primevue/fileupload'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog' 

const router = useRouter()
const confirm = useConfirm()

const cachedCitizens = getListCache('citizens')
const residents = ref((cachedCitizens ?? []).map(mapCitizenFromApi))
const loading = ref(!cachedCitizens)
const loadError = ref('')

const detailDialogVisible = ref(false)
const selectedDetailResident = ref(null)

function viewDetail(data) {
  selectedDetailResident.value = data
  detailDialogVisible.value = true
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// Mapping field backend (snake_case) -> field yang dipakai UI (camelCase)
// Kenapa perlu mapping: biar KODE TEMPLATE DI BAWAH (Column, dst) TIDAK PERLU DIUBAH SAMA SEKALI.
function mapCitizenFromApi(item) {
  return {
    id: item.citizen_id,
    recordType: item.record_type,
    recordEvent: item.record_event,
    name: item.full_name,
    nationalId: item.national_id, 
    familyCardNumber: item.family_card_number,
    dusun: item.dusun,
    rt: item.rt,
    rw: item.rw,
    gender: item.gender,
    address: item.address,
    ktpAddress: item.ktp_address,
    status: item.status,
    occupation: item.occupation,
    education: item.education,
    maritalStatus: item.marital_status,
    religion: item.religion,
    phoneNumber: item.phone_number,
    birthPlace: item.birth_place,
    birthDate: item.birth_date,
    age: item.age,
    birthCertificateStatus: item.birth_certificate_status,
    birthCertificateNumber: item.birth_certificate_number,
    bloodType: item.blood_type,
    marriageCertificateStatus: item.marriage_certificate_status,
    marriageCertificateNumber: item.marriage_certificate_number,
    marriageDate: item.marriage_date,
    divorceCertificateStatus: item.divorce_certificate_status,
    divorceCertificateNumber: item.divorce_certificate_number,
    divorceDate: item.divorce_date,
    familyRelationship: item.family_relationship,
    physicalDisability: item.physical_disability,
    disabilityStatus: item.disability_status,
    motherNationalId: item.mother_national_id,
    motherName: item.mother_name,
    fatherNationalId: item.father_national_id,
    fatherName: item.father_name,
    nationality: item.nationality,
  }
}

async function fetchCitizens({ background = false } = {}) {
  if (!background) loading.value = true
  loadError.value = ''
  try {
    const data = await getCitizens()
    const normalized = Array.isArray(data) ? data : []
    setListCache('citizens', normalized)
    residents.value = normalized.map(mapCitizenFromApi)
  } catch (err) {
    loadError.value = err.response?.data?.message || 'Gagal memuat data warga.'
    if (!background) residents.value = []
  } finally {
    if (!background) loading.value = false
  }
}

// Panggil sekali waktu halaman dibuka
onMounted(() => fetchCitizens({ background: Boolean(cachedCitizens) }))

const selectedResidents = ref([])
const rowsPerPage = ref(10)

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

const importError = ref('')
const importSuccess = ref('')

function statusSeverity(status) {
  return status === 'Active' ? 'success' : 'warn'
}

function createResident() {
  router.push({ name: 'citizen-create' })
}

function editResident(id) {
  router.push({ name: 'citizen-edit', params: { id } })
}


// GANTI: deleteResident sekarang beneran panggil API, bukan cuma filter array lokal
async function deleteResident(data) {
  confirm.require({
    message: `Hapus data warga "${data.name}" dengan NIK "${data.nationalId}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await removeCitizen(data.id)
        residents.value = residents.value.filter(resident => resident.id !== data.id)
        setListCache('citizens', items => items.filter(item => item.citizen_id !== data.id))
        selectedResidents.value = selectedResidents.value.filter(resident => resident.id !== data.id)
      } catch (err) {
        loadError.value = err.response?.data?.message || 'Gagal menghapus data warga.'
      }
    },
  })
}


// GANTI: hapus banyak sekaligus -> panggil API satu-satu (backend belum ada endpoint bulk-delete)
async function deleteSelected() {
  confirm.require({
    message: `Hapus ${selectedResidents.value.length} data warga terpilih?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      const idsToDelete = selectedResidents.value.map(resident => resident.id)
      try {
        await Promise.all(idsToDelete.map(id => removeCitizen(id)))
        const idSet = new Set(idsToDelete)
        residents.value = residents.value.filter(resident => !idSet.has(resident.id))
        setListCache('citizens', items => items.filter(item => !idSet.has(item.citizen_id)))
        selectedResidents.value = []
      } catch (err) {
        loadError.value = err.response?.data?.message || 'Sebagian data gagal dihapus.'
        await fetchCitizens() // sinkronin ulang biar data yg berhasil kehapus tetap ke-refresh
      }
    },
  })
}

// --- Bagian import Excel (handleFileSelect, mapRowToResident, normalizeKey)
// TETAP SAMA PERSIS, tidak perlu diubah -- itu logic baca file, bukan komunikasi API.

function normalizeKey(key) {
  return String(key ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function excelDateToIso(value) {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const raw = String(value).trim()
  if (!raw) return null

  if (/^\d+(\.\d+)?$/.test(raw)) {
    const parsed = XLSX.SSF.parse_date_code(Number(raw))
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`
  }

  const parts = raw.split(/[\/-]/).map(Number)
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    const [first, second, third] = parts
    const year = first > 31 ? first : third
    const month = first > 31 ? second : second
    const day = first > 31 ? third : first
    if (year && month && day) return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

function normalizeGender(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'p' || normalized === 'perempuan') return 'Perempuan'
  if (normalized === 'l' || normalized === 'laki-laki' || normalized === 'laki laki') return 'Laki-laki'
  return String(value ?? '').trim()
}

function normalizeReligion(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  const values = {
    katholik: 'Katolik',
    katolik: 'Katolik',
    budha: 'Buddha',
    buddha: 'Buddha',
    islam: 'Islam',
    kristen: 'Kristen',
    hindu: 'Hindu',
    konghucu: 'Konghucu',
  }
  return values[normalized] ?? String(value ?? '').trim()
}

function mapRowToResident(row) {
  const normalized = {}

  Object.keys(row).forEach(key => {
    normalized[normalizeKey(key)] = row[key]
  })

  const record_type = normalized['tulispendudukmatipindahorangluar'] ?? 'PENDUDUK'
  const record_event = normalized['tulislahir01dstdatang01dstpindah01dstmati01dst'] ?? 'Lahir01'
  const full_name = normalized['namalengkap'] ?? normalized['nama'] ?? normalized['name'] ?? ''
  const national_id = normalized['nik'] ?? normalized['nationalid'] ?? ''
  const family_card_number = normalized['nomorkk'] ?? normalized['kk'] ?? normalized['familycardnumber'] ?? ''
  const dusun = normalized['dusun'] ?? ''
  const rt = normalized['rt'] ?? ''
  const rw = normalized['rw'] ?? ''
  const gender = normalizeGender(normalized['lp'] ?? normalized['jeniskelamin'] ?? normalized['gender'] ?? normalized['jk'] ?? '')
  const birth_place = normalized['tempatlahir'] ?? normalized['birthplace'] ?? ''
  const birth_date = excelDateToIso(normalized['tanggallahir'] ?? normalized['birthdate'] ?? null)
  const age = normalized['umur'] ? Number.parseInt(normalized['umur'], 10) : null
  const birth_certificate_status = normalized['aktalahir'] ?? ''
  const birth_certificate_number = normalized['nomoraktalahir'] ?? ''
  const blood_type = normalized['goldarah'] ?? ''
  const phone_number = normalized['notelepon'] ?? normalized['nomortelepon'] ?? normalized['phonenumber'] ?? ''
  const address = normalized['alamat'] ?? normalized['address'] ?? ''
  const occupation = normalized['pekerjaan'] ?? normalized['occupation'] ?? ''
  const education = normalized['pendidikan'] ?? normalized['education'] ?? ''
  const marital_status = normalized['statuskawin'] ?? normalized['statuspernikahan'] ?? normalized['maritalstatus'] ?? ''
  const marriage_certificate_status = normalized['aktakawin'] ?? ''
  const marriage_certificate_number = normalized['nomoraktakawin'] ?? ''
  const marriage_date = excelDateToIso(normalized['tanggalkawin'] ?? null)
  const divorce_certificate_status = normalized['aktacerai'] ?? ''
  const divorce_certificate_number = normalized['nomoraktacerai'] ?? ''
  const divorce_date = excelDateToIso(normalized['tanggalcerai'] ?? null)
  const family_relationship = normalized['statushubdlmkeluarga'] ?? ''
  const physical_disability = normalized['kelainanfisik'] ?? ''
  const disability_status = normalized['penyandangcacat'] ?? ''
  const religion = normalizeReligion(normalized['agama'] ?? '')
  const mother_national_id = normalized['nikibu'] ?? ''
  const mother_name = normalized['namalengkapibu'] ?? ''
  const father_national_id = normalized['nikayah'] ?? ''
  const father_name = normalized['namalengkapayah'] ?? ''
  const nationality = normalized['kewarganegaraan'] ?? ''
  const ktp_address = address
  const status = String(normalized['status'] ?? '').trim().toLowerCase() === 'pindah' ? 'Pindah' : 'Active'


  if (!full_name && !national_id) return null

  return {
    record_type: String(record_type).trim() || 'PENDUDUK',
    record_event: String(record_event).trim() || 'Lahir01',
    full_name: String(full_name).trim(),
    national_id: String(national_id).trim(),
    family_card_number: String(family_card_number).trim(),
    dusun: String(dusun).trim(),
    rt: String(rt).trim(),
    rw: String(rw).trim(),
    gender,
    birth_place: String(birth_place).trim(),
    birth_date,
    age: Number.isNaN(age) ? null : age,
    birth_certificate_status: String(birth_certificate_status).trim(),
    birth_certificate_number: String(birth_certificate_number).trim(),
    blood_type: String(blood_type).trim(),
    phone_number: String(phone_number).trim(),
    address: String(address).trim(),
    ktp_address: String(ktp_address).trim(),
    occupation: String(occupation).trim(),
    education: String(education).trim(),
    marital_status: String(marital_status).trim(),
    marriage_certificate_status: String(marriage_certificate_status).trim(),
    marriage_certificate_number: String(marriage_certificate_number).trim(),
    marriage_date,
    divorce_certificate_status: String(divorce_certificate_status).trim(),
    divorce_certificate_number: String(divorce_certificate_number).trim(),
    divorce_date,
    family_relationship: String(family_relationship).trim(),
    physical_disability: String(physical_disability).trim(),
    disability_status: String(disability_status).trim(),
    religion,
    mother_national_id: String(mother_national_id).trim(),
    mother_name: String(mother_name).trim(),
    father_national_id: String(father_national_id).trim(),
    father_name: String(father_name).trim(),
    nationality: String(nationality).trim(),
    status,
  }
}

function readCitizenRows(workbook) {
  for (const sheetName of workbook.SheetNames) {
    const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: '',
      raw: false,
    })
    const headerIndex = matrix.findIndex(row => {
      const keys = row.map(normalizeKey)
      return keys.includes('nik') && keys.includes('namalengkap')
    })
    if (headerIndex < 0) continue

    const headers = matrix[headerIndex]
    return matrix.slice(headerIndex + 1).map(values => headers.reduce((row, header, index) => {
      if (header !== '') row[header] = values[index] ?? ''
      return row
    }, {}))
  }

  return []
}

async function handleFileSelect(event) {
  const file = event.files?.[0]
  if (!file) return

  importError.value = ''
  importSuccess.value = ''

  const reader = new FileReader()

  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const rows = readCitizenRows(workbook)

      if (rows.length === 0) {
        importError.value = 'File tidak berisi data yang bisa diimpor.'
        return
      }

      const payloads = rows.map(row => mapRowToResident(row)).filter(p => p !== null)

      if (payloads.length === 0) {
        importError.value = 'Tidak ada baris valid ditemukan. Pastikan kolom Nama Lengkap dan NIK terisi.'
        return
      }

      let successCount = 0
      let failCount = 0

      for (const payload of payloads) {
        try {
          await createCitizen(payload)
          successCount++
        } catch {
          failCount++
        }
      }

      await fetchCitizens()

      if (failCount === 0) {
        importSuccess.value = `${successCount} data warga berhasil diimpor.`
      } else {
        importSuccess.value = `${successCount} data berhasil diimpor, ${failCount} gagal (kemungkinan NIK duplikat/tidak valid).`
      }
    } catch (err) {
      importError.value = 'Gagal membaca file. Pastikan format file adalah .xlsx, .xls, atau .csv.'
    }
  }

  reader.readAsArrayBuffer(file)
}
</script>

<template>
  <div>

    <div class="mb-6">
      <h1 class="m-0 text-2xl font-bold text-primary-900">
        Kelola Data Warga
      </h1>

      <p class="m-0 mt-1 text-sm text-neutral-500">
        Kelola data kependudukan warga desa.
      </p>
    </div>

    <Card
      :pt="{
        root: { class: 'rounded-lg border border-neutral-200 bg-white shadow-sm' },
        body: { class: 'p-5' },
        content: { class: 'p-0' },
      }"
    >
      <template #content>

        <div class="mb-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <div class="flex flex-wrap items-center gap-2">

            <Button
              label="Tambah Warga"
              icon="pi pi-plus"
              class="rounded-lg border border-transparent bg-primary-700 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-primary-800"
              @click="createResident"
            />

            <Button
              label="Hapus"
              icon="pi pi-trash"
              severity="secondary"
              outlined
              :disabled="selectedResidents.length === 0"
              class="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
              @click="deleteSelected"
            />

          </div>

          <div class="flex flex-wrap items-center gap-2">
            <IconField class="w-full sm:w-72">
              <InputIcon class="pi pi-search text-neutral-400" />
              <InputText
                v-model="filters.global.value"
                placeholder="Cari nama, NIK, atau alamat"
                class="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-8 pr-3 text-[13px] text-neutral-800 outline-none transition focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
              />
            </IconField>

            <FileUpload
              mode="basic"
              accept=".xlsx,.xls,.csv"
              chooseLabel="Import Data Warga"
              chooseIcon="pi pi-upload"
              :auto="false"
              customUpload
              :pt="{
                root: { class: 'inline-flex' },
                chooseButton: {
                  class:
                    'inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100',
                },
              }"
              @select="handleFileSelect"
            />
          </div>
        </div>

        <div v-if="importError || importSuccess" class="mb-4">
          <Message v-if="importError" severity="error" :closable="false" class="text-[13px]">
            {{ importError }}
          </Message>

          <Message v-if="importSuccess" severity="success" :closable="false" class="text-[13px]">
            {{ importSuccess }}
          </Message>
        </div>

        <DataTable
          v-model:selection="selectedResidents"
          :value="residents"
          :loading="loading"
          :filters="filters"
          :paginator="true"
          :rows="rowsPerPage"
          :rowsPerPageOptions="[10, 25, 50]"
          currentPageReportTemplate="Menampilkan {first}–{last} dari {totalRecords} warga"
          paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          dataKey="id"
          sortField="name"
          :sortOrder="1"
          removableSort
          stripedRows
          class="w-full overflow-hidden rounded-lg border border-neutral-200 text-[13px]"
          :pt="{
            header: { class: 'bg-neutral-50' },
            headerRow: { class: 'bg-neutral-50' },
            headerCell: { class: 'whitespace-nowrap border-b border-neutral-200 bg-neutral-50 px-3 py-2.5 text-left font-semibold text-neutral-500' },
            bodyRow: { class: 'border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/70' },
            bodyCell: { class: 'px-3 py-3 align-middle text-neutral-700' },
            paginator: { root: { class: 'flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-3 py-3 text-[13px] text-neutral-500' } },
          }"
        >
          <template #empty>
            <div class="px-3 py-8 text-center text-neutral-400">
              {{ loadError || 'Tidak ada data warga yang cocok dengan pencarian.' }}
            </div>
          </template>

          <Column selectionMode="multiple" headerStyle="width: 2.5rem" />

          <Column field="name" header="Nama Lengkap" sortable />
          <Column field="nationalId" header="NIK" sortable />
          <Column field="gender" header="Jenis Kelamin" sortable />
          <Column field="address" header="Alamat" />

          <Column field="status" header="Status" sortable>
            <template #body="{ data }">
              <Tag
                :value="data.status"
                :severity="statusSeverity(data.status)"
                class="rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide"
              />
            </template>
          </Column>

          <Column header="Aksi" headerStyle="width: 8rem">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <Button
                  icon="pi pi-eye"
                  text
                  rounded
                  severity="secondary"
                  class="h-8 w-8 text-neutral-500 hover:bg-neutral-100 hover:text-primary-700"
                  title="Detail"
                  @click="viewDetail(data)"
                />
                <Button
                  icon="pi pi-pencil"
                  text
                  rounded
                  severity="secondary"
                  class="h-8 w-8 text-neutral-500 hover:bg-neutral-100 hover:text-primary-700"
                  title="Edit"
                  @click="editResident(data.id)"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  class="h-8 w-8 text-neutral-500 hover:bg-danger-50 hover:text-danger-600"
                  title="Hapus"
                  @click="deleteResident(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>

      </template>
    </Card>

    <Dialog
      v-model:visible="detailDialogVisible"
      header="Detail Data Warga"
      modal
      :style="{ width: '32rem' }"
      class="rounded-lg"
      :pt="{
        header: { class: 'border-b border-neutral-100 px-5 py-4' },
        title: { class: 'text-base font-bold text-primary-900' },
        content: { class: 'px-5 py-5' },
        footer: { class: 'border-t border-neutral-100 px-5 py-3' },
      }"
    >
      <div v-if="selectedDetailResident" class="grid max-h-[65vh] grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
        <div class="flex flex-col gap-1 sm:col-span-2">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Nama Lengkap</span>
          <span class="text-[13px] font-medium text-neutral-800">{{ selectedDetailResident.name || '-' }}</span>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Jenis Data</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.recordType || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Peristiwa</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.recordEvent || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">NIK</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.nationalId || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Nomor KK</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.familyCardNumber || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Jenis Kelamin</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.gender || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Nomor Telepon</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.phoneNumber || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Tempat Lahir</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.birthPlace || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Tanggal Lahir</span>
          <span class="text-[13px] text-neutral-800">{{ formatDate(selectedDetailResident.birthDate) }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Umur</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.age ?? '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Golongan Darah</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.bloodType || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Akta Lahir</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.birthCertificateStatus || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Nomor Akta Lahir</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.birthCertificateNumber || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Dusun</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.dusun || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">RT / RW</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.rt || '-' }} / {{ selectedDetailResident.rw || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Pekerjaan</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.occupation || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Pendidikan</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.education || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Status Pernikahan</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.maritalStatus || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Agama</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.religion || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Akta Kawin</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.marriageCertificateStatus || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Nomor Akta Kawin</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.marriageCertificateNumber || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Tanggal Kawin</span>
          <span class="text-[13px] text-neutral-800">{{ formatDate(selectedDetailResident.marriageDate) }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Akta Cerai</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.divorceCertificateStatus || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Nomor Akta Cerai</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.divorceCertificateNumber || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Tanggal Cerai</span>
          <span class="text-[13px] text-neutral-800">{{ formatDate(selectedDetailResident.divorceDate) }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Hubungan Keluarga</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.familyRelationship || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Kelainan Fisik</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.physicalDisability || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Penyandang Cacat</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.disabilityStatus || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Kewarganegaraan</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.nationality || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Nama Ibu</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.motherName || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">NIK Ibu</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.motherNationalId || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Nama Ayah</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.fatherName || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">NIK Ayah</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.fatherNationalId || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1 sm:col-span-2">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Status</span>
          <Tag
            :value="selectedDetailResident.status"
            :severity="statusSeverity(selectedDetailResident.status)"
            class="w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide"
          />
        </div>
        <div class="flex flex-col gap-1 sm:col-span-2">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Alamat</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.address || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1 sm:col-span-2">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Alamat sesuai KTP</span>
          <span class="text-[13px] text-neutral-800">{{ selectedDetailResident.ktpAddress || '-' }}</span>
        </div>
      </div>

      <template #footer>
        <Button
          label="Tutup"
          severity="secondary"
          outlined
          class="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
          @click="detailDialogVisible = false"
        />
      </template>
    </Dialog>

  </div>
</template>
