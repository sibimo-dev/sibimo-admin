<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import AppButton from '@/components/common/AppButton.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import { useLetterStore } from '@/stores/useLetterStore'
import { useLetterTypeStore } from '@/stores/useLetterTypeStore'
import { downloadLetterPdf, getLetterPdf } from '@/services/letter-request.service'
import { mediaUrl } from '@/services/media'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const letterStore = useLetterStore()
const typeStore = useLetterTypeStore()

const record = ref(null)
const selectedSignerId = ref(null)
const signatureType = ref('manual')
const statusValue = ref('verified')
const loading = ref(true)
const saving = ref(false)
const downloading = ref(false)

const statusMeta = {
  submitted: 'Menunggu Verifikasi',
  verified: 'Menunggu Otorisasi',
  authorized: 'Disetujui',
  completed: 'Selesai',
  rejected: 'Ditolak',
}

const signerOptions = computed(() =>
  typeStore.signers.value.map((signer) => ({
    value: signer.staff_id,
    label: `${signer.name} - ${signer.position}`,
  })),
)
const signatureOptions = [
  { value: 'digital', label: 'Tanda Tangan Digital (TTE)' },
  { value: 'manual', label: 'Tanda Tangan Manual + Cap Desa' },
]
const statusOptions = computed(() => {
  const options = [
    { value: 'verified', label: statusMeta.verified },
    { value: 'authorized', label: statusMeta.authorized },
  ]
  const current = record.value?.backendStatus
  if (current && !options.some((option) => option.value === current)) {
    options.push({ value: current, label: statusMeta[current] ?? current })
  }
  return options
})

const canAuthorize = computed(() => record.value?.backendStatus === 'verified')
const isAuthorized = computed(() =>
  ['authorized', 'completed'].includes(record.value?.backendStatus),
)

const selectedSigner = computed(
  () => typeStore.signers.value.find((s) => s.staff_id === selectedSignerId.value) ?? null,
)

// Gambar TTD milik penandatangan terpilih (hanya relevan untuk TTD digital).
const signatureImageUrl = computed(() =>
  selectedSigner.value?.signature_image ? mediaUrl(selectedSigner.value.signature_image) : '',
)

// TTD digital butuh gambar TTD milik penandatangan; TTD manual dikosongkan untuk tanda tangan basah.
const missingSignatureImage = computed(
  () =>
    signatureType.value === 'digital' &&
    !!selectedSigner.value &&
    !selectedSigner.value.signature_image,
)

const verifierName = computed(() => {
  const name = record.value?.verifiedBy
  return name && name !== '-' ? name : '-'
})
const verifierRole = computed(() => {
  const role = record.value?.verifier?.role
  if (!role) return ''
  const text = String(role).replace(/[_-]+/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
})

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  const day = date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
  const time = date
    .toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    })
    .replace('.', ':')
  return `${day}, ${time} WIB`
}

const signerName = computed(() => {
  if (isAuthorized.value && record.value?.authorizedBy !== '-') return record.value.authorizedBy
  return selectedSigner.value?.name ?? ''
})
const signerPosition = computed(() => {
  if (isAuthorized.value && record.value?.authorized_signer?.position) {
    return record.value.authorized_signer.position
  }
  return selectedSigner.value?.position ?? ''
})
const signatureLabel = computed(
  () => signatureOptions.find((option) => option.value === signatureType.value)?.label ?? '-',
)

// Pratinjau = PDF hasil render template blade di backend (resources/views/letters).
const previewUrl = ref('')
const previewLoading = ref(false)
const previewError = ref('')

async function readErrorMessage(error) {
  const data = error.response?.data
  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text()).message
    } catch {
      return ''
    }
  }
  return data?.message ?? ''
}

async function loadPreview() {
  if (!record.value) return
  previewLoading.value = true
  previewError.value = ''
  try {
    const blob = await getLetterPdf(record.value.id)
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = URL.createObjectURL(blob)
  } catch (error) {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
    previewError.value =
      (await readErrorMessage(error)) || 'Pratinjau dokumen gagal dimuat.'
  } finally {
    previewLoading.value = false
  }
}

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

onMounted(async () => {
  try {
    await typeStore.fetchSigners()
    record.value = await letterStore.fetchById(route.params.id)
    selectedSignerId.value =
      record.value?.authorized_by_signer_id ?? record.value?.letter_type?.signer_id ?? null
    signatureType.value = record.value?.signature_type ?? 'manual'
    statusValue.value = record.value?.backendStatus ?? 'verified'
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal memuat detail otorisasi', life: 3000 })
  } finally {
    loading.value = false
  }
  loadPreview()
})

