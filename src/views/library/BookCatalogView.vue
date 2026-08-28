<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
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
import {
  createBook, createBookCategory, deleteBook, deleteBookCategory,
  getBookCategories, getBooks, updateBook, updateBookCategory,
} from '@/services/library.service'
import { getListCache, setListCache, updateListCache } from '@/services/list-cache'

const confirm = useConfirm()
const toast = useToast()
const cachedBooks = getListCache('books')
const cachedCategories = getListCache('book-categories')
const books = ref(cachedBooks ?? [])
const categories = ref(cachedCategories ?? [])
const selected = ref([])
const loading = ref(!cachedBooks && !cachedCategories)
const saving = ref(false)
const categorySaving = ref(false)
const showBookModal = ref(false)
const showCategoryModal = ref(false)
const filters = ref({ global: { value: null } })
const rowsPerPage = ref(10)
const bookForm = reactive({ book_id: null, category_id: null, new_category_name: '', title: '', author: '', isbn: '', stock: 0 })
const categoryForm = reactive({ category_id: null, category_name: '', description: '' })
const categoryOptions = computed(() => categories.value.map((category) => ({ label: category.category_name, value: category.category_id })))

function messageFrom(error, fallback) {
  return error.response?.data?.message ?? error.response?.data?.errors?.book_id?.[0] ?? fallback
}

async function loadData({ background = false } = {}) {
  if (!background) loading.value = true
  try {
    const [categoryData, bookData] = await Promise.all([getBookCategories(), getBooks()])
    categories.value = categoryData
    books.value = bookData
    setListCache('book-categories', categoryData)
    setListCache('books', bookData)
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal memuat katalog', detail: messageFrom(error, 'Coba lagi.'), life: 3500 })
  } finally {
    if (!background) loading.value = false
  }
}

function resetBookForm() {
  Object.assign(bookForm, { book_id: null, category_id: null, new_category_name: '', title: '', author: '', isbn: '', stock: 0 })
}
function resetCategoryForm() {
  Object.assign(categoryForm, { category_id: null, category_name: '', description: '' })
}
function openCreateBook() { resetBookForm(); showBookModal.value = true }
function openEditBook(book) {
  Object.assign(bookForm, { book_id: book.book_id, category_id: book.category_id, new_category_name: '', title: book.title, author: book.author ?? '', isbn: book.isbn ?? '', stock: book.stock })
  showBookModal.value = true
}
function openCreateCategory() { resetCategoryForm(); showCategoryModal.value = true }
function openEditCategory(category) {
  Object.assign(categoryForm, { category_id: category.category_id, category_name: category.category_name, description: category.description ?? '' })
  showCategoryModal.value = true
}

async function saveBook() {
  if ((!bookForm.category_id && !bookForm.new_category_name.trim()) || !bookForm.title.trim()) {
    toast.add({ severity: 'error', summary: 'Kategori dan judul buku wajib diisi', life: 2500 })
    return
  }
  saving.value = true
  try {
    let categoryId = bookForm.category_id
    if (!bookForm.book_id && bookForm.new_category_name.trim()) {
      const category = await createBookCategory({ category_name: bookForm.new_category_name.trim(), description: null })
      categoryId = category.category_id
      categories.value = [category, ...categories.value]
      updateListCache('book-categories', (items) => [category, ...items])
    }
    const payload = { category_id: categoryId, title: bookForm.title.trim(), author: bookForm.author.trim() || null, isbn: bookForm.isbn.trim() || null, stock: Number(bookForm.stock) || 0 }
    const saved = bookForm.book_id
      ? await updateBook(bookForm.book_id, payload)
      : await createBook(payload)
    updateListCache('books', items => bookForm.book_id
      ? items.map(item => item.book_id === Number(bookForm.book_id) ? { ...item, ...saved, category_id: categoryId } : item)
      : [saved, ...items])
    toast.add({ severity: 'success', summary: 'Buku berhasil disimpan', life: 2500 })
    showBookModal.value = false
    void loadData({ background: true })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Buku gagal disimpan', detail: messageFrom(error, 'Periksa data buku.'), life: 3500 })
  } finally { saving.value = false }
}

