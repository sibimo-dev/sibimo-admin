<script setup>
import { ref, reactive, computed } from 'vue'
import { useToast } from 'primevue/usetoast'

import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Card from 'primevue/card'
import FileUpload from 'primevue/fileupload'

// TODO: API sejarah sudah direvisi dan bentuknya beda dari sebelumnya.
// Sengaja TIDAK di-import dulu supaya halaman ini tidak error.
// Saat API baru siap, sambungkan lagi di sini, mis:
// import { getHistory, saveHistory } from '@/services/profile.service'

const toast = useToast()
const saving = ref(false)

const MIN_MILESTONES_TO_PUBLISH = 2

const isEdit = computed(() => !!form.history_id)
const pageTitle = computed(() => (isEdit.value ? 'Edit Sejarah' : 'Tambah Sejarah'))
const mainButtonLabel = computed(() => (isEdit.value ? 'Perbarui' : 'Terbitkan'))

const statusOptions = [
  { label: 'Draft', value: 'Draft' },
  { label: 'Terbit', value: 'Published' },
]

/* ---- Data lokal, kosong sampai API baru tersambung ---- */
const form = reactive({
  history_id: null,
  year: '',
  title: '',
  status: 'Draft',
  published_at: null,
  milestones: [],
  balai_desa_photo_file: null,
  kegiatan_warga_photo_file: null,
})

const statusOpen = ref(true)
const statusDisplay = computed(() => (
  statusOptions.find((item) => item.value === form.status)?.label ?? form.status
))

/* ---- Paragraf Sejarah (milestone): tambah / hapus / ubah urutan ---- */
const newMilestone = ref('')

function addMilestone() {
  const text = newMilestone.value.trim()
  if (!text) return
  form.milestones.push({ id: `milestone-${crypto.randomUUID()}`, text })
  newMilestone.value = ''
}

function removeMilestone(index) {
  form.milestones.splice(index, 1)
}

function moveMilestone(index, direction) {
  const target = index + direction
  if (target < 0 || target >= form.milestones.length) return
  const list = form.milestones
  ;[list[index], list[target]] = [list[target], list[index]]
}

/* ---- Upload Foto: dua slot terpisah, dibuat generik lewat factory function
     supaya logikanya tidak diduplikasi dua kali ---- */
function usePhotoSlot(initialUrl, formKey) {
  const preview = ref(initialUrl || null)
  const uploadRef = ref(null)

  function handleSelect(event) {
    const file = event.files?.[0]
    if (!file) return
    form[formKey] = file
    const reader = new FileReader()
    reader.onload = () => { preview.value = reader.result }
    reader.readAsDataURL(file)
  }

  function handleValidationError(event) {
    const message = event.files?.[0]?.name
      ? `File "${event.files[0].name}" tidak valid (format/ukuran tidak sesuai)`
      : 'File tidak valid'
    toast.add({ severity: 'error', summary: message, life: 3000 })
  }

  function change(removeFileCallback) {
    removeFileCallback?.(0)
    uploadRef.value?.choose()
  }

  function remove(removeFileCallback) {
    removeFileCallback?.(0)
    preview.value = null
    form[formKey] = null
  }

  return { preview, uploadRef, handleSelect, handleValidationError, change, remove }
}

const balaiDesaPhoto = usePhotoSlot(null, 'balai_desa_photo_file')
const kegiatanWargaPhoto = usePhotoSlot(null, 'kegiatan_warga_photo_file')
/* ---- end Upload Foto ---- */

function loadExisting(history) {
  if (!history) return

  const photos = Array.isArray(history.photos) ? history.photos : []
  Object.assign(form, {
    history_id: history.history_id,
    year: history.year_founded ?? '',
    title: history.title ?? '',
    status: history.status ?? 'Draft',
    published_at: history.published_at ?? null,
    milestones: (Array.isArray(history.points) ? history.points : []).map((text) => ({
      id: `milestone-${crypto.randomUUID()}`,
      text: text ?? '',
    })),
    balai_desa_photo_file: null,
    kegiatan_warga_photo_file: null,
  })
  balaiDesaPhoto.preview.value = photos[0] ?? null
  kegiatanWargaPhoto.preview.value = photos[1] ?? null
}

onMounted(async () => {
  try {
    const histories = await getHistories()
    loadExisting(histories[0])
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: error.response?.data?.message ?? 'Gagal memuat data sejarah',
      life: 3000,
    })
  }
})