async function save() {
  if (!record.value) return
  if (!canAuthorize.value) return

  if (statusValue.value !== 'authorized') {
    toast.add({ severity: 'info', summary: 'Tidak ada perubahan status', life: 2000 })
    return
  }
  if (!selectedSignerId.value) {
    toast.add({ severity: 'warn', summary: 'Pilih penandatangan terlebih dahulu', life: 2500 })
    return
  }
  if (missingSignatureImage.value) {
    toast.add({
      severity: 'warn',
      summary: 'Penandatangan belum punya gambar TTD digital',
      detail: 'Unggah gambar TTD-nya dulu atau pilih tanda tangan manual.',
      life: 3500,
    })
    return
  }

  saving.value = true
  try {
    record.value = await letterStore.authorizeSurat(record.value.id, {
      status: 'authorized',
      authorized_by_signer_id: selectedSignerId.value,
      signature_type: signatureType.value,
    })
    statusValue.value = record.value.backendStatus
    toast.add({ severity: 'success', summary: 'Surat berhasil diotorisasi', life: 2200 })
    loadPreview()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Otorisasi gagal',
      detail: error.response?.data?.message ?? 'Periksa status request.',
      life: 3000,
    })
  } finally {
    saving.value = false
  }
}

async function downloadDraft() {
  if (!record.value) return
  downloading.value = true
  try {
    const blob = await downloadLetterPdf(record.value.id)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${record.value.requestId || 'surat'}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal mengunduh draft',
      detail: 'Template PDF untuk tipe surat ini mungkin belum tersedia.',
      life: 3000,
    })
  } finally {
    downloading.value = false
  }
}

function normalizePhone(value) {
  if (!value) return null
  let digits = String(value).replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('0')) digits = '62' + digits.slice(1)
  else if (!digits.startsWith('62')) digits = '62' + digits
  return digits.length < 10 ? null : digits
}

function sendNotification() {
  const r = record.value
  const phone = normalizePhone(r?.citizenPhone)
  if (!phone) {
    toast.add({
      severity: 'error',
      summary: 'Nomor WhatsApp pemohon tidak tersedia',
      detail: 'Tidak bisa mengirim notifikasi tanpa nomor telepon.',
      life: 3000,
    })
    return
  }
  const number = r.letterNumber ? `\nNomor Surat: ${r.letterNumber}` : ''
  const how =
    r.signature_type === 'digital'
      ? 'Surat sudah ditandatangani secara digital (TTE) dan sah digunakan.'
      : 'Surat ini memakai tanda tangan manual + cap desa. Silakan datang ke kantor desa untuk proses tanda tangan dan cap resmi.'
  const message =
    `Halo ${r.citizenName || 'Bapak/Ibu'},\n\n` +
    `Pengajuan *${r.purpose}* Anda (No. Permohonan: ${r.requestId})${number} telah *DISETUJUI*.\n\n` +
    `${how}\n\nTerima kasih.`
  const opened = window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    '_blank',
    'noopener,noreferrer',
  )
  if (!opened) {
    toast.add({
      severity: 'error',
      summary: 'Gagal membuka WhatsApp',
      detail: 'Popup diblokir browser. Izinkan popup lalu coba lagi.',
      life: 3500,
    })
  }
}
</script>

