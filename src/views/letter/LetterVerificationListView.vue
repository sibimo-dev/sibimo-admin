<script setup>
/**
 * Halaman Verifikasi Surat -- daftar antrean.
 * Menampilkan surat berstatus "Pending" (menunggu verifikasi). Klik "Verifikasi"
 * membuka detail (LetterVerificationView.vue) lewat route /letter/verification/:id
 * yang isi tombolnya (Setujui/Tolak) langsung mengubah status di useLetterStore.
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Tag from 'primevue/tag'
import AppDataTable from '@/components/common/AppDataTable.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import { useLetterStore } from '@/stores/useLetterStore'

const router = useRouter()
const { rows } = useLetterStore()

const columns = [
  { field: 'requestId', header: 'Request ID' },
  { field: 'citizenName', header: 'Nama Pemohon' },
  { field: 'citizenId', header: 'NIK' },
  { field: 'purpose', header: 'Jenis Layanan' },
  { field: 'category', header: 'Kategori' },
  { field: 'date', header: 'Tanggal Pengajuan' },
  { field: 'source', header: 'Sumber' },
]

const searchQuery = ref('')

// Antrean verifikasi hanya menampilkan yang masih Pending -- yang sudah
// Diverifikasi/Disetujui/Ditolak tidak perlu tindakan lagi di sini.
const pendingRows = computed(() => {
  let result = rows.value.filter((r) => r.status === 'Pending')

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter(
      (r) =>
        r.requestId.toLowerCase().includes(query) ||
        (r.citizenName || '').toLowerCase().includes(query) ||
        r.citizenId.toLowerCase().includes(query),
    )
  }

  return result.sort((a, b) => new Date(a.dateValue) - new Date(b.dateValue)) // antrean lama duluan
})

function openVerification(data) {
  router.push(`/letter/verification/${data.requestId}`)
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-800">Verifikasi Surat</h1>
      <p class="text-sm text-slate-500 mt-1">
        Daftar pengajuan surat yang menunggu tindakan verifikasi.
      </p>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div class="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <p class="text-sm text-slate-500">
          <span class="font-semibold text-slate-800">{{ pendingRows.length }}</span>
          surat menunggu verifikasi
        </p>
        <AppInput
          v-model="searchQuery"
          placeholder="Cari Request ID, nama, atau NIK..."
          icon="pi pi-search"
        />
      </div>

      <div class="rounded-xl border border-slate-100 overflow-hidden">
        <AppDataTable :columns="columns" :rows="pendingRows">
          <template #category="{ data }">
            <Tag :value="data.category" severity="info" />
          </template>
          <template #actions="{ data }">
            <AppButton
              label="Verifikasi"
              variant="primary"
              size="small"
              @click="openVerification(data)"
            />
          </template>
        </AppDataTable>
      </div>

      <p v-if="pendingRows.length === 0" class="text-center text-slate-400 py-10 text-sm">
        Tidak ada surat yang menunggu verifikasi saat ini.
      </p>
    </div>
  </div>
</template>