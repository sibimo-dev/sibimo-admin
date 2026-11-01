<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useLetterTypeStore } from '@/stores/useLetterTypeStore'

const router = useRouter()
const toast = useToast()
const { rows, updateLetterType, fetchRows, removeLetterType } = useLetterTypeStore()

onMounted(async () => {
  try {
    await fetchRows()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal memuat tipe surat',
      detail: error.response?.data?.message ?? 'Periksa koneksi ke backend.',
      life: 3000,
    })
  }
})

// ====== Category (for filter & badge severity) ======
const categorySeverity = {
  Keterangan: 'info',
  Pengantar: 'warn',
  Permohonan: 'success',
  Rekomendasi: 'help',
}
function severityFor(category) {
  return categorySeverity[category] ?? 'secondary'
}

const categoryOptions = computed(() => {
  const unique = [...new Set(rows.value.map((r) => r.category))]
  return [{ label: 'Semua Kategori', value: null }, ...unique.map((c) => ({ label: c, value: c }))]
})

function formatCreatedAt(isoString) {
  if (!isoString) return '-'
  return new Date(isoString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ====== Search & filter ======
const searchQuery = ref('')
const selectedCategory = ref(null)

const filteredRows = computed(() => {
  return rows.value.filter((r) => {
    const matchSearch =
      !searchQuery.value ||
      (r.letter_name ?? '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (r.number_prefix ?? '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (r.classification_index ?? '').toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCategory = !selectedCategory.value || r.category === selectedCategory.value
    return matchSearch && matchCategory
  })
})

// ====== Stats ======
const stats = computed(() => {
  const total = rows.value.length
  const active = rows.value.filter((r) => r.is_active).length
  const inactive = total - active
  const categoryCount = new Set(rows.value.map((r) => r.category)).size
  return { total, active, inactive, categoryCount }
})

// ====== Toggle active/inactive status ======
async function toggleStatus(data) {
  try {
    await updateLetterType(data.letter_type_id, { is_active: data.is_active })
    toast.add({
      severity: data.is_active ? 'success' : 'secondary',
      summary: `Status "${data.letter_name}" diubah menjadi ${data.is_active ? 'Aktif' : 'Nonaktif'}`,
      life: 2000,
    })
  } catch (error) {
    data.is_active = !data.is_active
    toast.add({ severity: 'error', summary: 'Gagal mengubah status tipe surat', life: 2500 })
  }
}

// ====== Navigate to manage page ======
function handleKelola(data) {
  router.push({ name: 'letter-type-manage', params: { id: data.letter_type_id } })
}

// ====== Hapus tipe surat (selalu minta konfirmasi dulu) ======
const isDeleteDialogVisible = ref(false)
const isDeleting = ref(false)
const typeToDelete = ref(null)

function handleHapus(data) {
  typeToDelete.value = data
  isDeleteDialogVisible.value = true
}

async function confirmHapus() {
  if (!typeToDelete.value) return
  isDeleting.value = true
  try {
    await removeLetterType(typeToDelete.value.letter_type_id)
    toast.add({ severity: 'success', summary: 'Tipe surat dihapus', life: 2000 })
    isDeleteDialogVisible.value = false
    typeToDelete.value = null
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal menghapus tipe surat',
      detail: error.response?.data?.message ?? 'Tipe surat mungkin sudah dipakai surat lain.',
      life: 3500,
    })
  } finally {
    isDeleting.value = false
  }
}
</script>
<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="m-0 text-2xl font-bold text-primary-900">Pengelolaan Tipe Surat</h1>
      <p class="m-0 mt-1 text-sm text-neutral-500">
        Kelola daftar tipe surat yang tersedia untuk layanan administrasi desa.
      </p>
    </div>

    <!-- Ringkasan -->
    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div class="text-[13px] text-neutral-500">Total Tipe Surat</div>
        <div class="mt-1 text-3xl font-bold text-neutral-800">{{ stats.total }}</div>
        <div class="mt-1 text-xs text-neutral-400">Terdaftar di sistem</div>
      </div>
      <div class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div class="flex items-center gap-1.5 text-[13px] text-neutral-500">
          <span class="inline-block h-2 w-2 rounded-full bg-green-500"></span> Aktif
        </div>
        <div class="mt-1 text-3xl font-bold text-neutral-800">{{ stats.active }}</div>
        <div class="mt-1 text-xs text-neutral-400">Dapat diajukan warga</div>
      </div>
      <div class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div class="flex items-center gap-1.5 text-[13px] text-neutral-500">
          <span class="inline-block h-2 w-2 rounded-full bg-neutral-400"></span> Nonaktif / Draft
        </div>
        <div class="mt-1 text-3xl font-bold text-neutral-800">{{ stats.inactive }}</div>
        <div class="mt-1 text-xs text-neutral-400">Belum lengkap konfigurasi</div>
      </div>
      <div class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div class="text-[13px] text-neutral-500">Kategori Layanan</div>
        <div class="mt-1 text-3xl font-bold text-neutral-800">{{ stats.categoryCount }}</div>
        <div class="mt-1 text-xs text-neutral-400">Keterangan, Pengantar, dll.</div>
      </div>
    </div>

    <Card
      :pt="{
        root: { class: 'rounded-lg border border-neutral-200 bg-white shadow-sm' },
        body: { class: 'p-5' },
        content: { class: 'p-0' },
      }"
    >
      <template #content>
        <!-- Toolbar: filter kategori (pill) di kiri, pencarian di kanan -->
        <div class="mb-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <div class="flex flex-wrap items-center gap-2">
            <Button
              v-for="opt in categoryOptions"
              :key="opt.value ?? 'all'"
              :label="opt.label"
              size="small"
              :outlined="selectedCategory !== opt.value"
              :aria-pressed="selectedCategory === opt.value"
              @click="selectedCategory = opt.value"
            />
          </div>

          <IconField class="w-full sm:w-72">
            <InputIcon class="pi pi-search text-neutral-400" />
            <InputText
              v-model="searchQuery"
              placeholder="Cari nama surat/prefix/indeks"
              class="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-8 pr-3 text-[13px] text-neutral-800 outline-none transition focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
            />
          </IconField>
        </div>

        <DataTable
          :value="filteredRows"
          data-key="letter_type_id"
          sort-field="created_at"
          :sort-order="-1"
          removable-sort
          striped-rows
          paginator
          :rows="10"
          :rows-per-page-options="[10, 25, 50]"
          current-page-report-template="Menampilkan {first}–{last} dari {totalRecords} tipe surat"
          paginator-template="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          responsive-layout="scroll"
          class="w-full overflow-hidden rounded-lg border border-neutral-200 text-[13px]"
          :pt="{
            headerRow: { class: 'bg-neutral-50' },
            headerCell: { class: 'whitespace-nowrap border-b border-neutral-200 bg-neutral-50 px-3 py-2.5 text-left font-semibold text-neutral-500' },
            bodyRow: { class: 'border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/70' },
            bodyCell: { class: 'px-3 py-3 align-middle text-neutral-700' },
            paginator: { root: { class: 'flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-3 py-3 text-[13px] text-neutral-500' } },
          }"
        >
          <template #empty>
            <div class="px-3 py-8 text-center text-neutral-400">
              Tidak ada tipe surat yang cocok dengan pencarian/filter.
            </div>
          </template>

          <Column header="No." header-style="width: 4rem">
            <template #body="{ index }">{{ index + 1 }}</template>
          </Column>

          <Column field="letter_name" header="Nama Surat" sortable>
            <template #body="{ data }">
              <span class="font-medium text-neutral-800">{{ data.letter_name }}</span>
            </template>
          </Column>

          <Column field="category" header="Kategori" sortable>
            <template #body="{ data }">
              <Tag
                :value="data.category"
                :severity="severityFor(data.category)"
                class="rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide"
              />
            </template>
          </Column>

          <Column field="classification_index" header="Indeks Arsip" sortable>
            <template #body="{ data }">
              <span
                v-if="data.classification_index"
                class="inline-flex rounded-md bg-neutral-100 px-2 py-1 text-[12px] font-medium text-neutral-600"
              >{{ data.classification_index }}</span>
              <span v-else class="text-neutral-400">-</span>
            </template>
          </Column>

          <Column field="processing_time" header="Estimasi Proses" sortable>
            <template #body="{ data }">
              <span class="flex items-center gap-2 text-neutral-600">
                <i class="pi pi-clock text-neutral-400"></i>
                {{ data.processing_time || '-' }}
              </span>
            </template>
          </Column>

          <Column field="document_count" header="Dok. Syarat" sortable>
            <template #body="{ data }">
              <span class="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-3 py-1.5 text-[12px] font-medium leading-tight text-blue-600">
                <i class="pi pi-file"></i>
                {{ data.document_count }} dokumen
              </span>
            </template>
          </Column>

          <Column field="signer_name" header="Penandatangan" sortable />

          <Column field="signature_method" header="Metode TTD" sortable>
            <template #body="{ data }">
              <Tag
                :value="data.signature_method === 'manual' ? 'Manual' : 'Digital'"
                :severity="data.signature_method === 'manual' ? 'secondary' : 'contrast'"
                class="rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide"
              />
            </template>
          </Column>

          <Column field="created_at" header="Tanggal Dibuat" sortable>
            <template #body="{ data }">{{ formatCreatedAt(data.created_at) }}</template>
          </Column>

          <Column field="is_active" header="Status" sortable>
            <template #body="{ data }">
              <ToggleSwitch v-model="data.is_active" @change="toggleStatus(data)" />
            </template>
          </Column>

          <Column
            header="Aksi"
            header-style="width: 6rem; text-align: center"
            body-class="text-center"
            :pt="{ columnHeaderContent: { class: 'justify-center' } }"
          >
            <template #body="{ data }">
              <div class="flex items-center justify-center gap-1">
                <Button
                  icon="pi pi-pencil"
                  text
                  rounded
                  size="small"
                  class="text-slate-500! hover:bg-slate-100!"
                  aria-label="Edit tipe surat"
                  title="Edit"
                  @click="handleKelola(data)"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  size="small"
                  severity="danger"
                  aria-label="Hapus tipe surat"
                  title="Hapus"
                  @click="handleHapus(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Konfirmasi hapus -->
    <Dialog
      v-model:visible="isDeleteDialogVisible"
      modal
      header="Konfirmasi Hapus"
      class="w-[26rem] max-w-[95vw]"
      :draggable="false"
      :closable="!isDeleting"
    >
      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
          <i class="pi pi-exclamation-triangle text-lg"></i>
        </div>
        <p class="m-0 text-sm text-neutral-600">
          Yakin ingin menghapus tipe surat
          <span class="font-semibold text-neutral-800">{{ typeToDelete?.letter_name }}</span>?
          Dokumen persyaratannya ikut terhapus dan tindakan ini tidak dapat dibatalkan.
        </p>
      </div>

      <template #footer>
        <Button label="Batal" severity="secondary" text :disabled="isDeleting" @click="isDeleteDialogVisible = false" />
        <Button label="Ya, Hapus" icon="pi pi-trash" severity="danger" :loading="isDeleting" @click="confirmHapus" />
      </template>
    </Dialog>
  </div>
</template>