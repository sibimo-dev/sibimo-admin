<script setup>
/**
 * VillageProfileFormView - form tambah/edit generik, dipakai bertiga
 * oleh Sejarah, Visi & Misi, Struktur Organisasi (lihat penjelasan
 * di VillageProfileListView.vue kenapa dibuat reusable).
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import AppTextarea from '@/components/common/AppTextarea.vue'
import { SECTION_MAP, profileContents } from './villageProfileData'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const section = computed(() => SECTION_MAP[route.meta.sectionSlug])
const isEdit = computed(() => !!route.params.id)
const saving = ref(false)

const statusOptions = [
  { label: 'Draft', value: 'Draft' },
  { label: 'Terbitkan', value: 'Published' },
]

const form = reactive({
  profile_content_id: null,
  title: '',
  content: '',
  status: 'Draft',
  published_at: null,
  photo_file: null, // File asli yang dipilih user (opsional) -- ini yang dikirim ke API, bukan `photoPreview`
})

// --- Upload Foto (opsional) ---
const photoPreview = ref(null) // data URL untuk preview gambar
const fileInput = ref(null)

function pickFile() {
  fileInput.value?.click()
}

function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  form.photo_file = file
  const reader = new FileReader()
  reader.onload = () => {
    photoPreview.value = reader.result
  }
  reader.readAsDataURL(file)
}

function removePhoto() {
  photoPreview.value = null
  form.photo_file = null
  if (fileInput.value) fileInput.value.value = ''
}
// --- end Upload Foto ---

onMounted(() => {
  if (isEdit.value) {
    const existing = profileContents.value.find(
      (c) => c.profile_content_id === Number(route.params.id),
    )
    if (existing) {
      Object.assign(form, existing)
      // kalau data lama sudah punya foto, tampilkan sebagai preview
      if (existing.photo_url) {
        photoPreview.value = existing.photo_url
      }
    }
  }
})

async function handleSave() {
  if (!form.title.trim()) {
    toast.add({ severity: 'error', summary: 'Judul wajib diisi', life: 2500 })
    return
  }

  saving.value = true
  try {
    // Kalau status diubah ke Published dan belum ada published_at, isi otomatis hari ini.
    if (form.status === 'Published' && !form.published_at) {
      form.published_at = new Date().toISOString().slice(0, 10)
    }

    // Foto opsional -- kolom `photo` di DB (kalau ada) isinya path/URL hasil
    // upload, bukan base64, jadi file aslinya (form.photo_file) sebaiknya
    // dikirim lewat FormData, bukan disatukan ke payload JSON biasa.
    const payload = new FormData()
    payload.append('section_id', section.value.section_id)
    payload.append('title', form.title)
    payload.append('content', form.content)
    payload.append('status', form.status)
    payload.append('published_at', form.published_at ?? '')
    if (form.photo_file) payload.append('photo', form.photo_file)

    // TODO: ganti dengan panggilan ke profileContent.service.js (create/update),
    // kirim `payload` (FormData) di atas.
    const plainPayload = {
      section_id: section.value.section_id,
      title: form.title,
      content: form.content,
      status: form.status,
      published_at: form.published_at,
    }
    if (isEdit.value) {
      const idx = profileContents.value.findIndex((c) => c.profile_content_id === form.profile_content_id)
      profileContents.value[idx] = { ...profileContents.value[idx], ...plainPayload }
    } else {
      profileContents.value.push({ ...plainPayload, profile_content_id: Date.now() })
    }

    toast.add({ severity: 'success', summary: 'Berhasil disimpan', life: 2000 })
    router.push({ name: `village-profile-${route.meta.sectionSlug}-list` })
  } finally {
    saving.value = false
  }
}

function batal() {
  router.push({ name: `village-profile-${route.meta.sectionSlug}-list` })
}
</script>

<template>
  <div>
    <h1 class="page-title">{{ isEdit ? 'Edit' : 'Tambah' }} {{ section.label }}</h1>
    <p class="page-subtitle">Isi konten {{ section.label.toLowerCase() }} desa</p>

    <div class="card max-w-3xl">
      <div class="flex flex-col gap-4">
        <AppInput v-model="form.title" label="Judul" required />
        <AppTextarea v-model="form.content" label="Isi Konten" :rows="8" />

        <!-- Upload Foto (opsional).
             Markup & class SAMA PERSIS dengan dropzone di form Gallery. -->
        <div>
          <label class="text-sm font-medium text-neutral-700 block mb-1">Foto (opsional)</label>

          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileChange"
          />

          <div
            v-if="!photoPreview"
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
            <img :src="photoPreview" alt="Preview foto" class="w-full max-h-64 object-cover" />
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
                @click="removePhoto"
              />
            </div>
          </div>
        </div>

        <AppSelect v-model="form.status" label="Status" :options="statusOptions" required />
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <AppButton label="Batal" variant="ghost" @click="batal" />
        <AppButton label="Simpan" variant="primary" :loading="saving" @click="handleSave" />
      </div>
    </div>
  </div>
</template>