async function saveCategory() {
  if (!categoryForm.category_name.trim()) {
    toast.add({ severity: 'error', summary: 'Nama kategori wajib diisi', life: 2500 })
    return
  }
  categorySaving.value = true
  try {
    const payload = { category_name: categoryForm.category_name.trim(), description: categoryForm.description.trim() || null }
    const saved = categoryForm.category_id
      ? await updateBookCategory(categoryForm.category_id, payload)
      : await createBookCategory(payload)
    updateListCache('book-categories', items => categoryForm.category_id
      ? items.map(item => item.category_id === Number(categoryForm.category_id) ? { ...item, ...saved } : item)
      : [saved, ...items])
    toast.add({ severity: 'success', summary: 'Kategori berhasil disimpan', life: 2500 })
    showCategoryModal.value = false
    void loadData({ background: true })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Kategori gagal disimpan', detail: messageFrom(error, 'Periksa data kategori.'), life: 3500 })
  } finally { categorySaving.value = false }
}

function confirmDeleteBook(book) {
  confirm.require({ message: `Hapus buku "${book.title}"?`, header: 'Konfirmasi Hapus', icon: 'pi pi-exclamation-triangle', acceptLabel: 'Hapus', rejectLabel: 'Batal', acceptClass: 'p-button-danger', accept: async () => {
    try { await deleteBook(book.book_id); selected.value = selected.value.filter((item) => item.book_id !== book.book_id); toast.add({ severity: 'success', summary: 'Buku berhasil dihapus', life: 2500 }); await loadData() }
    catch (error) { toast.add({ severity: 'error', summary: 'Buku gagal dihapus', detail: messageFrom(error, 'Data mungkin masih digunakan.'), life: 3500 }) }
  } })
}
function confirmDeleteCategory(category) {
  confirm.require({ message: `Hapus kategori "${category.category_name}"?`, header: 'Konfirmasi Hapus', icon: 'pi pi-exclamation-triangle', acceptLabel: 'Hapus', rejectLabel: 'Batal', acceptClass: 'p-button-danger', accept: async () => {
    try { await deleteBookCategory(category.category_id); toast.add({ severity: 'success', summary: 'Kategori berhasil dihapus', life: 2500 }); await loadData() }
    catch (error) { toast.add({ severity: 'error', summary: 'Kategori gagal dihapus', detail: messageFrom(error, 'Kategori mungkin masih dipakai buku.'), life: 3500 }) }
  } })
}
function deleteSelected() {
  if (!selected.value.length) return
  confirm.require({ message: `Hapus ${selected.value.length} buku terpilih?`, header: 'Konfirmasi Hapus', icon: 'pi pi-exclamation-triangle', acceptLabel: 'Hapus', rejectLabel: 'Batal', acceptClass: 'p-button-danger', accept: async () => {
    try { await Promise.all(selected.value.map((book) => deleteBook(book.book_id))); selected.value = []; toast.add({ severity: 'success', summary: 'Buku terpilih berhasil dihapus', life: 2500 }); await loadData() }
    catch (error) { toast.add({ severity: 'error', summary: 'Sebagian buku gagal dihapus', detail: messageFrom(error, 'Muat ulang data untuk melihat hasilnya.'), life: 3500 }); await loadData() }
  } })
}
function stockSeverity(stock) { return stock > 0 ? 'success' : 'danger' }
onMounted(() => loadData({ background: Boolean(cachedBooks || cachedCategories) }))
</script>

