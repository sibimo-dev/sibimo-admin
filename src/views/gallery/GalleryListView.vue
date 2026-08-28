<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

import Card from 'primevue/card'
import Button from 'primevue/button'
import AppButton from '@/components/common/AppButton.vue'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

import AppPagination from '@/components/common/AppPagination.vue'
import { useGalleryStore } from '@/stores/gallery.store'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()
const galleryStore = useGalleryStore()

const loading = ref(galleryStore.photos.length === 0)
const search = ref('')
const first = ref(0)
const rowsPerPage = 8

onMounted(async () => {
  const hasCachedPhotos = galleryStore.photos.length > 0
  loading.value = !hasCachedPhotos

  try {
    // Bila store sudah berisi data dari kunjungan sebelumnya, tampilkan
    // langsung dan segarkan dari API di background.
    const refresh = galleryStore.fetchAll()
    if (hasCachedPhotos) {
      loading.value = false
      await refresh
    } else {
      await refresh
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal memuat galeri',
      detail: error.response?.data?.message ?? 'Periksa koneksi backend.',
      life: 4000,
    })
  } finally {
    loading.value = false
  }
})

const filtered = computed(() => {
  if (!search.value.trim()) return galleryStore.photos
  const q = search.value.toLowerCase()
  return galleryStore.photos.filter((p) => p.title.toLowerCase().includes(q))
})

const paged = computed(() => filtered.value.slice(first.value, first.value + rowsPerPage))

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function goCreate() {
  router.push({ name: 'gallery-create' })
}

function goEdit(item) {
  router.push({ name: 'gallery-edit', params: { id: item.gallery_id } })
}

function handleDelete(item) {
  confirm.require({
    message: `Hapus foto "${item.title}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await galleryStore.remove(item.gallery_id)
      toast.add({ severity: 'success', summary: 'Foto berhasil dihapus', life: 2000 })
    },
  })
}
</script>

<template>
  <div class="min-h-full text-slate-800">
    <h1 class="m-0 mb-1 text-[22px] font-bold text-slate-900">
      Galeri Foto
    </h1>

    <p class="mb-5 text-sm text-slate-500">
      Kelola foto kegiatan &amp; dokumentasi desa.
    </p>

    <Card>
      <template #content>
        <div class="flex flex-col gap-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <Button
              label="Tambah Foto"
              icon="pi pi-plus"
              @click="goCreate"
            />

            <IconField>
              <InputIcon class="pi pi-search" />

              <InputText
                v-model="search"
                placeholder="Cari judul foto..."
                @update:modelValue="first = 0"
              />
            </IconField>
          </div>

          <!-- Loading state -->
          <div v-if="loading" class="py-14 text-center text-slate-400">
            <i class="pi pi-spin pi-spinner mb-3 block text-4xl text-slate-300" />
            Memuat foto...
          </div>

          <!-- Empty state -->
          <div v-else-if="paged.length === 0" class="py-14 text-center text-slate-400">
            <i class="pi pi-images mb-3 block text-4xl text-slate-300" />
            Belum ada foto yang cocok.
          </div>

          <!-- Grid kartu foto -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="item in paged"
              :key="item.gallery_id"
              class="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-primary-200 transition-all group"
            >
              <!-- Thumbnail -->
              <div class="aspect-[4/3] bg-slate-50 flex items-center justify-center relative overflow-hidden">
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.title"
                  class="w-full h-full object-cover"
                />
                <i v-else class="pi pi-image text-4xl text-slate-300" />

                <!-- Actions overlay -->
                <div
                  class="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100"
                >
                  <AppButton
                    icon="pi pi-pencil"
                    variant="outline"
                    rounded-icon
                    class="!bg-white"
                    aria-label="Edit foto"
                    title="Edit"
                    @click="goEdit(item)"
                  />
                  <AppButton
                    icon="pi pi-trash"
                    variant="danger-ghost"
                    rounded-icon
                    class="!bg-white"
                    aria-label="Hapus foto"
                    title="Hapus"
                    @click="handleDelete(item)"
                  />
                </div>
              </div>

              <!-- Info -->
              <div class="p-3">
                <p class="text-sm font-semibold text-slate-900 truncate">{{ item.title }}</p>
                <p class="text-xs text-slate-400 mt-1">{{ formatDate(item.uploaded_at) }}</p>
              </div>
            </div>
          </div>

          <div v-if="filtered.length > rowsPerPage">
            <AppPagination
              :total="filtered.length"
              :rows="rowsPerPage"
              :first="first"
              @page="({ first: f }) => (first = f)"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
