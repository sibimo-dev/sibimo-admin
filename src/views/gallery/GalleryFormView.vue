<script setup>
/**
 * Form Gallery - dipakai untuk 2 route sekaligus:
 *   - /gallery/create   (gallery-create) -> mode tambah, route.params.id kosong
 *   - /gallery/:id/edit (gallery-edit)   -> mode edit, ambil data dari id
 *

 * TODO: ganti dummy `dummyGalleryPhoto` & handleSubmit dengan panggilan asli ke
 * gallery.service.js (fetchGalleryById, createGallery, updateGallery). Untuk
 * createGallery/updateGallery, kirim sebagai FormData karena ada file gambar.
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth.store'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppTextarea from '@/components/common/AppTextarea.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const isEdit = computed(() => !!route.params.id)
const saving = ref(false)
const preview = ref(null) // data URL untuk preview gambar
const fileInput = ref(null)

const form = reactive({
  title: '',
  description: '',
  image_file: null, // File asli yang dipilih user -- ini yang dikirim ke API, bukan `preview`
  uploaded_at: null, // cuma dipakai buat DITAMPILKAN saat edit, tidak dikirim ulang
})

const errors = reactive({ title: '' })

// Data dummy -- ganti dengan fetch API asli berdasarkan route.params.id
const dummyGalleryPhoto = {
  gallery_id: 1,
  title: 'Kerja Bakti Balai Desa',
  description: 'Kegiatan kerja bakti rutin warga dusun dalam rangka persiapan HUT Desa.',
  image: null,
  uploaded_by: 4,
  uploaded_at: '2026-07-02T08:00:00',
}

onMounted(() => {
  if (isEdit.value) {
    // TODO: fetchGaleriById(route.params.id)
    form.title = dummyGalleryPhoto.title
    form.description = dummyGalleryPhoto.description
    form.uploaded_at = dummyGalleryPhoto.uploaded_at
    preview.value = dummyGalleryPhoto.image
  }
})

function pickFile() {
  fileInput.value?.click()
}

function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  form.image_file = file
  const reader = new FileReader()
  reader.onload = () => {
    preview.value = reader.result
  }
  reader.readAsDataURL(file)
}

function removeImage() {
  preview.value = null
  form.image_file = null
  if (fileInput.value) fileInput.value.value = ''
}

function validate() {
  errors.title = form.title.trim() ? '' : 'Judul foto wajib diisi'
  return !errors.title
}

async function handleSubmit() {
  if (!validate()) return
  saving.value = true
  try {
    // Kolom `image` di DB isinya path/URL hasil upload, bukan base64 --
    // jadi file aslinya (form.image_file) dikirim lewat FormData, dan
    // uploaded_by diambil dari admin yang sedang login, bukan dari form.
    const payload = new FormData()
    payload.append('title', form.title)
    payload.append('description', form.description)
    payload.append('uploaded_by', authStore.user?.id ?? '')
    if (form.image_file) payload.append('image', form.image_file)

    // TODO: panggil createGaleri(payload) atau updateGaleri(route.params.id, payload)
    await new Promise((r) => setTimeout(r, 500))
    toast.add({
      severity: 'success',
      summary: isEdit.value ? 'Foto berhasil diperbarui' : 'Foto berhasil ditambahkan',
      life: 2000,
    })
    router.push({ name: 'gallery-list' })
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  router.push({ name: 'gallery-list' })
}
</script>

<template>
  <div class="max-w-2xl">
    <div class="flex items-center gap-3 mb-5">
      <AppButton icon="pi pi-arrow-left" variant="ghost" rounded aria-label="Kembali" @click="handleCancel" />
      <div>
        <h1 class="page-title mb-0">{{ isEdit ? 'Edit Foto' : 'Tambah Foto' }}</h1>
        <p class="page-subtitle mb-0">
          {{ isEdit ? 'Perbarui informasi foto galeri' : 'Unggah foto baru ke galeri desa' }}
        </p>
      </div>
    </div>

    <form class="card flex flex-col gap-5" @submit.prevent="handleSubmit">
      <!-- Upload gambar -->
      <div>
        <label class="text-sm font-medium text-neutral-700 block mb-1">
          Foto <span class="text-danger-500">*</span>
        </label>

        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileChange"
        />

        <div
          v-if="!preview"
          class="border-2 border-dashed border-primary-200 bg-primary-50/40 rounded-xl flex flex-col items-center justify-center py-10 cursor-pointer hover:bg-primary-50 transition-colors"
          @click="pickFile"
        >
          <i class="pi pi-cloud-upload text-3xl text-primary-400 mb-2" />
          <p class="text-sm text-neutral-600">
            <span class="text-primary-600 font-medium">Klik untuk unggah</span> atau seret foto ke sini
          </p>
          <p class="text-xs text-neutral-400 mt-1">PNG, JPG, maks. 5MB</p>
        </div>

        <div v-else class="relative rounded-xl overflow-hidden border border-neutral-200 group">
          <img :src="preview" alt="Preview foto" class="w-full max-h-64 object-cover" />
          <div
            class="absolute inset-0 bg-primary-900/0 group-hover:bg-primary-900/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100"
          >
            <AppButton
              type="button"
              icon="pi pi-refresh"
              variant="secondary"
              rounded
              aria-label="Ganti foto"
              @click="pickFile"
            />
            <AppButton
              type="button"
              icon="pi pi-trash"
              variant="danger"
              rounded
              aria-label="Hapus foto"
              @click="removeImage"
            />
          </div>
        </div>
      </div>

      <AppInput v-model="form.title" label="Judul Foto" placeholder="Contoh: Kerja Bakti Balai Desa" :error="errors.title" required />

      <AppInput
        v-if="isEdit"
        label="Diunggah Pada"
        :model-value="new Date(form.uploaded_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })"
        disabled
      />

      <AppTextarea
        v-model="form.description"
        label="Deskripsi"
        placeholder="Deskripsi atau keterangan singkat dari foto (opsional)"
        :rows="4"
      />

      <div class="flex justify-end gap-2 pt-2 border-t border-neutral-100">
        <AppButton label="Batal" variant="ghost" type="button" @click="handleCancel" />
        <AppButton
          :label="isEdit ? 'Simpan Perubahan' : 'Tambah Foto'"
          variant="primary"
          type="submit"
          :loading="saving"
        />
      </div>
    </form>
  </div>
</template>