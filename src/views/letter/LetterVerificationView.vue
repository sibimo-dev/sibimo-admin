<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import AppButton from '@/components/common/AppButton.vue'
import { useLetterStore } from '@/stores/useLetterStore'
import { mediaUrl } from '@/services/media'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const store = useLetterStore()

const record = ref(null)
const notes = ref('')
const loading = ref(true)
const saving = ref(false)
const pdfLoading = ref(false)

const attachments = computed(() => record.value?.attachments ?? [])
const activeAttachment = computed(() => selectedAttachment.value ?? attachments.value[0] ?? null)

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

onMounted(async () => {
  try {
    record.value = await store.fetchById(route.params.id)
    notes.value = record.value?.notes ?? ''
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal memuat detail surat', life: 3000 })
  } finally {
    loading.value = false
  }
})

async function verify(newStatus) {
  if (!record.value) return
  if (newStatus === 'rejected' && !notes.value.trim()) {
    toast.add({ severity: 'warn', summary: 'Isi catatan alasan penolakan terlebih dahulu', life: 2500 })
    return
  }
  saving.value = true
  try {
    const updated = await store.verifySurat(record.value.id, newStatus, notes.value.trim() || null)
    record.value = updated
    toast.add({
      severity: 'success',
      summary: newStatus === 'verified' ? 'Surat berhasil diverifikasi' : 'Surat berhasil ditolak',
      life: 2200,
    })
    if (newStatus === 'verified') {
      router.push({ name: 'letter-authorization', query: { highlight: updated.requestId } })
    } else {
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
    saving.value = false
  }
}

async function previewPdf() {
  if (!record.value) return
  pdfLoading.value = true
  try {
    const { blob } = await store.getLetterPdf(record.value.id)
    store.openPdfBlob(blob)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Preview PDF gagal',
      detail: error.response?.data?.message ?? 'Template surat belum tersedia.',
      life: 3000,
    })
  } finally {
    pdfLoading.value = false
  }
}
</script>

<template>
  <div>
    <div v-if="loading" class="p-6 text-sm text-slate-500">Memuat detail...</div>

    <div v-else-if="!record" class="max-w-md mx-auto text-center py-20">
      <p class="text-slate-500 text-sm mb-4">Data surat tidak ditemukan.</p>
      <AppButton label="Kembali ke Daftar Verifikasi" @click="router.push('/letter/verification')" />
    </div>

    <div v-else>
      <h1 class="text-2xl font-bold text-slate-800 mb-5">
        Verifikasi Dokumen #{{ record.requestId }}
      </h1>

      <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
        <!-- Kolom kiri -->
        <div class="flex flex-col gap-4 min-w-0">
          <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 class="font-semibold text-slate-800 mb-3 text-sm">Informasi Pemohon</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                v-for="cell in infoCells"
                :key="cell.label"
                class="border border-slate-200 rounded-lg px-3 py-2.5 flex flex-col gap-0.5"
              >
                <p class="text-xs font-semibold text-slate-800">{{ cell.label }}</p>
                <p class="text-xs text-slate-500 break-words">{{ cell.value || '-' }}</p>
              </div>
              <div
                v-for="cell in extraCells"
                :key="'extra-' + cell.label"
                class="border border-slate-200 rounded-lg px-3 py-2.5 flex flex-col gap-0.5"
              >
                <p class="text-xs font-semibold text-slate-800">{{ cell.label }}</p>
                <p class="text-xs text-slate-500 break-words">{{ cell.value || '-' }}</p>
              </div>
              <div
                class="sm:col-span-2 border border-slate-200 rounded-lg px-3 py-2.5 flex flex-col gap-0.5"
              >
                <p class="text-xs font-semibold text-slate-800">Alamat Lengkap</p>
                <p class="text-xs text-slate-500">{{ record.citizenAddress || '-' }}</p>
              </div>
            </div>
          </section>

          <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 class="font-semibold text-slate-800 mb-3 text-sm">Dokumen Terlampir</h2>
            <div v-if="attachments.length" class="flex flex-col gap-2">
              <div
                v-for="item in attachments"
                :key="item.attachment_id"
                class="flex items-center justify-between border rounded-lg px-3 py-2.5 transition-colors"
                :class="
                  activeAttachment?.attachment_id === item.attachment_id
                    ? 'border-slate-400 bg-slate-50'
                    : 'border-slate-200'
                "
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="w-9 h-9 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"
                  >
                    <i :class="attachmentIcon(item)" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-slate-800 truncate">{{ item.file_name }}</p>
                    <p class="text-xs text-slate-500 truncate">{{ documentName(item) }}</p>
                  </div>
                </div>
                <button
                  type="button"
                  class="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Pratinjau"
                  @click="selectedAttachment = item"
                >
                  <i class="pi pi-eye" />
                </button>
              </div>
            </div>
            <p v-else class="text-sm text-slate-500">Belum ada lampiran.</p>
          </section>

          <section
            class="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 relative"
          >
            <div
              class="min-h-[260px] rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden"
            >
              <span v-if="!activeAttachment" class="text-slate-400 text-sm">
                Pilih dokumen untuk pratinjau
              </span>
              <img
                v-else-if="isImage(activeAttachment.file_name)"
                :src="mediaUrl(activeAttachment.file_path)"
                :alt="activeAttachment.file_name"
                class="max-w-full max-h-[420px] object-contain"
              />
              <span v-else class="text-slate-400 text-sm px-4 text-center">
                Pratinjau tidak tersedia untuk tipe file ini. Gunakan tombol di kanan atas untuk
                membukanya.
              </span>
            </div>
            <div v-if="activeAttachment" class="absolute top-6 right-6">
              <AppButton
                :label="`Pratinjau ${documentName(activeAttachment)}`"
                icon="pi pi-search"
                variant="light"
                size="small"
                class="!bg-white shadow-sm"
                @click="openAttachment(activeAttachment)"
              />
            </div>
          </section>
        </div>

        <!-- Kolom kanan -->
        <div class="flex flex-col gap-4">
          <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 class="font-semibold text-slate-800 mb-2 text-sm">Catatan Verifikator</h2>
            <label class="text-xs font-semibold text-slate-500 mb-1 block">
              Tambahkan catatan untuk pemohon (wajib diisi jika menolak)
            </label>
            <textarea
              v-model="notes"
              rows="4"
              :disabled="!canVerify"
              placeholder="Tuliskan alasan penolakan atau catatan tambahan di sini..."
              class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-y outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors disabled:bg-slate-50 disabled:text-slate-500"
            />
          </section>

          <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 class="font-semibold text-slate-800 mb-2 text-sm">Tindakan</h2>
            <p class="text-sm text-slate-500 mb-4">
              Pastikan semua dokumen telah diperiksa dengan seksama sebelum mengambil keputusan.
            </p>
            <div v-if="canVerify" class="flex flex-col gap-2">
              <AppButton
                label="Setujui Permohonan"
                icon="pi pi-check-circle"
                variant="dark"
                class="w-full"
                :loading="saving"
                @click="verify('verified')"
              />
              <AppButton
                label="Tolak Permohonan"
                icon="pi pi-times-circle"
                variant="outline"
                class="w-full"
                :disabled="saving"
                @click="verify('rejected')"
              />
            </div>
            <div v-else class="text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
              Permohonan ini sudah ditindak sebelumnya dengan status
              <span class="font-medium text-slate-700">{{ status.label }}</span
              >.
            </div>
          </section>

          <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 class="font-semibold text-slate-800 text-xs mb-2">Status Saat Ini</h2>
            <span
              class="inline-block text-[10px] font-semibold tracking-wide uppercase rounded px-2 py-0.5"
              :class="status.class"
            >
              {{ status.label }}
            </span>
            <p class="text-xs font-semibold text-slate-800 mt-4 mb-1">Diverifikasi Oleh</p>
            <div class="flex items-center gap-2">
              <div
                class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <i class="pi pi-user text-[10px]" />
              </div>
              <span class="text-sm text-slate-700">{{ record.verifiedBy }}</span>
            </div>
          </section>
        </div>
      </div>
