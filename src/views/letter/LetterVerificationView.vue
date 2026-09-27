<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import AppButton from '@/components/common/AppButton.vue'
import { useLetterStore } from '@/stores/useLetterStore'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const store = useLetterStore()

const record = ref(null)
const notes = ref('')
const loading = ref(true)
const saving = ref(false)

const formEntries = computed(() => Object.entries(record.value?.formData ?? {}))
const attachments = computed(() => record.value?.attachments ?? [])

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

async function verify(status) {
  if (!record.value) return
  saving.value = true
  try {
    const updated = await store.verifySurat(record.value.id, status, notes.value.trim() || null)
    record.value = updated
    toast.add({
      severity: 'success',
      summary: status === 'verified' ? 'Surat berhasil diverifikasi' : 'Surat berhasil ditolak',
      life: 2200,
    })
    if (status === 'verified') {
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
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div v-if="loading" class="p-6 text-sm text-slate-500">Memuat detail...</div>
    <div v-else-if="!record" class="p-6 text-center text-slate-500">Data surat tidak ditemukan.</div>
    <div v-else class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-slate-800">Verifikasi Surat</h1>
          <p class="text-sm text-slate-500 mt-1">{{ record.requestId }} · {{ record.purpose }}</p>
        </div>
        <AppButton label="Kembali" variant="outline" @click="router.push('/letter/verification')" />
      </div>

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

      <section class="bg-white rounded-xl border p-5 space-y-4">
        <label class="block text-sm text-slate-600">Catatan Verifikasi
          <textarea v-model="notes" rows="4" class="mt-1 w-full border rounded-lg px-3 py-2" />
        </label>
        <div class="flex gap-3">
          <AppButton label="Tolak" variant="outline" :disabled="saving" @click="verify('rejected')" />
          <AppButton label="Verifikasi" :disabled="saving" @click="verify('verified')" />
        </div>
      </section>
    </div>
  </div>
</template>
