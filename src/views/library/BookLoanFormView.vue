<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppAutocomplete from '@/components/common/AppAutocomplete.vue'
import { createLoan, getBooks } from '@/services/library.service'
import { getListCache, setListCache } from '@/services/list-cache'

const toast = useToast()
const cachedBooks = getListCache('books')
const books = ref(cachedBooks ?? [])
const loading = ref(!cachedBooks)
const saving = ref(false)
const loanReceipt = ref(null)
const showReceiptDialog = ref(false)

const today = () => new Date().toISOString().slice(0, 10)
const form = reactive({ borrower_name: '', book_id: null, borrowed_at: today(), loanDurationDays: 7 })

const bookOptions = computed(() => books.value.filter(b => Number(b.stock) > 0).map(b => ({ label: `${b.title} (stok ${b.stock})`, value: b.book_id })))
const dueDate = computed(() => { const d = new Date(`${form.borrowed_at}T00:00:00`); d.setDate(d.getDate() + Number(form.loanDurationDays || 0)); return d.toISOString().slice(0, 10) })

function messageFrom(error, fallback) { return error.response?.data?.message ?? fallback }

async function loadFormData({ background = false } = {}) {
  if (!background) loading.value = true
  try {
    const bookData = await getBooks()
    books.value = bookData
    setListCache('books', bookData)
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal memuat data', detail: messageFrom(error, 'Coba lagi.'), life: 3500 })
  } finally {
    if (!background) loading.value = false
  }
}

async function saveLoan() {
  if (!form.book_id || !form.borrowed_at) {
    toast.add({ severity: 'warn', summary: 'Data belum lengkap', detail: 'Pilih buku dan tanggal pinjam.', life: 3000 })
    return
  }
  const book = books.value.find(b => b.book_id === form.book_id)
  const borrowerName = form.borrower_name.trim()
  saving.value = true
  try {
    const result = await createLoan({ borrower_name: borrowerName || null, book_id: form.book_id, borrowed_at: form.borrowed_at, due_date: dueDate.value })
    loanReceipt.value = {
      ...result,
      borrower_name: borrowerName || 'Umum',
      title: book?.title ?? '-',
      borrowed_at: form.borrowed_at,
      due_date: dueDate.value,
    }
    toast.add({ severity: 'success', summary: 'Peminjaman berhasil dicatat', life: 2500 })
    Object.assign(form, { borrower_name: '', book_id: null, borrowed_at: today(), loanDurationDays: 7 })
    showReceiptDialog.value = true
    void loadFormData({ background: true })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Peminjaman gagal dicatat', detail: messageFrom(error, 'Coba lagi.'), life: 3500 })
  } finally {
    saving.value = false
  }
}

const safeFilePart = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)

function printReceipt() {
  const originalTitle = document.title
  const id = loanReceipt.value?.loan_id ?? ''
  const namePart = safeFilePart(loanReceipt.value?.borrower_name || 'Umum')
  document.title = `Bukti-Peminjaman-Buku-${id}${namePart ? `-${namePart}` : ''}`

  const restoreTitle = () => {
    document.title = originalTitle
    window.removeEventListener('afterprint', restoreTitle)
  }
  window.addEventListener('afterprint', restoreTitle)

  window.print()
  setTimeout(restoreTitle, 2000)
}

onMounted(() => loadFormData({ background: Boolean(cachedBooks) }))
</script>

