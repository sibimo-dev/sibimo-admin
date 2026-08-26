<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Card from 'primevue/card'
import { useLetterStore } from '@/stores/useLetterStore'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { getSuratById, updateSurat } = useLetterStore()

const suratId = route.params.id
const surat = computed(() => getSuratById(suratId))

const statusMeta = {
  Pending: { label: 'Pending', severity: 'warn' },
  Diverifikasi: { label: 'Menunggu Otorisasi', severity: 'info' },
  Disetujui: { label: 'Disetujui', severity: 'success' },
  Ditolak: { label: 'Ditolak', severity: 'danger' },
}

// ====== Dummy info verifikasi (belum ada tabel histori verifikasi di backend) ======
const verifikasi = ref({
  jabatan: 'Kasi Pemerintahan',
  waktu: '-',
  catatan: 'Dokumen lengkap dan sesuai.',
})

// ====== 1. Pilih Penandatangan ======
// TODO: ganti dengan data pejabat sungguhan (User Management / Profil Desa)
const signerOptions = [
  { value: 'kepala_desa', nama: 'Ahmad Hidayat', jabatan: 'Kepala Desa (Lurah)' },
  { value: 'sekretaris_desa', nama: 'Budi Wijaya', jabatan: 'Sekretaris Desa (Carik)' },
]
const selectedSignerId = ref(null)
const selectedSigner = computed(
  () => signerOptions.find((s) => s.value === selectedSignerId.value) || null,
)

// ====== 2. Pilih Jenis Tanda Tangan ======
const signatureTypeOptions = [
  { value: 'digital', label: 'Tanda Tangan Digital (TTE / Barcode)' },
  { value: 'basah', label: 'Tanda Tangan Basah (Manual + Cap Desa)' },
]
const selectedSignatureType = ref(null)

// ====== 3. Keputusan & simpan ======
const statusOptions = [
  { value: 'Diverifikasi', label: 'Menunggu Otorisasi' },
  { value: 'Disetujui', label: 'Disetujui' },
]
const selectedStatus = ref(surat.value?.status || 'Diverifikasi')

// Kalau surat berubah (mis. navigasi antar id), sinkronkan ulang pilihan status awal
watch(surat, (val) => {
  if (val) selectedStatus.value = val.status
})

const isSaving = ref(false)
const isFinalized = ref(false) // true setelah "Simpan Perubahan" berhasil, mengaktifkan tombol notifikasi

/**
 * Ubah nomor telepon lokal (08xxx / +62xxx / 62xxx) ke format
 * internasional tanpa simbol, sesuai kebutuhan link wa.me (mis. 6281234500005).
 */
function formatNomorWa(nomor) {
  if (!nomor) return null
  let digits = String(nomor).replace(/\D/g, '')
  if (!digits) return null

  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1)
  } else if (!digits.startsWith('62')) {
    digits = '62' + digits
  }

  // Nomor telepon Indonesia yang valid minimal ~10 digit total (termasuk 62).
  // Kalau kurang dari itu, anggap nomornya tidak valid daripada nekat kirim
  // ke tujuan yang salah/ambigu.
  if (digits.length < 10) return null

  return digits
}

/**
 * Susun pesan pemberitahuan bahwa surat sudah selesai/disetujui,
 * dikirim ke pemohon lewat WhatsApp. Isi pesan menyesuaikan jenis TTD:
 * - Digital (TTE/Barcode): softfile sudah SAH & bisa langsung dipakai,
 *   pemohon tinggal ambil hardfile (cetakan fisik) ke kantor kalau perlu.
 * - Manual (Basah): softfile dikirim untuk DICETAK SENDIRI oleh pemohon,
 *   lalu dibawa ke kantor kelurahan/kecamatan untuk ditandatangani &
 *   dicap secara manual.
 */
