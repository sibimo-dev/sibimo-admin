<script setup>
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import AppButton from '@/components/common/AppButton.vue'
import AppDataTable from '@/components/common/AppDataTable.vue'

const toast = useToast()

// ===== Dummy data book_loans yang berstatus masih dipinjam -- ganti dengan API =====
// GET /api/book-loans?status=Borrowed&search=... (cari lewat loan_id atau nama anggota)
const dummyLoans = ref([
  { loan_id: 101, nama_anggota: 'Budi Santoso', title: 'Sistem Informasi Manajemen', borrowed_at: '2026-08-04', due_date: '2026-08-11' },
  { loan_id: 102, nama_anggota: 'Budi Santoso', title: 'Desain Basis Data Relasional', borrowed_at: '2026-08-04', due_date: '2026-08-13' },
  { loan_id: 103, nama_anggota: 'Siti Aminah', title: 'Laskar Pelangi', borrowed_at: '2026-07-30', due_date: '2026-08-06' },
])

const keyword = ref('')
const hasilPencarian = ref(null)

// Daftar peminjaman yang belum dikembalikan, difilter live sesuai keyword
// (cari lewat loan_id atau nama anggota). Kalau backend sudah siap, ganti
// jadi panggilan API dengan query param `search` alih-alih filter di client.
const daftarBelumKembali = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return dummyLoans.value
  return dummyLoans.value.filter(
    (l) => String(l.loan_id).includes(q) || l.nama_anggota.toLowerCase().includes(q),
  )
})

const columns = [
  { field: 'loan_id', header: 'No. Peminjaman' },
  { field: 'nama_anggota', header: 'Nama Anggota' },
  { field: 'title', header: 'Judul Buku' },
  { field: 'borrowed_at', header: 'Tgl Pinjam' },
  { field: 'due_date', header: 'Jatuh Tempo' },
  { field: 'status', header: 'Status' },
]

// Status keterlambatan dihitung dari due_date vs hari ini -- dipakai baik
// untuk badge di tabel maupun untuk kartu proses pengembalian di bawah.
function hitungStatus(loan) {
  const today = new Date()
  const due = new Date(loan.due_date)
  const selisihHari = Math.floor((today - due) / (1000 * 60 * 60 * 24))
  if (selisihHari > 0) return { label: `Terlambat ${selisihHari} Hari`, severity: 'danger', hari: selisihHari }
  return { label: 'Tepat Waktu', severity: 'success', hari: 0 }
}

const statusInfo = computed(() => (hasilPencarian.value ? hitungStatus(hasilPencarian.value) : null))

// Placeholder aturan denda -- BELUM DIKONFIRMASI tim backend/Perdes, sesuaikan nanti.
const DENDA_PER_HARI = 1000
const totalDenda = computed(() => (statusInfo.value ? statusInfo.value.hari * DENDA_PER_HARI : 0))

function prosesBaris(loan) {
  hasilPencarian.value = loan
}

async function prosesPengembalian() {
  if (!hasilPencarian.value) return

  // Payload PERSIS sesuai kolom book_loans -- siap dikirim ke PUT/PATCH /api/book-loans/:loan_id
  const payload = {
    loan_id: hasilPencarian.value.loan_id,
    returned_at: new Date().toISOString().slice(0, 10),
    status: statusInfo.value.hari > 0 ? 'Late' : 'Returned', // sesuai enum book_loans.status
    fine_amount: totalDenda.value,
  }

  // TODO: ganti dengan panggilan service, misal:
  // await updateBookLoan(payload.loan_id, payload)
  console.log('Payload ke API:', payload)
  toast.add({ severity: 'success', summary: 'Pengembalian berhasil dicatat (dummy)', life: 2500 })

  // Hilangkan dari daftar yang belum kembali (dummy) -- ganti dengan
  // refetch daftar dari API setelah request di atas berhasil.
  dummyLoans.value = dummyLoans.value.filter((l) => l.loan_id !== hasilPencarian.value.loan_id)
  hasilPencarian.value = null
}

function batal() {
  hasilPencarian.value = null
}
</script>

<template>
  <div>
    <h1 class="page-title">Pengembalian Buku</h1>
    <p class="page-subtitle">Catat transaksi pengembalian buku perpustakaan desa</p>

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

      <AppDataTable :columns="columns" :rows="daftarBelumKembali" data-key="loan_id" empty-message="Semua buku sudah dikembalikan">
        <template #status="{ data }">
          <Tag :value="hitungStatus(data).label" :severity="hitungStatus(data).severity" />
        </template>
        <template #actions="{ data }">
          <AppButton label="Proses" icon="pi pi-replay" variant="ghost" size="small" @click="prosesBaris(data)" />
        </template>
      </AppDataTable>
    </div>

    <div v-if="hasilPencarian" class="card max-w-2xl">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-neutral-800">No. Peminjaman: {{ hasilPencarian.loan_id }}</h2>
        <AppButton icon="pi pi-times" variant="ghost" size="small" @click="batal" />
      </div>

      <div class="grid grid-cols-2 gap-4 text-sm mb-5">
        <div>
          <p class="text-neutral-400 mb-0.5">Nama Anggota</p>
          <p class="font-medium text-neutral-800">{{ hasilPencarian.nama_anggota }}</p>
        </div>
        <div>
          <p class="text-neutral-400 mb-0.5">Judul Buku</p>
          <p class="font-medium text-neutral-800">{{ hasilPencarian.title }}</p>
        </div>
        <div>
          <p class="text-neutral-400 mb-0.5">Tanggal Pinjam</p>
          <p class="font-medium text-neutral-800">{{ hasilPencarian.borrowed_at }}</p>
        </div>
        <div>
          <p class="text-neutral-400 mb-0.5">Jatuh Tempo</p>
          <p class="font-medium text-neutral-800">{{ hasilPencarian.due_date }}</p>
        </div>
      </div>

      <div class="flex items-center justify-between bg-neutral-50 border border-border rounded-lg px-4 py-3 mb-2">
        <span class="text-sm text-neutral-600">Status</span>
        <Tag :value="statusInfo.label" :severity="statusInfo.severity" />
      </div>

      <div class="flex items-center justify-between bg-neutral-50 border border-border rounded-lg px-4 py-3 mb-1">
        <span class="text-sm text-neutral-600">Denda Keterlambatan</span>
        <span class="font-semibold text-neutral-800">Rp {{ totalDenda.toLocaleString('id-ID') }}</span>
      </div>
      <p class="text-xs text-neutral-400 mb-5">
        Rp {{ DENDA_PER_HARI.toLocaleString('id-ID') }}/hari -- placeholder, sesuaikan dengan aturan resmi.
      </p>

      <div class="flex justify-end gap-3">
        <AppButton label="Batal" variant="secondary" @click="batal" />
        <AppButton label="Proses Pengembalian" variant="primary" @click="prosesPengembalian" />
      </div>
    </div>
  </div>
</template>