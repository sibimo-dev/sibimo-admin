<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import AppButton from '@/components/common/AppButton.vue'
import { useLetterStore } from '@/stores/useLetterStore'
import { useLetterTypeStore } from '@/stores/useLetterTypeStore'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const letterStore = useLetterStore()
const typeStore = useLetterTypeStore()

const record = ref(null)
const selectedSignerId = ref(null)
const signatureType = ref('manual')
const loading = ref(true)
const saving = ref(false)

const signerOptions = computed(() => typeStore.signers.value)

onMounted(async () => {
  try {
    await typeStore.fetchSigners()
    record.value = await letterStore.fetchById(route.params.id)
    selectedSignerId.value = record.value?.letter_type?.signer_id ?? null
    signatureType.value = record.value?.backendStatus === 'authorized'
      ? record.value.signatureType.toLowerCase()
      : 'manual'
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal memuat detail otorisasi', life: 3000 })
  } finally {
    loading.value = false
  }
})

async function authorize() {
  if (!record.value || !selectedSignerId.value) {
    toast.add({ severity: 'warn', summary: 'Pilih penandatangan terlebih dahulu', life: 2500 })
    return
  }

  saving.value = true
  try {
    record.value = await letterStore.authorizeSurat(record.value.id, {
      status: 'authorized',
      authorized_by_signer_id: selectedSignerId.value,
      signature_type: signatureType.value,
    })
    toast.add({ severity: 'success', summary: 'Surat berhasil diotorisasi', life: 2200 })
    router.push({ name: 'letter-list', query: { highlight: record.value.requestId } })
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
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div v-if="loading" class="p-6 text-sm text-slate-500">Memuat detail...</div>
    <div v-else-if="!record" class="p-6 text-center text-slate-500">Data surat tidak ditemukan.</div>
    <div v-else class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-slate-800">Otorisasi Surat</h1>
          <p class="text-sm text-slate-500 mt-1">{{ record.requestId }} · {{ record.purpose }}</p>
        </div>
        <AppButton label="Kembali" variant="outline" @click="router.push('/letter/authorization')" />
      </div>

      <section class="bg-white rounded-xl border p-5">
        <h2 class="font-semibold text-slate-800 mb-4">Data Pengajuan</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><span class="text-slate-500">Nama:</span> {{ record.citizenName }}</div>
          <div><span class="text-slate-500">NIK:</span> {{ record.citizenId }}</div>
          <div><span class="text-slate-500">Jenis Surat:</span> {{ record.purpose }}</div>
          <div><span class="text-slate-500">Status:</span> {{ record.status }}</div>
          <div><span class="text-slate-500">Catatan:</span> {{ record.notes || '-' }}</div>
          <div><span class="text-slate-500">Nomor Surat:</span> {{ record.letterNumber || 'Belum diterbitkan' }}</div>
        </div>
      </section>

      <section class="bg-white rounded-xl border p-5 space-y-4">
        <label class="block text-sm text-slate-600">Penandatangan
          <select v-model="selectedSignerId" class="mt-1 w-full border rounded-lg px-3 py-2">
            <option :value="null">Pilih penandatangan</option>
            <option v-for="signer in signerOptions" :key="signer.staff_id" :value="signer.staff_id">
              {{ signer.name }} - {{ signer.position }}
            </option>
          </select>
        </label>
        <label class="block text-sm text-slate-600">Jenis Tanda Tangan
          <select v-model="signatureType" class="mt-1 w-full border rounded-lg px-3 py-2">
            <option value="digital">Digital</option>
            <option value="manual">Manual</option>
          </select>
        </label>
        <AppButton label="Simpan Otorisasi" :disabled="saving" @click="authorize" />
      </section>
    </div>
  </div>
</template>
