<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import AppButton from '@/components/common/AppButton.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useLetterStore } from '@/stores/useLetterStore'
import { useLetterTypeStore } from '@/stores/useLetterTypeStore'
import { downloadLetterPdf, getLetterPdf } from '@/services/letter-request.service'
import { mediaUrl } from '@/services/media'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const letterStore = useLetterStore()
const typeStore = useLetterTypeStore()

/* ------------------------------- State ------------------------------- */

const record = ref(null)
const loading = ref(true)

// Verifikasi
const notes = ref('')
const verifying = ref(false)

// Otorisasi
const selectedSignerId = ref(null)
const signatureType = ref('manual')
const authorizing = ref(false)

// Preview & unduhan
const selectedLetterId = ref(null)
const previewUrl = ref('')
const previewLoading = ref(false)
const previewError = ref('')
const previewFrame = ref(null)
const pageRoot = ref(null)
let initialScrollPending = true
const downloading = ref(false)
let previewToken = 0

/* ------------------------------ Konstanta ------------------------------ */

const statusMeta = {
  submitted: { label: 'Pending', class: 'bg-amber-100 text-amber-700' },
  verified: { label: 'Pending', class: 'bg-amber-100 text-amber-700' },
  authorized: { label: 'Selesai', class: 'bg-emerald-100 text-emerald-700' },
  completed: { label: 'Selesai', class: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Ditolak', class: 'bg-red-100 text-red-700' },
}

const signatureOptions = [
  { value: 'digital', label: 'Tanda Tangan Digital (TTE)' },
  { value: 'manual', label: 'Tanda Tangan Manual + Cap Desa' },
]

/* ------------------------------ Hak akses ------------------------------ */

// Sama seperti sidebar: kalau daftar permission tidak tersedia, anggap boleh.
function hasPermission(permission) {
  const permissions = authStore.user?.permissions
  return !Array.isArray(permissions) || permissions.includes(permission)
}

/* ------------------------------ Status ------------------------------ */

const backendStatus = computed(() => record.value?.backendStatus)
const status = computed(
  () =>
    statusMeta[backendStatus.value] ?? {
      label: record.value?.status ?? '-',
      class: 'bg-slate-100 text-slate-700',
    },
)

const isAuthorized = computed(() => ['authorized', 'completed'].includes(backendStatus.value))
const isRejected = computed(() => backendStatus.value === 'rejected')
const canVerify = computed(() => backendStatus.value === 'submitted' && hasPermission('verifikasi-surat'))
const canAuthorize = computed(() => backendStatus.value === 'verified' && hasPermission('otorisasi-surat'))
const showAuthorizationCard = computed(() =>
  ['verified', 'authorized', 'completed'].includes(backendStatus.value),
)

/* --------------------------- Informasi pemohon --------------------------- */

const infoCells = computed(() => {
  if (!record.value) return []
  return [
    { label: 'Nama Pemohon', value: record.value.citizenName },
    { label: 'NIK', value: record.value.citizenId },
    { label: 'Nomor Telepon', value: record.value.citizenPhone },
    { label: 'Jenis Surat', value: record.value.purpose },
    { label: 'Kategori', value: record.value.category },
    { label: 'Sumber', value: record.value.source },
    { label: 'Tanggal Pengajuan', value: record.value.date },
  ]
})

/* ------------------------------ Lampiran ------------------------------ */

const attachments = computed(() => record.value?.attachments ?? [])
const isImage = (name) => /\.(png|jpe?g|gif|webp|bmp)$/i.test(name || '')
const isPdf = (name) => /\.pdf$/i.test(name || '')
const documentName = (item) => item?.letter_type_document?.document_name || 'Dokumen'

function attachmentIcon(item) {
  if (isPdf(item.file_name)) return 'pi pi-file-pdf'
  if (/ktp/i.test(documentName(item)) || /ktp/i.test(item.file_name || '')) return 'pi pi-id-card'
  if (isImage(item.file_name)) return 'pi pi-image'
  return 'pi pi-file'
}

function openAttachment(item) {
  if (item?.file_path) window.open(mediaUrl(item.file_path), '_blank', 'noopener,noreferrer')
}

/* ------------------------- Hasil verifikasi ------------------------- */

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

/* --------------------------- Otorisasi / TTD --------------------------- */

const signerOptions = computed(() =>
  typeStore.signers.value.map((signer) => ({
    value: signer.staff_id,
    label: `${signer.name} - ${signer.position}`,
  })),
)

const selectedSigner = computed(
  () => typeStore.signers.value.find((s) => s.staff_id === selectedSignerId.value) ?? null,
)

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

const signerName = computed(() => {
  if (isAuthorized.value && record.value?.authorizedBy && record.value.authorizedBy !== '-') {
    return record.value.authorizedBy
  }
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

/* ------------------------------ Preview ------------------------------ */

// Satu pengajuan bisa berisi lebih dari satu surat. Asumsi bentuk datanya:
// record.letters = [{ id, title }, ...]. Sesuaikan di sini kalau field-nya beda.
const letterOptions = computed(() =>
  (record.value?.letters ?? []).map((letter, index) => ({
    value: letter.id ?? letter.letter_id ?? index,
    label: letter.title ?? letter.name ?? letter.purpose ?? `Surat ${index + 1}`,
  })),
)
const hasMultipleLetters = computed(() => letterOptions.value.length > 1)

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

function clearPreviewUrl() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}

async function loadPreview() {
  if (!record.value) return
  const token = ++previewToken
  previewLoading.value = true
  previewError.value = ''
  try {
    // FIX #6: jangan pass selectedLetterId sebagai arg ke-2.
    // getLetterPdf(id, options) — angka akan diinterpretasi sebagai
    // Boolean(1)=true sehingga mode jadi download, bukan stream preview.
    const blob = await getLetterPdf(record.value.id)
    if (token !== previewToken) return
    clearPreviewUrl()
    previewUrl.value = URL.createObjectURL(blob)
  } catch (error) {
    if (token !== previewToken) return
    clearPreviewUrl()
    previewError.value = (await readErrorMessage(error)) || 'Pratinjau dokumen gagal dimuat.'
  } finally {
    if (token === previewToken) previewLoading.value = false
  }
}

function onLetterChange(value) {
  selectedLetterId.value = value
  loadPreview()
}

async function downloadPdf() {
  if (!record.value) return
  downloading.value = true
  try {
    const blob = await downloadLetterPdf(record.value.id, selectedLetterId.value)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${record.value.requestId || 'surat'}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Gagal mengunduh surat',
      detail: 'Template PDF untuk tipe surat ini mungkin belum tersedia.',
      life: 3000,
    })
  } finally {
    downloading.value = false
  }
}

