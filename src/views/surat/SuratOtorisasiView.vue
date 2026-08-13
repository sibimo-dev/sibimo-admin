<script setup>
/**
 * Halaman Otorisasi Surat.
 * Ganti dummyData dengan data asli dari surat.service.js (detail per requestId) begitu backend siap.
 */
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import Tag from 'primevue/tag'
import Select from 'primevue/select'
import AppButton from '@/components/common/AppButton.vue'

const route = useRoute()

// Ref ke elemen pratinjau surat -- dipakai untuk di-capture jadi PDF
const previewRef = ref(null)
const downloading = ref(false)

// requestId diambil dari route param, fallback ke dummy kalau diakses langsung
const requestId = computed(() => route.params.id || 'SKU-20231024-001')

// Status permohonan saat ini
const statusSaatIni = ref('Menunggu Otorisasi')
const statusColor = {
  'Menunggu Verifikasi': 'warn',
  'Menunggu Otorisasi': 'info',
  Selesai: 'success',
  Ditolak: 'danger',
}

// Dummy data -- ganti dengan hasil fetch detail permohonan dari backend
const hasilVerifikasi = ref({
  diverifikasiOleh: 'Siti Aminah',
  jabatan: 'Kasi Pemerintahan',
  waktuVerifikasi: '24 Okt 2023, 10:30 WIB',
  catatan: 'Dokumen lengkap dan sesuai. Lokasi usaha sudah ditinjau.',
})

const detailOtorisasi = ref({
  otorisator: 'Ahmad Hidayat',
  jabatan: 'Kepala Desa',
  tipeTandaTangan: 'Tanda Tangan Digital (TTE)',
})

const dokumen = ref({
  nomorSurat: '581/015/Desa-XI/2023',
  namaPemohon: 'Budi Santoso',
  nik: '3201010101010001',
  alamat: 'Jl. Merdeka No. 45, RT 02/RW 03',
  namaUsaha: 'Warung Sembako Makmur',
  bidang: 'Perdagangan',
  tempatTanggal: 'Desa Harapan Makmur, 24 Oktober 2023',
  penandaTangan: 'Ahmad Hidayat',
})

// Status & Tindakan
const statusOptions = [
  { label: 'Selesai', value: 'Selesai' },
  { label: 'Ditolak', value: 'Ditolak' },
]
const selectedStatus = ref('Selesai')
const loading = ref(false)

async function simpanPerubahan() {
  loading.value = true
  try {
    // TODO: panggil surat.service.js -> updateStatusOtorisasi(requestId.value, selectedStatus.value)
    console.log('Simpan perubahan status', requestId.value, selectedStatus.value)
  } finally {
    loading.value = false
  }
}

async function kirimNotifikasi() {
  loading.value = true
  try {
    // TODO: panggil surat.service.js -> kirimNotifikasi(requestId.value)
    console.log('Kirim notifikasi', requestId.value)
  } finally {
    loading.value = false
  }
}

/**
 * Generate PDF asli dari elemen pratinjau surat lalu langsung diunduh browser.
 * Butuh dua package tambahan -- install dulu:
 *   npm install html2canvas jspdf
 *
 * Kalau nanti backend sudah bisa generate PDF sendiri (lebih rapi untuk
 * dokumen resmi ber-tanda-tangan), fungsi ini tinggal diganti jadi
 * pemanggilan surat.service.js -> unduhDraftSurat(requestId.value) yang
 * me-return file dari server.
 */
