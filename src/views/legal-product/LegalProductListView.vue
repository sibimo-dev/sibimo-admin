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
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import AppButton from '@/components/common/AppButton.vue'

import AppPagination from '@/components/common/AppPagination.vue'
import {
  useLegalProductStore,
  getLegalProductCategory,
  getLegalProductStatus,
} from '@/stores/legal-product.store'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()
const legalProductStore = useLegalProductStore()

const loading = ref(legalProductStore.legalProducts.length === 0)
const search = ref('')
const first = ref(0)
const rowsPerPage = 10
// Default order is newest year first, shown as an active arrow on the Tahun header.
const sortField = ref('year')
const sortOrder = ref(-1) // 1 = ascending, -1 = descending, 0 = none

onMounted(async () => {
  const hasCachedData = legalProductStore.legalProducts.length > 0
  loading.value = !hasCachedData

  try {
    // If the store already has data from a previous visit, show it right away
    // and refresh from the API in the background.
    const refresh = legalProductStore.fetchAll()
    if (hasCachedData) {
      loading.value = false
      await refresh
    } else {
      await refresh
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal memuat produk hukum',
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
  if (!q) return legalProductStore.legalProducts

  return legalProductStore.legalProducts.filter((item) =>
    [
      item.title,
      item.number,
      item.description,
      getLegalProductCategory(item.category).label,
      getLegalProductStatus(item.status).label,
      item.year,
    ].some((value) => String(value ?? '').toLowerCase().includes(q)),
  )
})

const sortAccessors = {
  title: (item) => item.title.toLowerCase(),
  category: (item) => getLegalProductCategory(item.category).label.toLowerCase(),
  year: (item) => Number(item.year) || 0,
  status: (item) => getLegalProductStatus(item.status).label.toLowerCase(),
}

// Used when no column is sorted, and as a tie-breaker: newest year first, then title.
function compareDefault(a, b) {
  return b.year - a.year || a.title.localeCompare(b.title, 'id')
}

const sorted = computed(() => {
  const accessor = sortAccessors[sortField.value]
  const items = [...filtered.value]
  if (!accessor || !sortOrder.value) return items.sort(compareDefault)

  return items.sort((a, b) => {
    const valueA = accessor(a)
    const valueB = accessor(b)
    const result =
      typeof valueA === 'string' ? valueA.localeCompare(valueB, 'id') : valueA - valueB
    return result * sortOrder.value || compareDefault(a, b)
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

function goCreate() {
  router.push({ name: 'legal-product-create' })
}

function goEdit(item) {
  router.push({ name: 'legal-product-edit', params: { id: item.legal_product_id } })
}

function handleDelete(item) {
  confirm.require({
    message: `Hapus produk hukum "${item.title}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await legalProductStore.remove(item.legal_product_id)
      toast.add({ severity: 'success', summary: 'Produk hukum berhasil dihapus', life: 2000 })
    },
  })
}
</script>

<template>
  <div class="min-h-full text-slate-800">
    <h1 class="m-0 mb-1 text-[22px] font-bold text-slate-900">
      Produk Hukum
    </h1>

    <p class="mb-5 text-sm text-slate-500">
      Kelola dokumen produk hukum kalurahan seperti Perkal dan SK Lurah.
    </p>

    <Card>
      <template #content>
        <div class="flex flex-col gap-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <Button
              label="Tambah Produk Hukum"
              icon="pi pi-plus"
              @click="goCreate"
            />

            <div class="flex flex-wrap items-center gap-3">
              <IconField>
                <InputIcon class="pi pi-search" />

                <InputText
                  v-model="search"
                  placeholder="Cari kata kunci, nomor, judul..."
                  class="w-72"
                  @update:modelValue="resetPage"
                />
              </IconField>
            </div>
          </div>

          <!-- Loading state -->
          <div v-if="loading" class="py-14 text-center text-slate-400">
            <i class="pi pi-spin pi-spinner mb-3 block text-4xl text-slate-300" />
            Memuat produk hukum...
          </div>

          <!-- Table -->
          <DataTable
            v-else
            :value="paged"
            dataKey="legal_product_id"
            stripedRows
            lazy
            removableSort
            :sortField="sortField"
            :sortOrder="sortOrder"
            @sort="onSort"
          >
            <template #empty>
              <div class="py-10 text-center text-slate-400">
                <i class="pi pi-book mb-3 block text-4xl text-slate-300" />
                Belum ada produk hukum yang cocok.
              </div>
            </template>

            <Column header="No" style="width: 60px">
              <template #body="{ index }">
                <span class="text-sm">{{ first + index + 1 }}</span>
              </template>
            </Column>

            <Column header="Judul Produk Hukum" field="title" sortable style="min-width: 280px">
              <template #body="{ data }">
                <p class="m-0 text-sm font-semibold text-slate-900">{{ data.title }}</p>
                <p v-if="data.number" class="m-0 mt-0.5 text-xs text-slate-400">{{ data.number }}</p>
              </template>
            </Column>

            <Column header="Kategori" field="category" sortable>
              <template #body="{ data }">
                <span
                  class="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
                  :class="getLegalProductCategory(data.category).badgeClass"
                >
                  {{ getLegalProductCategory(data.category).label }}
                </span>
              </template>
            </Column>

            <Column header="Tahun" field="year" sortable style="width: 110px">
              <template #body="{ data }">
                <span class="text-sm">{{ data.year }}</span>
              </template>
            </Column>

            <Column header="Status" field="status" sortable>
              <template #body="{ data }">
                <span
                  class="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
                  :class="getLegalProductStatus(data.status).badgeClass"
                >
                  {{ getLegalProductStatus(data.status).label }}
                </span>
              </template>
            </Column>

            <Column header="Aksi" style="width: 200px">
              <template #body="{ data }">
                <div class="flex items-center gap-1.5">
                  <Button
                    as="a"
                    :href="data.document"
                    target="_blank"
                    rel="noopener"
                    icon="pi pi-eye"
                    severity="secondary"
                    outlined
                    rounded
                    :disabled="!data.document"
                    aria-label="Pratinjau dokumen"
                    title="Pratinjau"
                  />
                  <Button
                    as="a"
                    :href="data.document"
                    download
                    icon="pi pi-download"
                    severity="secondary"
                    outlined
                    rounded
                    :disabled="!data.document"
                    aria-label="Unduh dokumen"
                    title="Unduh"
                  />
                  <AppButton
                    icon="pi pi-pencil"
                    variant="outline"
                    rounded-icon
                    aria-label="Edit produk hukum"
                    title="Edit"
                    @click="goEdit(data)"
                  />
                  <AppButton
                    icon="pi pi-trash"
                    variant="danger-ghost"
                    rounded-icon
                    aria-label="Hapus produk hukum"
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