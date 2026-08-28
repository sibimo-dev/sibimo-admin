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
    name: item.full_name,
    nationalId: item.national_id, 
    familyCardNumber: item.family_card_number,
    gender: item.gender,
    address: item.address,
    status: item.status,
    occupation: item.occupation,
    education: item.education,
    maritalStatus: item.marital_status,
    phoneNumber: item.phone_number,
    birthPlace: item.birth_place,
    birthDate: item.birth_date,
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
  return key.trim().toLowerCase().replace(/[\s_]+/g, '')
}

function mapRowToResident(row, nextId) {
  const normalized = {}

  Object.keys(row).forEach(key => {
    normalized[normalizeKey(key)] = row[key]
  })

  const full_name = normalized['namalengkap'] ?? normalized['nama'] ?? normalized['name'] ?? ''
  const national_id = normalized['nik'] ?? normalized['nationalid'] ?? ''
  const family_card_number = normalized['nomorkk'] ?? normalized['kk'] ?? normalized['familycardnumber'] ?? ''
  const gender = normalized['jeniskelamin'] ?? normalized['gender'] ?? normalized['jk'] ?? ''
  const birth_place = normalized['tempatlahir'] ?? normalized['birthplace'] ?? ''
  const birth_date = normalized['tanggallahir'] ?? normalized['birthdate'] ?? null
  const phone_number = normalized['notelepon'] ?? normalized['nomortelepon'] ?? normalized['phonenumber'] ?? ''
  const address = normalized['alamat'] ?? normalized['address'] ?? ''
  const occupation = normalized['pekerjaan'] ?? normalized['occupation'] ?? ''
  const education = normalized['pendidikan'] ?? normalized['education'] ?? ''
  const marital_status = normalized['statuspernikahan'] ?? normalized['maritalstatus'] ?? ''
  let status = normalized['status'] ?? 'Active'

  status = String(status).trim().toLowerCase() === 'pindah' ? 'Pindah' : 'Active'

  if (!full_name && !national_id) return null

  return {
    full_name: String(full_name).trim(),
    national_id: String(national_id).trim(),
    family_card_number: String(family_card_number).trim(),
    gender: String(gender).trim(),
    birth_place: String(birth_place).trim(),
    birth_date: birth_date ? String(birth_date).trim() : null,
    phone_number: String(phone_number).trim(),
    address: String(address).trim(),
    occupation: String(occupation).trim(),
    education: String(education).trim(),
    marital_status: String(marital_status).trim(),
    status,
  }
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
      const firstSheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[firstSheetName]
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

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
      <div v-if="selectedDetailResident" class="grid grid-cols-1 gap-4 sm:grid-cols-2">

        <div class="flex flex-col gap-1 sm:col-span-2">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Nama Lengkap</span>
          <span class="text-[13px] font-medium text-neutral-800">{{ selectedDetailResident.name }}</span>
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
