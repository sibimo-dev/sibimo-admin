<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import AppButton from '@/components/common/AppButton.vue'
import AppDataTable from '@/components/common/AppDataTable.vue'
import { getLoans, returnLoan } from '@/services/library.service'
import { getListCache, setListCache } from '@/services/list-cache'

const toast = useToast()
const cachedLoans = getListCache('book-loans')
const loans = ref(cachedLoans ?? [])
const loading = ref(!cachedLoans)
const submittingReturn = ref(false)
const keyword = ref('')
const sortBy = ref('borrowed_desc')
const selectedLoan = ref(null)
const showReturnDialog = ref(false)
const returnReceipt = ref(null)
const showReceiptDialog = ref(false)

const columns = [
  { field: 'loan_id', header: 'No. Peminjaman', sortable: true },
  { field: 'full_name', header: 'Peminjam', sortable: true },
  { field: 'title', header: 'Judul Buku', sortable: true },
  { field: 'borrowed_at', header: 'Tgl Pinjam', sortable: true },
  { field: 'due_date', header: 'Jatuh Tempo', sortable: true },
  { field: 'late_days', header: 'Status', sortable: true },
]

const sortOptions = [
  { label: 'Pinjam terbaru', value: 'borrowed_desc' },
  { label: 'Pinjam terlama', value: 'borrowed_asc' },
  { label: 'Jatuh tempo terdekat', value: 'due_asc' },
  { label: 'Jatuh tempo terjauh', value: 'due_desc' },
  { label: 'Peminjam A-Z', value: 'name_asc' },
  { label: 'Judul buku A-Z', value: 'title_asc' },
  { label: 'No. peminjaman', value: 'id_asc' },
]

const byText = (key) => (a, b) => String(a[key]).localeCompare(String(b[key]), 'id')
const byDate = (key, dir) => (a, b) => (new Date(a[key]) - new Date(b[key])) * dir
const sorters = {
  borrowed_desc: byDate('borrowed_at', -1),
  borrowed_asc: byDate('borrowed_at', 1),
  due_asc: byDate('due_date', 1),
  due_desc: byDate('due_date', -1),
  name_asc: byText('full_name'),
  title_asc: byText('title'),
  id_asc: (a, b) => a.loan_id - b.loan_id,
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}
function messageFrom(error, fallback) { return error.response?.data?.message ?? fallback }

async function loadLoans({ background = false } = {}) {
  if (!background) loading.value = true
  try {
    const data = await getLoans()
    loans.value = data
    setListCache('book-loans', data)
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal memuat peminjaman', detail: messageFrom(error, 'Coba lagi.'), life: 3500 })
  } finally {
    if (!background) loading.value = false
  }
}

const activeLoans = computed(() => loans.value
  .filter(l => l.status === 'Borrowed')
  .map(l => ({
    ...l,
    full_name: l.borrower_name || l.citizen?.full_name || 'Umum',
    title: l.book?.title ?? '-',
    late_days: calculateStatus(l).days,
  })))

const unreturnedLoans = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  const list = q
    ? activeLoans.value.filter(l => String(l.loan_id).includes(q) || l.full_name.toLowerCase().includes(q) || l.title.toLowerCase().includes(q))
    : activeLoans.value
  // urutan awal: pinjam terbaru; selanjutnya diatur klik header kolom
  return [...list].sort((a, b) => new Date(b.borrowed_at) - new Date(a.borrowed_at))
})

function calculateStatus(loan) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due = new Date(loan.due_date); due.setHours(0, 0, 0, 0)
  const days = Math.max(0, Math.floor((today - due) / 86400000))
  return days
    ? { label: `Terlambat ${days} Hari`, severity: 'danger', days }
    : { label: 'Dipinjam', severity: 'info', days: 0 }
}

const statusInfo = computed(() => selectedLoan.value ? calculateStatus(selectedLoan.value) : null)

function selectRow(loan) { selectedLoan.value = loan; showReturnDialog.value = true }

async function processReturn() {
  if (!selectedLoan.value) return
  submittingReturn.value = true
  try {
    const info = statusInfo.value
    const status = info.days ? 'Late' : 'Returned'
    const returnedAt = new Date().toISOString().slice(0, 10)
    const result = await returnLoan(selectedLoan.value.loan_id, { returned_at: returnedAt, status, fine_amount: 0 })
    returnReceipt.value = {
      ...result,
      full_name: selectedLoan.value.full_name,
      title: selectedLoan.value.title,
      borrowed_at: selectedLoan.value.borrowed_label,
      due_date: selectedLoan.value.due_label,
      returned_at: formatDate(returnedAt),
      status_label: info.days ? 'Terlambat' : 'Tepat Waktu',
    }
    loans.value = loans.value.map((loan) => loan.loan_id === selectedLoan.value.loan_id ? { ...loan, status } : loan)
    setListCache('book-loans', loans.value)
    toast.add({ severity: 'success', summary: 'Pengembalian berhasil dicatat', life: 2500 })
    showReturnDialog.value = false
    selectedLoan.value = null
    showReceiptDialog.value = true
    void loadLoans({ background: true })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Pengembalian gagal dicatat', detail: messageFrom(error, 'Coba lagi.'), life: 3500 })
  } finally {
    submittingReturn.value = false
  }
}

function cancelForm() { showReturnDialog.value = false; selectedLoan.value = null }
function printReturnReceipt() { window.print() }
onMounted(() => loadLoans({ background: Boolean(cachedLoans) }))
</script>

