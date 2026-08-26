<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppAutocomplete from '@/components/common/AppAutocomplete.vue'
import { citizenList, bookList, namaKategori } from './libraryData'

const toast = useToast()

const form = reactive({
  citizen_id: null, // null kalau peminjam belum/tidak terdaftar sebagai anggota -- TIDAK wajib diisi
  full_name: '',
  national_id: '',
  book_id: null,
  borrowed_at: new Date().toISOString().slice(0, 10),
  loanDurationDays: 7,
})

// Bukti peminjaman terakhir yang berhasil disimpan -- dipakai untuk
// ditampilkan sebagai ringkasan + sumber data struk cetak (print).
// null berarti belum ada transaksi yang bisa dicetak.

import { getCitizens } from '@/services/citizen.service'
import { createLoan, getBooks } from '@/services/library.service'

const toast = useToast()
const books = ref([])
const citizens = ref([])
const loading = ref(false)
const saving = ref(false)

const loanReceipt = ref(null)
const form = reactive({ citizen_id: null, book_id: null, borrowed_at: new Date().toISOString().slice(0, 10), loanDurationDays: 7 })

const citizenOptions = computed(() => citizens.value
  .filter((citizen) => citizen.status === 'Active')
  .map((citizen) => ({ label: citizen.full_name, value: citizen.citizen_id, national_id: citizen.national_id })))
const bookOptions = computed(() => books.value
  .filter((book) => book.stock > 0)
  .map((book) => ({ label: book.title, value: book.book_id, isbn: book.isbn, category: book.category?.category_name ?? '-', stock: book.stock })))
