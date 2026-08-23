<script setup>
import { ref, reactive, computed } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Card from 'primevue/card'

import AppModal from '@/components/common/AppModal.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import { kategoriList, kategoriOptions, namaKategori, bookList, TAMBAH_KATEGORI_BARU } from './libraryData'

const confirm = useConfirm()
const toast = useToast()

// rows = alias lokal ke bookList bersama (dari libraryData.js), supaya
// Katalog Buku dan Peminjaman selalu baca data buku yang sama persis.
const rows = bookList

const selected = ref([])
const filters = ref({
  global: { value: null },
})

const rowsPerPage = ref(10)

const showModal = ref(false)
const saving = ref(false)
const form = reactive({
  book_id: null,
  category_id: null,
  title: '',
  author: '',
  isbn: '',
  stock: 0,
  kategori_baru_nama: '', // cuma dipakai sementara kalau pilih "+ Tambah kategori baru"
})

// Tampil/sembunyi field kategori baru, tergantung pilihan di dropdown
const sedangBuatKategoriBaru = computed(() => form.category_id === TAMBAH_KATEGORI_BARU)

function stockSeverity(stock) {
  return stock > 0 ? 'success' : 'danger'
}

function openTambah() {
  form.book_id = null
  form.category_id = null
  form.title = ''
  form.author = ''
  form.isbn = ''
  form.stock = 0
  form.kategori_baru_nama = ''
  showModal.value = true
}

function openEdit(data) {
  form.book_id = data.book_id
  form.category_id = data.category_id
  form.title = data.title
  form.author = data.author
  form.isbn = data.isbn
  form.stock = data.stock
  form.kategori_baru_nama = ''
  showModal.value = true
}

async function handleSave() {
  if (sedangBuatKategoriBaru.value && !form.kategori_baru_nama.trim()) {
    toast.add({ severity: 'error', summary: 'Nama kategori baru wajib diisi', life: 2500 })
    return
  }

  saving.value = true
  try {
    let categoryId = form.category_id

    // Kalau user pilih "+ Tambah kategori baru", buat kategorinya dulu,
    // baru pakai ID hasil buatnya untuk buku ini.
    // TODO: ganti dengan panggilan API createBookCategory(), lalu pakai
    // category_id hasil response-nya (bukan Date.now() seperti dummy ini).
    if (sedangBuatKategoriBaru.value) {
      const kategoriBaru = { category_id: Date.now(), category_name: form.kategori_baru_nama.trim() }
      kategoriList.value.push(kategoriBaru)
      categoryId = kategoriBaru.category_id
      toast.add({ severity: 'success', summary: `Kategori "${kategoriBaru.category_name}" ditambahkan`, life: 2000 })
    }

    const payload = {
      category_id: categoryId,
      title: form.title,
      author: form.author,
      isbn: form.isbn,
      stock: Number(form.stock) || 0,
    }

    // TODO: ganti dengan panggilan ke book.service.js (createBook / updateBook)
    if (form.book_id) {
      const idx = rows.value.findIndex((r) => r.book_id === form.book_id)
      rows.value[idx] = { ...rows.value[idx], ...payload }
    } else {
      rows.value.push({ ...payload, book_id: Date.now() })
    }
    toast.add({ severity: 'success', summary: 'Buku berhasil disimpan', life: 2000 })
    showModal.value = false
  } finally {
    saving.value = false
  }
}

function deleteBook(bookId) {
  rows.value = rows.value.filter((r) => r.book_id !== bookId)
  selected.value = selected.value.filter((item) => item.book_id !== bookId)
}

function handleDelete(data) {
  confirm.require({
    message: `Hapus buku "${data.title}"? Buku yang masih ada riwayat peminjaman aktif sebaiknya jangan dihapus.`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: () => {
      deleteBook(data.book_id)
      toast.add({ severity: 'success', summary: 'Berhasil dihapus', life: 2000 })
    },
  })
}