async function unduhDraft() {
  if (!previewRef.value) return

  downloading.value = true
  try {
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])

    const canvas = await html2canvas(previewRef.value, {
      scale: 2, // resolusi lebih tinggi biar teks tidak buram
      useCORS: true,
      backgroundColor: '#ffffff',
    })

    const imgData = canvas.toDataURL('image/png')

    // Halaman A4 potret dalam satuan mm
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    // Skalakan gambar biar pas lebar halaman, jaga rasio aspek
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Kalau kontennya lebih panjang dari 1 halaman A4, sambung ke halaman berikutnya
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(`Draft-${requestId.value}.pdf`)
  } catch (err) {
    console.error('Gagal membuat PDF draft:', err)
  } finally {
    downloading.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-4">
      <h1 class="page-title mb-0">ID: {{ requestId }}</h1>
    </div>
    <Tag :value="statusSaatIni" :severity="statusColor[statusSaatIni]" class="mb-4" />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Kolom kiri: Hasil Verifikasi, Detail Otorisasi, Status & Tindakan -->
      <div class="flex flex-col gap-4">
        <!-- Hasil Verifikasi -->
        <div class="card p-4">
          <h2 class="section-title">
            <i class="pi pi-check-circle text-success-500"></i>
            Hasil Verifikasi
          </h2>

          <p class="field-label mt-3">Diverifikasi Oleh</p>
          <p class="field-value font-semibold">{{ hasilVerifikasi.diverifikasiOleh }}</p>
          <p class="text-xs text-neutral-500">{{ hasilVerifikasi.jabatan }}</p>

          <p class="field-label mt-3">Waktu Verifikasi</p>
          <p class="field-value">{{ hasilVerifikasi.waktuVerifikasi }}</p>

          <p class="field-label mt-3">Catatan Verifikator</p>
          <div class="note-box">{{ hasilVerifikasi.catatan }}</div>
        </div>

        <!-- Detail Otorisasi -->
        <div class="card p-4 detail-otorisasi">
          <h2 class="section-title-dark">
            <i class="pi pi-key"></i>
            Detail Otorisasi
          </h2>

          <p class="field-label-dark mt-3">Otorisator (Authorized By)</p>
          <p class="field-value-dark font-semibold">{{ detailOtorisasi.otorisator }}</p>
          <p class="text-xs text-neutral-300">{{ detailOtorisasi.jabatan }}</p>

          <p class="field-label-dark mt-3">Tipe Tanda Tangan</p>
          <p class="field-value-dark">
            <i class="pi pi-shield mr-1"></i>{{ detailOtorisasi.tipeTandaTangan }}
          </p>
        </div>

        <!-- Status & Tindakan -->
        <div class="card p-4">
          <h2 class="section-title">Status & Tindakan</h2>

          <label class="field-label mt-3 mb-1 block">Ubah Status</label>
          <Select
            v-model="selectedStatus"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            class="w-full"
          />

          <AppButton
            label="Simpan Perubahan"
            variant="dark"
            class="w-full mt-3"
            :loading="loading"
            @click="simpanPerubahan"
          />
          <AppButton
            label="Kirim Notifikasi"
            icon="pi pi-send"
            variant="outline"
            class="w-full mt-2"
            :loading="loading"
            @click="kirimNotifikasi"
          />
        </div>
      </div>

      <!-- Kolom kanan: Pratinjau Dokumen -->
      <div class="lg:col-span-2">
        <div class="card p-0 overflow-hidden">
          <div class="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <h2 class="section-title mb-0">
              <i class="pi pi-file"></i>
              Pratinjau Dokumen
            </h2>
            <button
              class="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1 disabled:opacity-50"
              :disabled="downloading"
              @click="unduhDraft"
            >
              <i :class="downloading ? 'pi pi-spin pi-spinner' : 'pi pi-download'"></i>
              {{ downloading ? 'Menyiapkan PDF...' : 'Unduh Draft' }}
            </button>
          </div>

          <div ref="previewRef" class="p-8 surat-preview">
            <div class="text-center mb-6">
              <div class="stamp-placeholder mx-auto mb-3"></div>
              <h3 class="surat-title">SURAT KETERANGAN USAHA</h3>
              <p class="text-sm text-neutral-500">Nomor: {{ dokumen.nomorSurat }}</p>
            </div>

            <p class="text-sm mb-4">
              Yang bertanda tangan di bawah ini Kepala Desa, dengan ini menerangkan bahwa:
            </p>

            <table class="surat-table mb-4">
              <tr>
                <td class="w-32">Nama</td>
                <td>: {{ dokumen.namaPemohon }}</td>
              </tr>
              <tr>
                <td>NIK</td>
                <td>: {{ dokumen.nik }}</td>
              </tr>
              <tr>
                <td>Alamat</td>
                <td>: {{ dokumen.alamat }}</td>
              </tr>
            </table>

            <p class="text-sm mb-4">
              Adalah benar penduduk yang berdomisili di alamat tersebut di atas dan saat ini memiliki usaha:
            </p>

            <table class="surat-table mb-4">
              <tr>
                <td class="w-32">Nama Usaha</td>
                <td>: {{ dokumen.namaUsaha }}</td>
              </tr>
              <tr>
                <td>Bidang</td>
                <td>: {{ dokumen.bidang }}</td>
              </tr>
            </table>

            <p class="text-sm mb-6">
              Demikian surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.
            </p>

            <div class="text-right">
              <p class="text-sm">{{ dokumen.tempatTanggal }}</p>
              <p class="text-sm mb-1">Kepala Desa</p>
              <div class="signature-box ml-auto"></div>
              <p class="text-sm font-semibold underline">{{ dokumen.penandaTangan }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--color-neutral-800, #1f2937);
  font-size: 0.95rem;
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

.note-box {
  margin-top: 4px;
  background: var(--color-neutral-100, #f3f4f6);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.85rem;
  color: var(--color-neutral-700, #374151);
}

/* Detail Otorisasi - kartu gelap */
.detail-otorisasi {
  background: var(--color-neutral-800, #1f2937);
  color: white;
}

/* Header khusus di atas background gelap -- dibuat class terpisah
   (bukan pakai utility text-white) supaya tidak ketiban warna
   .section-title yang sudah hardcode neutral-800 */
.section-title-dark {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: white;
  font-size: 0.95rem;
}

.field-label-dark {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-neutral-400, #9ca3af);
}

.field-value-dark {
  font-size: 0.9rem;
  color: white;
}

/* Pratinjau Dokumen */
.surat-preview {
  background: white;
  font-family: 'Times New Roman', serif;
}

.stamp-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid var(--color-neutral-300, #d1d5db);
  background: var(--color-neutral-50, #f9fafb);
}

.surat-title {
  font-size: 1.1rem;
  font-weight: 700;
  text-decoration: underline;
  letter-spacing: 0.5px;
}

.surat-table td {
  font-size: 0.875rem;
  padding: 2px 8px 2px 0;
  vertical-align: top;
}

.signature-box {
  width: 140px;
  height: 70px;
  border: 1px dashed var(--color-neutral-300, #d1d5db);
  background: var(--color-info-50, #eff6ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: var(--color-neutral-400, #9ca3af);
  margin-bottom: 8px;
}
</style>