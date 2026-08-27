<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppAutocomplete from '@/components/common/AppAutocomplete.vue'
import { getCitizens } from '@/services/citizen.service'
import { createLoan, getBooks } from '@/services/library.service'
const toast = useToast(); const books = ref([]); const citizens = ref([]); const loading = ref(false); const saving = ref(false); const loanReceipt = ref(null)
const form = reactive({ citizen_id: null, book_id: null, borrowed_at: new Date().toISOString().slice(0, 10), loanDurationDays: 7 })
const citizenOptions = computed(() => citizens.value.filter(c => c.status === 'Active').map(c => ({ label: c.full_name, value: c.citizen_id })))
const bookOptions = computed(() => books.value.filter(b => Number(b.stock) > 0).map(b => ({ label: `${b.title} (stok ${b.stock})`, value: b.book_id })))
const dueDate = computed(() => { const d = new Date(`${form.borrowed_at}T00:00:00`); d.setDate(d.getDate() + Number(form.loanDurationDays || 0)); return d.toISOString().slice(0, 10) })
function messageFrom(error, fallback) { return error.response?.data?.message ?? fallback }
async function loadFormData() { loading.value = true; try { [books.value, citizens.value] = await Promise.all([getBooks(), getCitizens()]) } catch (error) { toast.add({ severity: 'error', summary: 'Gagal memuat data', detail: messageFrom(error, 'Coba lagi.'), life: 3500 }) } finally { loading.value = false } }
async function saveLoan() { if (!form.citizen_id || !form.book_id || !form.borrowed_at) { toast.add({ severity: 'warn', summary: 'Data belum lengkap', detail: 'Pilih anggota, buku, dan tanggal pinjam.', life: 3000 }); return }; saving.value = true; try { loanReceipt.value = await createLoan({ citizen_id: form.citizen_id, book_id: form.book_id, borrowed_at: form.borrowed_at, due_date: dueDate.value }); toast.add({ severity: 'success', summary: 'Peminjaman berhasil dicatat', life: 2500 }); Object.assign(form, { citizen_id: null, book_id: null, borrowed_at: new Date().toISOString().slice(0, 10), loanDurationDays: 7 }); await loadFormData() } catch (error) { toast.add({ severity: 'error', summary: 'Peminjaman gagal dicatat', detail: messageFrom(error, 'Coba lagi.'), life: 3500 }) } finally { saving.value = false } }
function printReceipt() { window.print() }
onMounted(loadFormData)
</script>
<template>
  <div class="max-w-2xl"><h1 class="m-0 mb-1 text-[22px] font-bold text-slate-900">Peminjaman Buku</h1><p class="mb-5 text-sm text-slate-500">Catat transaksi peminjaman buku perpustakaan desa.</p><div class="card space-y-4"><AppAutocomplete v-model="form.citizen_id" :options="citizenOptions" label="Anggota" placeholder="Pilih anggota" :disabled="loading" /><AppAutocomplete v-model="form.book_id" :options="bookOptions" label="Buku" placeholder="Pilih buku" :disabled="loading" /><AppInput v-model="form.borrowed_at" type="date" label="Tanggal Pinjam" /><AppInput v-model.number="form.loanDurationDays" type="number" min="1" label="Lama Pinjam (hari)" /><p class="text-sm text-slate-500">Jatuh tempo: <strong>{{ dueDate }}</strong></p><div class="flex justify-end"><AppButton label="Simpan Peminjaman" variant="primary" :loading="saving" @click="saveLoan" /></div></div><div v-if="loanReceipt" class="card mt-4"><p class="font-semibold">Peminjaman berhasil disimpan</p><p class="text-sm">Nomor peminjaman: {{ loanReceipt.loan_id }}</p><AppButton label="Cetak Bukti" icon="pi pi-print" variant="secondary" @click="printReceipt" /></div></div>
</template>
