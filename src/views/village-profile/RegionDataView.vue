<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import * as XLSX from 'xlsx'

import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { getRegions, createRegion, updateRegion, deleteRegion } from '@/services/region.service'
import { getListCache, setListCache, updateListCache } from '@/services/list-cache'

const toast = useToast()

// Kolom yang diharapkan ada di header baris pertama file Excel/CSV.
// Urutan bebas -- dicocokkan berdasarkan nama header, bukan posisi kolom.
const EXCEL_COLUMN_MAP = {
  'Dusun': 'name',
  'Kepala Dusun': 'headName',
  'Jumlah RW': 'rwCount',
  'Jumlah RT': 'rtCount',
  'Jumlah KK': 'kkCount',
  'Jiwa': 'population',
  'Laki-laki': 'maleCount',
  'Perempuan': 'femaleCount',
}
const NUMBER_FIELDS = ['rwCount', 'rtCount', 'kkCount', 'population', 'maleCount', 'femaleCount']

const excelFileInput = ref(null)
const importingExcel = ref(false)

// Dummy data dusun -- ganti dengan GET /hamlets via region.service.js.
// Field kkCount, population, maleCount, femaleCount sementara manual;
// idealnya dihitung backend dari data warga per dusun.
const cachedRegions = getListCache('regions')
const hamlets = ref((cachedRegions ?? []).map(toHamletView))
const loadingRegions = ref(!cachedRegions)
const regionLoadError = ref('')
/* const hamletsDummy = [
  { id: 1, name: 'BALONG', headName: '', rwCount: 3, rtCount: 6, kkCount: 354, population: 1014, maleCount: 513, femaleCount: 501 },
  { id: 2, name: 'BANJARHARJO', headName: 'BASUKI WIBOWO', rwCount: 4, rtCount: 6, kkCount: 265, population: 709, maleCount: 362, femaleCount: 347 },
  { id: 3, name: 'COKROGATEN', headName: 'MUCHAROM', rwCount: 4, rtCount: 6, kkCount: 327, population: 929, maleCount: 452, femaleCount: 477 },
  { id: 4, name: 'KALIBULUS', headName: 'UMI SOLIKAH', rwCount: 3, rtCount: 4, kkCount: 237, population: 606, maleCount: 299, femaleCount: 307 },
  { id: 5, name: 'KOROULON KIDUL', headName: '', rwCount: 3, rtCount: 4, kkCount: 224, population: 613, maleCount: 284, femaleCount: 329 },
  { id: 6, name: 'KOROULON LOR', headName: '', rwCount: 3, rtCount: 5, kkCount: 288, population: 762, maleCount: 392, femaleCount: 370 },
  { id: 7, name: 'KRAGILAN', headName: 'SUHARYONO', rwCount: 3, rtCount: 4, kkCount: 168, population: 442, maleCount: 219, femaleCount: 223 },
  { id: 8, name: 'KREBET', headName: 'JAKA WIDADA', rwCount: 3, rtCount: 5, kkCount: 267, population: 716, maleCount: 360, femaleCount: 356 },
  { id: 9, name: 'MACANAN', headName: 'KAHARUDIN', rwCount: 3, rtCount: 4, kkCount: 181, population: 523, maleCount: 257, femaleCount: 266 },
  { id: 10, name: 'PONDOK SURUH', headName: 'SUKIRMAN', rwCount: 4, rtCount: 7, kkCount: 255, population: 700, maleCount: 344, femaleCount: 356 },
  { id: 11, name: 'ROGOBANGSAN', headName: 'ANGGA WAHYU INDRA IRAWAN', rwCount: 3, rtCount: 5, kkCount: 291, population: 736, maleCount: 350, femaleCount: 386 },
  { id: 12, name: 'SORASAN', headName: 'JAZIM THOYIBI', rwCount: 3, rtCount: 5, kkCount: 300, population: 828, maleCount: 412, femaleCount: 416 },
]
*/

// Ringkasan kartu di atas -- dihitung dari hamlets, bukan dari store terpisah.
const totalArea = ref(0)
const totalRw = computed(() => hamlets.value.reduce((sum, h) => sum + h.rwCount, 0))
const totalRt = computed(() => hamlets.value.reduce((sum, h) => sum + h.rtCount, 0))