function buatPesanSelesai(rec, signer, signatureType) {
  const nama = rec.citizenName || 'Bapak/Ibu'
  const nomorSuratLine = rec.letterNumber ? `\nNomor Surat: ${rec.letterNumber}` : ''
  const penandatangan = signer?.jabatan || 'pejabat berwenang'

  // TODO: ganti dengan link unduh PDF asli begitu backend penyimpanan/
  // generate dokumen surat sudah tersedia. Untuk sekarang masih placeholder.
  const linkSoftfile = `https://sibimo.example.id/surat/unduh/${rec.requestId}`

  const instruksi =
    signatureType === 'Digital'
      ? `Berikut softfile surat Anda (sudah *ditandatangani secara digital/TTE* & SAH):\n` +
        `${linkSoftfile}\n\n` +
        `Surat ini sudah bisa langsung digunakan. Kalau butuh versi cetak (hardfile), ` +
        `silakan datang ke kantor kelurahan/kecamatan untuk mengambilnya.`
      : `Berikut softfile surat Anda:\n${linkSoftfile}\n\n` +
        `Karena surat ini memakai *tanda tangan basah (manual + cap desa)*, mohon dicetak ` +
        `terlebih dahulu, lalu datang ke kantor kelurahan/kecamatan untuk proses tanda ` +
        `tangan dan cap resmi.`

  return (
    `Halo ${nama},\n\n` +
    `Kabar baik! Pengajuan *${rec.purpose}* Anda ` +
    `(No. Permohonan: ${rec.requestId})${nomorSuratLine} telah *SELESAI* diproses ` +
    `dan *DISETUJUI*.\n\n` +
    `Surat sudah ditandatangani oleh ${penandatangan}.\n\n` +
    `${instruksi}\n\n` +
    `Terima kasih.`
  )
}

/**
 * Buka tab WhatsApp berisi pesan "surat selesai/disetujui" ke nomor pemohon.
 * Return true kalau tab berhasil dibuka, false kalau gagal (nomor kosong
 * atau popup diblokir browser).
 */
function bukaWaNotifikasiSelesai() {
  if (!surat.value) return false

  const nomorWa = formatNomorWa(surat.value.citizenPhone)
  if (!nomorWa) {
    toast.add({
      severity: 'error',
      summary: 'Nomor WhatsApp pemohon tidak tersedia',
      detail: 'Tidak bisa mengirim notifikasi tanpa nomor telepon.',
      life: 3000,
    })
    return false
  }

  const pesan = buatPesanSelesai(surat.value, selectedSigner.value, surat.value.signatureType)
  const waUrl = `https://wa.me/${nomorWa}?text=${encodeURIComponent(pesan)}`
  const waTab = window.open(waUrl, '_blank', 'noopener,noreferrer')
  return !!waTab
}

async function simpanPerubahan() {
  if (!surat.value) return

  if (selectedStatus.value === 'Disetujui' && (!selectedSignerId.value || !selectedSignatureType.value)) {
    toast.add({
      severity: 'warn',
      summary: 'Lengkapi dulu',
      detail: 'Pilih penandatangan dan jenis tanda tangan sebelum menyetujui surat.',
      life: 3000,
    })
    return
  }

  isSaving.value = true
  try {
    // TODO: panggil API update status/otorisasi di sini
    await new Promise((r) => setTimeout(r, 500))

    const signatureTypeLabel = selectedSignatureType.value === 'digital' ? 'Digital' : 'Manual'
    updateSurat(suratId, {
      status: selectedStatus.value,
      authorizedBy: selectedStatus.value === 'Disetujui' ? selectedSigner.value?.jabatan : '-',
      signatureType: selectedStatus.value === 'Disetujui' ? signatureTypeLabel : surat.value.signatureType,
    })

    isFinalized.value = true
    toast.add({ severity: 'success', summary: 'Perubahan tersimpan', life: 2000 })
  } finally {
    isSaving.value = false
  }
}

function kirimNotifikasi() {
  const terkirim = bukaWaNotifikasiSelesai()

  if (!terkirim) {
    toast.add({
      severity: 'error',
      summary: 'Gagal membuka WhatsApp',
      detail: 'Popup diblokir browser atau nomor WA pemohon tidak tersedia.',
      life: 3500,
    })
    return
  }

  toast.add({
    severity: 'success',
    summary: 'Notifikasi terkirim',
    detail: 'Pemohon telah diberi tahu mengenai status surat ini.',
    life: 2500,
  })
  router.push({ name: 'letter-list' })
}

function goBackToList() {
  router.push({ name: 'letter-authorization' })
}

// ====== Pratinjau dokumen (live, ikut berubah begitu penandatangan/jenis TTD dipilih) ======
const previewSignerName = computed(() => selectedSigner.value?.nama || '(Belum dipilih)')
const previewSignerJabatan = computed(() => selectedSigner.value?.jabatan || 'Penandatangan')
const displayLetterNumber = computed(
  () => surat.value?.letterNumber || 'Belum diterbitkan (menunggu otorisasi)',
)
const todayDisplay = new Date().toLocaleDateString('id-ID', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})
</script>

