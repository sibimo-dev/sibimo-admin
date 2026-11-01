<script setup>
/* Verifikasi + Otorisasi untuk PAKET surat (lebih dari 1 surat dalam satu pengajuan).
   Dibuka oleh LetterReviewView bila URL membawa ?with=<id>,<id>. Untuk 1 surat, LetterReviewView tetap memakai tampilan
   otorisasi default (komponen milik Orang 1) dan komponen ini tidak dipakai.

   Bentuk: list surat di kiri → pilih satu → pratinjau PDF-nya di kanan (tiap surat = 1 request & 1 template Blade sendiri),
   unduh/cetak satu-satu, lalu penandatangan + jenis TTD masuk ke form di bawah list.
   Setujui = verify('verified') lalu authorize('authorized') per surat (surat 'verified' lama hanya perlu otorisasi).
   "Setujui Semua" menjalankannya berurutan; surat yang gagal ditandai dan bisa dicoba ulang tanpa mengulang yang sudah berhasil. */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import AppButton from '@/components/common/AppButton.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import { useLetterStore } from '@/stores/useLetterStore'
import { useLetterTypeStore } from '@/stores/useLetterTypeStore'
import { getLetterBundlePdf } from '@/services/letter-request.service'
import { mediaUrl } from '@/services/media'

const props = defineProps({
  ids: { type: Array, required: true }, // urutan = urutan di paket
})

// TODO(BE): nyalakan setelah endpoint GET /letter-requests/bundle/pdf?ids=... tersedia (lihat letter-request.service.js).
const MERGED_PREVIEW_ENABLED = false
const MERGED_KEY = '__merged__'

const router = useRouter()
const toast = useToast()
const letterStore = useLetterStore()
const typeStore = useLetterTypeStore()

const records = ref([]) // urutan sama dengan props.ids
const missingIds = ref([])
const loading = ref(true)
const selectedKey = ref(null)
const busyId = ref(null) // id surat yang sedang diproses (setujui/tolak)
const bulkBusy = ref(false)
const rowError = reactive({}) // { [id]: pesan }
const form = reactive({}) // { [id]: { signerId, signatureType, notes } }

const statusMeta = {
  submitted: { label: 'Menunggu Persetujuan', class: 'bg-amber-100 text-amber-700' },
  verified: { label: 'Menunggu Otorisasi', class: 'bg-blue-100 text-blue-700' },
  authorized: { label: 'Disetujui', class: 'bg-emerald-100 text-emerald-700' },
  completed: { label: 'Selesai', class: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Ditolak', class: 'bg-red-100 text-red-700' },
}
const metaOf = (r) => statusMeta[r?.backendStatus] ?? { label: r?.status ?? '-', class: 'bg-slate-100 text-slate-700' }
const canDecide = (r) => ['submitted', 'verified'].includes(r?.backendStatus)
const needsVerify = (r) => r?.backendStatus === 'submitted'
const isAuthorized = (r) => ['authorized', 'completed'].includes(r?.backendStatus)

const signerOptions = computed(() =>
  typeStore.signers.value.map((s) => ({ value: s.staff_id, label: `${s.name} - ${s.position}` })),
)
const signatureOptions = [
  { value: 'digital', label: 'Tanda Tangan Digital (TTE)' },
  { value: 'manual', label: 'Tanda Tangan Manual + Cap Desa' },
]

const selected = computed(() => records.value.find((r) => String(r.id) === String(selectedKey.value)) ?? null)
const isMerged = computed(() => selectedKey.value === MERGED_KEY)
const selectedForm = computed(() => (selected.value ? form[selected.value.id] : null))
const signerOf = (id) => typeStore.signers.value.find((s) => s.staff_id === form[id]?.signerId) ?? null
const signatureImageUrl = computed(() => {
  const s = selected.value && signerOf(selected.value.id)
  return s?.signature_image && selectedForm.value?.signatureType === 'digital' ? mediaUrl(s.signature_image) : ''
})
const missingDigitalImage = (id) => form[id]?.signatureType === 'digital' && !!signerOf(id) && !signerOf(id).signature_image

const pendingRecords = computed(() => records.value.filter(canDecide))
const allDone = computed(() => records.value.length > 0 && records.value.every((r) => !canDecide(r)))
const progress = computed(() => ({
  done: records.value.filter((r) => !canDecide(r)).length,
  total: records.value.length,
}))

function initForm(r) {
  form[r.id] = {
    signerId: r.authorized_by_signer_id ?? r.letter_type?.signer_id ?? null,
    signatureType: r.signature_type ?? 'manual',
    notes: r.notes ?? '',
  }
}
function replaceRecord(updated) {
  const i = records.value.findIndex((r) => String(r.id) === String(updated.id))
  if (i >= 0) records.value[i] = updated
}

// ---------- Preview PDF (cache blob URL per surat) ----------
const urlCache = new Map() // key → blob URL
const previewUrl = ref('')
const previewLoading = ref(false)
const previewError = ref('')

// Gangguan sementara (server masih "pemanasan" saat render PDF pertama, 5xx, timeout, jaringan putus) dicoba ulang otomatis.
// Error 4xx (data/izin salah) tidak diulang karena percuma.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function withRetry(task, tries = 3) {
  let lastError
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      return await task()
    } catch (error) {
      lastError = error
      const status = error.response?.status
      const temporary = !status || status >= 500 || status === 408 || status === 429
      if (!temporary || attempt === tries - 1) break
      await sleep(800 * (attempt + 1))
    }
  }
  throw lastError
}

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

