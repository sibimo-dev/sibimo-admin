<script setup>
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import AppButton from '@/components/common/AppButton.vue'
import AppDataTable from '@/components/common/AppDataTable.vue'

const toast = useToast()

// ===== Dummy data book_loans yang berstatus masih dipinjam -- ganti dengan API =====
// GET /api/book-loans?status=Borrowed&search=... (cari lewat loan_id atau nama anggota)
const dummyLoans = ref([
  { loan_id: 101, full_name: 'Budi Santoso', title: 'Sistem Informasi Manajemen', borrowed_at: '2026-08-04', due_date: '2026-08-11' },
  { loan_id: 102, full_name: 'Budi Santoso', title: 'Desain Basis Data Relasional', borrowed_at: '2026-08-04', due_date: '2026-08-13' },
  { loan_id: 103, full_name: 'Siti Aminah', title: 'Laskar Pelangi', borrowed_at: '2026-07-30', due_date: '2026-08-06' },
])

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

const columns = [
  { field: 'loan_id', header: 'No. Peminjaman' },
  { field: 'full_name', header: 'Nama Anggota' },
  { field: 'title', header: 'Judul Buku' },
  { field: 'borrowed_at', header: 'Tgl Pinjam' },
  { field: 'due_date', header: 'Jatuh Tempo' },
  { field: 'status', header: 'Status' },
]

// Status keterlambatan dihitung dari due_date vs hari ini -- dipakai baik
// untuk badge di tabel maupun untuk kartu proses pengembalian di bawah.
function calculateStatus(loan) {
  const today = new Date()
  const due = new Date(loan.due_date)
  const daysDiff = Math.floor((today - due) / (1000 * 60 * 60 * 24))
  if (daysDiff > 0) return { label: `Terlambat ${daysDiff} Hari`, severity: 'danger', days: daysDiff }
  return { label: 'Tepat Waktu', severity: 'success', days: 0 }
}

const statusInfo = computed(() => (selectedLoan.value ? calculateStatus(selectedLoan.value) : null))

// Placeholder aturan denda -- BELUM DIKONFIRMASI tim backend/Perdes, sesuaikan nanti.
const FINE_PER_DAY = 1000
const totalFine = computed(() => (statusInfo.value ? statusInfo.value.days * FINE_PER_DAY : 0))

function selectRow(loan) {
  selectedLoan.value = loan
  returnReceipt.value = null
  showReturnDialog.value = true
}

async function processReturn() {
  if (!selectedLoan.value) return

  const returnedAt = new Date().toISOString().slice(0, 10)
  const finalStatus = statusInfo.value.days > 0 ? 'Late' : 'Returned' // sesuai enum book_loans.status

  // Payload PERSIS sesuai kolom book_loans -- siap dikirim ke PUT/PATCH /api/book-loans/:loan_id
  const payload = {
    loan_id: selectedLoan.value.loan_id,
    returned_at: returnedAt,
    status: finalStatus,
    fine_amount: totalFine.value,
  }

  // TODO: ganti dengan panggilan service, misal:
  // await updateBookLoan(payload.loan_id, payload)
  console.log('Payload ke API:', payload)
  toast.add({ severity: 'success', summary: 'Pengembalian berhasil dicatat (dummy)', life: 2500 })

  // Simpan snapshot data buat preview & struk cetak, sebelum data hilang dari daftar.
  returnReceipt.value = {
    loan_id: selectedLoan.value.loan_id,
    full_name: selectedLoan.value.full_name,
    title: selectedLoan.value.title,
    borrowed_at: selectedLoan.value.borrowed_at,
    due_date: selectedLoan.value.due_date,
    returned_at: returnedAt,
    status: finalStatus,
    fine_amount: totalFine.value,
  }

  // Hilangkan dari daftar yang belum kembali (dummy) -- ganti dengan
  // refetch daftar dari API setelah request di atas berhasil.
  dummyLoans.value = dummyLoans.value.filter((l) => l.loan_id !== selectedLoan.value.loan_id)

  // Tutup dialog form, lalu buka dialog preview bukti (bukan langsung print).
  showReturnDialog.value = false
  selectedLoan.value = null
  showReceiptDialog.value = true
}

// Dipanggil dari tombol "Cetak" DI DALAM dialog preview -- baru di titik
// ini window.print() dipanggil, jadi user selalu lihat preview dulu.
// Modal (mask + panel) otomatis disembunyikan saat print lewat CSS di
// bawah, jadi yang tercetak cuma area struk khusus print.
function printReturnReceipt() {
  if (!returnReceipt.value) return
  window.print()
}

function closeReceiptDialog() {
  showReceiptDialog.value = false
}

function cancelForm() {
  showReturnDialog.value = false
  selectedLoan.value = null
}
</script>