<template>
  <div class="min-h-full text-slate-800">
    <h1 class="m-0 mb-1 text-[22px] font-bold text-slate-900">Katalog Buku</h1>
    <p class="mb-5 text-sm text-slate-500">Kelola buku dan kategori perpustakaan desa.</p>
    <Card><template #content><div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3"><div class="flex flex-wrap items-center gap-2">
        <Button label="Tambah Buku" icon="pi pi-plus" @click="openCreateBook" />
        <Button label="Tambah Kategori" icon="pi pi-tags" severity="secondary" outlined @click="openCreateCategory" />
        <Button label="Hapus" icon="pi pi-trash" severity="secondary" outlined :disabled="selected.length === 0" @click="deleteSelected" />
      </div><IconField><InputIcon class="pi pi-search" /><InputText v-model="filters.global.value" placeholder="Cari judul, penulis, atau ISBN" /></IconField></div>
      <DataTable v-model:selection="selected" v-model:filters="filters" :value="books" :loading="loading" dataKey="book_id" :paginator="true" :rows="rowsPerPage" :rowsPerPageOptions="[10, 25, 50]" :globalFilterFields="['title', 'author', 'isbn', 'category.category_name']" sortField="title" :sortOrder="1" removableSort stripedRows>
        <template #empty><div class="py-8 text-center text-slate-400">Tidak ada buku.</div></template>
        <Column selectionMode="multiple" headerStyle="width: 3rem" /><Column field="title" header="Judul Buku" sortable class="min-w-64" /><Column field="author" header="Penulis" sortable /><Column field="isbn" header="ISBN" /><Column field="category.category_name" header="Kategori" sortable />
        <Column field="stock" header="Stok" sortable><template #body="{ data }"><Tag :value="data.stock > 0 ? `${data.stock} tersedia` : 'Stok habis'" :severity="stockSeverity(data.stock)" rounded /></template></Column>
        <Column header="Aksi" headerStyle="width: 7rem"><template #body="{ data }"><div class="flex items-center gap-1"><Button icon="pi pi-pencil" text rounded severity="secondary" @click="openEditBook(data)" /><Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDeleteBook(data)" /></div></template></Column>
      </DataTable>
    </div></template></Card>
    <Card class="mt-5"><template #title>Kategori Buku</template><template #content><DataTable :value="categories" :loading="loading" dataKey="category_id" stripedRows><template #empty><div class="py-5 text-center text-slate-400">Belum ada kategori.</div></template><Column field="category_name" header="Nama Kategori" /><Column field="description" header="Deskripsi" /><Column header="Aksi" headerStyle="width: 7rem"><template #body="{ data }"><Button icon="pi pi-pencil" text rounded severity="secondary" @click="openEditCategory(data)" /><Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDeleteCategory(data)" /></template></Column></DataTable></template></Card>
    <AppModal v-model="showBookModal" :title="bookForm.book_id ? 'Edit Buku' : 'Tambah Buku'" :loading="saving" @save="saveBook"><AppInput v-model="bookForm.title" label="Judul Buku" required /><AppInput v-model="bookForm.author" label="Penulis" /><AppInput v-model="bookForm.isbn" label="ISBN" placeholder="978-xxx-xxxx-xx-x" /><AppSelect v-model="bookForm.category_id" label="Kategori (pilih yang ada)" :options="categoryOptions" placeholder="Pilih kategori" /><template v-if="!bookForm.book_id"><p class="-mt-1 text-xs text-neutral-500">Belum ada kategori atau ingin menambah yang baru? Isi kolom berikut.</p><AppInput v-model="bookForm.new_category_name" label="Kategori Baru" placeholder="Contoh: Novel" /></template><AppInput v-model="bookForm.stock" type="number" label="Stok" required /></AppModal>
    <AppModal v-model="showCategoryModal" :title="categoryForm.category_id ? 'Edit Kategori' : 'Tambah Kategori'" :loading="categorySaving" @save="saveCategory"><AppInput v-model="categoryForm.category_name" label="Nama Kategori" required /><AppInput v-model="categoryForm.description" label="Deskripsi" /></AppModal>
  </div>
</template>
