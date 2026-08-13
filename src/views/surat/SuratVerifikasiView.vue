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
  <div>
    <h1 class="page-title mb-4">Verifikasi Dokumen #{{ requestId }}</h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Kolom kiri: info pemohon + dokumen + preview -->
      <div class="lg:col-span-2 flex flex-col gap-4">
        <!-- Informasi Pemohon -->
        <div class="card p-4">
          <h2 class="font-semibold text-neutral-800 mb-3">Informasi Pemohon</h2>

          <div class="grid grid-cols-2 gap-4">
            <div class="field-box">
              <p class="field-label">Jenis Surat</p>
              <p class="field-value">{{ pemohon.jenisSurat }}</p>
            </div>
            <div class="field-box">
              <p class="field-label">Jenis Layanan</p>
              <p class="field-value">{{ pemohon.jenisLayanan }}</p>
            </div>

            <div class="field-box">
              <p class="field-label">Kode Tipe Surat</p>
              <p class="field-value">{{ pemohon.kodeTipeSurat }}</p>
            </div>
            <div class="field-box">
              <p class="field-label">Tanggal Pengajuan</p>
              <p class="field-value">{{ pemohon.tanggalPengajuan }}</p>
            </div>

            <div class="field-box">
              <p class="field-label">Nama Lengkap</p>
              <p class="field-value">{{ pemohon.namaLengkap }}</p>
            </div>
            <div class="field-box">
              <p class="field-label">NIK</p>
              <p class="field-value">{{ pemohon.nik }}</p>
            </div>

            <div class="field-box">
              <p class="field-label">No Telepon</p>
              <p class="field-value">{{ pemohon.noTelepon }}</p>
            </div>
            <div></div>

            <div class="field-box col-span-2">
              <p class="field-label">Alamat Lengkap</p>
              <p class="field-value">{{ pemohon.alamatLengkap }}</p>
            </div>
          </div>
        </div>

        <!-- Dokumen Terlampir -->
        <div class="card p-4">
          <h2 class="font-semibold text-neutral-800 mb-3">Dokumen Terlampir</h2>

          <div class="flex flex-col divide-y divide-neutral-100">
            <div
              v-for="doc in dokumen"
              :key="doc.id"
              class="flex items-center justify-between py-3"
            >
              <div class="flex items-center gap-3">
                <div class="doc-icon">
                  <i :class="doc.icon"></i>
                </div>
                <div>
                  <p class="text-sm font-medium text-neutral-800">{{ doc.nama }}</p>
                  <p class="text-xs text-neutral-500">
                    {{ doc.ukuran }} • Ditambahkan {{ doc.tanggal }}
                  </p>
                </div>
              </div>

              <button
                class="text-neutral-400 hover:text-neutral-600"
                @click="previewDokumen(doc)"
                title="Pratinjau"
              >
                <i class="pi pi-eye"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Preview dokumen -->
        <div class="card p-0 overflow-hidden relative">
          <div class="preview-box">
            <span v-if="!activePreview" class="text-neutral-400 text-sm">
              Pilih dokumen untuk pratinjau
            </span>
            <img
              v-else-if="activePreview.icon !== 'pi pi-file-pdf'"
              :src="`/dummy-preview/${activePreview.nama}`"
              :alt="activePreview.nama"
              class="preview-image"
              @error="$event.target.style.display = 'none'"
            />
            <span v-else class="text-neutral-400 text-sm">Preview PDF tidak tersedia</span>
          </div>

          <AppButton
            v-if="activePreview"
            :label="`Pratinjau ${activePreview.nama.split('_')[0]}`"
            icon="pi pi-search"
            variant="light"
            size="small"
            class="preview-badge"
          />
        </div>
      </div>

      <!-- Kolom kanan: catatan, tindakan, status -->
      <div class="flex flex-col gap-4">
        <!-- Catatan Verifikator -->
        <div class="card p-4">
          <h2 class="font-semibold text-neutral-800 mb-2">Catatan Verifikator</h2>
          <label class="field-label mb-1 block">Tambahkan catatan untuk pemohon (opsional)</label>
          <textarea
            v-model="catatan"
            rows="4"
            class="app-textarea"
            placeholder="Tuliskan alasan penolakan atau catatan tambahan di sini..."
          ></textarea>
        </div>

        <!-- Tindakan -->
        <div class="card p-4">
          <h2 class="font-semibold text-neutral-800 mb-2">Tindakan</h2>
          <p class="text-sm text-neutral-500 mb-4">
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
        <div class="card p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold text-neutral-800">Status Saat Ini</h2>
            <button class="text-neutral-400 hover:text-neutral-600">
              <i class="pi pi-ellipsis-h"></i>
            </button>
          </div>

          <Tag :value="statusSaatIni.toUpperCase()" :severity="statusColor[statusSaatIni]" />

          <p class="field-label mt-4 mb-1">Diverifikasi Oleh</p>
          <div class="flex items-center gap-2">
            <div class="avatar-circle">
              <i class="pi pi-user text-xs"></i>
            </div>
            <span class="text-sm text-neutral-700">{{ diverifikasiOleh }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.field-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-neutral-500, #6b7280);
}

.field-value {
  font-size: 0.9rem;
  color: var(--color-neutral-800, #1f2937);
}

.doc-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--color-neutral-100, #f3f4f6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-neutral-500, #6b7280);
}

.preview-box {
  min-height: 220px;
  background: var(--color-neutral-200, #e5e7eb);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 320px;
  object-fit: contain;
}

.preview-badge {
  position: absolute;
  top: 12px;
  right: 12px;
}

.app-textarea {
  width: 100%;
  border: 1px solid var(--color-neutral-300, #d1d5db);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.875rem;
  resize: vertical;
  outline: none;
}

.app-textarea:focus {
  border-color: var(--color-primary-500, #2f6690);
}

.avatar-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-neutral-200, #e5e7eb);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-neutral-600, #4b5563);
}
</style>