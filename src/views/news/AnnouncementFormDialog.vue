<script setup>

import { ref, computed, watch } from 'vue'

import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import ToggleSwitch from 'primevue/toggleswitch'
import Select from 'primevue/select'
import Button from 'primevue/button'
import { newsService, newsCategoryService } from '@/services/content.service'
import { mediaUrl } from '@/services/media'

const props = defineProps({
  visible: { type: Boolean, default: false },
  // null = create a new announcement, otherwise edit the given id
  announcementId: { type: [Number, String], default: null },
})

const emit = defineEmits(['update:visible', 'saved'])

const isEdit = computed(() => props.announcementId !== null && props.announcementId !== undefined)

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')

const form = ref(emptyForm())
const attachmentFile = ref(null)
const existingAttachmentName = ref('')
const fileInput = ref(null)
// Optional image (thumbnail) shown on the public detail page
const thumbnailInput = ref(null)
const thumbnailFile = ref(null)
const thumbnailPreview = ref('')
const existingThumbnailUrl = ref('')
const thumbnailError = ref('')
const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024
// Announcements are always saved under the "Pengumuman" news category
const announcementCategoryId = ref(null)
// Keep the original publish date when editing
const existingPublishedAt = ref('')

const durationPresets = [
  { label: '7 hari', days: 7 },
  { label: '14 hari', days: 14 },
  { label: '30 hari', days: 30 },
]

const statusOptions = [
  { label: 'Draft', value: 'Draft' },
  { label: 'Published', value: 'Published' },
  { label: 'Archived', value: 'Archived' },
]

