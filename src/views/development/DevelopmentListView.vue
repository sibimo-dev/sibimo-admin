<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressBar from 'primevue/progressbar'
import AppButton from '@/components/common/AppButton.vue'

import AppPagination from '@/components/common/AppPagination.vue'
import {
  useDevelopmentStore,
  DEVELOPMENT_STATUSES,
  getDevelopmentCategoryLabel,
  getDevelopmentStatus,
} from '@/stores/development.store'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()
const developmentStore = useDevelopmentStore()

const loading = ref(developmentStore.developments.length === 0)
const search = ref('')
const first = ref(0)
const rowsPerPage = 8
const sortField = ref(null)
const sortOrder = ref(0) // 1 = ascending, -1 = descending, 0 = none

onMounted(async () => {
  const hasCachedData = developmentStore.developments.length > 0
  loading.value = !hasCachedData

  try {
    // If the store already has data from a previous visit, show it right away
    // and refresh from the API in the background.
    const refresh = developmentStore.fetchAll()
    if (hasCachedData) {
      loading.value = false
      await refresh
    } else {
      await refresh
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal memuat data pembangunan',
      detail: error.response?.data?.message ?? 'Periksa koneksi backend.',
      life: 4000,
    })
  } finally {
    loading.value = false
  }
})

// Search also matches category, status, and year, since there are no dropdown filters.
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return developmentStore.developments

  return developmentStore.developments.filter((item) =>
    [
      item.name,
      item.address,
      getDevelopmentCategoryLabel(item.category),
      getDevelopmentStatus(item.status).label,
      item.year,
    ].some((value) => String(value ?? '').toLowerCase().includes(q)),
  )
})

const sortAccessors = {
  name: (item) => item.name.toLowerCase(),
  category: (item) => getDevelopmentCategoryLabel(item.category).toLowerCase(),
  status: (item) => DEVELOPMENT_STATUSES.findIndex((status) => status.value === item.status),
  year: (item) => Number(item.year) || 0,
  budget: (item) => Number(item.budget) || 0,
  progress: (item) => latestProgress(item),
}

const sorted = computed(() => {
  const accessor = sortAccessors[sortField.value]
  if (!accessor || !sortOrder.value) return filtered.value

  return [...filtered.value].sort((a, b) => {
    const valueA = accessor(a)
    const valueB = accessor(b)
    const result =
      typeof valueA === 'string' ? valueA.localeCompare(valueB, 'id') : valueA - valueB
    return result * sortOrder.value
  })
})

const paged = computed(() => sorted.value.slice(first.value, first.value + rowsPerPage))

function resetPage() {
  first.value = 0
}