<template>
  <div>
    <div v-if="loading" class="p-6 text-sm text-slate-500">Memuat detail...</div>

    <div v-else-if="!record" class="text-center py-20">
      <p class="text-slate-500 mb-4">Data surat tidak ditemukan.</p>
      <AppButton label="Kembali ke Daftar Otorisasi" @click="router.push('/letter/authorization')" />
    </div>

    <div v-else>
      <div class="mb-5">
        <h1 class="text-2xl font-bold text-slate-800">ID: {{ record.requestId }}</h1>
        <span
          class="mt-2 inline-flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-200 rounded-full px-2.5 py-0.5"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-slate-500" />
          {{ statusMeta[record.backendStatus] ?? record.status }}
        </span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-5 items-start">
        <!-- Kolom kiri -->
        <div class="flex flex-col gap-4">
          <section class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 class="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-4">
              <i class="pi pi-check-circle text-slate-600" />
              Hasil Verifikasi
            </h2>
            <div class="mb-3">
              <p class="text-[10px] text-slate-500">Diverifikasi Oleh</p>
              <p class="text-sm font-semibold text-slate-800">{{ verifierName }}</p>
              <p v-if="verifierRole" class="text-xs text-slate-500">{{ verifierRole }}</p>
            </div>
            <div class="mb-3">
              <p class="text-[10px] text-slate-500">Waktu Verifikasi</p>
              <p class="text-xs text-slate-800">{{ formatDateTime(record.verified_at) }}</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-500 mb-1">Catatan Verifikator</p>
              <div
                class="bg-slate-100 border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-600"
              >
                {{ record.notes || '-' }}
              </div>
            </div>
          </section>

          <section class="bg-slate-700 text-slate-50 rounded-xl p-5 shadow-sm">
            <h2 class="flex items-center gap-2 text-sm font-semibold mb-4">
              <i class="pi pi-key text-slate-300" />
              Detail Otorisasi
            </h2>
            <div class="mb-3">
              <p class="text-[10px] text-slate-300">Otorisator (Authorized By)</p>
              <p class="text-sm font-semibold">{{ signerName || 'Belum diotorisasi' }}</p>
              <p v-if="signerPosition" class="text-xs text-slate-300">{{ signerPosition }}</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-300 mb-1">Tipe Tanda Tangan</p>
              <p class="text-xs font-medium flex items-center gap-1.5">
                <i class="pi pi-verified text-slate-200" />
                {{ signatureLabel }}
              </p>
            </div>
          </section>

          <section class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 class="text-sm font-semibold text-slate-800 mb-4">Status &amp; Tindakan</h2>

            <label class="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Penandatangan
            </label>
            <AppSelect
              v-model="selectedSignerId"
              :options="signerOptions"
              placeholder="Pilih penandatangan"
              :disabled="!canAuthorize"
              class="mb-3"
            />

            <label class="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Jenis Tanda Tangan
            </label>
            <AppSelect
              v-model="signatureType"
              :options="signatureOptions"
              placeholder="Pilih jenis tanda tangan"
              :disabled="!canAuthorize"
              class="mb-2"
            />
            <div
              class="mb-3 h-24 rounded-lg border border-dashed flex items-center justify-center overflow-hidden px-3 text-center"
              :class="missingSignatureImage ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-slate-50'"
            >
              <img
                v-if="signatureType === 'digital' && signatureImageUrl"
                :src="signatureImageUrl"
                alt="TTD digital"
                class="max-w-full max-h-full object-contain"
              />
              <span v-else-if="missingSignatureImage" class="text-xs text-red-600">
                Penandatangan ini belum punya gambar TTD digital. Unggah di menu Penandatangan.
              </span>
              <span v-else-if="signatureType === 'manual'" class="text-xs text-slate-400">
                Area tanda tangan basah. Dikosongkan, ditandatangani setelah dicetak.
              </span>
              <span v-else class="text-xs text-slate-400">Pilih penandatangan untuk melihat TTD.</span>
            </div>

            <label class="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Ubah Status
            </label>
            <AppSelect
              v-model="statusValue"
              :options="statusOptions"
              :disabled="!canAuthorize"
              class="mb-4"
            />

            <AppButton
              label="Simpan Perubahan"
              variant="dark"
              class="w-full mb-2.5"
              :loading="saving"
              :disabled="!canAuthorize"
              @click="save"
            />
            <AppButton
              label="Kirim Notifikasi"
              icon="pi pi-send"
              variant="outline"
              class="w-full"
              :disabled="!isAuthorized"
              @click="sendNotification"
            />
            <p class="text-xs text-slate-400 mt-2">
              <template v-if="!canAuthorize && !isAuthorized">
                Surat harus berstatus menunggu otorisasi untuk bisa diotorisasi.
              </template>
              <template v-else-if="!isAuthorized">
                Simpan otorisasi dulu sebelum mengirim notifikasi ke pemohon.
              </template>
              <template v-else>
                Tombol ini membuka WhatsApp untuk memberi tahu pemohon.
              </template>
            </p>
          </section>
        </div>

        <!-- Kolom kanan: pratinjau dokumen -->
        <section class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 min-w-0">
          <div class="flex items-center justify-between mb-4">
            <h2 class="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <i class="pi pi-file text-slate-500" />
              Pratinjau Dokumen
            </h2>
            <AppButton
              label="Unduh Draft"
              icon="pi pi-download"
              variant="light"
              size="small"
              :loading="downloading"
              @click="downloadDraft"
            />
          </div>

          <div
            class="relative rounded-lg border border-slate-200 bg-slate-100 overflow-hidden h-[75vh] min-h-[480px]"
          >
            <iframe
              v-if="previewUrl"
              :src="previewUrl + '#view=FitH'"
              title="Pratinjau surat"
              class="w-full h-full bg-white"
            />
            <div
              v-else
              class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-sm text-slate-500"
            >
              <template v-if="previewLoading">
                <i class="pi pi-spinner pi-spin text-xl" />
                Memuat pratinjau...
              </template>
              <template v-else>
                <p>{{ previewError }}</p>
                <AppButton label="Coba lagi" variant="outline" size="small" @click="loadPreview" />
              </template>
            </div>
            <div
              v-if="previewUrl && previewLoading"
              class="absolute inset-0 bg-white/60 flex items-center justify-center"
            >
              <i class="pi pi-spinner pi-spin text-xl text-slate-500" />
            </div>
          </div>
          <p class="text-xs text-slate-400 mt-2">
            Pratinjau mengikuti template surat dari backend. Penandatangan yang tampil mengikuti
            pengaturan tipe surat sampai surat diotorisasi.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>