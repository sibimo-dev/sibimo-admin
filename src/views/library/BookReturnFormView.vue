<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import AppButton from '@/components/common/AppButton.vue'
import AppDataTable from '@/components/common/AppDataTable.vue'
import { getLoans, returnLoan } from '@/services/library.service'

const toast = useToast()
const loans = ref([])
const loading = ref(false)
const submittingReturn = ref(false)
const keyword = ref('')
const selectedLoan = ref(null)
const showReturnDialog = ref(false)

// Bukti pengembalian terakhir yang berhasil disimpan -- dipakai sebagai
// sumber data preview & struk cetak. null berarti belum ada transaksi
// yang bisa dicetak (misal baru buka halaman, atau baru pilih baris
// tapi belum klik "Proses Pengembalian").
const returnReceipt = ref(null)

// Dialog preview bukti pengembalian -- muncul mengambang setelah proses
// berhasil, TIDAK langsung memanggil window.print(). User baru mencetak
// kalau menekan tombol "Cetak" di dalam dialog ini.
const showReceiptDialog = ref(false)

// Daftar peminjaman yang belum dikembalikan, difilter live sesuai keyword
// (cari lewat loan_id atau nama anggota). Kalau backend sudah siap, ganti
// jadi panggilan API dengan query param `search` alih-alih filter di client.
const unreturnedLoans = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return dummyLoans.value
  return dummyLoans.value.filter(
    (l) => String(l.loan_id).includes(q) || l.full_name.toLowerCase().includes(q),
  )
})

const showReturnDialog = ref(false)
const returnReceipt = ref(null)
const showReceiptDialog = ref(false)
const FINE_PER_DAY = 1000

const columns = [
  { field: 'loan_id', header: 'No. Peminjaman' },
  { field: 'full_name', header: 'Nama Anggota' },
  { field: 'title', header: 'Judul Buku' },
  { field: 'borrowed_at', header: 'Tgl Pinjam' },
  { field: 'due_date', header: 'Jatuh Tempo' },
  { field: 'status', header: 'Status' },
]

function messageFrom(error, fallback) {
  return error.response?.data?.message ?? error.response?.data?.errors?.status?.[0] ?? fallback
}

async function loadLoans() {
  loading.value = true
  try {
    loans.value = await getLoans()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal memuat peminjaman', detail: messageFrom(error, 'Coba lagi.'), life: 3500 })
  } finally {
    loading.value = false
  }
}

const activeLoans = computed(() => loans.value
  .filter((loan) => loan.status === 'Borrowed')
  .map((loan) => ({ ...loan, full_name: loan.citizen?.full_name ?? '-', title: loan.book?.title ?? '-' })))
const unreturnedLoans = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return activeLoans.value
  return activeLoans.value.filter((loan) => String(loan.loan_id).includes(query) || loan.full_name.toLowerCase().includes(query) || loan.title.toLowerCase().includes(query))
})

function calculateStatus(loan) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(`${loan.due_date}T00:00:00`)
  const days = Math.max(0, Math.floor((today - due) / 86400000))
  return days > 0 ? { label: `Terlambat ${days} Hari`, severity: 'danger', days } : { label: 'Tepat Waktu', severity: 'success', days: 0 }
}

const statusInfo = computed(() => selectedLoan.value ? calculateStatus(selectedLoan.value) : null)
const totalFine = computed(() => statusInfo.value ? statusInfo.value.days * FINE_PER_DAY : 0)

function selectRow(loan) {
  selectedLoan.value = loan
  showReturnDialog.value = true
}

