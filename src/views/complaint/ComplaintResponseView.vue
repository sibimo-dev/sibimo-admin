<script setup>
/**
 * Complaint Response View (Detail + Ubah Status)
 * Route name: complaint-response
 *
 * Field mengikuti tabel `complaints`: complaint_id, citizen_id, category,
 * title, description, status, submitted_at, resolved_at.
 *
 * NOTE: `nik`, `phone`, `address` di sini kemungkinan dari join ke tabel
 * `citizens`, dan `attachments` kemungkinan tabel relasi terpisah
 * (misal `complaint_attachments`). Perlu dikonfirmasi ke ERD backend.
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import AppButton from '@/components/common/AppButton.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isLoading = ref(false)
const isSaving = ref(false)

// ====== Status meta ======
const statusMeta = {
  submitted: { label: 'Menunggu', severity: 'warn' },
  in_progress: { label: 'Diproses', severity: 'info' },
  resolved: { label: 'Selesai', severity: 'success' },
  rejected: { label: 'Ditolak', severity: 'danger' },
}

const statusOptions = [
  { label: 'Menunggu', value: 'submitted' },
  { label: 'Diproses', value: 'in_progress' },
  { label: 'Selesai', value: 'resolved' },
  { label: 'Ditolak', value: 'rejected' },
]

// ====== Complaint detail ======
const complaint = reactive({
  complaint_id: null,
  complaint_code: '',
  submitted_at: '',
  status: 'submitted',
  reporter_name: '',
  nik: '',
  phone: '',
  address: '',
  category: '',
  location: '',
  description: '',
  attachments: [],
})

const selectedStatus = ref('submitted')

// ====== Timeline ======
const timeline = ref([
  { label: 'Laporan Diterima', time: '', note: 'Sistem menerima laporan secara otomatis.' },
])

// ====== Load data ======
onMounted(async () => {
  isLoading.value = true
  try {
    // TODO: replace with real API call
    // const data = await complaintService.getById(route.params.id)
    const dummy = {
      complaint_id: route.params.id,
      complaint_code: `#AD-2023-${String(route.params.id).padStart(3, '0')}`,
      submitted_at: '12 Oktober 2023, 14:30 WIB',
      status: 'submitted',
      reporter_name: 'Ghiska',
      nik: '3201012345678901',
      phone: '0812-3456-7890',
      address: 'Jl. Merdeka No. 45, RT 02/RW 03',
      category: 'Infrastruktur',
      location: 'RT 02',
      description:
        'Terdapat lubang besar di jalan utama desa dekat jembatan kayu yang membahayakan pengendara motor, terutama saat malam hari karena kurangnya penerangan di area tersebut. Mohon segera diperbaiki sebelum jatuh korban.',
      attachments: ['photo-1.jpg', 'photo-2.jpg'],
    }
    Object.assign(complaint, dummy)
    selectedStatus.value = dummy.status
    timeline.value[0].time = dummy.submitted_at.split(',')[0] + ', ' + dummy.submitted_at.split(',')[1]
  } finally {
    isLoading.value = false
  }
})

// ====== Save status ======
async function handleSave() {
  isSaving.value = true
  try {
    // TODO: replace with real API call
    // await complaintService.updateStatus(complaint.complaint_id, selectedStatus.value)
    await new Promise((resolve) => setTimeout(resolve, 600))
    complaint.status = selectedStatus.value
    toast.add({ severity: 'success', summary: 'Status aduan berhasil diperbarui', life: 2000 })
    router.push({ name: 'complaint-list' })
  } finally {
    isSaving.value = false
  }
}

function handlePrint() {
  window.print()
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-3 mb-1 print:hidden">
      <h1 class="text-2xl font-bold text-gray-800 m-0">Detail Aduan {{ complaint.complaint_code }}</h1>
      <Tag :value="statusMeta[complaint.status]?.label" :severity="statusMeta[complaint.status]?.severity" rounded />
    </div>
    <p class="text-sm text-gray-500 mb-6 print:hidden">Dibuat pada {{ complaint.submitted_at }}</p>

    <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
      <!-- ==================== MAIN CONTENT (LEFT) ==================== -->
      <div class="flex flex-col gap-5">
        <!-- Informasi Pelapor -->
        <Card>
          <template #content>
            <h2 class="flex items-center gap-2 text-base font-semibold text-gray-800 mb-4">
              <i class="pi pi-user text-gray-500"></i> Informasi Pelapor
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div class="text-xs text-gray-500 mb-1">Nama Lengkap</div>
                <div class="text-sm font-semibold text-gray-800">{{ complaint.reporter_name }}</div>
              </div>
              <div>
                <div class="text-xs text-gray-500 mb-1">NIK</div>
                <div class="text-sm font-semibold text-gray-800">{{ complaint.nik }}</div>
              </div>
              <div>
                <div class="text-xs text-gray-500 mb-1">No. Telepon</div>
                <div class="text-sm font-semibold text-gray-800">{{ complaint.phone }}</div>
              </div>
              <div>
                <div class="text-xs text-gray-500 mb-1">Alamat</div>
                <div class="text-sm font-semibold text-gray-800">{{ complaint.address }}</div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Isi Laporan -->
        <Card>
          <template #content>
            <h2 class="flex items-center gap-2 text-base font-semibold text-gray-800 mb-4">
              <i class="pi pi-file text-gray-500"></i> Isi Laporan
            </h2>

            <div class="flex items-center gap-2 mb-4">
              <Tag :value="`Kategori: ${complaint.category}`" severity="secondary" rounded />
              <Tag :value="`Lokasi: ${complaint.location}`" severity="secondary" rounded />
            </div>

            <p class="text-sm text-gray-700 leading-relaxed mb-6">{{ complaint.description }}</p>

            <h3 class="text-sm font-semibold text-gray-800 mb-3">Bukti Lampiran</h3>
            <div class="flex flex-wrap gap-3">
              <div
                v-for="(file, idx) in complaint.attachments"
                :key="idx"
                class="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400"
              >
                <i class="pi pi-image text-2xl"></i>
              </div>
              <div v-if="complaint.attachments.length === 0" class="text-sm text-gray-400">
                Tidak ada lampiran.
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- ==================== SIDEBAR (RIGHT) ==================== -->
      <div class="flex flex-col gap-4 print:hidden">
        <!-- Timeline -->
        <Card>
          <template #content>
            <h2 class="text-base font-semibold text-gray-800 mb-4">Tanggal Diupload</h2>
            <div v-for="(item, idx) in timeline" :key="idx" class="flex gap-3">
              <div class="flex flex-col items-center">
                <span class="w-2 h-2 rounded-full bg-gray-400 mt-1.5"></span>
              </div>
              <div class="flex-1 pb-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold text-gray-800">{{ item.label }}</span>
                  <span class="text-xs text-gray-400 whitespace-nowrap ml-2">{{ item.time }}</span>
                </div>
                <p class="text-xs text-gray-500 mt-1">{{ item.note }}</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Status & Tindakan -->
        <Card>
          <template #content>
            <h2 class="text-base font-semibold text-gray-800 mb-4">Status &amp; Tindakan</h2>

            <label class="block text-xs uppercase tracking-wide text-gray-400 mb-1">Ubah Status</label>
            <Select
              v-model="selectedStatus"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              class="w-full mb-3"
            />

            <AppButton
              label="Simpan Perubahan"
              variant="primary"
              class="w-full mb-2"
              :loading="isSaving"
              @click="handleSave"
            />

            <AppButton
              label="Cetak Laporan"
              icon="pi pi-print"
              variant="secondary"
              outlined
              class="w-full"
              @click="handlePrint"
            />
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>