async function persist(nextStatus) {
  const milestoneTexts = form.milestones.map((m) => m.text.trim()).filter(Boolean)

  if (!form.title.trim()) {
    toast.add({ severity: 'error', summary: 'Judul wajib diisi', life: 2500 })
    return
  }

  if (!String(form.year).trim()) {
    toast.add({ severity: 'error', summary: 'Tahun berdiri wajib diisi', life: 2500 })
    return
  }

  if (milestoneTexts.length === 0) {
    toast.add({ severity: 'error', summary: 'Minimal isi 1 paragraf sejarah', life: 2500 })
    return
  }

  if (nextStatus === 'Published' && milestoneTexts.length < MIN_MILESTONES_TO_PUBLISH) {
    toast.add({
      severity: 'error',
      summary: `Minimal ${MIN_MILESTONES_TO_PUBLISH} paragraf sejarah untuk menerbitkan`,
      life: 2500,
    })
    return
  }

  form.status = nextStatus
  saving.value = true
  try {
    if (form.status === 'Published' && !form.published_at) {
      form.published_at = new Date().toISOString().slice(0, 10)
    }

    const files = []
    if (form.balai_desa_photo_file) {
      files.push({ token: 'balai-desa', file: form.balai_desa_photo_file })
    }
    if (form.kegiatan_warga_photo_file) {
      files.push({ token: 'kegiatan-warga', file: form.kegiatan_warga_photo_file })
    }

    const saved = await saveHistory({
      id: form.history_id,
      payload: {
        title: form.title.trim(),
        year_founded: form.year,
        status: form.status,
        published_at: form.published_at,
        points: milestoneTexts,
        photos: [
          form.balai_desa_photo_file ? 'upload:balai-desa' : balaiDesaPhoto.preview.value,
          form.kegiatan_warga_photo_file ? 'upload:kegiatan-warga' : kegiatanWargaPhoto.preview.value,
        ],
      },
      files,
    })
    loadExisting(saved)
    toast.add({ severity: 'success', summary: 'Berhasil disimpan', life: 2000 })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: error.response?.data?.message ?? 'Gagal menyimpan data sejarah',
      life: 3000,
    })
  } finally {
    saving.value = false
  }
}

function saveDraft() { persist('Draft') }
function saveMain() { persist(isEdit.value ? form.status : 'Published') }
</script>