<template>
  <div>
    <!-- Konten normal, disembunyikan otomatis saat mode cetak (print:hidden) -->
    <div class="print:hidden">
      <h1 class="m-0 mb-1 text-[22px] font-bold text-slate-900">Pengembalian Buku</h1>
      <p class="mb-5 text-sm text-slate-500">Catat transaksi pengembalian buku perpustakaan desa</p>

      <div class="card mb-4">
        <h2 class="font-semibold text-neutral-800 mb-3">Daftar Peminjaman Belum Dikembalikan</h2>

        <div class="relative mb-4 max-w-sm">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" />
          <InputText
            v-model="keyword"
            placeholder="Cari No. Peminjaman atau Nama Anggota..."
            class="w-full !pl-9"
          />
        </div>

        <AppDataTable :columns="columns" :rows="unreturnedLoans" data-key="loan_id" empty-message="Semua buku sudah dikembalikan">
          <template #status="{ data }">
            <Tag :value="calculateStatus(data).label" :severity="calculateStatus(data).severity" />
          </template>
          <template #actions="{ data }">
            <AppButton label="Proses" icon="pi pi-replay" variant="ghost" size="small" @click="selectRow(data)" />
          </template>
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

        <div class="grid grid-cols-2 gap-4 text-sm mb-5">
          <div>
            <p class="text-neutral-400 mb-0.5">Nama Anggota</p>
            <p class="font-medium text-neutral-800">{{ selectedLoan.full_name }}</p>
          </div>
          <div>
            <p class="text-neutral-400 mb-0.5">Judul Buku</p>
            <p class="font-medium text-neutral-800">{{ selectedLoan.title }}</p>
          </div>
          <div>
            <p class="text-neutral-400 mb-0.5">Tanggal Pinjam</p>
            <p class="font-medium text-neutral-800">{{ selectedLoan.borrowed_at }}</p>
          </div>
          <div>
            <p class="text-neutral-400 mb-0.5">Jatuh Tempo</p>
            <p class="font-medium text-neutral-800">{{ selectedLoan.due_date }}</p>
          </div>
        </div>

        <div class="flex items-center justify-between bg-neutral-50 border border-border rounded-lg px-4 py-3 mb-2">
          <span class="text-sm text-neutral-600">Status</span>
          <Tag :value="statusInfo.label" :severity="statusInfo.severity" />
        </div>

        <div class="flex items-center justify-between bg-neutral-50 border border-border rounded-lg px-4 py-3 mb-1">
          <span class="text-sm text-neutral-600">Denda Keterlambatan</span>
          <span class="font-semibold text-neutral-800">Rp {{ totalFine.toLocaleString('id-ID') }}</span>
        </div>
        <p class="text-xs text-neutral-400 mb-5">
          Rp {{ FINE_PER_DAY.toLocaleString('id-ID') }}/hari
        </p>

        <div class="flex justify-end gap-3">
          <AppButton label="Batal" variant="secondary" @click="cancelForm" />
          <AppButton label="Proses Pengembalian" variant="primary" @click="processReturn" />
        </div>
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
    <div v-if="returnReceipt" class="hidden print:block text-sm text-black">
      <div class="text-center mb-6">
        <h2 class="text-lg font-bold uppercase">Bukti Pengembalian Buku</h2>
        <p>Perpustakaan Desa</p>
      </div>

      <table class="w-full mb-8">
        <tbody>
          <tr><td class="py-1 pr-4 w-44 align-top">No. Peminjaman</td><td class="align-top">: {{ returnReceipt.loan_id }}</td></tr>
          <tr><td class="py-1 pr-4 align-top">Nama Anggota</td><td class="align-top">: {{ returnReceipt.full_name }}</td></tr>
          <tr><td class="py-1 pr-4 align-top">Judul Buku</td><td class="align-top">: {{ returnReceipt.title }}</td></tr>
          <tr><td class="py-1 pr-4 align-top">Tanggal Pinjam</td><td class="align-top">: {{ returnReceipt.borrowed_at }}</td></tr>
          <tr><td class="py-1 pr-4 align-top">Jatuh Tempo</td><td class="align-top">: {{ returnReceipt.due_date }}</td></tr>
          <tr><td class="py-1 pr-4 align-top">Tanggal Kembali</td><td class="align-top">: {{ returnReceipt.returned_at }}</td></tr>
          <tr><td class="py-1 pr-4 align-top">Status</td><td class="align-top">: {{ returnReceipt.status === 'Late' ? 'Terlambat' : 'Tepat Waktu' }}</td></tr>
          <tr><td class="py-1 pr-4 align-top">Denda</td><td class="align-top">: Rp {{ returnReceipt.fine_amount.toLocaleString('id-ID') }}</td></tr>
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