<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'

import InputText from 'primevue/inputtext'
import Editor from 'primevue/editor'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Card from 'primevue/card'

import { SECTION_MAP, profileContents } from './villageProfileData'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const section = computed(() => SECTION_MAP[route.meta.sectionSlug])
const isEdit = computed(() => !!route.params.id)
const saving = ref(false)

const pageTitle = computed(() => (
  isEdit.value ? `Edit ${section.value.label}` : `Tambah ${section.value.label}`
))

const mainButtonLabel = computed(() => (
  isEdit.value ? 'Perbarui' : 'Terbitkan'
))

const statusOptions = [
  { label: 'Draft', value: 'Draft' },
  { label: 'Terbit', value: 'Published' },
]

const form = reactive({
  profile_content_id: null,
  title: '',
  content: '',
  status: 'Draft',
  published_at: null,
  photo_file: null, // File asli yang dipilih user (opsional) -- ini yang dikirim ke API, bukan `photoPreview`
})

const statusOpen = ref(true)
const statusDisplay = computed(() => (
  statusOptions.find((item) => item.value === form.status)?.label ?? form.status
))

// Class pass-through untuk area konten Editor -- fix bug bawaan PrimeVue Editor
// (Quill v2) di mana bullet list ikut tampil sebagai angka. Ditangani lewat
// Tailwind arbitrary variant, bukan <style> terpisah.
const editorContentClass =
  "[&_.ql-editor_ol_li[data-list='bullet']]:list-none [&_.ql-editor_ol_li[data-list='bullet']]:before:content-['•']"

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
  if (!isEdit.value) return

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
})

function goBack() {
  router.push({ name: `village-profile-${route.meta.sectionSlug}-list` })
}

async function persist(nextStatus) {
  if (!form.title.trim()) {
    toast.add({ severity: 'error', summary: 'Judul wajib diisi', life: 2500 })
    return
  }

  form.status = nextStatus
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
    goBack()
  } finally {
    saving.value = false
  }
}

function saveDraft() {
  persist('Draft')
}

function saveMain() {
  persist(isEdit.value ? form.status : 'Published')
}
</script>

<template>
  <div class="min-h-full text-slate-800">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 class="m-0 text-[22px] font-bold text-slate-900">
        {{ pageTitle }}
      </h1>
    </div>

    <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Card>
        <template #content>
          <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-2">
              <label for="title" class="text-[13px] font-semibold text-slate-700">
                Judul
              </label>
              <InputText
                id="title"
                v-model="form.title"
                placeholder="Judul"
                fluid
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-[13px] font-semibold text-slate-700">
                Isi Konten
              </label>

              <Editor
                v-model="form.content"
                editorStyle="height: 220px"
                :pt="{
                  toolbar: { class: 'border-b border-neutral-200 bg-neutral-50' },
                  content: { class: editorContentClass },
                }"
              >
                <template #toolbar>
                  <span class="ql-formats">
                    <select class="ql-header" defaultValue="0">
                      <option value="1">Heading</option>
                      <option value="0">Paragraf</option>
                    </select>
                    <select class="ql-font">
                      <option value="sans-serif" selected>Sans Serif</option>
                      <option value="serif">Serif</option>
                      <option value="monospace">Monospace</option>
                    </select>
                  </span>

                  <span class="ql-formats">
                    <button class="ql-bold" title="Bold" />
                    <button class="ql-italic" title="Italic" />
                    <button class="ql-underline" title="Underline" />
                  </span>

                  <span class="ql-formats">
                    <button class="ql-list" value="ordered" title="List bernomor" />
                    <button class="ql-list" value="bullet" title="List poin" />
                  </span>

                  <span class="ql-formats">
                    <button class="ql-align" value="" title="Rata Kiri" />
                    <button class="ql-align" value="center" title="Rata Tengah" />
                    <button class="ql-align" value="right" title="Rata Kanan" />
                    <button class="ql-align" value="justify" title="Rata Kanan-Kiri" />
                  </span>

                  <span class="ql-formats">
                    <button class="ql-image" title="Sisipkan gambar" />
                    <button class="ql-link" title="Sisipkan tautan" />
                    <button class="ql-clean" title="Hapus format" />
                  </span>
                </template>
              </Editor>
            </div>

            <div class="flex flex-col gap-2">
              <span class="text-[13px] font-semibold text-slate-700">
                Foto (opsional)
              </span>

              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleFileChange"
              />

              <div
                v-if="!photoPreview"
                class="rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/40 flex flex-col items-center justify-center py-10 cursor-pointer hover:bg-primary-50 transition-colors"
                @click="pickFile"
              >
                <i class="pi pi-cloud-upload text-3xl text-primary-400 mb-2" />
                <p class="text-sm text-slate-600 m-0">
                  <span class="text-primary-600 font-medium">Klik untuk unggah</span> atau seret foto ke sini
                </p>
                <p class="text-xs text-slate-400 mt-1">PNG, JPG, maks. 5MB</p>
              </div>

              <div v-else class="relative overflow-hidden rounded-xl border border-slate-200 group">
                <img :src="photoPreview" alt="Preview foto" class="h-48 w-full object-cover" />
                <div
                  class="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100"
                >
                  <Button
                    icon="pi pi-refresh"
                    severity="secondary"
                    rounded
                    aria-label="Ganti foto"
                    @click="pickFile"
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    rounded
                    aria-label="Hapus foto"
                    @click="removePhoto"
                  />
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
              <Button
                label="Simpan Draft"
                severity="secondary"
                outlined
                class="flex-1"
                :loading="saving"
                @click="saveDraft"
              />

              <Button
                :label="mainButtonLabel"
                class="flex-1"
                :loading="saving"
                @click="saveMain"
              />
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-3">
              <button
                type="button"
                class="flex items-center justify-between text-left text-[13px] text-slate-700"
                @click="statusOpen = !statusOpen"
              >
                <span>
                  Status:
                  <strong>{{ statusDisplay }}</strong>
                </span>

                <i
                  class="pi pi-chevron-down text-xs text-slate-400 transition-transform"
                  :class="{ 'rotate-180': statusOpen }"
                />
              </button>

              <Select
                v-show="statusOpen"
                v-model="form.status"
                :options="statusOptions"
                optionLabel="label"
                optionValue="value"
                fluid
              />
            </div>
          </template>
        </Card>

        <Button
          label="Batal"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          class="w-full"
          @click="goBack"
        />
      </aside>
    </div>
  </div>
</template>