<template>
  <div class="min-h-full text-slate-800">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 class="m-0 text-[22px] font-bold text-slate-900">{{ pageTitle }}</h1>
    </div>

    <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Card>
        <template #content>
          <div class="flex flex-col gap-6">
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_140px]">
              <div class="flex flex-col gap-2">
                <label for="title" class="text-[13px] font-semibold text-slate-700">Judul</label>
                <InputText id="title" v-model="form.title" placeholder="Judul" fluid />
              </div>
              <div class="flex flex-col gap-2">
                <label for="year" class="text-[13px] font-semibold text-slate-700">Tahun</label>
                <InputText id="year" v-model="form.year" placeholder="cth. 1946" fluid />
              </div>
            </div>

            <!-- MILESTONE: list custom -->
            <div class="flex flex-col gap-2">
              <label class="text-[13px] font-semibold text-slate-700">Paragraf Sejarah</label>
              <p class="-mt-1 text-xs text-slate-400">
                Setiap paragraf tampil sebagai satu titik pada garis waktu di halaman publik. Gunakan tombol panah untuk mengubah urutan. Minimal {{ MIN_MILESTONES_TO_PUBLISH }} paragraf untuk dapat diterbitkan.
              </p>

              <div class="flex flex-col gap-2 rounded-xl border border-slate-200 p-2">
                <div
                  v-for="(item, index) in form.milestones"
                  :key="item.id"
                  class="flex items-start gap-2 rounded-lg p-1.5 hover:bg-slate-50"
                >
                  <span class="mt-1.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-amber-100 text-[11px] font-semibold text-amber-700">
                    {{ index + 1 }}
                  </span>

                  <Textarea
                    v-model="item.text"
                    autoResize
                    rows="2"
                    class="min-h-[3rem] flex-1"
                    placeholder="Tulis satu paragraf sejarah"
                  />

                  <div class="flex flex-none flex-col gap-1">
                    <Button icon="pi pi-chevron-up" text rounded size="small" severity="secondary" :disabled="index === 0" aria-label="Naikkan urutan" @click="moveMilestone(index, -1)" />
                    <Button icon="pi pi-chevron-down" text rounded size="small" severity="secondary" :disabled="index === form.milestones.length - 1" aria-label="Turunkan urutan" @click="moveMilestone(index, 1)" />
                  </div>

                  <Button icon="pi pi-trash" text rounded size="small" severity="danger" aria-label="Hapus paragraf" @click="removeMilestone(index)" />
                </div>

                <p v-if="form.milestones.length === 0" class="py-6 text-center text-sm text-slate-400">
                  Belum ada paragraf. Tambahkan dari kolom di bawah.
                </p>
              </div>

              <div class="mt-1 flex gap-2">
                <Textarea v-model="newMilestone" autoResize rows="1" fluid placeholder="Tambah paragraf sejarah baru" @keydown.enter.exact.prevent="addMilestone" />
                <Button icon="pi pi-plus" label="Tambah" class="flex-none self-start" @click="addMilestone" />
              </div>
            </div>

            <!-- FOTO: dua slot terpisah, sesuai dua Card placeholder di publik -->
            <div class="flex flex-col gap-3">
              <label class="text-[13px] font-semibold text-slate-700">Foto</label>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <!-- Foto Balai Desa -->
                <div class="flex flex-col gap-2">
                  <span class="text-xs font-medium text-slate-500">Foto Balai Desa</span>

                  <FileUpload
                    :ref="(el) => (balaiDesaPhoto.uploadRef.value = el)"
                    mode="advanced"
                    accept="image/*"
                    :maxFileSize="5000000"
                    :multiple="false"
                    :auto="false"
                    :showUploadButton="false"
                    :showCancelButton="false"
                    customUpload
                    :pt="{
                      root: { class: 'border-none bg-transparent p-0' },
                      header: { class: 'hidden' },
                      content: { class: 'border-none bg-transparent p-0' },
                    }"
                    @select="balaiDesaPhoto.handleSelect"
                    @file-validation-failed="balaiDesaPhoto.handleValidationError"
                  >
                    <template #empty>
                      <div
                        v-if="!balaiDesaPhoto.preview.value"
                        class="rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/40 flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-primary-50 transition-colors"
                        @click="balaiDesaPhoto.uploadRef.value?.choose()"
                      >
                        <i class="pi pi-cloud-upload text-2xl text-primary-400 mb-2" />
                        <p class="text-xs text-slate-600 m-0 text-center px-2">
                          <span class="text-primary-600 font-medium">Klik untuk unggah</span> foto balai desa
                        </p>
                        <p class="text-[11px] text-slate-400 mt-1">PNG, JPG, maks. 5MB</p>
                      </div>
                    </template>

                    <template #content="{ removeFileCallback }">
                      <div v-if="balaiDesaPhoto.preview.value" class="relative overflow-hidden rounded-xl border border-slate-200 group">
                        <img :src="balaiDesaPhoto.preview.value" alt="Preview foto balai desa" class="h-40 w-full object-cover" />
                        <div class="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <Button icon="pi pi-refresh" severity="secondary" rounded aria-label="Ganti foto" @click="balaiDesaPhoto.change(removeFileCallback)" />
                          <Button icon="pi pi-trash" severity="danger" rounded aria-label="Hapus foto" @click="balaiDesaPhoto.remove(removeFileCallback)" />
                        </div>
                      </div>
                    </template>
                  </FileUpload>
                </div>

                <!-- Foto Kegiatan Warga -->
                <div class="flex flex-col gap-2">
                  <span class="text-xs font-medium text-slate-500">Foto Kegiatan Warga</span>

                  <FileUpload
                    :ref="(el) => (kegiatanWargaPhoto.uploadRef.value = el)"
                    mode="advanced"
                    accept="image/*"
                    :maxFileSize="5000000"
                    :multiple="false"
                    :auto="false"
                    :showUploadButton="false"
                    :showCancelButton="false"
                    customUpload
                    :pt="{
                      root: { class: 'border-none bg-transparent p-0' },
                      header: { class: 'hidden' },
                      content: { class: 'border-none bg-transparent p-0' },
                    }"
                    @select="kegiatanWargaPhoto.handleSelect"
                    @file-validation-failed="kegiatanWargaPhoto.handleValidationError"
                  >
                    <template #empty>
                      <div
                        v-if="!kegiatanWargaPhoto.preview.value"
                        class="rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/40 flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-primary-50 transition-colors"
                        @click="kegiatanWargaPhoto.uploadRef.value?.choose()"
                      >
                        <i class="pi pi-cloud-upload text-2xl text-primary-400 mb-2" />
                        <p class="text-xs text-slate-600 m-0 text-center px-2">
                          <span class="text-primary-600 font-medium">Klik untuk unggah</span> foto kegiatan warga
                        </p>
                        <p class="text-[11px] text-slate-400 mt-1">PNG, JPG, maks. 5MB</p>
                      </div>
                    </template>

                    <template #content="{ removeFileCallback }">
                      <div v-if="kegiatanWargaPhoto.preview.value" class="relative overflow-hidden rounded-xl border border-slate-200 group">
                        <img :src="kegiatanWargaPhoto.preview.value" alt="Preview foto kegiatan warga" class="h-40 w-full object-cover" />
                        <div class="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <Button icon="pi pi-refresh" severity="secondary" rounded aria-label="Ganti foto" @click="kegiatanWargaPhoto.change(removeFileCallback)" />
                          <Button icon="pi pi-trash" severity="danger" rounded aria-label="Hapus foto" @click="kegiatanWargaPhoto.remove(removeFileCallback)" />
                        </div>
                      </div>
                    </template>
                  </FileUpload>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <aside class="flex flex-col gap-3.5">
        <Card>
          <template #content>
            <div class="flex gap-2.5">
              <Button label="Simpan Draft" severity="secondary" outlined class="flex-1" :loading="saving" @click="saveDraft" />
              <Button :label="mainButtonLabel" class="flex-1" :loading="saving" @click="saveMain" />
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-3">
              <button type="button" class="flex items-center justify-between text-left text-[13px] text-slate-700" @click="statusOpen = !statusOpen">
                <span>Status: <strong>{{ statusDisplay }}</strong></span>
                <i class="pi pi-chevron-down text-xs text-slate-400 transition-transform" :class="{ 'rotate-180': statusOpen }" />
              </button>
              <Select v-show="statusOpen" v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value" fluid />
            </div>
          </template>
        </Card>
      </aside>
    </div>
  </div>
</template>