// Format sama seperti stats di Dashboard.vue -- label, value, unit, icon, bg.
// bg pakai token warna tema Sibimo (primary/secondary/success/warning), bukan
// warna Tailwind generik, biar konsisten dengan dashboard dan file main.css.
const areaStats = computed(() => [
  {
    label: 'Luas Wilayah',
    value: totalArea.value,
    unit: 'km²',
    icon: 'pi pi-map',
    bg: 'bg-primary-500',
  },
  {
    label: 'Jumlah RW',
    value: totalRw.value,
    unit: 'RW',
    icon: 'pi pi-sitemap',
    bg: 'bg-secondary-600',
  },
  {
    label: 'Jumlah RT',
    value: totalRt.value,
    unit: 'RT',
    icon: 'pi pi-building',
    bg: 'bg-success-600',
  },
  {
    label: 'Batas Wilayah',
    value: neighborCount.value,
    unit: 'Desa Tetangga',
    icon: 'pi pi-compass',
    bg: 'bg-warning-500',
  },
])

const boundaries = reactive({ north: '', south: '', east: '', west: '' })
const neighborCount = computed(
  () => Object.values(boundaries).filter((v) => v && v.trim()).length,
)

const filters = ref({
  global: { value: null },
})

const rowsPerPage = ref(10)
const currentPage = ref(0)

const hamletDialogOpen = ref(false)
const editingHamletId = ref(null)
const savingHamlet = ref(false)

const hamletForm = reactive({
  name: '',
  headName: '',
  rwCount: 1,
  rtCount: 1,
  kkCount: 0,
  population: 0,
  maleCount: 0,
  femaleCount: 0,
})

const boundaryDialogOpen = ref(false)

const boundaryForm = reactive({
  north: '',
  south: '',
  east: '',
  west: '',
})

function toHamletView(item) {
  return {
    id: item.region_id,
    name: item.name,
    headName: item.head_name ?? '',
    rwCount: item.rw_count ?? 0,
    rtCount: item.rt_count ?? 0,
    kkCount: item.kk_count ?? 0,
    population: item.population ?? 0,
    maleCount: item.male_count ?? 0,
    femaleCount: item.female_count ?? 0,
  }
}

async function loadRegions({ background = false } = {}) {
  try {
    const data = await getRegions()
    const normalized = Array.isArray(data) ? data : []
    setListCache('regions', normalized)
    hamlets.value = normalized.map(toHamletView)
    regionLoadError.value = ''
  } catch (error) {
    regionLoadError.value =
      'Data wilayah belum dapat dimuat. Pastikan backend aktif dan migration regions sudah dijalankan.'
    toast.add({
      severity: 'error',
      summary: 'Gagal memuat data wilayah',
      detail: error.response?.data?.message ?? 'Periksa koneksi ke backend.',
      life: 5000,
    })
    throw error
  } finally {
    if (!background) loadingRegions.value = false
  }
}

onMounted(async () => {
  try {
    await loadRegions({ background: Boolean(cachedRegions) })
  } catch {
    // Pesan error sudah ditampilkan oleh loadRegions().
  }
})

const directionLabels = [
  { key: 'north', letter: 'U', label: 'Utara' },
  { key: 'south', letter: 'S', label: 'Selatan' },
  { key: 'east', letter: 'T', label: 'Timur' },
  { key: 'west', letter: 'B', label: 'Barat' },
]

function openCreateHamlet() {
  editingHamletId.value = null
  hamletForm.name = ''
  hamletForm.headName = ''
  hamletForm.rwCount = 1
  hamletForm.rtCount = 1
  hamletForm.kkCount = 0
  hamletForm.population = 0
  hamletForm.maleCount = 0
  hamletForm.femaleCount = 0
  hamletDialogOpen.value = true
}

function openEditHamlet(hamlet) {
  editingHamletId.value = hamlet.id
  hamletForm.name = hamlet.name
  hamletForm.headName = hamlet.headName
  hamletForm.rwCount = hamlet.rwCount
  hamletForm.rtCount = hamlet.rtCount
  hamletForm.kkCount = hamlet.kkCount
  hamletForm.population = hamlet.population
  hamletForm.maleCount = hamlet.maleCount
  hamletForm.femaleCount = hamlet.femaleCount
  hamletDialogOpen.value = true
}