<<<<<<< HEAD
=======

      <section class="bg-white rounded-xl border p-5">
        <h2 class="font-semibold text-slate-800 mb-4">Data Pemohon</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><span class="text-slate-500">Nama:</span> {{ record.citizenName }}</div>
          <div><span class="text-slate-500">NIK:</span> {{ record.citizenId }}</div>
          <div><span class="text-slate-500">Telepon:</span> {{ record.citizenPhone || '-' }}</div>
          <div><span class="text-slate-500">Alamat:</span> {{ record.citizenAddress || '-' }}</div>
          <div><span class="text-slate-500">Kategori:</span> {{ record.category }}</div>
          <div><span class="text-slate-500">Sumber:</span> {{ record.source }}</div>
        </div>
      </section>

      <section class="bg-white rounded-xl border p-5">
        <h2 class="font-semibold text-slate-800 mb-4">Data Tambahan</h2>
        <div v-if="formEntries.length" class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div v-for="[key, value] in formEntries" :key="key">
            <span class="text-slate-500">{{ key }}:</span> {{ value || '-' }}
          </div>
        </div>
        <p v-else class="text-sm text-slate-500">Tidak ada data tambahan.</p>
      </section>

      <section class="bg-white rounded-xl border p-5">
        <h2 class="font-semibold text-slate-800 mb-4">Lampiran</h2>
        <div v-if="attachments.length" class="space-y-2">
          <a v-for="item in attachments" :key="item.attachment_id" :href="item.file_path" target="_blank" rel="noreferrer" class="block border rounded-lg p-3 text-sm text-blue-600 hover:bg-blue-50">
            {{ item.file_name }} · {{ item.letter_type_document?.document_name || 'Dokumen' }}
          </a>
        </div>
        <p v-else class="text-sm text-slate-500">Belum ada lampiran.</p>
      </section>

      <section class="bg-white rounded-xl border p-5 flex flex-wrap gap-3">
        <AppButton
          label="Preview Surat"
          icon="pi pi-eye"
          variant="outline"
          :disabled="pdfLoading"
          @click="previewPdf"
        />
      </section>

      <section class="bg-white rounded-xl border p-5 space-y-4">
        <label class="block text-sm text-slate-600">Catatan Verifikasi
          <textarea v-model="notes" rows="4" class="mt-1 w-full border rounded-lg px-3 py-2" />
        </label>
        <div class="flex gap-3">
          <AppButton label="Tolak" variant="outline" :disabled="saving" @click="verify('rejected')" />
          <AppButton label="Verifikasi" :disabled="saving" @click="verify('verified')" />
        </div>
      </section>
>>>>>>> origin/main
    </div>
  </div>
</template>