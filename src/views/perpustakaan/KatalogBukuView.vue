<script setup>
/**
 * CRUD Katalog Buku -- field sesuai tabel `books` (book_id, category_id FK,
 * title, author, isbn, stock). Kategori (`book_categories`) SENGAJA tidak
 * dibuat halaman terpisah -- dikelola langsung dari dalam form ini lewat
 * opsi "+ Tambah kategori baru" di dropdown kategori.
 *
 * Pola mengikuti TipeSuratListView.vue (AppDataTable + AppModal + useConfirm)
 * supaya konsisten dengan modul CRUD lain.
 */
import { ref, reactive, computed } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Tag from 'primevue/tag'
import AppDataTable from '@/components/common/AppDataTable.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppSelect from '@/components/common/AppSelect.vue'

const confirm = useConfirm()
const toast = useToast()

const TAMBAH_KATEGORI_BARU = '__new__'

// Dummy data kategori -- ganti dengan GET /book-categories.
// Karena tidak ada halaman terpisah, daftar ini HANYA dikelola dari sini.
const kategoriList = ref([
  { category_id: 1, category_name: 'Sejarah' },
  { category_id: 2, category_name: 'Pertanian' },
  { category_id: 3, category_name: 'Novel' },
])

const kategoriOptions = computed(() => [
  ...kategoriList.value.map((k) => ({ label: k.category_name, value: k.category_id })),
  { label: '+ Tambah kategori baru...', value: TAMBAH_KATEGORI_BARU },
])

function namaKategori(categoryId) {
  return kategoriList.value.find((k) => k.category_id === categoryId)?.category_name || '-'
}

const columns = [
  { field: 'title', header: 'Judul Buku' },
  { field: 'author', header: 'Penulis' },
  { field: 'isbn', header: 'ISBN' },
  { field: 'category_id', header: 'Kategori' },
  { field: 'stock', header: 'Stok' },
]

// Dummy data -- ganti dengan panggilan ke book.service.js
const rows = ref([
  { book_id: 1, category_id: 1, title: 'Sejarah Perjuangan Kemerdekaan', author: 'Ahmad Wibowo', isbn: '978-602-1234-56-7', stock: 3 },
  { book_id: 2, category_id: 2, title: 'Teknik Pertanian Modern', author: 'Siti Rahayu', isbn: '978-602-9876-54-3', stock: 5 },
  { book_id: 3, category_id: 3, title: 'Laskar Pelangi', author: 'Andrea Hirata', isbn: '978-979-1227-78-0', stock: 0 },
])

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

function handleDelete(data) {
  confirm.require({
    message: `Hapus buku "${data.title}"? Buku yang masih ada riwayat peminjaman aktif sebaiknya jangan dihapus.`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: () => {
      rows.value = rows.value.filter((r) => r.book_id !== data.book_id)
      toast.add({ severity: 'success', summary: 'Berhasil dihapus', life: 2000 })
    },
  })
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="page-title">Katalog Buku</h1>
        <p class="page-subtitle mb-0">Kelola daftar buku perpustakaan desa</p>
      </div>
      <AppButton label="Tambah Buku" icon="pi pi-plus" variant="primary" @click="openTambah" />
    </div>

    <AppDataTable :columns="columns" :rows="rows" data-key="book_id">
      <template #category_id="{ data }">
        {{ namaKategori(data.category_id) }}
      </template>
      <template #stock="{ data }">
        <Tag
          :value="data.stock > 0 ? `${data.stock} tersedia` : 'Stok habis'"
          :severity="data.stock > 0 ? 'success' : 'danger'"
        />
      </template>
      <template #actions="{ data }">
        <AppButton icon="pi pi-pencil" variant="ghost" size="small" @click="openEdit(data)" />
        <AppButton icon="pi pi-trash" variant="ghost" size="small" @click="handleDelete(data)" />
      </template>
    </AppDataTable>

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
