<script setup>
import { ref, reactive, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppAutoComplete from '@/components/common/AppAutoComplete.vue'

const toast = useToast()

// ===== Dummy data anggota (citizens) -- ganti dengan panggilan API =====
const anggotaList = ref([
  { citizen_id: 1, full_name: 'Budi Santoso', national_id: '3301234567890001' },
  { citizen_id: 2, full_name: 'Siti Aminah', national_id: '3301234567890002' },
])

// ===== Dummy data buku (books, join book_categories) -- ganti dengan API =====
const bukuList = ref([
  { book_id: 1, isbn: 'B-SEJ-001', title: 'Sejarah Perjuangan Kemerdekaan', kategori: 'Sejarah', stock: 3 },
  { book_id: 2, isbn: 'B-PRT-042', title: 'Teknik Pertanian Modern', kategori: 'Pertanian', stock: 5 },
  { book_id: 3, isbn: 'B-NOV-015', title: 'Laskar Pelangi', kategori: 'Novel', stock: 0 },
])

const form = reactive({
  citizen_id: null,
  book_id: null,
  borrowed_at: new Date().toISOString().slice(0, 10),
  durasi_hari: 7,
})

// Opsi utk AppAutoComplete: cukup { label, value } + field tambahan
// (national_id, kategori, stock) supaya bisa ditampilkan di item saran
// lewat slot #option, dan bisa ikut difilter kalau user ketik NIK/ISBN.
const anggotaOptions = computed(() =>
  anggotaList.value.map((a) => ({
    label: a.full_name,
    value: a.citizen_id,
    national_id: a.national_id,
  })),
)

const bukuOptions = computed(() =>
  bukuList.value
    .filter((b) => b.stock > 0) // cuma tampilkan buku yang stok-nya ada
    .map((b) => ({
      label: b.title,
      value: b.book_id,
      isbn: b.isbn,
      kategori: b.kategori,
      stock: b.stock,
    })),
)

const anggotaTerpilih = computed(() => anggotaList.value.find((a) => a.citizen_id === form.citizen_id))
const bukuTerpilih = computed(() => bukuList.value.find((b) => b.book_id === form.book_id))

// due_date dihitung dari borrowed_at + durasi_hari, sesuai kolom asli book_loans
const dueDateISO = computed(() => {
  if (!form.borrowed_at || !form.durasi_hari) return null
  const d = new Date(form.borrowed_at)
  d.setDate(d.getDate() + Number(form.durasi_hari))
  return d.toISOString().slice(0, 10)
})

const tanggalKembaliDisplay = computed(() => {
  if (!dueDateISO.value) return '-'
  return new Date(dueDateISO.value).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
})

async function simpanPeminjaman() {
  if (!form.citizen_id || !form.book_id) {
    toast.add({ severity: 'error', summary: 'Pilih anggota dan buku terlebih dahulu', life: 2500 })
    return
  }

  // Payload PERSIS sesuai kolom book_loans -- siap dikirim ke POST /api/book-loans
  const payload = {
    citizen_id: form.citizen_id,
    book_id: form.book_id,
    borrowed_at: form.borrowed_at,
    due_date: dueDateISO.value,
    status: 'Borrowed', // sesuai enum migrasi book_loans.status
  }

  // TODO: ganti dengan panggilan service, misal:
  // await createBookLoan(payload)
  console.log('Payload ke API:', payload)
  toast.add({ severity: 'success', summary: 'Peminjaman berhasil dicatat (dummy)', life: 2500 })
}

function batal() {
  form.citizen_id = null
  form.book_id = null
  form.durasi_hari = 7
}
</script>

<template>
  <div>
    <h1 class="page-title">Peminjaman Buku</h1>
    <p class="page-subtitle">Catat transaksi peminjaman buku perpustakaan desa (1 buku per transaksi)</p>

    <div class="card max-w-2xl">
      <h2 class="font-semibold text-neutral-800 mb-4">Form Peminjaman Buku</h2>

      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppAutoComplete
            v-model="form.citizen_id"
            label="Nama Anggota"
            :options="anggotaOptions"
            placeholder="Ketik nama anggota..."
            required
          >
            <template #option="{ option }">
              <div class="flex flex-col">
                <span>{{ option.label }}</span>
                <span class="text-xs text-neutral-400">NIK: {{ option.national_id }}</span>
              </div>
            </template>
          </AppAutoComplete>
          <AppInput label="NIK / ID Anggota" :model-value="anggotaTerpilih?.national_id || ''" disabled />
        </div>

        <AppAutoComplete
          v-model="form.book_id"
          label="Judul Buku"
          :options="bukuOptions"
          placeholder="Ketik judul atau ISBN buku..."
          empty-message="Tidak ada buku dengan stok tersedia"
          required
        >
          <template #option="{ option }">
            <div class="flex flex-col">
              <span>{{ option.label }}</span>
              <span class="text-xs text-neutral-400">
                {{ option.kategori }} &middot; ISBN {{ option.isbn }} &middot; Stok {{ option.stock }}
              </span>
            </div>
          </template>
        </AppAutoComplete>
        <p v-if="bukuTerpilih" class="text-xs text-neutral-400 -mt-2">
          Kategori: {{ bukuTerpilih.kategori }} &middot; Stok tersedia: {{ bukuTerpilih.stock }}
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppInput v-model="form.borrowed_at" type="date" label="Tanggal Pinjam" required />
          <AppInput v-model="form.durasi_hari" type="number" label="Durasi Pinjam (Hari)" required />
        </div>

        <AppInput label="Tanggal Kembali (Jatuh Tempo)" :model-value="tanggalKembaliDisplay" disabled />
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <AppButton label="Batal" variant="secondary" @click="batal" />
        <AppButton label="Simpan Peminjaman" variant="primary" @click="simpanPeminjaman" />
      </div>
    </div>
  </div>
</template>