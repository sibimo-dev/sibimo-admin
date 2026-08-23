<script setup>

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import { FilterMatchMode } from '@primevue/core/api'
import { useConfirm } from 'primevue/useconfirm'

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

const residents = ref([
  {
    id: 1,
    name: 'Budi Santoso',
    nationalId: '3273123456789012',
    familyCardNumber: '3273120001112223',
    gender: 'Laki-laki',
    birthPlace: 'Yogyakarta',
    birthDate: new Date('1990-05-14'),
    phoneNumber: '081234567890',
    address: 'Jl. Merdeka No. 1, RT 01/RW 02',
    occupation: 'Wiraswasta',
    education: 'S1',
    maritalStatus: 'Menikah',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Siti Aminah',
    nationalId: '3273987654321098',
    familyCardNumber: '3273120001112224',
    gender: 'Perempuan',
    birthPlace: 'Sleman',
    birthDate: new Date('1985-11-02'),
    phoneNumber: '081298765432',
    address: 'Jl. Pahlawan No. 45, RT 02/RW 01',
    occupation: 'Ibu Rumah Tangga',
    education: 'SMA/SMK',
    maritalStatus: 'Menikah',
    status: 'Pindah',
  },
  {
    id: 3,
    name: 'Agus Setiawan',
    nationalId: '3273112223445566',
    familyCardNumber: '3273120001112225',
    gender: 'Laki-laki',
    birthPlace: 'Bantul',
    birthDate: new Date('1992-02-20'),
    phoneNumber: '081311122233',
    address: 'Jl. Sudirman No. 10, RT 03/RW 03',
    occupation: 'Karyawan Swasta',
    education: 'D3',
    maritalStatus: 'Belum Menikah',
    status: 'Active',
  },
  {
    id: 4,
    name: 'Dewi Lestari',
    nationalId: '3273119876543210',
    familyCardNumber: '3273120001112226',
    gender: 'Perempuan',
    birthPlace: 'Yogyakarta',
    birthDate: new Date('1998-07-09'),
    phoneNumber: '081398765432',
    address: 'Jl. Kenanga No. 7, RT 01/RW 04',
    occupation: 'Guru',
    education: 'S1',
    maritalStatus: 'Belum Menikah',
    status: 'Active',
  },
  {
    id: 5,
    name: 'Rudi Hartono',
    nationalId: '3273115566778899',
    familyCardNumber: '3273120001112227',
    gender: 'Laki-laki',
    birthPlace: 'Kulon Progo',
    birthDate: new Date('1978-03-30'),
    phoneNumber: '081355667788',
    address: 'Jl. Anggrek No. 12, RT 04/RW 02',
    occupation: 'Petani',
    education: 'SMP',
    maritalStatus: 'Menikah',
    status: 'Active',
  },
  {
    id: 6,
    name: 'Ani Wulandari',
    nationalId: '3273119988776655',
    familyCardNumber: '3273120001112228',
    gender: 'Perempuan',
    birthPlace: 'Gunungkidul',
    birthDate: new Date('1995-09-17'),
    phoneNumber: '081399887766',
    address: 'Jl. Mawar No. 3, RT 02/RW 03',
    occupation: 'Perawat',
    education: 'D3',
    maritalStatus: 'Cerai Hidup',
    status: 'Pindah',
  },
])

const selectedResidents = ref([])
const rowsPerPage = ref(10)

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

const importError = ref('')
const importSuccess = ref('')



const detailDialogVisible = ref(false)
const selectedDetailResident = ref(null)

function viewDetail(data) {
  selectedDetailResident.value = data
  detailDialogVisible.value = true
}

function formatDate(value) {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function statusSeverity(status) {
  return status === 'Active' ? 'success' : 'warn'
}

function createResident() {
  router.push({ name: 'citizen-create' })
}

function editResident(id) {
  router.push({ name: 'citizen-edit', params: { id } })
}

function deleteResident(data) {
  confirm.require({
    message: `Hapus data warga "${data.name}" dengan NIK "${data.nationalId}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: () => {
      residents.value = residents.value.filter(resident => resident.id !== data.id)
      selectedResidents.value = selectedResidents.value.filter(resident => resident.id !== data.id)
    },
  })
}

function deleteSelected() {
  confirm.require({
    message: `Hapus ${selectedResidents.value.length} data warga terpilih?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: () => {
      const idsToDelete = new Set(selectedResidents.value.map(resident => resident.id))
      residents.value = residents.value.filter(resident => !idsToDelete.has(resident.id))
      selectedResidents.value = []
    },
  })
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
  const familyCardNumber = normalized['nomorkk'] ?? normalized['kk'] ?? normalized['familycardnumber'] ?? ''
  const gender = normalized['jeniskelamin'] ?? normalized['gender'] ?? normalized['jk'] ?? ''
  const birthPlace = normalized['tempatlahir'] ?? normalized['birthplace'] ?? ''
  const birthDate = normalized['tanggallahir'] ?? normalized['birthdate'] ?? null
  const phoneNumber = normalized['notelepon'] ?? normalized['nomortelepon'] ?? normalized['phonenumber'] ?? ''
  const address = normalized['alamat'] ?? normalized['address'] ?? ''
  const occupation = normalized['pekerjaan'] ?? normalized['occupation'] ?? ''
  const education = normalized['pendidikan'] ?? normalized['education'] ?? ''
  const maritalStatus = normalized['statuspernikahan'] ?? normalized['maritalstatus'] ?? ''
  let status = normalized['status'] ?? 'Active'

  status = String(status).trim().toLowerCase() === 'pindah' ? 'Pindah' : 'Active'

  if (!name && !nationalId) return null

  return {
    id: nextId,
    name: String(name).trim(),
    nationalId: String(nationalId).trim(),
    familyCardNumber: String(familyCardNumber).trim(),
    gender: String(gender).trim(),
    birthPlace: String(birthPlace).trim(),
    birthDate: birthDate ? String(birthDate).trim() : null,
    phoneNumber: String(phoneNumber).trim(),
    address: String(address).trim(),
    occupation: String(occupation).trim(),
    education: String(education).trim(),
    maritalStatus: String(maritalStatus).trim(),
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

      residents.value = [...residents.value, ...imported]
      importSuccess.value = `${imported.length} data warga berhasil diimpor.`
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