function printPreview() {
  if (!previewUrl.value) return
  try {
    previewFrame.value?.contentWindow?.focus()
    previewFrame.value?.contentWindow?.print()
  } catch {
    window.open(previewUrl.value, '_blank', 'noopener,noreferrer')
  }
}

/* ------------------------- Posisi scroll halaman ------------------------- */

// Layout admin men-scroll sebuah container (bukan window), jadi posisi scroll
// halaman sebelumnya terbawa. Selain itu viewer PDF di iframe bisa menarik
// fokus dan menggulung halaman ke bawah. Reset semua ancestor yang bisa di-scroll.
function scrollToTop() {
  let el = pageRoot.value?.parentElement
  while (el) {
    if (el.scrollHeight > el.clientHeight && /(auto|scroll)/.test(getComputedStyle(el).overflowY)) {
      el.scrollTop = 0
    }
    el = el.parentElement
  }
  window.scrollTo(0, 0)
}

function onPreviewLoad() {
  if (!initialScrollPending) return
  initialScrollPending = false
  scrollToTop()
  setTimeout(scrollToTop, 200)
}

/* --------------------------------- Muat data --------------------------------- */

function applyRecord(data) {
  record.value = data
  notes.value = data?.notes ?? ''
  selectedSignerId.value = data?.authorized_by_signer_id ?? data?.letter_type?.signer_id ?? null
  signatureType.value = data?.signature_type ?? 'manual'
  if (selectedLetterId.value === null) {
    selectedLetterId.value = letterOptions.value[0]?.value ?? null
  }
}