async function blobUrlFor(key, { force = false } = {}) {
  if (!force && urlCache.has(key)) return urlCache.get(key)
  const blob =
    key === MERGED_KEY
      ? await withRetry(() => getLetterBundlePdf(records.value.map((r) => r.id)))
      : await withRetry(() => letterStore.getLetterPdf(key))
  if (urlCache.has(key)) URL.revokeObjectURL(urlCache.get(key))
  const url = URL.createObjectURL(blob)
  urlCache.set(key, url)
  return url
}

async function loadPreview({ force = false } = {}) {
  const key = selectedKey.value
  if (!key) return
  previewLoading.value = true
  previewError.value = ''
  try {
    const url = await blobUrlFor(key, { force })
    if (selectedKey.value === key) previewUrl.value = url // abaikan hasil lama bila admin sudah pindah surat
  } catch (error) {
    if (selectedKey.value === key) {
      previewUrl.value = ''
      previewError.value = (await readErrorMessage(error)) || 'Pratinjau dokumen gagal dimuat.'
    }
  } finally {
    if (selectedKey.value === key) previewLoading.value = false
  }
}

function select(key) {
  if (String(selectedKey.value) === String(key)) return
  selectedKey.value = key
  previewUrl.value = urlCache.get(key) ?? ''
  loadPreview()
}

onBeforeUnmount(() => {
  urlCache.forEach((url) => URL.revokeObjectURL(url))
  urlCache.clear()
})

// ---------- Unduh / Cetak (satu-satu) ----------
const fileLabel = (r) => (r ? `${r.requestId || 'surat'}${isAuthorized(r) ? '' : '-draft'}.pdf` : 'surat.pdf')
const downloading = ref(false)