// Sorting is handled here (not by DataTable) so it applies to all pages, not
// only the rows currently shown. DataTable runs in `lazy` mode and only draws
// the header arrows and emits the sort event.
function onSort(event) {
  sortField.value = event.sortField ?? null
  sortOrder.value = event.sortOrder ?? 0
  resetPage()
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

// The highest percentage among the progress photos is treated as current progress.
function latestProgress(item) {
  return Math.max(0, ...(item.progress ?? []).map((entry) => Number(entry.percentage) || 0))
}

function goCreate() {
  router.push({ name: 'development-create' })
}

function goEdit(item) {
  router.push({ name: 'development-edit', params: { id: item.development_id } })
}

function handleDelete(item) {
  confirm.require({
    message: `Hapus data pembangunan "${item.name}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await developmentStore.remove(item.development_id)
      toast.add({ severity: 'success', summary: 'Data pembangunan berhasil dihapus', life: 2000 })
    },
  })
}
</script>

<template>
  <div class="min-h-full text-slate-800">
    <h1 class="m-0 mb-1 text-[22px] font-bold text-slate-900">
      Pembangunan
    </h1>

    <p class="mb-5 text-sm text-slate-500">
      Kelola data kegiatan pembangunan, progres, dan dokumentasinya.
    </p>

    <Card>
      <template #content>
        <div class="flex flex-col gap-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <Button
              label="Tambah Pembangunan"
              icon="pi pi-plus"
              @click="goCreate"
            />

            <div class="flex flex-wrap items-center gap-3">
              <IconField>
                <InputIcon class="pi pi-search" />

                <InputText
                  v-model="search"
                  placeholder="Cari kegiatan, lokasi, kategori, status..."
                  class="w-80"
                  @update:modelValue="resetPage"
                />
              </IconField>
            </div>
          </div>

          <!-- Loading state -->
          <div v-if="loading" class="py-14 text-center text-slate-400">
            <i class="pi pi-spin pi-spinner mb-3 block text-4xl text-slate-300" />
            Memuat data pembangunan...
          </div>

          <!-- Table -->
          <DataTable
            v-else
            :value="paged"
            dataKey="development_id"
            stripedRows
            lazy
            removableSort
            :sortField="sortField"
            :sortOrder="sortOrder"
            @sort="onSort"
          >
            <template #empty>
              <div class="py-10 text-center text-slate-400">
                <i class="pi pi-building mb-3 block text-4xl text-slate-300" />
                Belum ada data pembangunan yang cocok.
              </div>
            </template>

            <Column header="Kegiatan" field="name" sortable style="min-width: 280px">
              <template #body="{ data }">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100"
                  >
                    <img
                      v-if="data.cover_image"
                      :src="data.cover_image"
                      :alt="data.name"
                      class="h-full w-full object-cover"
                    />
                    <i v-else class="pi pi-image text-slate-300" />
                  </div>
                  <div class="min-w-0">
                    <p class="m-0 text-sm font-semibold text-slate-900">{{ data.name }}</p>
                    <p class="m-0 mt-0.5 truncate text-xs text-slate-400">{{ data.address || '-' }}</p>
                  </div>
                </div>
              </template>
            </Column>

            <Column header="Kategori" field="category" sortable>
              <template #body="{ data }">
                <Tag :value="getDevelopmentCategoryLabel(data.category)" severity="secondary" />
              </template>
            </Column>

            <Column header="Status" field="status" sortable>
              <template #body="{ data }">
                <Tag
                  :value="getDevelopmentStatus(data.status).label"
                  :severity="getDevelopmentStatus(data.status).severity"
                />
              </template>
            </Column>

            <Column header="Tahun" field="year" sortable>
              <template #body="{ data }">
                <span class="text-sm">{{ data.year || '-' }}</span>
              </template>
            </Column>

            <Column header="Anggaran" field="budget" sortable>
              <template #body="{ data }">
                <span class="whitespace-nowrap text-sm">{{ formatCurrency(data.budget) }}</span>
              </template>
            </Column>

            <Column header="Progres" field="progress" sortable style="min-width: 160px">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <ProgressBar
                    :value="latestProgress(data)"
                    :showValue="false"
                    class="flex-1"
                    style="height: 8px"
                  />
                  <span class="w-10 text-right text-xs font-semibold text-slate-600">
                    {{ latestProgress(data) }}%
                  </span>
                </div>
              </template>
            </Column>

            <Column header="Aksi" style="width: 110px">
              <template #body="{ data }">
                <div class="flex items-center gap-1.5">
                  <AppButton
                    icon="pi pi-pencil"
                    variant="outline"
                    rounded-icon
                    aria-label="Edit pembangunan"
                    title="Edit"
                    @click="goEdit(data)"
                  />
                  <AppButton
                    icon="pi pi-trash"
                    variant="danger-ghost"
                    rounded-icon
                    aria-label="Hapus pembangunan"
                    title="Hapus"
                    @click="handleDelete(data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>

          <div v-if="filtered.length > rowsPerPage">
            <AppPagination
              :total="filtered.length"
              :rows="rowsPerPage"
              :first="first"
              @page="({ first: f }) => (first = f)"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>