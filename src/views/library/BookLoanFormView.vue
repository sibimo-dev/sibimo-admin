<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppAutocomplete from '@/components/common/AppAutocomplete.vue'
import { getCitizens } from '@/services/citizen.service'
import { createLoan, getBooks } from '@/services/library.service'
import { getListCache, setListCache } from '@/services/list-cache'

const toast = useToast()
const cachedBooks = getListCache('books')
const cachedCitizens = getListCache('citizens')
const books = ref(cachedBooks ?? [])
const citizens = ref(cachedCitizens ?? [])
const loading = ref(!cachedBooks && !cachedCitizens)
const saving = ref(false)
const loanReceipt = ref(null)
const showReceiptDialog = ref(false)

const form = reactive({ citizen_id: null, book_id: null, borrowed_at: new Date().toISOString().slice(0, 10), loanDurationDays: 7 })

const citizenOptions = computed(() => citizens.value.filter(c => c.status === 'Active').map(c => ({ label: c.full_name, value: c.citizen_id })))
const bookOptions = computed(() => books.value.filter(b => Number(b.stock) > 0).map(b => ({ label: `${b.title} (stok ${b.stock})`, value: b.book_id })))
const dueDate = computed(() => { const d = new Date(`${form.borrowed_at}T00:00:00`); d.setDate(d.getDate() + Number(form.loanDurationDays || 0)); return d.toISOString().slice(0, 10) })

function messageFrom(error, fallback) { return error.response?.data?.message ?? fallback }

async function loadFormData({ background = false } = {}) {
  if (!background) loading.value = true
  try {
    const [bookData, citizenData] = await Promise.all([getBooks(), getCitizens()])
    books.value = bookData
    citizens.value = citizenData
    setListCache('books', bookData)
    setListCache('citizens', citizenData)
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal memuat data', detail: messageFrom(error, 'Coba lagi.'), life: 3500 })
  } finally {
    if (!background) loading.value = false
  }
}

async function saveLoan() {
  if (!form.citizen_id || !form.book_id || !form.borrowed_at) {
    toast.add({ severity: 'warn', summary: 'Data belum lengkap', detail: 'Pilih anggota, buku, dan tanggal pinjam.', life: 3000 })
    return
  }
  const citizen = citizens.value.find(c => c.citizen_id === form.citizen_id)
  const book = books.value.find(b => b.book_id === form.book_id)
  saving.value = true
  try {
    const result = await createLoan({ citizen_id: form.citizen_id, book_id: form.book_id, borrowed_at: form.borrowed_at, due_date: dueDate.value })
    loanReceipt.value = {
      ...result,
      full_name: citizen?.full_name ?? '-',
      title: book?.title ?? '-',
      borrowed_at: form.borrowed_at,
      due_date: dueDate.value,
    }
    toast.add({ severity: 'success', summary: 'Peminjaman berhasil dicatat', life: 2500 })
    Object.assign(form, { citizen_id: null, book_id: null, borrowed_at: new Date().toISOString().slice(0, 10), loanDurationDays: 7 })
    showReceiptDialog.value = true
    void loadFormData({ background: true })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Peminjaman gagal dicatat', detail: messageFrom(error, 'Coba lagi.'), life: 3500 })
  } finally {
    saving.value = false
  }
}

function printReceipt() { window.print() }

onMounted(() => loadFormData({ background: Boolean(cachedBooks || cachedCitizens) }))
</script>

<template>
  <div>
    <div class="print:hidden max-w-2xl">
      <h1 class="m-0 mb-1 text-[22px] font-bold text-slate-900">Peminjaman Buku</h1>
      <p class="mb-5 text-sm text-slate-500">Catat transaksi peminjaman buku perpustakaan desa.</p>
      <div class="card space-y-4">
        <AppAutocomplete v-model="form.citizen_id" :options="citizenOptions" label="Anggota" placeholder="Pilih anggota" :disabled="loading" />
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
      <div v-if="loanReceipt">
        <p>No. Peminjaman: {{ loanReceipt.loan_id }}</p>
        <p>Anggota: {{ loanReceipt.full_name }}</p>
        <p>Buku: {{ loanReceipt.title }}</p>
        <p>Tanggal Pinjam: {{ loanReceipt.borrowed_at }}</p>
        <p>Jatuh Tempo: {{ loanReceipt.due_date }}</p>
        <div class="flex justify-end gap-3">
          <AppButton label="Tutup" variant="outline" @click="showReceiptDialog = false" />
          <AppButton label="Cetak Bukti" icon="pi pi-print" variant="primary" @click="printReceipt" />
        </div>
      </div>
    </Dialog>

    <!-- Bukti cetak: hanya tampil saat mencetak, styling pakai utility class Tailwind -->
    <div v-if="loanReceipt" class="hidden print:block">
      <div class="mx-auto max-w-[480px] text-slate-900">
        <div class="mb-5 text-center">
          <p class="m-0 text-base font-bold uppercase tracking-wide">Perpustakaan Kalurahan Bimomartani</p>
          <p class="mt-0.5 text-[11px] text-slate-600">Kalurahan Bimomartani, Kec. Ngemplak, Kab. Sleman, Daerah Istimewa Yogyakarta</p>
          <div class="mt-2 border-b-2 border-slate-900"></div>
        </div>

        <h2 class="mb-5 text-center text-[15px] font-bold uppercase underline">Bukti Peminjaman Buku</h2>

        <table class="w-full border-collapse text-[13px]">
          <tbody>
            <tr>
              <td class="w-[140px] py-0.5 align-top">No. Peminjaman</td>
              <td class="w-3 py-0.5 align-top">:</td>
              <td class="py-0.5 align-top">{{ loanReceipt.loan_id }}</td>
            </tr>
            <tr>
              <td class="w-[140px] py-0.5 align-top">Nama Anggota</td>
              <td class="w-3 py-0.5 align-top">:</td>
              <td class="py-0.5 align-top">{{ loanReceipt.full_name }}</td>
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
}
</style>