async function downloadSelected() {
  const key = selectedKey.value
  if (!key) return
  downloading.value = true
  try {
    const url = await blobUrlFor(key)
    const a = document.createElement('a')
    a.href = url
    a.download = key === MERGED_KEY ? 'paket-surat.pdf' : fileLabel(selected.value)
    document.body.appendChild(a)
    a.click()
    a.remove()
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

async function printSelected() {
  const key = selectedKey.value
  if (!key) return
  try {
    const url = await blobUrlFor(key)
    const frame = document.createElement('iframe')
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
    frame.src = url
    frame.onload = () => {
      frame.contentWindow.focus()
      frame.contentWindow.print()
      setTimeout(() => frame.remove(), 60_000)
    }
    document.body.appendChild(frame)
  } catch {
    toast.add({ severity: 'error', summary: 'Gagal membuka dokumen untuk dicetak', life: 3000 })
  }
}

// ---------- Aksi ----------
function validateApprove(r) {
  const f = form[r.id]
  if (!f?.signerId) return 'Pilih penandatangan terlebih dahulu.'
  if (missingDigitalImage(r.id)) return 'Penandatangan belum punya gambar TTD digital. Pilih TTD manual atau unggah gambar TTD-nya.'
  return ''
}

// Mengembalikan true bila berhasil. Tidak melempar: kegagalan dicatat di rowError.
async function approveOne(r) {
  const problem = validateApprove(r)
  if (problem) {
    rowError[r.id] = problem
    return false
  }
  delete rowError[r.id]
  const f = form[r.id]
  busyId.value = r.id
  try {
    if (needsVerify(r)) {
      replaceRecord(await letterStore.verifySurat(r.id, 'verified', f.notes.trim() || null))
    }
    const done = await letterStore.authorizeSurat(r.id, {
      status: 'authorized',
      authorized_by_signer_id: f.signerId,
      signature_type: f.signatureType,
    })
    replaceRecord(done)
    initForm(done)
    // PDF final (dengan TTD/nomor surat) berbeda dari draft: buang cache supaya preview berikutnya mengambil ulang
    if (urlCache.has(r.id)) {
      URL.revokeObjectURL(urlCache.get(r.id))
      urlCache.delete(r.id)
    }
    return true
  } catch (error) {
    const fresh = letterStore.getSuratById(r.id) // verifikasi bisa saja sudah berhasil sebelum otorisasi gagal
    if (fresh) replaceRecord(fresh)
    rowError[r.id] = error.response?.data?.message ?? 'Persetujuan gagal. Periksa status request.'
    return false
  } finally {
    busyId.value = null
  }
}

async function approveSelected() {
  const r = selected.value
  if (!r || !canDecide(r)) return
  if (await approveOne(r)) {
    toast.add({ severity: 'success', summary: `${r.purpose} disetujui dan diotorisasi`, life: 2200 })
    loadPreview({ force: true })
  } else if (rowError[r.id]) {
    toast.add({ severity: 'warn', summary: 'Persetujuan belum berhasil', detail: rowError[r.id], life: 3500 })
  }
}

async function rejectSelected() {
  const r = selected.value
  if (!r || !needsVerify(r)) return
  const f = form[r.id]
  if (!f.notes.trim()) {
    toast.add({ severity: 'warn', summary: 'Isi catatan alasan penolakan terlebih dahulu', life: 2500 })
    return
  }
  busyId.value = r.id
  try {
    replaceRecord(await letterStore.verifySurat(r.id, 'rejected', f.notes.trim()))
    delete rowError[r.id]
    toast.add({ severity: 'success', summary: `${r.purpose} ditolak`, life: 2200 })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Penolakan gagal',
      detail: error.response?.data?.message ?? 'Periksa status request.',
      life: 3000,
    })
  } finally {
    busyId.value = null
  }
}

async function approveAll() {
  const targets = pendingRecords.value
  if (!targets.length) return
  bulkBusy.value = true
  let ok = 0
  const failed = []
  for (const r of targets) {
    if (await approveOne(r)) ok++
    else failed.push(r)
  }
  bulkBusy.value = false
  if (failed.length) {
    select(failed[0].id) // lompat ke surat pertama yang gagal supaya alasannya langsung terlihat
    toast.add({
      severity: 'warn',
      summary: `${ok} surat disetujui, ${failed.length} belum berhasil`,
      detail: 'Cek tanda merah pada list, perbaiki, lalu setujui lagi.',
      life: 4500,
    })
  } else {
    toast.add({ severity: 'success', summary: `${ok} surat disetujui dan diotorisasi`, life: 2500 })
    loadPreview({ force: true })
  }
}

function applySignatureToAll() {
  const f = selectedForm.value
  if (!f) return
  for (const r of records.value) {
    if (!canDecide(r)) continue
    form[r.id].signatureType = f.signatureType
    form[r.id].signerId = f.signerId
  }
  toast.add({ severity: 'info', summary: 'Penandatangan & jenis TTD disamakan untuk semua surat', life: 2200 })
}

// ---------- Muat data ----------
onMounted(async () => {
  try {
    await typeStore.fetchSigners()
  } catch {
    /* daftar penandatangan gagal dimuat: select kosong, admin bisa muat ulang halaman */
  }
  const results = await Promise.allSettled(props.ids.map((id) => letterStore.fetchById(id)))
  const loaded = []
  const missing = []
  results.forEach((res, i) => (res.status === 'fulfilled' ? loaded.push(res.value) : missing.push(props.ids[i])))
  records.value = loaded
  missingIds.value = missing
  loaded.forEach(initForm)
  loading.value = false
  if (missing.length) {
    toast.add({ severity: 'error', summary: `${missing.length} surat dalam paket gagal dimuat`, life: 3500 })
  }
  if (loaded.length) select(loaded.find(canDecide)?.id ?? loaded[0].id)
})
</script>