async function saveHamlet() {
  if (!hamletForm.name.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Belum lengkap',
      detail: 'Nama dusun wajib diisi',
      life: 3000,
    })
    return
  }

  const isCreating = editingHamletId.value === null
  const editingId = editingHamletId.value
  const name = hamletForm.name
  const payload = {
    name: hamletForm.name,
    head_name: hamletForm.headName,
    rw_count: hamletForm.rwCount,
    rt_count: hamletForm.rtCount,
    kk_count: hamletForm.kkCount,
    population: hamletForm.population,
    male_count: hamletForm.maleCount,
    female_count: hamletForm.femaleCount,
  }

  savingHamlet.value = true
  try {
    const saved = isCreating
      ? await createRegion(payload)
      : await updateRegion(editingId, payload)

    updateListCache('regions', (items) => isCreating
      ? [saved, ...items]
      : items.map((item) => item.region_id === editingId ? { ...item, ...saved } : item))
    hamlets.value = isCreating
      ? [toHamletView(saved), ...hamlets.value]
      : hamlets.value.map((item) => item.id === editingId
          ? toHamletView({ ...item, ...saved })
          : item)

    currentPage.value = 0
    hamletDialogOpen.value = false

    toast.add({
      severity: 'success',
      summary: 'Berhasil',
      detail: `Dusun ${name} ${isCreating ? 'ditambahkan' : 'diperbarui'}`,
      life: 3000,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal menyimpan data',
      detail: error.response?.data?.message ?? 'Periksa koneksi ke backend.',
      life: 4000,
    })
  } finally {
    savingHamlet.value = false
  }
}

async function deleteHamlet(id) {
  const hamlet = hamlets.value.find((h) => h.id === id)
  try {
    await deleteRegion(id)
    hamlets.value = hamlets.value.filter((item) => item.id !== id)
    updateListCache('regions', (items) => items.filter((item) => item.region_id !== id))

    const maxFirst =
      Math.max(0, Math.ceil(hamlets.value.length / rowsPerPage.value) - 1) *
      rowsPerPage.value
    if (currentPage.value > maxFirst) currentPage.value = maxFirst

    toast.add({
      severity: 'success',
      summary: 'Berhasil',
      detail: `Dusun ${hamlet?.name ?? ''} dihapus`,
      life: 3000,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal menghapus data',
      detail: error.response?.data?.message ?? 'Periksa koneksi ke backend.',
      life: 4000,
    })
  }
}

function downloadExcelTemplate() {
  const headers = Object.keys(EXCEL_COLUMN_MAP)
  const exampleRow = {
    'Dusun': 'CONTOH DUSUN',
    'Kepala Dusun': 'Nama Kepala Dusun',
    'Jumlah RW': 3,
    'Jumlah RT': 5,
    'Jumlah KK': 250,
    'Jiwa': 700,
    'Laki-laki': 350,
    'Perempuan': 350,
  }

  const worksheet = XLSX.utils.json_to_sheet([exampleRow], { header: headers })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Wilayah')
  XLSX.writeFile(workbook, 'template-data-wilayah.xlsx')
}

function triggerExcelImport() {
  excelFileInput.value?.click()
}

async function handleExcelImport(event) {
  const file = event.target.files?.[0]
  if (!file) return

  importingExcel.value = true

  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[firstSheetName]

   
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    if (rows.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'File kosong',
        detail: 'Tidak ada baris data yang terbaca dari file',
        life: 3000,
      })
      return
    }

    const parsed = []
    const errors = []

    rows.forEach((row, index) => {
      const rowNumber = index + 2 // +2: baris 1 = header, data mulai baris 2
      const mapped = {}

      for (const [excelHeader, fieldKey] of Object.entries(EXCEL_COLUMN_MAP)) {
        mapped[fieldKey] = row[excelHeader]
      }

      const name = String(mapped.name ?? '').trim()
      if (!name) {
        errors.push(`Baris ${rowNumber}: kolom "Dusun" kosong, dilewati`)
        return
      }

      const hamlet = {
        id: Date.now() + index,
        name,
        headName: String(mapped.headName ?? '').trim(),
      }

      for (const field of NUMBER_FIELDS) {
        const num = Number(mapped[field])
        hamlet[field] = Number.isFinite(num) ? num : 0
      }

      parsed.push(hamlet)
    })

    if (parsed.length > 0) {
      hamlets.value.unshift(...parsed)
      currentPage.value = 0
    }

    if (parsed.length > 0 && errors.length === 0) {
      toast.add({
        severity: 'success',
        summary: 'Import berhasil',
        detail: `${parsed.length} data dusun ditambahkan`,
        life: 3500,
      })
    } else if (parsed.length > 0 && errors.length > 0) {
      toast.add({
        severity: 'warn',
        summary: 'Import selesai dengan catatan',
        detail: `${parsed.length} baris masuk, ${errors.length} baris dilewati (nama dusun kosong)`,
        life: 4500,
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Import gagal',
        detail: 'Tidak ada baris valid. Pastikan kolom "Dusun" terisi di setiap baris',
        life: 4500,
      })
    }
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Gagal membaca file',
      detail: 'Pastikan file berformat .xlsx, .xls, atau .csv yang valid',
      life: 4000,
    })
  } finally {
    importingExcel.value = false
    // reset value input, supaya pilih file yang SAMA dua kali berturut-turut tetap trigger @change
    event.target.value = ''
  }
}

