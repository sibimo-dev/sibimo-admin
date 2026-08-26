<script setup>

import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import { FilterMatchMode } from '@primevue/core/api'
<<<<<<< Updated upstream
=======
import { useConfirm } from 'primevue/useconfirm'
import { createCitizen, deleteCitizen as removeCitizen, getCitizens } from '@/services/citizen.service'
>>>>>>> Stashed changes

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import FileUpload from 'primevue/fileupload'
import Message from 'primevue/message'

const router = useRouter()

<<<<<<< Updated upstream
// Data dummy — tidak diubah dari versi sebelumnya
const residents = ref([
  {
    id: 1,
    name: 'Budi Santoso',
    nationalId: '3273123456789012',
    gender: 'Laki-laki',
    address: 'Jl. Merdeka No. 1, RT 01/RW 02',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Siti Aminah',
    nationalId: '3273987654321098',
    gender: 'Perempuan',
    address: 'Jl. Pahlawan No. 45, RT 02/RW 01',
    status: 'Pindah',
  },
  {
    id: 3,
    name: 'Agus Setiawan',
    nationalId: '3273112223445566',
    gender: 'Laki-laki',
    address: 'Jl. Sudirman No. 10, RT 03/RW 03',
    status: 'Active',
  },
  {
    id: 4,
    name: 'Dewi Lestari',
    nationalId: '3273119876543210',
    gender: 'Perempuan',
    address: 'Jl. Kenanga No. 7, RT 01/RW 04',
    status: 'Active',
  },
  {
    id: 5,
    name: 'Rudi Hartono',
    nationalId: '3273115566778899',
    gender: 'Laki-laki',
    address: 'Jl. Anggrek No. 12, RT 04/RW 02',
    status: 'Active',
  },
  {
    id: 6,
    name: 'Ani Wulandari',
    nationalId: '3273119988776655',
    gender: 'Perempuan',
    address: 'Jl. Mawar No. 3, RT 02/RW 03',
    status: 'Pindah',
  },
])
=======
// GANTI: dari array dummy statis -> ref kosong, diisi lewat fetchCitizens()
const residents = ref([])
const loading = ref(false)
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

async function fetchCitizens() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await getCitizens()
    residents.value = data.map(mapCitizenFromApi)
  } catch (err) {
    loadError.value = err.response?.data?.message || 'Gagal memuat data warga.'
  } finally {
    loading.value = false
  }
}

// Panggil sekali waktu halaman dibuka
onMounted(fetchCitizens)
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
function deleteResident(id) {
  residents.value = residents.value.filter(resident => resident.id !== id)
  selectedResidents.value = selectedResidents.value.filter(resident => resident.id !== id)
}

function deleteSelected() {
  const idsToDelete = new Set(selectedResidents.value.map(resident => resident.id))
  residents.value = residents.value.filter(resident => !idsToDelete.has(resident.id))
  selectedResidents.value = []
=======

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
        await Promise.all(idsToDelete.map((id) => removeCitizen(id)))
        const idSet = new Set(idsToDelete)
        residents.value = residents.value.filter(resident => !idSet.has(resident.id))
        selectedResidents.value = []
      } catch (err) {
        loadError.value = err.response?.data?.message || 'Sebagian data gagal dihapus.'
        await fetchCitizens() // sinkronin ulang biar data yg berhasil kehapus tetap ke-refresh
      }
    },
  })
>>>>>>> Stashed changes
}

function normalizeKey(key) {
  return key.trim().toLowerCase().replace(/[\s_]+/g, '')
}

function mapRowToResident(row, nextId) {
  const normalized = {}

  Object.keys(row).forEach(key => {
    normalized[normalizeKey(key)] = row[key]
  })

  const name = normalized['namalengkap'] ?? normalized['nama'] ?? normalized['name'] ?? ''
  const nationalId = normalized['nik'] ?? normalized['nationalid'] ?? ''
  const gender = normalized['jeniskelamin'] ?? normalized['gender'] ?? normalized['jk'] ?? ''
  const address = normalized['alamat'] ?? normalized['address'] ?? ''
  let status = normalized['status'] ?? 'Active'

  status = String(status).trim().toLowerCase() === 'pindah' ? 'Pindah' : 'Active'

  if (!name && !nationalId) return null

  return {
    id: nextId,
    name: String(name).trim(),
    nationalId: String(nationalId).trim(),
    gender: String(gender).trim(),
    address: String(address).trim(),
    status,
  }
}

function handleFileSelect(event) {
  const file = event.files?.[0]
  if (!file) return

  importError.value = ''
  importSuccess.value = ''

  const reader = new FileReader()

  reader.onload = (e) => {
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

      let nextId = residents.value.reduce((max, resident) => Math.max(max, resident.id), 0) + 1
      const imported = []

      rows.forEach(row => {
        const mapped = mapRowToResident(row, nextId)
        if (mapped) {
          imported.push(mapped)
          nextId += 1
        }
      })

      if (imported.length === 0) {
        importError.value = 'Tidak ada baris valid ditemukan. Pastikan kolom Nama Lengkap dan NIK terisi.'
        return
      }

<<<<<<< Updated upstream
      residents.value = [...residents.value, ...imported]
      importSuccess.value = `${imported.length} data warga berhasil diimpor.`
=======
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
>>>>>>> Stashed changes
    } catch (err) {
      importError.value = 'Gagal membaca file. Pastikan format file adalah .xlsx, .xls, atau .csv.'
    }
  }

  reader.readAsArrayBuffer(file)
}
</script>

<template>
  <div class="min-h-full px-6 py-6 text-neutral-800 lg:px-8">

    <h1 class="m-0 mb-1 text-[22px] font-bold text-primary-900">
      Kelola Data Warga
    </h1>

    <p class="m-0 mb-5 text-sm text-neutral-500">
      Kelola data kependudukan warga desa.
    </p>

    <div class="rounded-xl border border-neutral-200 bg-white shadow-sm">

      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-6 py-4">

        <h2 class="m-0 text-base font-semibold text-primary-900">
          Data Warga
        </h2>

        <div class="flex flex-wrap items-center gap-2">

          <IconField>
            <InputIcon class="pi pi-search text-neutral-400" />
            <InputText
              v-model="filters.global.value"
              placeholder="Cari nama, NIK, atau alamat"
              class="w-[220px] rounded-lg border border-neutral-300 bg-white py-2 pl-8 pr-3 text-[13px] text-neutral-800 outline-none transition focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
            />
          </IconField>

          <Button
            label="Hapus"
            icon="pi pi-trash"
            severity="secondary"
            outlined
            :disabled="selectedResidents.length === 0"
            class="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
            @click="deleteSelected"
          />

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

          <Button
            label="Tambah Warga"
            icon="pi pi-plus"
            class="rounded-lg border border-transparent bg-primary-700 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-primary-800"
            @click="createResident"
          />

        </div>
      </div>

      <div v-if="importError || importSuccess" class="px-6 pt-4">
        <Message v-if="importError" severity="error" :closable="false" class="text-[13px]">
          {{ importError }}
        </Message>

        <Message v-if="importSuccess" severity="success" :closable="false" class="text-[13px]">
          {{ importSuccess }}
        </Message>
      </div>

      <div class="px-6 py-4">
        <DataTable
          v-model:selection="selectedResidents"
          :value="residents"
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
              Tidak ada data warga yang cocok dengan pencarian.
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

          <Column header="Aksi" headerStyle="width: 6rem">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
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
                  @click="deleteResident(data.id)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

    </div>
  </div>
</template>