function deleteSelected() {
  if (selected.value.length === 0) return

  confirm.require({
    message: `Hapus ${selected.value.length} buku yang dipilih?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: () => {
      const selectedIds = new Set(selected.value.map((item) => item.book_id))
      rows.value = rows.value.filter((r) => !selectedIds.has(r.book_id))
      selected.value = []
      toast.add({ severity: 'success', summary: 'Berhasil dihapus', life: 2000 })
    },
  })
}
</script>

<template>
  <div class="min-h-full text-slate-800">
    <h1 class="m-0 mb-1 text-[22px] font-bold text-slate-900">
      Katalog Buku
    </h1>

    <p class="mb-5 text-sm text-slate-500">
      Kelola daftar buku perpustakaan desa.
    </p>

    <Card>
      <template #content>
        <div class="flex flex-col gap-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <Button
                label="Tambah Buku"
                icon="pi pi-plus"
                @click="openTambah"
              />

              <Button
                label="Hapus"
                icon="pi pi-trash"
                severity="secondary"
                outlined
                :disabled="selected.length === 0"
                @click="deleteSelected"
              />
            </div>

            <IconField>
              <InputIcon class="pi pi-search" />

              <InputText
                v-model="filters.global.value"
                placeholder="Cari judul, penulis, atau ISBN"
              />
            </IconField>
          </div>

          <DataTable
            v-model:selection="selected"
            v-model:filters="filters"
            :value="rows"
            dataKey="book_id"
            :paginator="true"
            :rows="rowsPerPage"
            :rowsPerPageOptions="[10, 25, 50]"
            :globalFilterFields="['title', 'author', 'isbn']"
            sortField="title"
            :sortOrder="1"
            removableSort
            stripedRows
            currentPageReportTemplate="Menampilkan {first}–{last} dari {totalRecords} buku"
            paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            class="w-full"
          >
            <template #empty>
              <div class="py-8 text-center text-slate-400">
                Tidak ada buku yang cocok dengan pencarian.
              </div>
            </template>

            <Column selectionMode="multiple" headerStyle="width: 3rem" />

            <Column
              field="title"
              header="Judul Buku"
              sortable
              class="min-w-64"
            />

            <Column
              field="author"
              header="Penulis"
              sortable
            />

            <Column
              field="isbn"
              header="ISBN"
            />

            <Column
              header="Kategori"
              sortable
              sortField="category_id"
            >
              <template #body="{ data }">
                {{ namaKategori(data.category_id) }}
              </template>
            </Column>

            <Column
              field="stock"
              header="Stok"
              sortable
            >
              <template #body="{ data }">
                <Tag
                  :value="data.stock > 0 ? `${data.stock} tersedia` : 'Stok habis'"
                  :severity="stockSeverity(data.stock)"
                  rounded
                />
              </template>
            </Column>

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
                    aria-label="Edit buku"
                    title="Edit"
                    @click="openEdit(data)"
                  />

                  <Button
                    icon="pi pi-trash"
                    text
                    rounded
                    severity="danger"
                    aria-label="Hapus buku"
                    title="Hapus"
                    @click="handleDelete(data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </Card>

    <AppModal
      v-model="showModal"
      :title="form.book_id ? 'Edit Buku' : 'Tambah Buku'"
      :loading="saving"
      @save="handleSave"
    >
      <AppInput v-model="form.title" label="Judul Buku" required />
      <AppInput v-model="form.author" label="Penulis" />
      <AppInput v-model="form.isbn" label="ISBN" placeholder="978-xxx-xxxx-xx-x" />

      <AppSelect v-model="form.category_id" label="Kategori" :options="kategoriOptions" placeholder="Pilih Kategori..." required />

      <!-- Muncul cuma kalau pilih "+ Tambah kategori baru" di dropdown atas -->
      <AppInput
        v-if="sedangBuatKategoriBaru"
        v-model="form.kategori_baru_nama"
        label="Nama Kategori Baru"
        placeholder="Contoh: Biografi"
        required
      />

      <AppInput v-model="form.stock" type="number" label="Stok" required />
    </AppModal>
  </div>
</template>