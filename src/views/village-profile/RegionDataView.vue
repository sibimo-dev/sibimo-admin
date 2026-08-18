<script setup>
import { reactive, ref, computed } from 'vue'

import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

// Dummy data dusun -- ganti dengan GET /hamlets via region.service.js.
// Field kkCount, population, maleCount, femaleCount sementara manual;
// idealnya dihitung backend dari data warga per dusun.
const hamlets = ref([
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
])

// Ringkasan kartu di atas -- dihitung dari hamlets, bukan dari store terpisah.
const totalArea = ref(12.5) // km² -- ganti angka sesuai data desa Kak
const totalRw = computed(() => hamlets.value.reduce((sum, h) => sum + h.rwCount, 0))
const totalRt = computed(() => hamlets.value.reduce((sum, h) => sum + h.rtCount, 0))

const boundaries = reactive({
  north: 'Desa Sukamaju',
  south: 'Desa Margoluwih',
  east: 'Desa Sidoarum',
  west: 'Desa Sidokarto',
})
const neighborCount = computed(
  () => Object.values(boundaries).filter((v) => v && v.trim()).length,
)

const filters = ref({
  global: { value: null },
})

const rowsPerPage = ref(10)

const hamletDialogOpen = ref(false)
const editingHamletId = ref(null)

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

function saveHamlet() {
  if (!hamletForm.name.trim()) return

  if (editingHamletId.value === null) {
    hamlets.value.push({ ...hamletForm, id: Date.now() })
  } else {
    const idx = hamlets.value.findIndex((h) => h.id === editingHamletId.value)
    if (idx !== -1) hamlets.value[idx] = { ...hamlets.value[idx], ...hamletForm }
  }

  hamletDialogOpen.value = false
}

function deleteHamlet(id) {
  hamlets.value = hamlets.value.filter((h) => h.id !== id)
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

    <div class="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <template #content>
          <p class="m-0 mb-2 text-sm text-slate-500">
            Luas Wilayah
          </p>
          <p class="m-0 text-2xl font-bold text-slate-900">
            {{ totalArea }}
            <span class="text-sm font-medium text-slate-400">km²</span>
          </p>
        </template>
      </Card>

      <Card>
        <template #content>
          <p class="m-0 mb-2 text-sm text-slate-500">
            Jumlah RW
          </p>
          <p class="m-0 text-2xl font-bold text-slate-900">
            {{ totalRw }}
            <span class="text-sm font-medium text-slate-400">RW</span>
          </p>
        </template>
      </Card>

      <Card>
        <template #content>
          <p class="m-0 mb-2 text-sm text-slate-500">
            Jumlah RT
          </p>
          <p class="m-0 text-2xl font-bold text-slate-900">
            {{ totalRt }}
            <span class="text-sm font-medium text-slate-400">RT</span>
          </p>
        </template>
      </Card>

      <Card>
        <template #content>
          <p class="m-0 mb-2 text-sm text-slate-500">
            Batas Wilayah
          </p>
          <p class="m-0 text-2xl font-bold text-slate-900">
            {{ neighborCount }}
            <span class="text-sm font-medium text-slate-400">Desa Tetangga</span>
          </p>
        </template>
      </Card>
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
                  label="Tambah Data"
                  icon="pi pi-plus"
                  @click="openCreateHamlet"
                />
              </div>
            </div>

            <DataTable
              v-model:filters="filters"
              :value="hamlets"
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

      <Card>
        <template #content>
          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <h2 class="m-0 text-base font-semibold text-slate-900">
                Batas Wilayah
              </h2>

              <Button
                icon="pi pi-pencil"
                text
                rounded
                severity="secondary"
                aria-label="Edit batas wilayah"
                title="Edit"
                @click="openBoundaryDialog"
              />
            </div>

            <div class="flex flex-col gap-3">
              <div
                v-for="direction in directionLabels"
                :key="direction.key"
                class="flex items-center gap-3"
              >
                <span
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600"
                >
                  {{ direction.letter }}
                </span>

                <div class="flex flex-col">
                  <span class="text-sm font-semibold text-slate-800">
                    {{ direction.label }}
                  </span>
                  <span class="text-xs text-slate-500">
                    {{ boundaries[direction.key] || 'Belum diisi' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <Dialog
      v-model:visible="hamletDialogOpen"
      modal
      :header="editingHamletId === null ? 'Tambah Data Wilayah' : 'Edit Data Wilayah'"
      :style="{ width: '28rem' }"
    >
      <div class="flex flex-col gap-4">
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
          />
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold text-slate-700" for="hamletPopulation">
              Jiwa
            </label>
            <InputNumber
              id="hamletPopulation"
              v-model="hamletForm.population"
              :min="0"
              class="w-full"
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