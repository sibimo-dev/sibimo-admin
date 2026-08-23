<script setup>
/**
 * Halaman Verifikasi Surat (detail).
 * Diakses dari LetterVerificationListView.vue lewat /letter/verification/:id
 * (id = requestId). Data pemohon sekarang diambil dari useLetterStore --
 * bukan dummy hardcode lagi -- dan tombol Setujui/Tolak memanggil
 * updateStatus() di store yang sama.
 *
 * Dokumen terlampir & preview MASIH dummy statis karena belum ada alur
 * upload/simpan dokumen di aplikasi ini. Ganti begitu fitur upload dokumen
 * pemohon (online maupun manual) sudah ada.
 */
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Tag from 'primevue/tag'
import AppButton from '@/components/common/AppButton.vue'
import { useLetterStore } from '@/stores/useLetterStore'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { getByRequestId, updateStatus } = useLetterStore()

const requestId = computed(() => route.params.id)
const record = computed(() => getByRequestId(requestId.value))

// TODO: ganti dengan identitas admin yang sedang login (auth store)
const currentAdminName = 'Super Admin'

// Dokumen terlampir -- dummy statis, lihat catatan di atas
const dokumen = ref([
  { id: 1, nama: 'KTP_Pemohon.jpg', ukuran: '245 KB', tanggal: '12 Okt 2023', icon: 'pi pi-id-card' },
  { id: 2, nama: 'KK_Pemohon.pdf', ukuran: '1.2 MB', tanggal: '12 Okt 2023', icon: 'pi pi-file-pdf' },
  { id: 3, nama: 'Foto_Tempat_Usaha.jpg', ukuran: '3.5 MB', tanggal: '12 Okt 2023', icon: 'pi pi-image' },
])
const activePreview = ref(dokumen.value[0])
function previewDokumen(doc) {
  activePreview.value = doc
}

// Catatan verifikator
const catatan = ref('')

const statusColor = {
  Pending: 'warn',
  Diverifikasi: 'info',
  Disetujui: 'success',
  Ditolak: 'danger',
}

const loading = ref(false)

async function setujuiPermohonan() {
  if (!record.value) return
  loading.value = true
  try {
    // TODO: panggil surat.service.js -> approveSurat(requestId, { catatan })
    updateStatus(requestId.value, {
      status: 'Diverifikasi',
      verifiedBy: currentAdminName,
      notes: catatan.value,
    })
    toast.add({ severity: 'success', summary: 'Permohonan diverifikasi', life: 2000 })
    router.push('/letter/verification')
  } finally {
    loading.value = false
  }
}