<template>
  <div>
    <div v-if="loading" class="p-6 text-sm text-slate-500">Memuat paket surat...</div>

    <div v-else-if="!records.length" class="text-center py-20">
      <p class="text-slate-500 mb-4">Data surat tidak ditemukan.</p>
      <AppButton label="Kembali ke Pengelolaan Surat" @click="router.push('/letter')" />
    </div>

    <div v-else>
      <button
        type="button"
        class="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        @click="router.push('/letter')"
      >
        <i class="pi pi-arrow-left text-xs" /> Kembali ke Pengelolaan Surat
      </button>
      <div class="mb-5 flex items-center gap-3 flex-wrap">
        <h1 class="text-2xl font-bold text-slate-800">Verifikasi &amp; Otorisasi Paket Surat</h1>
        <span class="text-[11px] font-semibold tracking-wide uppercase rounded px-2 py-0.5 bg-slate-100 text-slate-700">
          {{ progress.done }} / {{ progress.total }} surat selesai
        </span>
      </div>

      <p v-if="missingIds.length" class="mb-4 text-sm rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2">
        {{ missingIds.length }} surat dalam paket ini tidak bisa dimuat (ID: {{ missingIds.join(', ') }}). Surat lain tetap bisa diproses.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-5 items-start">
        <!-- ============ Kolom kiri: list surat + form otorisasi ============ -->
        <div class="flex flex-col gap-4">
          <section class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-sm font-semibold text-slate-800">Daftar Surat dalam Paket</h2>
              <span class="text-xs text-slate-400">{{ records.length }} surat</span>
            </div>
            <p class="text-xs text-slate-500 mb-3">
              Pemohon: <span class="font-medium text-slate-700">{{ records[0].citizenName || '-' }}</span>
              &middot; NIK {{ records[0].citizenId || '-' }}
            </p>

            <ul class="flex flex-col gap-2">
              <li v-if="MERGED_PREVIEW_ENABLED">
                <button
                  type="button"
                  class="w-full flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors"
                  :class="isMerged ? 'border-slate-800 bg-slate-50' : 'border-slate-200 hover:bg-slate-50'"
                  @click="select(MERGED_KEY)"
                >
                  <i class="pi pi-copy text-slate-500" />
                  <span class="text-sm font-medium text-slate-800">Semua surat (gabungan)</span>
                </button>
              </li>
              <li v-for="(r, i) in records" :key="r.id">
                <button
                  type="button"
                  class="w-full flex items-start gap-3 rounded-lg border px-3 py-2 text-left transition-colors"
                  :class="[
                    String(selectedKey) === String(r.id) ? 'border-slate-800 bg-slate-50' : 'border-slate-200 hover:bg-slate-50',
                    rowError[r.id] ? 'border-red-300' : '',
                  ]"
                  @click="select(r.id)"
                >
                  <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                    {{ i + 1 }}
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block text-sm font-medium text-slate-800 truncate">{{ r.purpose }}</span>
                    <span class="block text-[11px] text-slate-400 truncate">#{{ r.requestId }}</span>
                    <span v-if="rowError[r.id]" class="block text-[11px] text-red-600 mt-0.5">{{ rowError[r.id] }}</span>
                  </span>
                  <i v-if="busyId === r.id" class="pi pi-spinner pi-spin text-slate-400 text-xs mt-1" />
                  <span
                    v-else
                    class="shrink-0 text-[10px] font-semibold tracking-wide uppercase rounded px-1.5 py-0.5"
                    :class="metaOf(r).class"
                  >
                    {{ metaOf(r).label }}
                  </span>
                </button>
              </li>
            </ul>
          </section>

          <section v-if="selected && selectedForm" class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 class="text-sm font-semibold text-slate-800 mb-1">Otorisasi: {{ selected.purpose }}</h2>
            <p class="text-xs text-slate-400 mb-3">Penandatangan & TTD diatur per surat.</p>

            <label class="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Penandatangan</label>
            <AppSelect
              v-model="selectedForm.signerId"
              :options="signerOptions"
              placeholder="Pilih penandatangan"
              :disabled="!canDecide(selected)"
              class="mb-3"
            />

            <label class="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Jenis Tanda Tangan</label>
            <AppSelect
              v-model="selectedForm.signatureType"
              :options="signatureOptions"
              :disabled="!canDecide(selected)"
              class="mb-2"
            />
            <div
              class="mb-3 h-16 rounded-lg border border-dashed flex items-center justify-center overflow-hidden px-3 text-center"
              :class="missingDigitalImage(selected.id) ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-slate-50'"
            >
              <img v-if="signatureImageUrl" :src="signatureImageUrl" alt="TTD digital" class="max-w-full max-h-full object-contain" />
              <span v-else-if="missingDigitalImage(selected.id)" class="text-xs text-red-600">
                Penandatangan ini belum punya gambar TTD digital.
              </span>
              <span v-else-if="selectedForm.signatureType === 'manual'" class="text-xs text-slate-400">
                Tanda tangan basah, dikosongkan sampai surat dicetak.
              </span>
              <span v-else class="text-xs text-slate-400">Pilih penandatangan untuk melihat TTD.</span>
            </div>

            <button
              v-if="pendingRecords.length > 1 && canDecide(selected)"
              type="button"
              class="mb-3 text-xs text-slate-500 underline underline-offset-2 hover:text-slate-800"
              @click="applySignatureToAll"
            >
              Samakan penandatangan &amp; jenis TTD untuk semua surat yang belum diproses
            </button>

            <label class="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Catatan (wajib jika menolak)
            </label>
            <textarea
              v-model="selectedForm.notes"
              rows="2"
              :disabled="!needsVerify(selected)"
              placeholder="Alasan penolakan atau catatan tambahan..."
              class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-y outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors disabled:bg-slate-50 disabled:text-slate-500 mb-4"
            />

            <div v-if="canDecide(selected)" class="flex flex-col gap-2">
              <AppButton
                label="Setujui Surat Ini"
                icon="pi pi-check-circle"
                variant="dark"
                class="w-full"
                :loading="busyId === selected.id && !bulkBusy"
                :disabled="bulkBusy"
                @click="approveSelected"
              />
              <AppButton
                v-if="needsVerify(selected)"
                label="Tolak Surat Ini"
                icon="pi pi-times-circle"
                variant="outline"
                class="w-full"
                :disabled="bulkBusy || busyId === selected.id"
                @click="rejectSelected"
              />
            </div>
            <p v-else class="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
              Surat ini sudah ditindak dengan status
              <span class="font-medium text-slate-700">{{ metaOf(selected).label }}</span>.
            </p>
          </section>

          <section v-if="pendingRecords.length > 1" class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <AppButton
              :label="`Setujui Semua (${pendingRecords.length} surat)`"
              icon="pi pi-check-square"
              variant="dark"
              class="w-full"
              :loading="bulkBusy"
              :disabled="busyId !== null && !bulkBusy"
              @click="approveAll"
            />
            <p class="text-[11px] text-slate-400 mt-2">
              Memakai penandatangan & jenis TTD masing-masing surat. Surat yang gagal ditandai merah dan bisa dicoba lagi.
            </p>
          </section>

          <AppButton
            v-if="allDone"
            label="Selesai, kembali ke Pengelolaan Surat"
            icon="pi pi-check"
            variant="outline"
            class="w-full"
            @click="router.push('/letter')"
          />
        </div>

        <!-- ============ Kolom kanan: pratinjau surat terpilih ============ -->
        <section class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 min-w-0">
          <div class="flex items-center justify-between gap-3 flex-wrap mb-4">
            <h2 class="flex items-center gap-2 text-sm font-semibold text-slate-800 min-w-0">
              <i class="pi pi-file text-slate-500" />
              <span class="truncate">Pratinjau: {{ isMerged ? 'Semua surat (gabungan)' : selected?.purpose }}</span>
            </h2>
            <div class="flex items-center gap-2">
              <AppButton label="Cetak" icon="pi pi-print" variant="light" size="small" :disabled="!previewUrl" @click="printSelected" />
              <AppButton
                :label="isMerged || isAuthorized(selected) ? 'Unduh Surat' : 'Unduh Draft'"
                icon="pi pi-download"
                variant="light"
                size="small"
                :loading="downloading"
                @click="downloadSelected"
              />
            </div>
          </div>

          <div class="relative rounded-lg border border-slate-200 bg-slate-100 overflow-hidden h-[78vh] min-h-[480px]">
            <iframe v-if="previewUrl" :src="previewUrl + '#view=FitH'" title="Pratinjau surat" class="w-full h-full bg-white" />
            <div
              v-else
              class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-sm text-slate-500"
            >
              <template v-if="previewLoading">
                <i class="pi pi-spinner pi-spin text-xl" />
                Memuat pratinjau...
              </template>
              <template v-else>
                <p>{{ previewError || 'Pilih surat di daftar untuk melihat pratinjau.' }}</p>
                <AppButton v-if="previewError" label="Coba lagi" variant="outline" size="small" @click="loadPreview({ force: true })" />
              </template>
            </div>
            <div v-if="previewUrl && previewLoading" class="absolute inset-0 bg-white/60 flex items-center justify-center">
              <i class="pi pi-spinner pi-spin text-xl text-slate-500" />
            </div>
          </div>
          <p class="text-xs text-slate-400 mt-2">
            Tiap surat dirender dari template-nya sendiri. Unduh/cetak dilakukan satu per satu.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>