function addDays(base, days) {
  const result = new Date(base)
  result.setDate(result.getDate() + days)
  return result
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function emptyForm() {
  const today = startOfToday()
  return {
    title: '',
    content: '',
    valid_from: today,
    valid_until: addDays(today, 7), // an announcement never lasts forever: default 7 days
    show_in_ticker: true,
    status: 'Published',
  }
}

function toDateString(date) {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

// Short random suffix keeps the slug unique when two announcements share a title
function buildSlug(title) {
  const base = slugify(title) || 'pengumuman'
  return `${base}-${Math.random().toString(36).slice(2, 7)}`
}

// Show every validation message from the API instead of only the first one
function extractErrorMessage(error, fallback) {
  const errors = error.response?.data?.errors
  if (errors && typeof errors === 'object') {
    return Object.values(errors).flat().join('\n')
  }
  return error.response?.data?.message ?? fallback
}

function applyPreset(days) {
  form.value.valid_until = addDays(form.value.valid_from ?? startOfToday(), days)
}

function onFileChange(event) {
  attachmentFile.value = event.target.files?.[0] ?? null
}

function onThumbnailChange(event) {
  const file = event.target.files?.[0]
  thumbnailError.value = ''
  if (!file) return

  if (!file.type.startsWith('image/')) {
    thumbnailError.value = 'File harus berupa gambar (PNG atau JPG).'
    event.target.value = ''
    return
  }
  if (file.size > MAX_THUMBNAIL_SIZE) {
    thumbnailError.value = 'Ukuran gambar maksimal 5MB.'
    event.target.value = ''
    return
  }

  thumbnailFile.value = file
  const reader = new FileReader()
  reader.onload = () => {
    thumbnailPreview.value = reader.result
  }
  reader.readAsDataURL(file)
}

// Drop the newly picked image (an already saved image stays)
function clearNewThumbnail() {
  thumbnailFile.value = null
  thumbnailPreview.value = ''
  thumbnailError.value = ''
  if (thumbnailInput.value) thumbnailInput.value.value = ''
}

function resetState() {
  form.value = emptyForm()
  attachmentFile.value = null
  existingAttachmentName.value = ''
  existingPublishedAt.value = ''
  errorMessage.value = ''
  if (fileInput.value) fileInput.value.value = ''
  clearNewThumbnail()
  existingThumbnailUrl.value = ''
}

async function loadAnnouncement() {
  loading.value = true
  try {
    const data = await newsService.get(props.announcementId)
    form.value = {
      title: data.title ?? '',
      content: data.content ?? '',
      valid_from: data.valid_from ? new Date(data.valid_from) : startOfToday(),
      valid_until: data.valid_until ? new Date(data.valid_until) : null,
      show_in_ticker: Boolean(data.show_in_ticker),
      status: data.status ?? 'Draft',
    }
    existingAttachmentName.value = data.attachment_name ?? ''
    existingPublishedAt.value = data.published_at ?? ''
    existingThumbnailUrl.value = mediaUrl(data.thumbnail) ?? ''
  } catch (error) {
    errorMessage.value = 'Data pengumuman belum dapat dimuat.'
    console.error('Failed to load announcement:', error)
  } finally {
    loading.value = false
  }
}

async function loadAnnouncementCategory() {
  try {
    const categories = await newsCategoryService.list()
    const match = (Array.isArray(categories) ? categories : []).find(
      (category) => (category.category_name ?? category.name ?? '').trim().toLowerCase() === 'pengumuman'
    )
    announcementCategoryId.value = match ? (match.category_id ?? match.id) : null
  } catch (error) {
    announcementCategoryId.value = null
    console.error('Failed to load news categories:', error)
  }
}

// Reset (and load when editing) every time the dialog opens
watch(
  () => props.visible,
  (open) => {
    if (!open) return
    resetState()
    loadAnnouncementCategory()
    if (isEdit.value) loadAnnouncement()
  }
)

function validate() {
  const { title, content, valid_from, valid_until, status } = form.value

  if (!title.trim()) return 'Judul pengumuman wajib diisi.'
  if (!content.trim()) return 'Isi pengumuman wajib diisi.'
  if (!valid_until) return 'Tanggal berakhir wajib diisi agar pengumuman tidak berlaku selamanya.'
  if (valid_from && valid_until < valid_from) {
    return 'Tanggal berakhir tidak boleh sebelum tanggal mulai.'
  }
  if (status === 'Published' && valid_until < startOfToday()) {
    return 'Tanggal berakhir sudah lewat. Pilih tanggal yang akan datang atau ubah status.'
  }
  return ''
}

async function save() {
  errorMessage.value = validate()
  if (errorMessage.value) return

  if (!announcementCategoryId.value) await loadAnnouncementCategory()
  if (!announcementCategoryId.value) {
    errorMessage.value = 'Kategori "Pengumuman" belum ada. Tambahkan dulu di kategori berita.'
    return
  }

  // newsService builds the FormData itself, so pass a plain object here
  const payload = {
    category_id: announcementCategoryId.value,
    category_name: 'Pengumuman',
    slug: isEdit.value ? undefined : buildSlug(form.value.title),
    published_at: existingPublishedAt.value || new Date().toISOString(),
    title: form.value.title.trim(),
    content: form.value.content.trim(),
    valid_from: toDateString(form.value.valid_from),
    valid_until: toDateString(form.value.valid_until),
    show_in_ticker: form.value.show_in_ticker ? 1 : 0,
    status: form.value.status,
  }
  if (attachmentFile.value) payload.attachment = attachmentFile.value
  if (thumbnailFile.value) payload.thumbnail = thumbnailFile.value

  saving.value = true
  try {
    if (isEdit.value) {
      await newsService.update(props.announcementId, payload)
    } else {
      await newsService.create(payload)
    }
    emit('saved')
    close()
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, 'Gagal menyimpan pengumuman.')
  } finally {
    saving.value = false
  }
}

function close() {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :draggable="false"
    :closable="!saving"
    :header="isEdit ? 'Edit Pengumuman' : 'Tambah Pengumuman'"
    :style="{ width: '34rem' }"
    :breakpoints="{ '640px': '95vw' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div v-if="loading" class="py-10 text-center text-neutral-400">Memuat data...</div>

    <div v-else class="flex flex-col gap-4">

      <div class="flex flex-col gap-1.5">
        <label for="announcement-title" class="text-[13px] font-semibold text-neutral-700">Judul</label>
        <InputText
          id="announcement-title"
          v-model="form.title"
          maxlength="150"
          placeholder="Contoh: Pelayanan ditutup saat libur nasional"
          class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-[13px]"
        />
        <small class="text-neutral-400">Judul inilah yang tampil di teks berjalan situs publik.</small>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="announcement-content" class="text-[13px] font-semibold text-neutral-700">Isi Pengumuman</label>
        <Textarea
          id="announcement-content"
          v-model="form.content"
          rows="4"
          autoResize
          placeholder="Tulis isi pengumuman secara singkat dan jelas"
          class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-[13px]"
        />
        <small class="text-neutral-400">Isi lengkap tampil di halaman berita pada kategori Pengumuman.</small>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="announcement-thumbnail" class="text-[13px] font-semibold text-neutral-700">
          Gambar (opsional)
        </label>
        <input
          id="announcement-thumbnail"
          ref="thumbnailInput"
          type="file"
          accept="image/*"
          class="text-[13px] text-neutral-700"
          @change="onThumbnailChange"
        />
        <small class="text-neutral-400">
          PNG atau JPG, maks. 5MB. Tampil di bagian atas halaman detail pengumuman.
        </small>
        <small v-if="thumbnailError" class="text-danger-600">{{ thumbnailError }}</small>

        <div v-if="thumbnailPreview || existingThumbnailUrl" class="flex items-center gap-3">
          <img
            :src="thumbnailPreview || existingThumbnailUrl"
            alt="Pratinjau gambar pengumuman"
            class="h-20 w-32 rounded-lg border border-neutral-200 object-cover"
          />
          <Button
            v-if="thumbnailPreview"
            label="Batalkan pilihan"
            size="small"
            severity="secondary"
            text
            class="text-[12px]"
            @click="clearNewThumbnail"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <label for="announcement-valid-from" class="text-[13px] font-semibold text-neutral-700">Berlaku Dari</label>
          <DatePicker
            inputId="announcement-valid-from"
            v-model="form.valid_from"
            dateFormat="dd/mm/yy"
            showIcon
            fluid
            appendTo="body"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="announcement-valid-until" class="text-[13px] font-semibold text-neutral-700">
            Berlaku Sampai <span class="text-danger-600">*</span>
          </label>
          <DatePicker
            inputId="announcement-valid-until"
            v-model="form.valid_until"
            dateFormat="dd/mm/yy"
            :minDate="form.valid_from ?? undefined"
            showIcon
            fluid
            appendTo="body"
          />
        </div>
      </div>

      <div class="-mt-2 flex flex-wrap items-center gap-2">
        <span class="text-[12px] text-neutral-500">Atur cepat:</span>
        <Button
          v-for="preset in durationPresets"
          :key="preset.days"
          :label="preset.label"
          size="small"
          severity="secondary"
          outlined
          class="rounded-full px-3 py-1 text-[12px]"
          @click="applyPreset(preset.days)"
        />
        <span class="text-[12px] text-neutral-400">
          Setelah tanggal ini judul pengumuman otomatis hilang dari teks berjalan.
        </span>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="announcement-attachment" class="text-[13px] font-semibold text-neutral-700">
          Lampiran (PDF, opsional)
        </label>
        <input
          id="announcement-attachment"
          ref="fileInput"
          type="file"
          accept="application/pdf"
          class="text-[13px] text-neutral-700"
          @change="onFileChange"
        />
        <small v-if="existingAttachmentName && !attachmentFile" class="text-neutral-400">
          Lampiran saat ini: {{ existingAttachmentName }}
        </small>
      </div>

      <div class="flex items-center gap-3">
        <ToggleSwitch v-model="form.show_in_ticker" inputId="announcement-ticker" />
        <label for="announcement-ticker" class="text-[13px] text-neutral-700">
          Tampilkan di teks berjalan
        </label>
      </div>

      <div class="flex flex-col gap-1.5 sm:w-1/2">
        <label for="announcement-status" class="text-[13px] font-semibold text-neutral-700">Status</label>
        <Select
          inputId="announcement-status"
          v-model="form.status"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          fluid
          appendTo="body"
        />
      </div>

      <p v-if="errorMessage" class="m-0 whitespace-pre-line text-[13px] text-danger-600">{{ errorMessage }}</p>
    </div>

    <template #footer>
      <Button
        label="Batal"
        severity="secondary"
        outlined
        :disabled="saving"
        class="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:bg-neutral-100"
        @click="close"
      />
      <Button
        label="Simpan"
        icon="pi pi-check"
        :loading="saving"
        :disabled="loading"
        class="rounded-lg border border-primary-700 bg-primary-700 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-primary-800"
        @click="save"
      />
    </template>
  </Dialog>
</template>