onMounted(async () => {
  scrollToTop()
  const cached = letterStore.getSuratById(route.params.id)
  if (cached) {
    applyRecord(cached)
    loading.value = false
  }

  try {
    const [fresh] = await Promise.all([
      letterStore.fetchById(route.params.id),
      typeStore.fetchSigners(),
    ])
    applyRecord(fresh)
  } catch {
    if (!record.value) {
      toast.add({ severity: 'error', summary: 'Gagal memuat detail surat', life: 3000 })
    }
  } finally {
    loading.value = false
  }

  await nextTick()
  scrollToTop()
  loadPreview()
})

onBeforeUnmount(() => clearPreviewUrl())

/* -------------------------------- Aksi -------------------------------- */

async function verify(newStatus) {
  if (!record.value || !canVerify.value) return
  if (newStatus === 'rejected' && !notes.value.trim()) {
    toast.add({ severity: 'warn', summary: 'Isi catatan alasan penolakan terlebih dahulu', life: 2500 })
    return
  }

  verifying.value = true
  try {
    const updated = await letterStore.verifySurat(record.value.id, newStatus, notes.value.trim() || null)
    record.value = updated
    toast.add({
      severity: 'success',
      summary: newStatus === 'verified' ? 'Surat berhasil diverifikasi' : 'Surat berhasil ditolak',
      life: 2200,
    })
    // Disetujui: tetap di halaman ini supaya bisa langsung lanjut otorisasi.
    if (newStatus === 'rejected') {
      router.push({ name: 'letter-list', query: { highlight: updated.requestId } })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Perubahan status gagal',
      detail: error.response?.data?.message ?? 'Periksa status request.',
      life: 3000,
    })
  } finally {
    verifying.value = false
  }
}

