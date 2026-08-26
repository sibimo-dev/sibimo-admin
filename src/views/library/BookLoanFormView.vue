<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppAutocomplete from '@/components/common/AppAutocomplete.vue'
<<<<<<< Updated upstream

const toast = useToast()

// ===== Dummy data anggota (citizens) -- ganti dengan panggilan API =====
const citizenList = ref([
  { citizen_id: 1, full_name: 'Budi Santoso', national_id: '3301234567890001' },
  { citizen_id: 2, full_name: 'Siti Aminah', national_id: '3301234567890002' },
])

// ===== Dummy data buku (books, join book_categories) -- ganti dengan API =====
const bookList = ref([
  { book_id: 1, isbn: 'B-SEJ-001', title: 'Sejarah Perjuangan Kemerdekaan', category: 'Sejarah', stock: 3 },
  { book_id: 2, isbn: 'B-PRT-042', title: 'Teknik Pertanian Modern', category: 'Pertanian', stock: 5 },
  { book_id: 3, isbn: 'B-NOV-015', title: 'Laskar Pelangi', category: 'Novel', stock: 0 },
])

const form = reactive({
  citizen_id: null,
  book_id: null,
  borrowed_at: new Date().toISOString().slice(0, 10),
  loanDurationDays: 7,
})

// Bukti peminjaman terakhir yang berhasil disimpan -- dipakai untuk
// ditampilkan sebagai ringkasan + sumber data struk cetak (print).
// null berarti belum ada transaksi yang bisa dicetak.
=======
import { getCitizens } from '@/services/citizen.service'
import { createLoan, getBooks } from '@/services/library.service'

const toast = useToast()
const books = ref([])
const citizens = ref([])
const loading = ref(false)
const saving = ref(false)
>>>>>>> Stashed changes
const loanReceipt = ref(null)
const form = reactive({ citizen_id: null, book_id: null, borrowed_at: new Date().toISOString().slice(0, 10), loanDurationDays: 7 })

<<<<<<< Updated upstream

// (national_id, category, stock) supaya bisa ditampilkan di item saran
// lewat slot #option, dan bisa ikut difilter kalau user ketik NIK/ISBN.
const citizenOptions = computed(() =>
  citizenList.value.map((c) => ({
    label: c.full_name,
    value: c.citizen_id,
    national_id: c.national_id,
  })),
)

const bookOptions = computed(() =>
  bookList.value
    .filter((b) => b.stock > 0) // cuma tampilkan buku yang stok-nya ada
    .map((b) => ({
      label: b.title,
      value: b.book_id,
      isbn: b.isbn,
      category: b.category,
      stock: b.stock,
    })),
)

const selectedCitizen = computed(() => citizenList.value.find((c) => c.citizen_id === form.citizen_id))
const selectedBook = computed(() => bookList.value.find((b) => b.book_id === form.book_id))

// due_date dihitung dari borrowed_at + loanDurationDays, sesuai kolom asli book_loans
=======
const citizenOptions = computed(() => citizens.value
  .filter((citizen) => citizen.status === 'Active')
  .map((citizen) => ({ label: citizen.full_name, value: citizen.citizen_id, national_id: citizen.national_id })))
const bookOptions = computed(() => books.value
  .filter((book) => book.stock > 0)
  .map((book) => ({ label: book.title, value: book.book_id, isbn: book.isbn, category: book.category?.category_name ?? '-', stock: book.stock })))
const selectedCitizen = computed(() => citizens.value.find((citizen) => citizen.citizen_id === form.citizen_id) ?? null)
const selectedBook = computed(() => books.value.find((book) => book.book_id === form.book_id) ?? null)
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  if (!form.citizen_id || !form.book_id) {
    toast.add({ severity: 'error', summary: 'Pilih anggota dan buku terlebih dahulu', life: 2500 })
    return
  }

  const payload = {
    citizen_id: form.citizen_id,
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
    full_name: selectedCitizen.value?.full_name ?? '-',
    national_id: selectedCitizen.value?.national_id ?? '-',
    title: selectedBook.value?.title ?? '-',
    isbn: selectedBook.value?.isbn ?? '-',
    borrowed_at: form.borrowed_at,
    due_date: dueDateISO.value,
  }
=======
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
>>>>>>> Stashed changes
}

function printLoanReceipt() {
  if (loanReceipt.value) window.print()
}

<<<<<<< Updated upstream
function cancelForm() {
  form.citizen_id = null
  form.book_id = null
  form.loanDurationDays = 7
}
=======
onMounted(loadFormData)
>>>>>>> Stashed changes
</script>

<template>
  <div>
    <div class="print:hidden">
      <h1 class="m-0 mb-1 text-[22px] font-bold text-slate-900">Peminjaman Buku</h1>
<<<<<<< Updated upstream
      <p class="mb-5 text-sm text-slate-500">Catat transaksi peminjaman buku perpustakaan desa (1 buku per transaksi)</p>

      <div class="card max-w-2xl">
        <h2 class="font-semibold text-neutral-800 mb-4">Form Peminjaman Buku</h2>

        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppAutocomplete
              v-model="form.citizen_id"
              label="Nama Anggota"
              :options="citizenOptions"
              placeholder="Ketik nama anggota..."
              required
            >
              <template #option="{ option }">
                <div class="flex flex-col">
                  <span>{{ option.label }}</span>
                  <span class="text-xs text-neutral-400">NIK: {{ option.national_id }}</span>
                </div>
              </template>
            </AppAutocomplete>
            <AppInput label="NIK / ID Anggota" :model-value="selectedCitizen?.national_id || ''" disabled />
          </div>

          <AppAutocomplete
            v-model="form.book_id"
            label="Judul Buku"
            :options="bookOptions"
            placeholder="Ketik judul atau ISBN buku..."
            empty-message="Tidak ada buku dengan stok tersedia"
            required
          >
            <template #option="{ option }">
              <div class="flex flex-col">
                <span>{{ option.label }}</span>
                <span class="text-xs text-neutral-400">
                  {{ option.category }} &middot; ISBN {{ option.isbn }} &middot; Stok {{ option.stock }}
                </span>
              </div>
            </template>
          </AppAutocomplete>
          <p v-if="selectedBook" class="text-xs text-neutral-400 -mt-2">
            Kategori: {{ selectedBook.category }} &middot; Stok tersedia: {{ selectedBook.stock }}
          </p>

=======
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
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream

      <!-- Muncul setelah transaksi berhasil disimpan -->
      <div v-if="loanReceipt" class="card max-w-2xl mt-4 flex items-center justify-between gap-3">
        <div>
          <p class="text-sm font-medium text-neutral-800">Peminjaman berhasil dicatat</p>
          <p class="text-xs text-neutral-400">No. Peminjaman: {{ loanReceipt.loan_id }}</p>
        </div>
=======
      <div v-if="loanReceipt" class="card mt-4 flex items-center justify-between gap-3">
        <div><p class="text-sm font-medium text-neutral-800">Peminjaman berhasil dicatat</p><p class="text-xs text-neutral-400">No. Peminjaman: {{ loanReceipt.loan_id }}</p></div>
>>>>>>> Stashed changes
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