<template>
  <div>
    <div class="print:hidden">
      <h1 class="m-0 mb-1 text-[22px] font-bold text-slate-900">Pengembalian Buku</h1>
      <p class="mb-5 text-sm text-slate-500">Catat transaksi pengembalian buku perpustakaan desa.</p>
      <div class="card">
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <InputText v-model="keyword" placeholder="Cari nomor, peminjam, atau judul..." class="w-full max-w-sm" />
        </div>
        <AppDataTable :columns="columns" :rows="unreturnedLoans" :loading="loading" data-key="loan_id" empty-message="Semua buku sudah dikembalikan">
          <template #borrowed_at="{ data }">{{ formatDate(data.borrowed_at) }}</template>
          <template #due_date="{ data }">{{ formatDate(data.due_date) }}</template>
          <template #late_days="{ data }">
            <Tag :value="calculateStatus(data).label" :severity="calculateStatus(data).severity" />
          </template>
          <template #actions="{ data }">
            <AppButton label="Proses" icon="pi pi-replay" variant="ghost" size="small" @click="selectRow(data)" />
          </template>
        </AppDataTable>
      </div>
    </div>

    <Dialog v-model:visible="showReturnDialog" modal header="Proses Pengembalian" :style="{ width: '40rem' }" @hide="cancelForm">
      <div v-if="selectedLoan">
        <p>No. Peminjaman: <strong>{{ selectedLoan.loan_id }}</strong></p>
        <p>Peminjam: {{ selectedLoan.full_name }}</p>
        <p>Buku: {{ selectedLoan.title }}</p>
        <p>Status: <Tag :value="statusInfo.label" :severity="statusInfo.severity" /></p>
        <div class="flex justify-end gap-3">
          <AppButton label="Batal" variant="outline" @click="cancelForm" />
          <AppButton label="Proses Pengembalian" variant="primary" :loading="submittingReturn" @click="processReturn" />
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="showReceiptDialog" modal header="Bukti Pengembalian Buku" :style="{ width: '32rem' }">
      <div v-if="returnReceipt">
        <p>No. Peminjaman: {{ returnReceipt.loan_id }}</p>
        <p>Peminjam: {{ returnReceipt.full_name }}</p>
        <p>Buku: {{ returnReceipt.title }}</p>
        <div class="flex justify-end gap-3">
          <AppButton label="Tutup" variant="outline" @click="showReceiptDialog = false" />
          <AppButton label="Cetak Bukti" icon="pi pi-print" variant="primary" @click="printReturnReceipt" />
        </div>
      </div>
    </Dialog>

    <!-- Bukti cetak: hanya tampil saat mencetak, styling pakai utility class Tailwind -->
    <div v-if="returnReceipt" class="hidden print:block">
      <div class="mx-auto max-w-[480px] text-slate-900">
        <div class="mb-5 text-center">
          <p class="m-0 text-base font-bold uppercase tracking-wide">Perpustakaan Kalurahan Bimomartani</p>
          <p class="mt-0.5 text-[11px] text-slate-600">Kalurahan Bimomartani, Kec. Ngemplak, Kab. Sleman, Daerah Istimewa Yogyakarta</p>
          <div class="mt-2 border-b-2 border-slate-900"></div>
        </div>

        <h2 class="mb-5 text-center text-[15px] font-bold uppercase underline">Bukti Pengembalian Buku</h2>

        <table class="w-full border-collapse text-[13px]">
          <tbody>
            <tr>
              <td class="w-[140px] py-0.5 align-top">No. Peminjaman</td>
              <td class="w-3 py-0.5 align-top">:</td>
              <td class="py-0.5 align-top">{{ returnReceipt.loan_id }}</td>
            </tr>
            <tr>
              <td class="w-[140px] py-0.5 align-top">Nama Peminjam</td>
              <td class="w-3 py-0.5 align-top">:</td>
              <td class="py-0.5 align-top">{{ returnReceipt.full_name }}</td>
            </tr>
            <tr>
              <td class="w-[140px] py-0.5 align-top">Judul Buku</td>
              <td class="w-3 py-0.5 align-top">:</td>
              <td class="py-0.5 align-top">{{ returnReceipt.title }}</td>
            </tr>
            <tr>
              <td class="w-[140px] py-0.5 align-top">Tanggal Pinjam</td>
              <td class="w-3 py-0.5 align-top">:</td>
              <td class="py-0.5 align-top">{{ returnReceipt.borrowed_at }}</td>
            </tr>
            <tr>
              <td class="w-[140px] py-0.5 align-top">Jatuh Tempo</td>
              <td class="w-3 py-0.5 align-top">:</td>
              <td class="py-0.5 align-top">{{ returnReceipt.due_date }}</td>
            </tr>
            <tr>
              <td class="w-[140px] py-0.5 align-top">Tanggal Kembali</td>
              <td class="w-3 py-0.5 align-top">:</td>
              <td class="py-0.5 align-top">{{ returnReceipt.returned_at }}</td>
            </tr>
            <tr>
              <td class="w-[140px] py-0.5 align-top">Status</td>
              <td class="w-3 py-0.5 align-top">:</td>
              <td class="py-0.5 align-top">{{ returnReceipt.status_label }}</td>
            </tr>
          </tbody>
        </table>

        <div class="mt-10 pr-6 text-right text-[13px]">
          <p>Petugas Perpustakaan</p>
          <p class="mt-16">( ...................... )</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>

@media print {
  @page { margin: 20mm 18mm; }
  .p-dialog,
  .p-dialog-mask,
  .p-toast,
  .p-toast-message {
    display: none !important;
  }
}
</style>