async function authorize() {
  if (!record.value || !canAuthorize.value) return
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

  authorizing.value = true
  try {
    // FIX #4: notes tidak dikirim saat otorisasi — notes hanya untuk alasan penolakan.
    record.value = await letterStore.authorizeSurat(record.value.id, {
      status: 'authorized',
      authorized_by_signer_id: selectedSignerId.value,
      signature_type: signatureType.value,
    })
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
    authorizing.value = false
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
  <div ref="pageRoot">
    <div v-if="loading" class="p-6 text-base text-slate-500">Memuat detail...</div>

    <div v-else-if="!record" class="max-w-md mx-auto text-center py-20">
      <p class="text-slate-500 text-base mb-4">Data surat tidak ditemukan.</p>
      <AppButton label="Kembali ke Daftar Surat" @click="router.push('/letter')" />
    </div>

    <div v-else>
      <!-- Header -->
      <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-3xl font-bold text-slate-800">Detail Surat #{{ record.requestId }}</h1>
          <span
            class="mt-2 inline-block text-sm font-semibold rounded px-2 py-0.5"
            :class="status.class"
          >
            {{ status.label }}
          </span>
        </div>
        <AppButton
          label="Kembali ke Daftar"
          icon="pi pi-arrow-left"
          variant="outline"
         
          @click="router.push('/letter')"
        />
      </div>

      <!-- Informasi pemohon: kartu selebar halaman (landscape) -->
      <section class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">
        <h2 class="font-semibold text-slate-800 mb-3 text-lg">Informasi Pemohon</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div
            v-for="cell in infoCells"
            :key="cell.label"
            class="border border-slate-200 rounded-lg px-4 py-3 flex flex-col gap-0.5"
          >
            <p class="text-sm font-semibold text-slate-800">{{ cell.label }}</p>
            <p class="text-base text-slate-600 break-words">{{ cell.value || '-' }}</p>
          </div>
          <div class="border border-slate-200 rounded-lg px-4 py-3 flex flex-col gap-0.5">
            <p class="text-sm font-semibold text-slate-800">Alamat Lengkap</p>
            <p class="text-base text-slate-600 break-words">{{ record.citizenAddress || '-' }}</p>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-[420px_minmax(0,1fr)] gap-5 items-start">
        <!-- ===================== Kolom kiri: data & tindakan ===================== -->
        <div class="flex flex-col gap-4 min-w-0">
          <!-- Dokumen terlampir -->
          <section class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 class="font-semibold text-slate-800 mb-3 text-lg">Dokumen Terlampir</h2>
            <div v-if="attachments.length" class="flex flex-col gap-2">
              <div
                v-for="item in attachments"
                :key="item.attachment_id"
                class="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="w-9 h-9 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"
                  >
                    <i :class="attachmentIcon(item)" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-base font-medium text-slate-800 truncate">{{ item.file_name }}</p>
                    <p class="text-sm text-slate-500 truncate">{{ documentName(item) }}</p>
                  </div>
                </div>
                <button
                  type="button"
                  class="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Buka lampiran"
                  @click="openAttachment(item)"
                >
                  <i class="pi pi-external-link" />
                </button>
              </div>
            </div>
            <p v-else class="text-base text-slate-500">Belum ada lampiran.</p>
          </section>

          <!-- Langkah 1: Verifikasi -->
          <section class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 class="flex items-center gap-2 font-semibold text-slate-800 mb-3 text-lg">
              <i class="pi pi-check-circle text-slate-600" />
              Verifikasi
            </h2>

            <template v-if="canVerify">
              <label class="text-sm font-semibold text-slate-500 mb-1 block">
                Catatan untuk pemohon (wajib diisi jika menolak)
              </label>
              <textarea
                v-model="notes"
                rows="4"
                placeholder="Tuliskan alasan penolakan atau catatan tambahan di sini..."
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-base resize-y outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
              />
              <p class="text-sm text-slate-500 my-3">
                Pastikan semua dokumen telah diperiksa sebelum mengambil keputusan.
              </p>
              <div class="flex flex-col gap-2">
                <AppButton
                  label="Setujui Permohonan"
                  icon="pi pi-check-circle"
                  variant="dark"
                  class="w-full"
                  :loading="verifying"
                  @click="verify('verified')"
                />
                <AppButton
                  label="Tolak Permohonan"
                  icon="pi pi-times-circle"
                  variant="outline"
                  class="w-full"
                  :disabled="verifying"
                  @click="verify('rejected')"
                />
              </div>
            </template>

            <template v-else-if="backendStatus === 'submitted'">
              <p class="text-base text-slate-500 bg-slate-50 rounded-lg p-3">
                Surat ini menunggu verifikasi. Anda tidak memiliki hak akses untuk memverifikasi.
              </p>
            </template>

            <template v-else>
              <div class="mb-3">
                <p class="text-sm text-slate-500">Diverifikasi Oleh</p>
                <p class="text-base font-semibold text-slate-800">{{ verifierName }}</p>
                <p v-if="verifierRole" class="text-sm text-slate-500">{{ verifierRole }}</p>
              </div>
              <div class="mb-3">
                <p class="text-sm text-slate-500">Waktu Verifikasi</p>
                <p class="text-sm text-slate-800">{{ formatDateTime(record.verified_at) }}</p>
              </div>
              <div>
                <p class="text-sm text-slate-500 mb-1">
                  {{ isRejected ? 'Alasan Penolakan' : 'Catatan Verifikator' }}
                </p>
                <div
                  class="bg-slate-100 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-600"
                >
                  {{ record.notes || '-' }}
                </div>
              </div>
            </template>
          </section>

          <!-- Langkah 2: Otorisasi -->
          <section
            v-if="showAuthorizationCard"
            class="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
          >
            <h2 class="flex items-center gap-2 font-semibold text-slate-800 mb-3 text-lg">
              <i class="pi pi-key text-slate-600" />
              Otorisasi
            </h2>

            <template v-if="canAuthorize">
              <label class="block text-sm font-semibold text-slate-500 mb-1">
                Penandatangan
              </label>
              <AppSelect
                v-model="selectedSignerId"
                :options="signerOptions"
                placeholder="Pilih penandatangan"
                class="mb-3"
              />

              <label class="block text-sm font-semibold text-slate-500 mb-1">
                Jenis Tanda Tangan
              </label>
              <AppSelect
                v-model="signatureType"
                :options="signatureOptions"
                placeholder="Pilih jenis tanda tangan"
                class="mb-2"
              />
              <div
                class="mb-4 h-24 rounded-lg border border-dashed flex items-center justify-center overflow-hidden px-3 text-center"
                :class="missingSignatureImage ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-slate-50'"
              >
                <img
                  v-if="signatureType === 'digital' && signatureImageUrl"
                  :src="signatureImageUrl"
                  alt="TTD digital"
                  class="max-w-full max-h-full object-contain"
                />
                <span v-else-if="missingSignatureImage" class="text-sm text-red-600">
                  Penandatangan ini belum punya gambar TTD digital. Unggah di menu Penandatangan.
                </span>
                <span v-else-if="signatureType === 'manual'" class="text-sm text-slate-400">
                  Area tanda tangan basah. Dikosongkan, ditandatangani setelah dicetak.
                </span>
                <span v-else class="text-sm text-slate-400">Pilih penandatangan untuk melihat TTD.</span>
              </div>

              <AppButton
                label="Otorisasi Surat"
                icon="pi pi-verified"
                variant="dark"
                class="w-full"
                :loading="authorizing"
                @click="authorize"
              />
            </template>

            <template v-else-if="isAuthorized">
              <div class="bg-slate-700 text-slate-50 rounded-lg p-4 mb-3">
                <div class="mb-3">
                  <p class="text-sm text-slate-300">Otorisator</p>
                  <p class="text-base font-semibold">{{ signerName || '-' }}</p>
                  <p v-if="signerPosition" class="text-sm text-slate-300">{{ signerPosition }}</p>
                </div>
                <div>
                  <p class="text-sm text-slate-300 mb-1">Tipe Tanda Tangan</p>
                  <p class="text-sm font-medium flex items-center gap-1.5">
                    <i class="pi pi-verified text-slate-200" />
                    {{ signatureLabel }}
                  </p>
                </div>
              </div>
              <AppButton
                label="Kirim Notifikasi ke Pemohon"
                icon="pi pi-send"
                variant="outline"
                class="w-full"
                @click="sendNotification"
              />
              <p class="text-sm text-slate-400 mt-2">Tombol ini membuka WhatsApp untuk memberi tahu pemohon.</p>
            </template>

            <template v-else>
              <p class="text-base text-slate-500 bg-slate-50 rounded-lg p-3">
                Surat ini menunggu otorisasi. Anda tidak memiliki hak akses untuk mengotorisasi.
              </p>
            </template>
          </section>
        </div>

        <!-- ===================== Kolom kanan: preview surat ===================== -->
        <section
          class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 min-w-0 flex flex-col lg:sticky lg:top-4 lg:h-[calc(100vh-7rem)]"
        >
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
            <h2 class="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <i class="pi pi-file text-slate-500" />
              Pratinjau Surat
            </h2>
            <div class="flex items-center gap-2">
              <AppButton
                label="Cetak"
                icon="pi pi-print"
                variant="light"
               
                :disabled="!previewUrl"
                @click="printPreview"
              />
              <AppButton
                :label="isAuthorized ? 'Unduh PDF' : 'Unduh Draft'"
                icon="pi pi-download"
                variant="light"
               
                :loading="downloading"
                @click="downloadPdf"
              />
            </div>
          </div>

          <!-- Dropdown hanya muncul kalau ada lebih dari satu surat -->
          <div v-if="hasMultipleLetters" class="mb-3">
            <label class="block text-sm font-semibold text-slate-500 mb-1">
              Pilih Surat ({{ letterOptions.length }} surat diajukan)
            </label>
            <AppSelect
              :model-value="selectedLetterId"
              :options="letterOptions"
              placeholder="Pilih surat untuk dipratinjau"
              @update:model-value="onLetterChange"
            />
          </div>

          <div
            class="relative flex-1 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden h-[70vh] min-h-[420px] lg:h-auto"
          >
            <iframe
              v-if="previewUrl"
              ref="previewFrame"
              @load="onPreviewLoad"
              :src="previewUrl + '#view=FitH'"
              title="Pratinjau surat"
              class="absolute inset-0 w-full h-full bg-white"
            />
            <div
              v-else
              class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-base text-slate-500"
            >
              <template v-if="previewLoading">
                <i class="pi pi-spinner pi-spin text-xl" />
                Memuat pratinjau...
              </template>
              <template v-else>
                <p>{{ previewError || 'Pratinjau belum tersedia.' }}</p>
                <AppButton label="Coba lagi" variant="outline" @click="loadPreview" />
              </template>
            </div>
            <div
              v-if="previewUrl && previewLoading"
              class="absolute inset-0 bg-white/60 flex items-center justify-center"
            >
              <i class="pi pi-spinner pi-spin text-xl text-slate-500" />
            </div>
          </div>
          <p class="text-sm text-slate-400 mt-2">
            Pratinjau mengikuti template surat dari backend. Penandatangan yang tampil mengikuti
            pengaturan tipe surat sampai surat diotorisasi.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>