async function tolakPermohonan() {
  if (!record.value) return
  if (!catatan.value.trim()) {
    toast.add({ severity: 'warn', summary: 'Isi catatan alasan penolakan terlebih dahulu', life: 2500 })
    return
  }
  loading.value = true
  try {
    // TODO: panggil surat.service.js -> rejectSurat(requestId, { catatan })
    updateStatus(requestId.value, {
      status: 'Ditolak',
      verifiedBy: currentAdminName,
      notes: catatan.value,
    })
    toast.add({ severity: 'success', summary: 'Permohonan ditolak', life: 2000 })
    router.push('/letter/verification')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Data tidak ditemukan (mis. requestId salah, atau sudah tidak Pending) -->
    <div v-if="!record" class="max-w-md mx-auto text-center py-20">
      <p class="text-slate-500 text-sm mb-4">
        Permohonan dengan Request ID <span class="font-medium text-slate-700">{{ requestId }}</span>
        tidak ditemukan.
      </p>
      <AppButton label="Kembali ke Daftar Verifikasi" variant="primary" @click="router.push('/letter/verification')" />
    </div>

    <template v-else>
      <div class="flex items-center gap-3 mb-5">
        <button
          class="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          @click="router.push('/letter/verification')"
        >
          <i class="pi pi-arrow-left"></i>
        </button>
        <h1 class="text-2xl font-bold text-slate-800">Verifikasi Dokumen #{{ record.requestId }}</h1>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Kolom kiri: info pemohon + dokumen + preview -->
        <div class="lg:col-span-2 flex flex-col gap-4">
          <!-- Informasi Pemohon -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 class="font-semibold text-slate-800 mb-3 text-sm">Informasi Pemohon</h2>

            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-0.5">
                <p class="text-xs font-semibold text-slate-500">Kategori</p>
                <p class="text-sm text-slate-800">{{ record.category }}</p>
              </div>
              <div class="flex flex-col gap-0.5">
                <p class="text-xs font-semibold text-slate-500">Jenis Layanan</p>
                <p class="text-sm text-slate-800">{{ record.purpose }}</p>
              </div>

              <div class="flex flex-col gap-0.5">
                <p class="text-xs font-semibold text-slate-500">Nomor Surat</p>
                <p class="text-sm text-slate-800">{{ record.letterNumber || '-' }}</p>
              </div>
              <div class="flex flex-col gap-0.5">
                <p class="text-xs font-semibold text-slate-500">Tanggal Pengajuan</p>
                <p class="text-sm text-slate-800">{{ record.date }}</p>
              </div>

              <div class="flex flex-col gap-0.5">
                <p class="text-xs font-semibold text-slate-500">Nama Lengkap</p>
                <p class="text-sm text-slate-800">{{ record.citizenName || '-' }}</p>
              </div>
              <div class="flex flex-col gap-0.5">
                <p class="text-xs font-semibold text-slate-500">NIK</p>
                <p class="text-sm text-slate-800">{{ record.citizenId }}</p>
              </div>

              <div class="flex flex-col gap-0.5">
                <p class="text-xs font-semibold text-slate-500">No Telepon</p>
                <p class="text-sm text-slate-800">{{ record.citizenPhone || '-' }}</p>
              </div>
              <div class="flex flex-col gap-0.5">
                <p class="text-xs font-semibold text-slate-500">Sumber Pengajuan</p>
                <p class="text-sm text-slate-800">{{ record.source }}</p>
              </div>

              <div class="flex flex-col gap-0.5 col-span-2">
                <p class="text-xs font-semibold text-slate-500">Alamat Lengkap</p>
                <p class="text-sm text-slate-800">{{ record.citizenAddress || '-' }}</p>
              </div>
            </div>
          </div>

          <!-- Dokumen Terlampir -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 class="font-semibold text-slate-800 mb-3 text-sm">Dokumen Terlampir</h2>

            <div class="flex flex-col divide-y divide-slate-100">
              <div
                v-for="doc in dokumen"
                :key="doc.id"
                class="flex items-center justify-between py-3"
              >
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <i :class="doc.icon"></i>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-800">{{ doc.nama }}</p>
                    <p class="text-xs text-slate-500">
                      {{ doc.ukuran }} • Ditambahkan {{ doc.tanggal }}
                    </p>
                  </div>
                </div>

                <button
                  class="text-slate-400 hover:text-blue-600 transition-colors"
                  @click="previewDokumen(doc)"
                  title="Pratinjau"
                >
                  <i class="pi pi-eye"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Preview dokumen -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
            <div class="min-h-[220px] bg-slate-100 flex items-center justify-center">
              <span v-if="!activePreview" class="text-slate-400 text-sm">
                Pilih dokumen untuk pratinjau
              </span>
              <img
                v-else-if="activePreview.icon !== 'pi pi-file-pdf'"
                :src="`/dummy-preview/${activePreview.nama}`"
                :alt="activePreview.nama"
                class="max-w-full max-h-80 object-contain"
                @error="$event.target.style.display = 'none'"
              />
              <span v-else class="text-slate-400 text-sm">Preview PDF tidak tersedia</span>
            </div>

            <div v-if="activePreview" class="absolute top-3 right-3">
              <AppButton
                :label="`Pratinjau ${activePreview.nama.split('_')[0]}`"
                icon="pi pi-search"
                variant="light"
                size="small"
              />
            </div>
          </div>
        </div>

        <!-- Kolom kanan: catatan, tindakan, status -->
        <div class="flex flex-col gap-4">
          <!-- Catatan Verifikator -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 class="font-semibold text-slate-800 mb-2 text-sm">Catatan Verifikator</h2>
            <label class="text-xs font-semibold text-slate-500 mb-1 block">
              Tambahkan catatan untuk pemohon (wajib diisi jika menolak)
            </label>
            <textarea
              v-model="catatan"
              rows="4"
              class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-y outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="Tuliskan alasan penolakan atau catatan tambahan di sini..."
            ></textarea>
          </div>

          <!-- Tindakan -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 class="font-semibold text-slate-800 mb-2 text-sm">Tindakan</h2>
            <p class="text-sm text-slate-500 mb-4">
              Pastikan semua dokumen telah diperiksa dengan seksama sebelum mengambil keputusan.
            </p>

            <div v-if="record.status !== 'Pending'" class="text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
              Permohonan ini sudah ditindak sebelumnya dengan status
              <span class="font-medium text-slate-700">{{ record.status }}</span>.
            </div>
            <div v-else class="flex flex-col gap-2">
              <AppButton
                label="Setujui Permohonan"
                icon="pi pi-check-circle"
                variant="primary"
                class="w-full"
                :loading="loading"
                @click="setujuiPermohonan"
              />
              <AppButton
                label="Tolak Permohonan"
                icon="pi pi-times-circle"
                variant="outline"
                class="w-full"
                :loading="loading"
                @click="tolakPermohonan"
              />
            </div>
          </div>

          <!-- Status Saat Ini -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div class="flex items-center justify-between mb-3">
              <h2 class="font-semibold text-slate-800 text-sm">Status Saat Ini</h2>
            </div>

            <Tag :value="record.status.toUpperCase()" :severity="statusColor[record.status]" />

            <p class="text-xs font-semibold text-slate-500 mt-4 mb-1">Diverifikasi Oleh</p>
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <i class="pi pi-user text-xs"></i>
              </div>
              <span class="text-sm text-slate-700">{{ record.verifiedBy }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>