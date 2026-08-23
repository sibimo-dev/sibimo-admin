<script setup>
import { ref, reactive, computed } from 'vue'
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
const loanReceipt = ref(null)


const showCitizenSuggestions = ref(false)

const filteredCitizens = computed(() => {
  const q = form.full_name.trim().toLowerCase()
  if (!q) return []
  return citizenList.value.filter(
    (c) => c.full_name.toLowerCase().includes(q) || c.national_id.includes(q),
  )
})

function onNameInput() {
  // Kalau user mengetik ulang setelah sebelumnya pilih dari daftar,
  // anggap dia mau ganti/isi manual -- lepas ikatan ke anggota lama.
  if (form.citizen_id) {
    form.citizen_id = null
  }
  showCitizenSuggestions.value = true
}

function selectCitizen(c) {
  form.citizen_id = c.citizen_id
  form.full_name = c.full_name
  form.national_id = c.national_id
  showCitizenSuggestions.value = false
}

function hideSuggestionsDelayed() {
  // delay supaya klik pada item saran sempat ke-trigger duluan sebelum
  // dropdown ditutup oleh event blur
  setTimeout(() => {
    showCitizenSuggestions.value = false
  }, 150)
}
// --- end Autocomplete Nama Anggota ---

const bookOptions = computed(() =>
  bookList.value
    .filter((b) => b.stock > 0) // cuma tampilkan buku yang stok-nya ada
    .map((b) => ({
      label: b.title,
      value: b.book_id,
      isbn: b.isbn,
      category: namaKategori(b.category_id),
      stock: b.stock,
    })),
)

const selectedBook = computed(() => bookList.value.find((b) => b.book_id === form.book_id))

// due_date dihitung dari borrowed_at + loanDurationDays, sesuai kolom asli book_loans
const dueDateISO = computed(() => {
  if (!form.borrowed_at || !form.loanDurationDays) return null
  const d = new Date(form.borrowed_at)
  d.setDate(d.getDate() + Number(form.loanDurationDays))
  return d.toISOString().slice(0, 10)
})

const dueDateDisplay = computed(() => {
  if (!dueDateISO.value) return '-'
  return new Date(dueDateISO.value).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
})

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

  cancelForm()
}

function printLoanReceipt() {
  if (!loanReceipt.value) return
  window.print()
}

function cancelForm() {
  form.citizen_id = null
  form.full_name = ''
  form.national_id = ''
  form.book_id = null
  form.loanDurationDays = 7
}
</script>

<template>
  <div>
    <!-- Konten normal, disembunyikan otomatis saat mode cetak (print:hidden) -->
    <div class="print:hidden">
      <h1 class="m-0 mb-1 text-[22px] font-bold text-slate-900">Peminjaman Buku</h1>
      <p class="mb-5 text-sm text-slate-500">Catat transaksi peminjaman buku perpustakaan desa (1 buku per transaksi)</p>

      <div class="card">
        <h2 class="font-semibold text-neutral-800 mb-4">Form Peminjaman Buku</h2>

        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="relative">
              <AppInput
                v-model="form.full_name"
                label="Nama Anggota"
                placeholder="Ketik nama anggota, atau isi manual jika belum terdaftar..."
                required
                @input="onNameInput"
                @focus="showCitizenSuggestions = true"
                @blur="hideSuggestionsDelayed"
              />

              <ul
                v-if="showCitizenSuggestions && filteredCitizens.length"
                class="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-border bg-white shadow-lg"
              >
                <li
                  v-for="c in filteredCitizens"
                  :key="c.citizen_id"
                  class="px-3 py-2 text-sm cursor-pointer hover:bg-neutral-50"
                  @mousedown.prevent="selectCitizen(c)"
                >
                  <div class="flex flex-col">
                    <span class="text-neutral-800">{{ c.full_name }}</span>
                    <span class="text-xs text-neutral-400">NIK: {{ c.national_id }}</span>
                  </div>
                </li>
              </ul>

              <p class="text-xs text-neutral-400 mt-1">
                {{
                  form.citizen_id
                    ? 'Terdaftar sebagai anggota perpustakaan.'
                    : 'Belum jadi anggota? Isi nama secara manual'
                }}
              </p>
            </div>

            <AppInput
              v-model="form.national_id"
              label="NIK / ID Anggota"
              placeholder="Terisi otomatis jika pilih dari daftar, atau isi manual"
            />
          </div>

          <AppAutocomplete
            v-model="form.book_id"
            label="Judul Buku"
            :options="bookOptions"
            :search-fields="['label', 'isbn']"
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
            Kategori: {{ namaKategori(selectedBook.category_id) }} &middot; Stok tersedia: {{ selectedBook.stock }}
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppInput v-model="form.borrowed_at" type="date" label="Tanggal Pinjam" required />
            <AppInput v-model="form.loanDurationDays" type="number" label="Durasi Pinjam (Hari)" required />
          </div>

          <AppInput label="Tanggal Kembali (Jatuh Tempo)" :model-value="dueDateDisplay" disabled />
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <AppButton label="Batal" variant="secondary" @click="cancelForm" />
          <AppButton label="Simpan Peminjaman" variant="primary" @click="saveLoan" />
        </div>
      </div>

      <!-- Muncul setelah transaksi berhasil disimpan -->
      <div v-if="loanReceipt" class="card mt-4 flex items-center justify-between gap-3">
        <div>
          <p class="text-sm font-medium text-neutral-800">Peminjaman berhasil dicatat</p>
          <p class="text-xs text-neutral-400">No. Peminjaman: {{ loanReceipt.loan_id }}</p>
        </div>
        <AppButton label="Cetak Bukti Peminjaman" icon="pi pi-print" variant="secondary" @click="printLoanReceipt" />
      </div>
    </div>

    <!-- Area struk cetak -- tersembunyi di layar, hanya tampil saat window.print() -->
    <div v-if="loanReceipt" class="hidden print:block text-sm text-black">
      <div class="text-center mb-6">
        <h2 class="text-lg font-bold uppercase">Bukti Peminjaman Buku</h2>
        <p>Perpustakaan Desa</p>
      </div>

      <table class="w-full mb-8">
        <tbody>
          <tr><td class="py-1 pr-4 w-44 align-top">No. Peminjaman</td><td class="align-top">: {{ loanReceipt.loan_id }}</td></tr>
          <tr><td class="py-1 pr-4 align-top">Nama Anggota</td><td class="align-top">: {{ loanReceipt.full_name }}</td></tr>
          <tr><td class="py-1 pr-4 align-top">NIK</td><td class="align-top">: {{ loanReceipt.national_id }}</td></tr>
          <tr><td class="py-1 pr-4 align-top">Judul Buku</td><td class="align-top">: {{ loanReceipt.title }}</td></tr>
          <tr><td class="py-1 pr-4 align-top">ISBN</td><td class="align-top">: {{ loanReceipt.isbn }}</td></tr>
          <tr><td class="py-1 pr-4 align-top">Tanggal Pinjam</td><td class="align-top">: {{ loanReceipt.borrowed_at }}</td></tr>
          <tr><td class="py-1 pr-4 align-top">Jatuh Tempo</td><td class="align-top">: {{ loanReceipt.due_date }}</td></tr>
        </tbody>
      </table>

      <div class="flex justify-end">
        <div class="text-center">
          <p>Petugas Perpustakaan</p>
          <div class="h-16"></div>
          <p>( ..................... )</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Non-scoped supaya berlaku saat mode cetak (@page hanya bisa didefinisikan
   secara global, tidak bisa lewat class Tailwind). */
@media print {
  @page {
    margin: 1.5cm;
  }
}
</style>