const selectedCitizen = computed(() => citizens.value.find((citizen) => citizen.citizen_id === form.citizen_id) ?? null)
const selectedBook = computed(() => books.value.find((book) => book.book_id === form.book_id) ?? null)
const dueDateISO = computed(() => {
  if (!form.borrowed_at || !form.loanDurationDays) return null
  const date = new Date(`${form.borrowed_at}T00:00:00`)
  date.setDate(date.getDate() + Number(form.loanDurationDays))
  return date.toISOString().slice(0, 10)
})
const dueDateDisplay = computed(() => dueDateISO.value
  ? new Date(`${dueDateISO.value}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  : '-')

function messageFrom(error, fallback) {
  return error.response?.data?.message ?? error.response?.data?.errors?.book_id?.[0] ?? fallback
}

async function loadFormData() {
  loading.value = true
  try {
    const [bookData, citizenData] = await Promise.all([getBooks(), getCitizens()])
    books.value = bookData
    citizens.value = citizenData
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal memuat data peminjaman', detail: messageFrom(error, 'Coba lagi.'), life: 3500 })
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, { citizen_id: null, book_id: null, borrowed_at: new Date().toISOString().slice(0, 10), loanDurationDays: 7 })
}

async function saveLoan() {
  if (!form.full_name.trim()) {
    toast.add({ severity: 'error', summary: 'Nama peminjam wajib diisi', life: 2500 })
    return
  }
  if (!form.book_id) {
    toast.add({ severity: 'error', summary: 'Pilih buku terlebih dahulu', life: 2500 })
    return
  }

  const payload = {
    citizen_id: form.citizen_id, // null kalau bukan anggota terdaftar
    full_name: form.full_name,
    national_id: form.national_id || null,
    book_id: form.book_id,
    borrowed_at: form.borrowed_at,
    due_date: dueDateISO.value,
    status: 'Borrowed', // sesuai enum migrasi book_loans.status
  }

  // TODO: ganti dengan panggilan service, misal:
  // const { loan_id } = await createBookLoan(payload)
  console.log('Payload ke API:', payload)
  toast.add({ severity: 'success', summary: 'Peminjaman berhasil dicatat (dummy)', life: 2500 })

  // Simpan snapshot data buat bukti cetak. `loan_id` di sini masih dummy
  // (Date.now()) -- ganti dengan loan_id asli dari response API di atas.
  loanReceipt.value = {
    loan_id: Date.now(),
    full_name: form.full_name,
    national_id: form.national_id || '-',
    title: selectedBook.value?.title ?? '-',
    isbn: selectedBook.value?.isbn ?? '-',
    borrowed_at: form.borrowed_at,
    due_date: dueDateISO.value,
  }
  if (!form.citizen_id || !form.book_id || !dueDateISO.value) {
    toast.add({ severity: 'error', summary: 'Warga, buku, dan tanggal pinjam wajib diisi', life: 2500 })
    return
  }
  saving.value = true
  try {
    const loan = await createLoan({ citizen_id: form.citizen_id, book_id: form.book_id, borrowed_at: form.borrowed_at, due_date: dueDateISO.value })
    loanReceipt.value = loan
    toast.add({ severity: 'success', summary: 'Peminjaman berhasil dicatat', life: 2500 })
    resetForm()
    await loadFormData()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Peminjaman gagal dicatat', detail: messageFrom(error, 'Periksa data yang diisi.'), life: 3500 })
  } finally {
    saving.value = false
  }


  cancelForm()

}

function printLoanReceipt() {
  if (loanReceipt.value) window.print()
}

onMounted(loadFormData)
</script>

<template>
  <div>
    <div class="print:hidden">
      <h1 class="m-0 mb-1 text-[22px] font-bold text-slate-900">Peminjaman Buku</h1>
      <p class="mb-5 text-sm text-slate-500">Catat satu buku untuk satu transaksi peminjaman.</p>
      <div class="card">
        <h2 class="font-semibold text-neutral-800 mb-4">Form Peminjaman Buku</h2>
        <div v-if="loading" class="py-6 text-center text-neutral-400">Memuat buku dan warga...</div>
        <div v-else class="flex flex-col gap-4">
          <AppAutocomplete v-model="form.citizen_id" label="Nama Anggota" :options="citizenOptions" :search-fields="['label', 'national_id']" placeholder="Cari nama atau NIK warga..." empty-message="Warga aktif tidak ditemukan" required>
            <template #option="{ option }"><div><p>{{ option.label }}</p><p class="text-xs text-neutral-400">NIK: {{ option.national_id }}</p></div></template>
          </AppAutocomplete>
          <p v-if="selectedCitizen" class="text-xs text-neutral-400 -mt-2">NIK: {{ selectedCitizen.national_id }}</p>
          <AppAutocomplete v-model="form.book_id" label="Judul Buku" :options="bookOptions" :search-fields="['label', 'isbn']" placeholder="Cari judul atau ISBN..." empty-message="Tidak ada buku dengan stok tersedia" required>
            <template #option="{ option }"><div><p>{{ option.label }}</p><p class="text-xs text-neutral-400">{{ option.category }} · ISBN {{ option.isbn || '-' }} · Stok {{ option.stock }}</p></div></template>
          </AppAutocomplete>
          <p v-if="selectedBook" class="text-xs text-neutral-400 -mt-2">Kategori: {{ selectedBook.category?.category_name ?? '-' }} · Stok tersedia: {{ selectedBook.stock }}</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppInput v-model="form.borrowed_at" type="date" label="Tanggal Pinjam" required />
            <AppInput v-model="form.loanDurationDays" type="number" label="Durasi Pinjam (Hari)" required />
          </div>
          <AppInput label="Tanggal Kembali (Jatuh Tempo)" :model-value="dueDateDisplay" disabled />
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <AppButton label="Batal" variant="secondary" :disabled="saving" @click="resetForm" />
          <AppButton label="Simpan Peminjaman" variant="primary" :loading="saving" :disabled="loading" @click="saveLoan" />
        </div>
      </div>
      <div v-if="loanReceipt" class="card mt-4 flex items-center justify-between gap-3">
        <div><p class="text-sm font-medium text-neutral-800">Peminjaman berhasil dicatat</p><p class="text-xs text-neutral-400">No. Peminjaman: {{ loanReceipt.loan_id }}</p></div>
        <AppButton label="Cetak Bukti Peminjaman" icon="pi pi-print" variant="secondary" @click="printLoanReceipt" />
      </div>
    </div>
    <div v-if="loanReceipt" class="hidden print:block text-sm text-black">
      <div class="text-center mb-6"><h2 class="text-lg font-bold uppercase">Bukti Peminjaman Buku</h2><p>Perpustakaan Desa</p></div>
      <table class="w-full mb-8"><tbody>
        <tr><td class="py-1 pr-4 w-44">No. Peminjaman</td><td>: {{ loanReceipt.loan_id }}</td></tr>
        <tr><td class="py-1 pr-4">Nama Anggota</td><td>: {{ loanReceipt.citizen?.full_name ?? '-' }}</td></tr>
        <tr><td class="py-1 pr-4">NIK</td><td>: {{ loanReceipt.citizen?.national_id ?? '-' }}</td></tr>
        <tr><td class="py-1 pr-4">Judul Buku</td><td>: {{ loanReceipt.book?.title ?? '-' }}</td></tr>
        <tr><td class="py-1 pr-4">ISBN</td><td>: {{ loanReceipt.book?.isbn ?? '-' }}</td></tr>
        <tr><td class="py-1 pr-4">Tanggal Pinjam</td><td>: {{ loanReceipt.borrowed_at }}</td></tr>
        <tr><td class="py-1 pr-4">Jatuh Tempo</td><td>: {{ loanReceipt.due_date }}</td></tr>
      </tbody></table>
    </div>
  </div>
</template>
