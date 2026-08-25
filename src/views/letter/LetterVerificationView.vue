<script setup>
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

    // Arahkan ke daftar Otorisasi, bawa requestId lewat query supaya baris
    // surat ini bisa di-highlight (blink) di sana agar admin langsung tahu
    // surat mana yang baru saja diverifikasi.
    router.push({ name: 'letter-authorization', query: { highlight: record.value.requestId } })
  } finally {
    loading.value = false
  }
}

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
 * Susun pesan penolakan yang akan dikirim ke pemohon lewat WhatsApp.
 */
function buatPesanPenolakan(rec, alasan) {
  const nama = rec.citizenName || 'Bapak/Ibu'
  return (
    `Halo ${nama},\n\n` +
    `Kami informasikan bahwa permohonan *${rec.purpose}* Anda ` +
    `(No. Permohonan: ${rec.requestId}) yang diajukan pada ${rec.date} ` +
    `telah *DITOLAK*.\n\n` +
    `Alasan penolakan:\n${alasan}\n\n` +
    `Untuk informasi lebih lanjut atau pengajuan ulang, silakan hubungi ` +
    `kantor kelurahan/kecamatan setempat.\n\n` +
    `Terima kasih.`
  )
}

async function tolakPermohonan() {
  if (!record.value) return

  if (!catatan.value.trim()) {
    toast.add({ severity: 'warn', summary: 'Isi catatan alasan penolakan terlebih dahulu', life: 2500 })
    return
  }

  const nomorWa = formatNomorWa(record.value.citizenPhone)
  if (!nomorWa) {
    toast.add({
      severity: 'error',
      summary: 'Nomor WhatsApp pemohon tidak tersedia',
      detail: 'Tidak bisa mengirim notifikasi penolakan tanpa nomor telepon.',
      life: 3000,
    })
    return
  }

  loading.value = true
  try {
    const pesan = buatPesanPenolakan(record.value, catatan.value.trim())
    const waUrl = `https://wa.me/${nomorWa}?text=${encodeURIComponent(pesan)}`

    // Buka tab WhatsApp berisi pesan penolakan yang sudah terisi otomatis,
    // diarahkan langsung ke nomor WA pemohon.
    const waTab = window.open(waUrl, '_blank', 'noopener,noreferrer')

    if (!waTab) {
      // Popup diblokir browser -- batalkan proses, jangan ubah status
      // supaya admin tidak menyangka notifikasi sudah terkirim.
      toast.add({
        severity: 'error',
        summary: 'Gagal membuka WhatsApp',
        detail: 'Popup diblokir browser. Izinkan popup untuk domain ini lalu coba lagi.',
        life: 3500,
      })
      return
    }

    // TODO: panggil surat.service.js -> rejectSurat(requestId, { catatan })
    // (idealnya status pengiriman WA juga dicatat di backend, mis. via
    // provider WA Business API, bukan hanya wa.me di sisi client)
    updateStatus(requestId.value, {
      status: 'Ditolak',
      verifiedBy: currentAdminName,
      notes: catatan.value,
    })

    toast.add({
      severity: 'success',
      summary: 'Notifikasi WhatsApp terkirim & permohonan ditolak',
      life: 2500,
    })

    // Arahkan ke daftar Pengelolaan Surat (bukan daftar Verifikasi)
    router.push('/letter/management')
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