<template>
  <div class="p-4 md:p-6">
    <!-- Surat tidak ditemukan -->
    <div v-if="!surat" class="text-center py-20">
      <p class="text-slate-500 mb-4">Surat dengan ID tersebut tidak ditemukan.</p>
      <Button label="Kembali ke Daftar Otorisasi" @click="goBackToList" />
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex items-center gap-3 mb-5">
        <button
          class="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          @click="goBackToList"
        >
          <i class="pi pi-arrow-left"></i>
        </button>
        <h1 class="text-2xl font-bold text-gray-800 m-0">{{ surat.requestId }}</h1>
        <Tag :value="statusMeta[surat.status].label" :severity="statusMeta[surat.status].severity" rounded />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-start">
        <!-- ==================== KOLOM KIRI ==================== -->
        <div class="flex flex-col gap-5">
          <!-- Hasil Verifikasi -->
          <Card>
            <template #title>
              <span class="flex items-center gap-2 text-base font-semibold">
                <i class="pi pi-check-circle text-green-500"></i> Hasil Verifikasi
              </span>
            </template>
            <template #content>
              <div class="mb-4">
                <div class="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                  Diverifikasi Oleh
                </div>
                <div class="text-sm font-semibold text-gray-800">{{ surat.verifiedBy }}</div>
                <div class="text-sm text-gray-500">{{ verifikasi.jabatan }}</div>
              </div>

              <div>
                <div class="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                  Catatan Verifikator
                </div>
                <div class="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-600">
                  {{ verifikasi.catatan }}
                </div>
              </div>
            </template>
          </Card>

          <!-- Detail Otorisasi TERSIMPAN -- pakai <div> polos (lihat catatan sebelumnya
               soal PrimeVue Card tema warna), menampilkan status yang SUDAH disimpan,
               bukan sekadar pilihan sementara di form di bawah. -->
          <div class="bg-gray-800 text-gray-50 rounded-xl p-5 shadow-sm">
            <span class="flex items-center gap-2 text-base font-semibold text-gray-50">
              <i class="pi pi-key text-gray-300"></i> Detail Otorisasi
            </span>

            <div class="mt-4 mb-4">
              <div class="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                Otorisator (Authorized By)
              </div>
              <div class="text-sm font-semibold text-gray-50">
                {{ surat.authorizedBy && surat.authorizedBy !== '-' ? surat.authorizedBy : 'Belum diotorisasi' }}
              </div>
            </div>

            <div>
              <div class="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                Tipe Tanda Tangan
              </div>
              <div class="text-sm flex items-center gap-1.5 text-gray-50">
                <i class="pi pi-verified text-green-400"></i>
                {{ surat.status === 'Disetujui' ? surat.signatureType : '-' }}
              </div>
            </div>
          </div>

          <!-- Status & Tindakan -->
          <Card>
            <template #title>
              <span class="text-base font-semibold">Status &amp; Tindakan</span>
            </template>
            <template #content>
              <!-- 1. Pilih penandatangan -->
              <label class="block text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                1. Pilih Penandatangan
              </label>
              <Select
                v-model="selectedSignerId"
                :options="signerOptions"
                option-label="jabatan"
                option-value="value"
                placeholder="Pilih penandatangan"
                class="w-full mb-4"
              />

              <!-- 2. Pilih jenis tanda tangan -->
              <label class="block text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                2. Jenis Tanda Tangan
              </label>
              <Select
                v-model="selectedSignatureType"
                :options="signatureTypeOptions"
                option-label="label"
                option-value="value"
                placeholder="Pilih jenis tanda tangan"
                class="w-full mb-4"
              />

              <!-- 3. Keputusan -->
              <label class="block text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                3. Keputusan
              </label>
              <Select
                v-model="selectedStatus"
                :options="statusOptions"
                option-label="label"
                option-value="value"
                class="w-full mb-4"
              />

              <Button
                label="Simpan Perubahan"
                class="w-full mb-2.5"
                severity="contrast"
                :loading="isSaving"
                @click="simpanPerubahan"
              />

              <Button
                label="Kirim Notifikasi ke Pemohon"
                icon="pi pi-send"
                class="w-full"
                severity="secondary"
                outlined
                :disabled="!isFinalized && surat.authorizedBy === '-'"
                @click="kirimNotifikasi"
              />
              <p v-if="!isFinalized && surat.authorizedBy === '-'" class="text-xs text-gray-400 mt-2">
                Simpan keputusan otorisasi dulu sebelum mengirim notifikasi.
              </p>
              <p v-else class="text-xs text-gray-400 mt-2">
                Klik tombol ini untuk membuka WhatsApp dan mengirim notifikasi ke nomor pemohon.
              </p>
            </template>
          </Card>
        </div>

        <!-- ==================== KOLOM KANAN: PRATINJAU (LIVE) ==================== -->
        <div>
          <Card>
            <template #title>
              <span class="flex items-center gap-2 text-base font-semibold">
                <i class="pi pi-file text-gray-500"></i> Pratinjau Dokumen
              </span>
            </template>
            <template #content>
              <div class="bg-white border border-gray-200 rounded-lg px-10 py-10 text-[13.5px] leading-relaxed text-gray-800">
                <div class="text-center text-2xl mb-2">
                  <i class="pi pi-shield text-gray-400"></i>
                </div>

                <h3 class="text-center text-lg font-bold tracking-wide uppercase m-0 mb-1">
                  {{ surat.purpose }}
                </h3>
                <p class="text-center text-xs text-gray-500 mb-6">
                  Nomor: {{ displayLetterNumber }}
                </p>

                <p class="my-4">
                  Yang bertanda tangan di bawah ini
                  <span class="font-medium">{{ previewSignerJabatan }}</span>, dengan ini
                  menerangkan bahwa:
                </p>

                <div class="grid grid-cols-[110px_12px_1fr] mb-1">
                  <span class="text-gray-700">Nama</span>
                  <span>:</span>
                  <span class="font-semibold">{{ surat.citizenName || '-' }}</span>
                </div>
                <div class="grid grid-cols-[110px_12px_1fr] mb-1">
                  <span class="text-gray-700">NIK</span>
                  <span>:</span>
                  <span>{{ surat.citizenId }}</span>
                </div>
                <div class="grid grid-cols-[110px_12px_1fr] mb-1">
                  <span class="text-gray-700">Alamat</span>
                  <span>:</span>
                  <span>{{ surat.address || '-' }}</span>
                </div>

                <p class="my-4" v-if="surat.notes">Catatan: {{ surat.notes }}</p>

                <p class="my-4">
                  Demikian surat ini dibuat untuk dipergunakan sebagaimana mestinya.
                </p>

                <div class="mt-8 text-right">
                  <p class="m-0">Desa Harapan Makmur, {{ todayDisplay }}</p>
                  <p class="m-0">{{ previewSignerJabatan }}</p>

                  <!-- Area tanda tangan -- berubah sesuai jenis TTD yang dipilih -->
                  <div
                    v-if="selectedSignatureType === 'digital'"
                    class="ml-auto mt-3 mb-3 w-[200px] h-[90px] border border-dashed border-indigo-300 bg-indigo-50 rounded-lg flex flex-col items-center justify-center text-center text-[11px] text-indigo-500 gap-1"
                  >
                    <i class="pi pi-qrcode text-lg"></i>
                    Tanda Tangan Digital (TTE)
                    <span class="text-[10px] text-indigo-400">Barcode digenerate otomatis</span>
                  </div>
                  <div
                    v-else-if="selectedSignatureType === 'basah'"
                    class="ml-auto mt-3 mb-3 w-[200px] h-[90px] border border-dashed border-amber-300 bg-amber-50 rounded-lg flex flex-col items-center justify-center text-center text-[11px] text-amber-600 gap-1"
                  >
                    <i class="pi pi-pencil text-lg"></i>
                    Tanda Tangan Basah
                    <span class="text-[10px] text-amber-500">Dicetak & ditandatangani manual + cap desa</span>
                  </div>
                  <div
                    v-else
                    class="ml-auto mt-3 mb-3 w-[200px] h-[90px] border border-dashed border-gray-300 bg-gray-50 rounded-lg flex items-center justify-center text-center text-[11px] text-gray-400 px-3"
                  >
                    Pilih penandatangan &amp; jenis TTD di kolom kiri
                  </div>

                  <p class="font-bold underline m-0">{{ previewSignerName }}</p>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>