function openBoundaryDialog() {
  boundaryForm.north = boundaries.north
  boundaryForm.south = boundaries.south
  boundaryForm.east = boundaries.east
  boundaryForm.west = boundaries.west
  boundaryDialogOpen.value = true
}

function saveBoundaries() {
  Object.assign(boundaries, { ...boundaryForm })
  boundaryDialogOpen.value = false

  toast.add({
    severity: 'success',
    summary: 'Berhasil',
    detail: 'Batas wilayah diperbarui',
    life: 3000,
  })
}
</script>

<template>
  <div class="min-h-full text-slate-800">
    <h1 class="m-0 mb-1 text-[22px] font-bold text-slate-900">
      Data Wilayah Administratif Desa
    </h1>

    <p class="mb-5 text-sm text-slate-500">
      Kelola Data Wilayah desa, termasuk dusun, RW, RT, dan batas wilayah desa.
    </p>

    <div
      v-if="regionLoadError"
      class="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ regionLoadError }}
    </div>

    <div class="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="s in areaStats"
        :key="s.label"
        class="bg-white rounded-xl border border-neutral-200 p-5 relative overflow-hidden"
      >
        <div class="flex items-start justify-between mb-3">
          <p class="text-sm text-neutral-500">{{ s.label }}</p>
          <div
            class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md"
            :class="s.bg"
          >
            <i :class="s.icon" class="text-lg" />
          </div>
        </div>
        <p class="text-3xl font-bold text-neutral-900">
          {{ s.value }}
          <span class="text-sm font-medium text-neutral-400">{{ s.unit }}</span>
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <Card>
        <template #content>
          <div class="flex flex-col gap-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 class="m-0 text-base font-semibold text-slate-900">
                Data Wilayah
              </h2>

              <div class="flex flex-wrap items-center gap-2">
                <IconField>
                  <InputIcon class="pi pi-search" />

                  <InputText
                    v-model="filters.global.value"
                    placeholder="Cari dusun"
                  />
                </IconField>

                <Button
                  label="Template"
                  icon="pi pi-download"
                  severity="secondary"
                  text
                  @click="downloadExcelTemplate"
                />

                <Button
                  label="Import Excel"
                  icon="pi pi-upload"
                  severity="secondary"
                  outlined
                  :loading="importingExcel"
                  @click="triggerExcelImport"
                />

                <input
                  ref="excelFileInput"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  class="hidden"
                  @change="handleExcelImport"
                />

                <Button
                  label="Tambah Data"
                  icon="pi pi-plus"
                  @click="openCreateHamlet"
                />
              </div>
            </div>

            <DataTable
              v-model:filters="filters"
              v-model:first="currentPage"
              :value="hamlets"
              :loading="loadingRegions"
              dataKey="id"
              :paginator="true"
              :rows="rowsPerPage"
              :rowsPerPageOptions="[10, 25, 50]"
              :globalFilterFields="['name', 'headName']"
              stripedRows
              currentPageReportTemplate="Menampilkan {first}–{last} dari {totalRecords} dusun"
              paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
              class="w-full"
            >
              <template #empty>
                <div class="py-8 text-center text-slate-400">
                  Tidak ada dusun yang cocok dengan pencarian.
                </div>
              </template>

              <Column
                field="name"
                header="Dusun"
                sortable
                class="min-w-32"
              />

              <Column
                field="headName"
                header="Kepala Dusun"
                class="min-w-36"
              />

              <Column
                field="rwCount"
                header="Jumlah RW"
              />

              <Column
                field="rtCount"
                header="Jumlah RT"
              />

              <Column
                field="kkCount"
                header="Jumlah KK"
              />

              <Column
                field="population"
                header="Jiwa"
              />

              <Column
                field="maleCount"
                header="Laki-laki"
              />

              <Column
                field="femaleCount"
                header="Perempuan"
              />

              <Column
                header="Aksi"
                headerStyle="width: 7rem"
              >
                <template #body="{ data }">
                  <div class="flex items-center gap-1">
                    <Button
                      icon="pi pi-pencil"
                      text
                      rounded
                      severity="secondary"
                      aria-label="Edit dusun"
                      title="Edit"
                      @click="openEditHamlet(data)"
                    />

                    <Button
                      icon="pi pi-trash"
                      text
                      rounded
                      severity="danger"
                      aria-label="Hapus dusun"
                      title="Hapus"
                      @click="deleteHamlet(data.id)"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </template>
      </Card>

      <div class="bg-primary-600 rounded-xl p-5 text-white shadow-md flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm font-semibold flex items-center gap-2">
            <i class="pi pi-compass text-base" />
            Batas Wilayah
          </p>

          <Button
            icon="pi pi-pencil"
            text
            rounded
            aria-label="Edit batas wilayah"
            title="Edit"
            class="!text-white hover:!bg-white/15 !w-8 !h-8"
            @click="openBoundaryDialog"
          />
        </div>

        <div class="flex flex-col gap-4">
          <div
            v-for="direction in directionLabels"
            :key="direction.key"
            class="flex items-start gap-3"
          >
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white"
            >
              {{ direction.letter }}
            </span>

            <div class="min-w-0">
              <p class="text-sm text-white font-medium">{{ direction.label }}</p>
              <p class="text-xs text-white/65 mt-0.5">
                {{ boundaries[direction.key] || 'Belum diisi' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!--
      Dialog Tambah/Edit Data Wilayah.
      width diperbesar dari 28rem -> 36rem karena grid 3-kolom (Jiwa/Laki-laki/
      Perempuan) + InputNumber (yang punya wrapper stepper +/-) butuh ruang
      lebih dari InputText biasa. maxWidth + breakpoints menjaga dialog tetap
      muat di layar sempit (HP) tanpa keluar viewport.
    -->
    <Dialog
      v-model:visible="hamletDialogOpen"
      modal
      :header="editingHamletId === null ? 'Tambah Data Wilayah' : 'Edit Data Wilayah'"
      :style="{ width: '36rem', maxWidth: '95vw' }"
      :breakpoints="{ '640px': '95vw' }"
    >
      <div class="flex flex-col gap-4 overflow-x-hidden">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-semibold text-slate-700" for="hamletName">
            Nama Dusun
          </label>
          <InputText
            id="hamletName"
            v-model="hamletForm.name"
            placeholder="Nama dusun"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-semibold text-slate-700" for="hamletHead">
            Kepala Dusun
          </label>
          <InputText
            id="hamletHead"
            v-model="hamletForm.headName"
            placeholder="Nama kepala dusun"
            class="w-full"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold text-slate-700" for="hamletRw">
              Jumlah RW
            </label>
            <InputNumber
              id="hamletRw"
              v-model="hamletForm.rwCount"
              :min="0"
              class="w-full"
              inputClass="w-full"
              fluid
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold text-slate-700" for="hamletRt">
              Jumlah RT
            </label>
            <InputNumber
              id="hamletRt"
              v-model="hamletForm.rtCount"
              :min="0"
              class="w-full"
              inputClass="w-full"
              fluid
            />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-semibold text-slate-700" for="hamletKk">
            Jumlah KK
          </label>
          <InputNumber
            id="hamletKk"
            v-model="hamletForm.kkCount"
            :min="0"
            class="w-full"
            inputClass="w-full"
            fluid
          />
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold text-slate-700" for="hamletPopulation">
              Jiwa
            </label>
            <InputNumber
              id="hamletPopulation"
              v-model="hamletForm.population"
              :min="0"
              class="w-full"
              inputClass="w-full"
              fluid
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold text-slate-700" for="hamletMale">
              Laki-laki
            </label>
            <InputNumber
              id="hamletMale"
              v-model="hamletForm.maleCount"
              :min="0"
              class="w-full"
              inputClass="w-full"
              fluid
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold text-slate-700" for="hamletFemale">
              Perempuan
            </label>
            <InputNumber
              id="hamletFemale"
              v-model="hamletForm.femaleCount"
              :min="0"
              class="w-full"
              inputClass="w-full"
              fluid
            />
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          label="Batal"
          severity="secondary"
          outlined
          @click="hamletDialogOpen = false"
        />
        <Button
          label="Simpan"
          :loading="savingHamlet"
          :disabled="savingHamlet"
          @click="saveHamlet"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="boundaryDialogOpen"
      modal
      header="Edit Batas Wilayah"
      :style="{ width: '28rem' }"
    >
      <div class="flex flex-col gap-4">
        <div
          v-for="direction in directionLabels"
          :key="direction.key"
          class="flex flex-col gap-2"
        >
          <label class="text-sm font-semibold text-slate-700" :for="`boundary-${direction.key}`">
            {{ direction.label }}
          </label>
          <InputText
            :id="`boundary-${direction.key}`"
            v-model="boundaryForm[direction.key]"
            placeholder="Nama desa tetangga"
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <Button
          label="Batal"
          severity="secondary"
          outlined
          @click="boundaryDialogOpen = false"
        />
        <Button
          label="Simpan"
          @click="saveBoundaries"
        />
      </template>
    </Dialog>
  </div>
</template>