async function processReturn() {
  if (!selectedLoan.value) return
  submittingReturn.value = true
  try {
    const returnedAt = new Date().toISOString().slice(0, 10)
    const status = statusInfo.value.days > 0 ? 'Late' : 'Returned'
    const returnedLoan = await returnLoan(selectedLoan.value.loan_id, { returned_at: returnedAt, status, fine_amount: totalFine.value })
    returnReceipt.value = { ...returnedLoan, full_name: returnedLoan.citizen?.full_name ?? '-', title: returnedLoan.book?.title ?? '-' }
    toast.add({ severity: 'success', summary: 'Pengembalian berhasil dicatat', life: 2500 })
    showReturnDialog.value = false
    selectedLoan.value = null
    showReceiptDialog.value = true
    await loadLoans()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Pengembalian gagal dicatat', detail: messageFrom(error, 'Coba lagi.'), life: 3500 })
  } finally {
    submittingReturn.value = false
  }
}

function closeReceiptDialog() {
  showReceiptDialog.value = false
}

function cancelForm() {
  showReturnDialog.value = false
  selectedLoan.value = null
}

function printReturnReceipt() {
  if (returnReceipt.value) window.print()
}

onMounted(loadLoans)
</script>

<template>
  <div>
    <div class="print:hidden">
      <h1 class="m-0 mb-1 text-[22px] font-bold text-slate-900">Pengembalian Buku</h1>
      <p class="mb-5 text-sm text-slate-500">Catat transaksi pengembalian buku perpustakaan desa.</p>
      <div class="card mb-4">
        <h2 class="font-semibold text-neutral-800 mb-3">Daftar Peminjaman Belum Dikembalikan</h2>
        <div class="relative mb-4 max-w-sm"><i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" /><InputText v-model="keyword" placeholder="Cari nomor, anggota, atau judul..." class="w-full !pl-9" /></div>
        <AppDataTable :columns="columns" :rows="unreturnedLoans" :loading="loading" data-key="loan_id" empty-message="Semua buku sudah dikembalikan">
          <template #status="{ data }"><Tag :value="calculateStatus(data).label" :severity="calculateStatus(data).severity" /></template>
          <template #actions="{ data }"><AppButton label="Proses" icon="pi pi-replay" variant="ghost" size="small" @click="selectRow(data)" /></template>
        </AppDataTable>
      </div>
    </div>

    <!-- Dialog mengambang: form proses pengembalian -->
    <Dialog
      v-model:visible="showReturnDialog"
      modal
      header="Proses Pengembalian"
      :style="{ width: '40rem' }"
      class="mx-4"
      :closable="true"
      @hide="cancelForm"
    >
      <div v-if="selectedLoan">
        <div class="mb-4">
          <h2 class="font-semibold text-neutral-800">No. Peminjaman: {{ selectedLoan.loan_id }}</h2>
        </div>


    </div>
    <Dialog v-model:visible="showReturnDialog" modal header="Proses Pengembalian" :style="{ width: '40rem' }" class="mx-4" @hide="cancelForm">
      <div v-if="selectedLoan">
        <h2 class="font-semibold text-neutral-800 mb-4">No. Peminjaman: {{ selectedLoan.loan_id }}</h2>

        <div class="grid grid-cols-2 gap-4 text-sm mb-5">
          <div><p class="text-neutral-400 mb-0.5">Nama Anggota</p><p class="font-medium text-neutral-800">{{ selectedLoan.full_name }}</p></div>
          <div><p class="text-neutral-400 mb-0.5">Judul Buku</p><p class="font-medium text-neutral-800">{{ selectedLoan.title }}</p></div>
          <div><p class="text-neutral-400 mb-0.5">Tanggal Pinjam</p><p class="font-medium text-neutral-800">{{ selectedLoan.borrowed_at }}</p></div>
          <div><p class="text-neutral-400 mb-0.5">Jatuh Tempo</p><p class="font-medium text-neutral-800">{{ selectedLoan.due_date }}</p></div>
        </div>
        <div class="flex items-center justify-between bg-neutral-50 border border-border rounded-lg px-4 py-3 mb-2"><span class="text-sm text-neutral-600">Status</span><Tag :value="statusInfo.label" :severity="statusInfo.severity" /></div>
        <div class="flex items-center justify-between bg-neutral-50 border border-border rounded-lg px-4 py-3 mb-1"><span class="text-sm text-neutral-600">Denda Keterlambatan</span><span class="font-semibold text-neutral-800">Rp {{ totalFine.toLocaleString('id-ID') }}</span></div>
        <p class="text-xs text-neutral-400 mb-5">Rp {{ FINE_PER_DAY.toLocaleString('id-ID') }}/hari</p>
        <div class="flex justify-end gap-3"><AppButton label="Batal" variant="secondary" :disabled="submittingReturn" @click="cancelForm" /><AppButton label="Proses Pengembalian" variant="primary" :loading="submittingReturn" @click="processReturn" /></div>
      </div>
    </Dialog>

    <!-- Dialog mengambang: preview bukti pengembalian setelah berhasil diproses.
         Klik "Proses Pengembalian" TIDAK langsung window.print(); yang muncul
         cuma dialog preview ini. window.print() baru dipanggil kalau user
         menekan tombol "Cetak Bukti" di dalamnya. -->
    <Dialog
      v-model:visible="showReceiptDialog"
      modal
      header="Bukti Pengembalian Buku"
      :style="{ width: '32rem' }"
      class="mx-4"
      :closable="true"
      @hide="closeReceiptDialog"
    >
      <div v-if="returnReceipt">
        <div class="text-center mb-5">
          <p class="text-sm text-neutral-500">Perpustakaan Desa</p>
        </div>

        <table class="w-full text-sm mb-6">
          <tbody>
            <tr><td class="py-1 pr-4 w-36 align-top text-neutral-500">No. Peminjaman</td><td class="align-top font-medium text-neutral-800">: {{ returnReceipt.loan_id }}</td></tr>
            <tr><td class="py-1 pr-4 align-top text-neutral-500">Nama Anggota</td><td class="align-top font-medium text-neutral-800">: {{ returnReceipt.full_name }}</td></tr>
            <tr><td class="py-1 pr-4 align-top text-neutral-500">Judul Buku</td><td class="align-top font-medium text-neutral-800">: {{ returnReceipt.title }}</td></tr>
            <tr><td class="py-1 pr-4 align-top text-neutral-500">Tanggal Pinjam</td><td class="align-top font-medium text-neutral-800">: {{ returnReceipt.borrowed_at }}</td></tr>
            <tr><td class="py-1 pr-4 align-top text-neutral-500">Jatuh Tempo</td><td class="align-top font-medium text-neutral-800">: {{ returnReceipt.due_date }}</td></tr>
            <tr><td class="py-1 pr-4 align-top text-neutral-500">Tanggal Kembali</td><td class="align-top font-medium text-neutral-800">: {{ returnReceipt.returned_at }}</td></tr>
            <tr><td class="py-1 pr-4 align-top text-neutral-500">Status</td><td class="align-top font-medium text-neutral-800">: {{ returnReceipt.status === 'Late' ? 'Terlambat' : 'Tepat Waktu' }}</td></tr>
            <tr><td class="py-1 pr-4 align-top text-neutral-500">Denda</td><td class="align-top font-medium text-neutral-800">: Rp {{ returnReceipt.fine_amount.toLocaleString('id-ID') }}</td></tr>
          </tbody>
        </table>

        <div class="flex justify-end gap-3">
          <AppButton label="Tutup" variant="secondary" @click="closeReceiptDialog" />
          <AppButton label="Cetak Bukti" icon="pi pi-print" variant="primary" @click="printReturnReceipt" />
        </div>
      </div>
    </Dialog>

    <!-- Area struk cetak -- tersembunyi di layar, hanya tampil saat window.print() -->

    </Dialog>
    <Dialog v-model:visible="showReceiptDialog" modal header="Bukti Pengembalian Buku" :style="{ width: '32rem' }" class="mx-4">
      <div v-if="returnReceipt">
        <table class="w-full text-sm mb-6"><tbody>
          <tr><td class="py-1 pr-4 w-36 text-neutral-500">No. Peminjaman</td><td class="font-medium">: {{ returnReceipt.loan_id }}</td></tr>
          <tr><td class="py-1 pr-4 text-neutral-500">Nama Anggota</td><td class="font-medium">: {{ returnReceipt.full_name }}</td></tr>
          <tr><td class="py-1 pr-4 text-neutral-500">Judul Buku</td><td class="font-medium">: {{ returnReceipt.title }}</td></tr>
          <tr><td class="py-1 pr-4 text-neutral-500">Tanggal Pinjam</td><td class="font-medium">: {{ returnReceipt.borrowed_at }}</td></tr>
          <tr><td class="py-1 pr-4 text-neutral-500">Jatuh Tempo</td><td class="font-medium">: {{ returnReceipt.due_date }}</td></tr>
          <tr><td class="py-1 pr-4 text-neutral-500">Tanggal Kembali</td><td class="font-medium">: {{ returnReceipt.returned_at }}</td></tr>
          <tr><td class="py-1 pr-4 text-neutral-500">Status</td><td class="font-medium">: {{ returnReceipt.status === 'Late' ? 'Terlambat' : 'Tepat Waktu' }}</td></tr>
          <tr><td class="py-1 pr-4 text-neutral-500">Denda</td><td class="font-medium">: Rp {{ Number(returnReceipt.fine_amount).toLocaleString('id-ID') }}</td></tr>
        </tbody></table>
        <div class="flex justify-end gap-3"><AppButton label="Tutup" variant="secondary" @click="showReceiptDialog = false" /><AppButton label="Cetak Bukti" icon="pi pi-print" variant="primary" @click="printReturnReceipt" /></div>
      </div>
    </Dialog>

    <div v-if="returnReceipt" class="hidden print:block text-sm text-black">
      <div class="text-center mb-6"><h2 class="text-lg font-bold uppercase">Bukti Pengembalian Buku</h2><p>Perpustakaan Desa</p></div>
      <table class="w-full mb-8"><tbody>
        <tr><td class="py-1 pr-4 w-44">No. Peminjaman</td><td>: {{ returnReceipt.loan_id }}</td></tr>
        <tr><td class="py-1 pr-4">Nama Anggota</td><td>: {{ returnReceipt.full_name }}</td></tr>
        <tr><td class="py-1 pr-4">Judul Buku</td><td>: {{ returnReceipt.title }}</td></tr>
        <tr><td class="py-1 pr-4">Tanggal Pinjam</td><td>: {{ returnReceipt.borrowed_at }}</td></tr>
        <tr><td class="py-1 pr-4">Jatuh Tempo</td><td>: {{ returnReceipt.due_date }}</td></tr>
        <tr><td class="py-1 pr-4">Tanggal Kembali</td><td>: {{ returnReceipt.returned_at }}</td></tr>
        <tr><td class="py-1 pr-4">Status</td><td>: {{ returnReceipt.status === 'Late' ? 'Terlambat' : 'Tepat Waktu' }}</td></tr>
        <tr><td class="py-1 pr-4">Denda</td><td>: Rp {{ Number(returnReceipt.fine_amount).toLocaleString('id-ID') }}</td></tr>
      </tbody></table>
    </div>
  </div>
</template>

<style>
@media print {
  @page { margin: 1.5cm; }
  .p-dialog-mask, .p-overlay-mask { display: none !important; }

  /* PrimeVue men-teleport Dialog ke <body> dan membungkusnya dengan mask
     terpisah dari panel dialog itu sendiri -- class "print:hidden" yang
     dipasang lewat prop `class` Dialog hanya nempel ke panel, BUKAN ke
     mask/overlay-nya, sehingga modal (termasuk tombol Tutup/Cetak) tetap
     kelihatan saat window.print() dipanggil. Ditarget langsung lewat CSS
     global di sini supaya seluruh modal disembunyikan saat cetak, dan
     yang tampil cuma area struk khusus print di atas.
     Kalau versi PrimeVue kamu berbeda, cek nama class mask lewat inspect
     element pada elemen pembungkus paling luar saat dialog terbuka. */
  .p-dialog-mask,
  .p-overlay-mask {
    display: none !important;
  }
}
</style>