<template>
  <div>
    <div class="print:hidden max-w-2xl">
      <h1 class="m-0 mb-1 text-[22px] font-bold text-slate-900">Peminjaman Buku</h1>
      <p class="mb-5 text-sm text-slate-500">Catat transaksi peminjaman buku perpustakaan desa.</p>
      <div class="card space-y-4">
        <AppInput v-model="form.borrower_name" label="Peminjam" placeholder="Nama peminjam (opsional, kosongkan jika umum)" />
        <AppAutocomplete v-model="form.book_id" :options="bookOptions" label="Buku" placeholder="Pilih buku" :disabled="loading" />
        <AppInput v-model="form.borrowed_at" type="date" label="Tanggal Pinjam" />
        <AppInput v-model.number="form.loanDurationDays" type="number" min="1" label="Lama Pinjam (hari)" />
        <p class="text-sm text-slate-500">Jatuh tempo: <strong>{{ dueDate }}</strong></p>
        <div class="flex justify-end">
          <AppButton label="Simpan Peminjaman" variant="primary" :loading="saving" @click="saveLoan" />
        </div>
      </div>
    </div>

    <Dialog v-model:visible="showReceiptDialog" modal header="Bukti Peminjaman Buku" :style="{ width: '32rem' }">
      <div v-if="loanReceipt" class="space-y-1.5 text-sm">
        <p>No. Peminjaman: <strong>{{ loanReceipt.loan_id }}</strong></p>
        <p>Peminjam: <strong>{{ loanReceipt.borrower_name }}</strong></p>
        <p>Buku: <strong>{{ loanReceipt.title }}</strong></p>
        <p>Tanggal Pinjam: {{ loanReceipt.borrowed_at }}</p>
        <p>Jatuh Tempo: {{ loanReceipt.due_date }}</p>
        <div class="mt-4 flex justify-end gap-3">
          <AppButton label="Tutup" variant="outline" @click="showReceiptDialog = false" />
          <AppButton label="Cetak Bukti" icon="pi pi-print" variant="primary" @click="printReceipt" />
        </div>
      </div>
    </Dialog>

    <!-- Bukti cetak: hanya tampil saat mencetak, styling pakai utility class Tailwind -->
    <div v-if="loanReceipt" class="hidden print:block print-receipt-card">
      <div class="mx-auto max-w-[480px] text-slate-900">
        <div class="mb-4 text-center">
          <p class="m-0 text-base font-bold uppercase tracking-wide">Perpustakaan Kalurahan Bimomartani</p>
          <p class="mt-0.5 text-[11px] text-slate-600">Kalurahan Bimomartani, Kec. Ngemplak, Kab. Sleman, Daerah Istimewa Yogyakarta</p>
          <div class="mt-2 border-b-2 border-slate-900"></div>
        </div>

        <h2 class="mb-4 text-center text-[15px] font-bold uppercase underline">Bukti Peminjaman Buku</h2>

        <table class="w-full border-collapse text-[13px]">
          <tbody>
            <tr>
              <td class="w-[140px] py-0.5 align-top">No. Peminjaman</td>
              <td class="w-3 py-0.5 align-top">:</td>
              <td class="py-0.5 align-top">{{ loanReceipt.loan_id }}</td>
            </tr>
            <tr>
              <td class="w-[140px] py-0.5 align-top">Nama Peminjam</td>
              <td class="w-3 py-0.5 align-top">:</td>
              <td class="py-0.5 align-top">{{ loanReceipt.borrower_name }}</td>
            </tr>
            <tr>
              <td class="w-[140px] py-0.5 align-top">Judul Buku</td>
              <td class="w-3 py-0.5 align-top">:</td>
              <td class="py-0.5 align-top">{{ loanReceipt.title }}</td>
            </tr>
            <tr>
              <td class="w-[140px] py-0.5 align-top">Tanggal Pinjam</td>
              <td class="w-3 py-0.5 align-top">:</td>
              <td class="py-0.5 align-top">{{ loanReceipt.borrowed_at }}</td>
            </tr>
            <tr>
              <td class="w-[140px] py-0.5 align-top">Jatuh Tempo</td>
              <td class="w-3 py-0.5 align-top">:</td>
              <td class="py-0.5 align-top">{{ loanReceipt.due_date }}</td>
            </tr>
          </tbody>
        </table>

        <div class="mt-8 pr-6 text-right text-[13px]">
          <p>Petugas Perpustakaan</p>
          <p class="mt-14">( ...................... )</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@media print {
  @page {
    size: portrait;
    margin: 12mm 15mm;
  }
  .p-dialog,
  .p-dialog-mask,
  .p-component-overlay,
  .p-toast,
  .p-toast-message {
    display: none !important;
  }
}
</style>