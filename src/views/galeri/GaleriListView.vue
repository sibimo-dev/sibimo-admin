<script setup>
/**
 * Galeri Foto - halaman list.
 * Beda dari modul lain (tipe surat, dll) yang pakai AppDataTable,
 * di sini pakai grid kartu + AppPagination -- lebih pas untuk foto
 * (lihat catatan di AppPagination.vue).
 *
 * Field mengikuti tabel `galleries`: gallery_id (PK), title, description,
 * image, uploaded_by, uploaded_at. TIDAK ada kolom kategori di skema --
 * jadi field itu sengaja tidak ada di sini (lihat catatan di
 * GaleriFormView.vue kalau memang butuh kategori, kolomnya perlu
 * ditambahkan dulu di migrasi/ERD).
 *
 * TODO: ganti dummy `allPhotos` dengan panggilan ke galeri.service.js
 * begitu backend siap (fetchGaleri({ search, offset, limit })).
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import AppButton from '@/components/common/AppButton.vue'
import AppPagination from '@/components/common/AppPagination.vue'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

// Data dummy -- ganti dengan data asli dari API begitu backend siap.
// Field persis kolom tabel `galleries`.
const allPhotos = ref([
  { gallery_id: 1, title: 'Kerja Bakti Balai Desa', image: null, uploaded_at: '2026-07-02T08:00:00' },
  { gallery_id: 2, title: 'Panen Raya Padi', image: null, uploaded_at: '2026-06-18T09:30:00' },
  { gallery_id: 3, title: 'Perayaan HUT RI', image: null, uploaded_at: '2026-08-17T07:00:00' },
  { gallery_id: 4, title: 'Posyandu Balita', image: null, uploaded_at: '2026-05-10T10:15:00' },
  { gallery_id: 5, title: 'Pembangunan Jalan Dusun', image: null, uploaded_at: '2026-04-22T13:00:00' },
  { gallery_id: 6, title: 'Pelatihan UMKM', image: null, uploaded_at: '2026-03-15T14:45:00' },
])

const search = ref('')
const first = ref(0)
const rowsPerPage = 8

const filtered = computed(() => {
  if (!search.value.trim()) return allPhotos.value
  const q = search.value.toLowerCase()
  return allPhotos.value.filter((p) => p.title.toLowerCase().includes(q))
})

const paged = computed(() => filtered.value.slice(first.value, first.value + rowsPerPage))

function formatTanggal(iso) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function goTambah() {
  router.push({ name: 'galeri-tambah' })
}

function goEdit(item) {
  router.push({ name: 'galeri-edit', params: { id: item.gallery_id } })
}

function handleDelete(item) {
  confirm.require({
    message: `Hapus foto "${item.title}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: () => {
      allPhotos.value = allPhotos.value.filter((p) => p.gallery_id !== item.gallery_id)
      toast.add({ severity: 'success', summary: 'Foto berhasil dihapus', life: 2000 })
    },
  })
}
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div>
        <h1 class="page-title">Galeri Foto</h1>
        <p class="page-subtitle mb-0">Kelola foto kegiatan &amp; dokumentasi desa</p>
      </div>
      <AppButton label="Tambah Foto" icon="pi pi-plus" variant="primary" @click="goTambah" />
    </div>

    <!-- Search bar -->
    <div class="relative mb-5 max-w-sm">
      <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" />
      <InputText
        v-model="search"
        placeholder="Cari judul foto..."
        class="w-full !pl-9"
        @update:modelValue="first = 0"
      />
    </div>

    <!-- Empty state -->
    <div v-if="paged.length === 0" class="card text-center py-14">
      <i class="pi pi-images text-4xl text-primary-200 mb-3 block" />
      <p class="text-neutral-500 text-sm">Belum ada foto yang cocok.</p>
    </div>

    <!-- Grid kartu foto -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="item in paged"
        :key="item.gallery_id"
        class="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-md hover:border-primary-200 transition-all group"
      >
        <!-- Thumbnail -->
        <div class="aspect-[4/3] bg-primary-50 flex items-center justify-center relative overflow-hidden">
          <img
            v-if="item.image"
            :src="item.image"
            :alt="item.title"
            class="w-full h-full object-cover"
          />
          <i v-else class="pi pi-image text-4xl text-primary-200" />

          <!-- Actions overlay -->
          <div
            class="absolute inset-0 bg-primary-900/0 group-hover:bg-primary-900/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100"
          >
            <AppButton
              icon="pi pi-pencil"
              variant="secondary"
              rounded
              aria-label="Edit foto"
              @click="goEdit(item)"
            />
            <AppButton
              icon="pi pi-trash"
              variant="danger"
              rounded
              aria-label="Hapus foto"
              @click="handleDelete(item)"
            />
          </div>
        </div>

        <!-- Info -->
        <div class="p-3">
          <p class="text-sm font-semibold text-neutral-900 truncate">{{ item.title }}</p>
          <p class="text-xs text-neutral-400 mt-1">{{ formatTanggal(item.uploaded_at) }}</p>
        </div>
      </div>
    </div>

    <div class="mt-6" v-if="filtered.length > rowsPerPage">
      <AppPagination
        :total="filtered.length"
        :rows="rowsPerPage"
        :first="first"
        @page="({ first: f }) => (first = f)"
      />
    </div>
  </div>
</template>