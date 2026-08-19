<script setup>
/**
 * Halaman Verifikasi Surat.
 * Ganti dummyData dengan data asli dari surat.service.js (detail per requestId) begitu backend siap.
 */
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import Tag from 'primevue/tag'
import AppButton from '@/components/common/AppButton.vue'

const route = useRoute()

// requestId diambil dari route param, fallback ke dummy kalau diakses langsung
const requestId = computed(() => route.params.id || 'REQ-20231015-001')

// Dummy data -- ganti dengan hasil fetch detail permohonan dari backend
const pemohon = ref({
  jenisSurat: 'Surat Permohonan',
  jenisLayanan: 'Surat Keterangan Usaha',
  kodeTipeSurat: '581/',
  tanggalPengajuan: '10 Oktober 2023',
  namaLengkap: 'Ghiska',
  nik: '3201011205900001',
  noTelepon: '08xxxxxxx',
  alamatLengkap: 'Jl. Merdeka No. 45, RT 02/RW 03, Desa Makmur, Kec. Sejahtera, Kab. Maju',
})

const dokumen = ref([
  { id: 1, nama: 'KTP_Ghiska.jpg', ukuran: '245 KB', tanggal: '12 Okt 2023', icon: 'pi pi-id-card' },
  { id: 2, nama: 'KK_Ghiska.pdf', ukuran: '1.2 MB', tanggal: '12 Okt 2023', icon: 'pi pi-file-pdf' },
  { id: 3, nama: 'Foto_Tempat_Usaha.jpg', ukuran: '3.5 MB', tanggal: '12 Okt 2023', icon: 'pi pi-image' },
])

const activePreview = ref(dokumen.value[0])

function previewDokumen(doc) {
  activePreview.value = doc
}

// Catatan verifikator
const catatan = ref('')

// Status permohonan saat ini
const statusSaatIni = ref('Menunggu Verifikasi')
const diverifikasiOleh = ref('Admin Desa')

const statusColor = {
  'Menunggu Verifikasi': 'warn',
  Diverifikasi: 'info',
  Disetujui: 'success',
  Ditolak: 'danger',
}

const loading = ref(false)

async function setujuiPermohonan() {
  loading.value = true
  try {
    // TODO: panggil surat.service.js -> approveSurat(requestId.value, { catatan: catatan.value })
    console.log('Setujui permohonan', requestId.value, catatan.value)
  } finally {
    loading.value = false
  }
}

async function tolakPermohonan() {
  loading.value = true
  try {
    // TODO: panggil surat.service.js -> rejectSurat(requestId.value, { catatan: catatan.value })
    console.log('Tolak permohonan', requestId.value, catatan.value)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- font judul disamakan ke font-bold, konsisten dengan h1 di
         LetterTypeListView.vue ("Pengelolaan Tipe Surat") -->
    <h1 class="text-2xl font-bold text-slate-800 mb-5">Verifikasi Dokumen #{{ requestId }}</h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Kolom kiri: info pemohon + dokumen + preview -->
      <div class="lg:col-span-2 flex flex-col gap-4">
        <!-- Informasi Pemohon -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 class="font-semibold text-slate-800 mb-3 text-sm">Informasi Pemohon</h2>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-0.5">
              <p class="text-xs font-semibold text-slate-500">Jenis Surat</p>
              <p class="text-sm text-slate-800">{{ pemohon.jenisSurat }}</p>
            </div>
            <div class="flex flex-col gap-0.5">
              <p class="text-xs font-semibold text-slate-500">Jenis Layanan</p>
              <p class="text-sm text-slate-800">{{ pemohon.jenisLayanan }}</p>
            </div>

            <div class="flex flex-col gap-0.5">
              <p class="text-xs font-semibold text-slate-500">Kode Tipe Surat</p>
              <p class="text-sm text-slate-800">{{ pemohon.kodeTipeSurat }}</p>
            </div>
            <div class="flex flex-col gap-0.5">
              <p class="text-xs font-semibold text-slate-500">Tanggal Pengajuan</p>
              <p class="text-sm text-slate-800">{{ pemohon.tanggalPengajuan }}</p>
            </div>

            <div class="flex flex-col gap-0.5">
              <p class="text-xs font-semibold text-slate-500">Nama Lengkap</p>
              <p class="text-sm text-slate-800">{{ pemohon.namaLengkap }}</p>
            </div>
            <div class="flex flex-col gap-0.5">
              <p class="text-xs font-semibold text-slate-500">NIK</p>
              <p class="text-sm text-slate-800">{{ pemohon.nik }}</p>
            </div>

            <div class="flex flex-col gap-0.5">
              <p class="text-xs font-semibold text-slate-500">No Telepon</p>
              <p class="text-sm text-slate-800">{{ pemohon.noTelepon }}</p>
            </div>
            <div></div>

            <div class="flex flex-col gap-0.5 col-span-2">
              <p class="text-xs font-semibold text-slate-500">Alamat Lengkap</p>
              <p class="text-sm text-slate-800">{{ pemohon.alamatLengkap }}</p>
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
            Tambahkan catatan untuk pemohon (opsional)
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

          <div class="flex flex-col gap-2">
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
            <button class="text-slate-400 hover:text-blue-600 transition-colors">
              <i class="pi pi-ellipsis-h"></i>
            </button>
          </div>

          <Tag :value="statusSaatIni.toUpperCase()" :severity="statusColor[statusSaatIni]" />

          <p class="text-xs font-semibold text-slate-500 mt-4 mb-1">Diverifikasi Oleh</p>
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <i class="pi pi-user text-xs"></i>
            </div>
            <span class="text-sm text-slate-700">{{ diverifikasiOleh }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>