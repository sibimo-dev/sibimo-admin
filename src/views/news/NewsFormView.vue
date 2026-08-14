<script setup>
/**
 * Sama seperti file Citizen sebelumnya: PrimeVue diasumsikan terpasang
 * dengan `unstyled: true` + plugin `tailwindcss-primeui`, jadi seluruh
 * tampilan murni dikendalikan Tailwind, bukan tema bawaan PrimeVue.
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import RadioButton from 'primevue/radiobutton'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'

const route = useRoute()
const router = useRouter()

const newsId = computed(() => route.params.id ?? null)
const isEditMode = computed(() => newsId.value !== null)
const pageTitle = computed(() => (
  isEditMode.value ? 'Edit Berita' : 'Buat Berita Baru'
))

const imagePreview = ref(null)
const title = ref('')
const content = ref('')

const blockTypeOptions = ['Heading', 'Paragraf']
const blockType = ref('Heading')
const fontFamilyOptions = ['Sans Serif', 'Serif', 'Monospace']
const fontFamily = ref('Sans Serif')

const status = ref('Draft')
const statusOpen = ref(true)
const visibility = ref('publik')
const publishDate = ref(new Date())
const authorOptions = ['User Name']
const author = ref('User Name')

const categoryOptions = ref([
  { id: 'infrastruktur', label: 'Infrastruktur', checked: false },
  { id: 'pertanian', label: 'Pertanian', checked: false },
  { id: 'kesehatan', label: 'Kesehatan', checked: false },
  { id: 'sosial', label: 'Sosial', checked: true },
  { id: 'keuangan', label: 'Keuangan', checked: true },
  { id: 'teknologi', label: 'Teknologi', checked: false },
])

const tags = ref(['Sosial', 'Keuangan'])
const tagInput = ref('')

const statusLabelMap = {
  Draft: 'Draft',
  Published: 'Terbit',
}

const statusDisplay = computed(() => (
  statusLabelMap[status.value] ?? status.value
))

const mainButtonLabel = computed(() => (
  isEditMode.value ? 'Perbarui' : 'Terbitkan'
))

const visibilityLabel = computed(() => (
  visibility.value === 'publik'
    ? 'Publik'
    : visibility.value === 'password'
      ? 'Dilindungi kata sandi'
      : 'Privat'
))

onMounted(() => {
  if (!isEditMode.value) return

  title.value = 'Judul berita'
  content.value = 'Isi konten berita yang sudah tersimpan sebelumnya...'
  status.value = 'Published'
})

function selectImage(event) {
  const file = event.files?.[0]

  if (!file) return

  imagePreview.value = URL.createObjectURL(file)
}

function addTagFromInput(event) {
  const value = tagInput.value.trim()

  if (!value || event.key !== 'Enter') return

  if (!tags.value.includes(value)) {
    tags.value.push(value)
  }

  tagInput.value = ''
}

function removeTag(tag) {
  tags.value = tags.value.filter(item => item !== tag)
}

function previewNews() {
  window.open(`/news/preview/${newsId.value ?? ''}`, '_blank')
}

function saveDraft() {
  status.value = 'Draft'
  router.push({ name: 'news-list' })
}

function publishNews() {
  status.value = 'Published'
  router.push({ name: 'news-list' })
}

function moveToTrash() {
  router.push({ name: 'news-list' })
}
</script>

<template>
  <div class="min-h-full px-6 py-6 text-neutral-800 lg:px-8">
    <div class="mb-5">
      <h1 class="m-0 text-[22px] font-bold text-primary-900">
        {{ pageTitle }}
      </h1>
    </div>

    <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">

      <div class="flex flex-col gap-5 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">

        <div class="flex flex-col gap-2">
          <label class="text-[13px] font-semibold text-neutral-700">
            Gambar
          </label>

          <div
            class="relative flex h-[240px] items-center justify-center overflow-hidden rounded-[10px] border-[1.5px] border-dashed border-neutral-300 bg-neutral-100"
            :class="imagePreview ? 'border-solid' : ''"
          >
            <img
              v-if="imagePreview"
              :src="imagePreview"
              alt="Preview gambar"
              class="h-full w-full object-cover"
            />

            <span v-else class="text-[13px] text-neutral-400">
              Klik atau seret gambar ke sini
            </span>

            <span class="absolute right-2.5 top-2.5 rounded-md bg-white p-1.5 text-primary-700 shadow">
              <i class="pi pi-pencil text-sm" />
            </span>

            <FileUpload
              mode="basic"
              accept="image/*"
              :auto="false"
              customUpload
              chooseLabel=""
              :pt="{
                root: { class: 'absolute inset-0' },
                chooseButton: { class: 'absolute inset-0 h-full w-full cursor-pointer opacity-0' },
              }"
              @select="selectImage"
            />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-[13px] font-semibold text-neutral-700" for="title">
            Judul
          </label>

          <InputText
            id="title"
            v-model="title"
            placeholder="Judul berita"
            class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none transition focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-[13px] font-semibold text-neutral-700">
            Isi Konten
          </label>

          <div class="overflow-hidden rounded-lg border border-neutral-300">

            <div class="flex flex-wrap items-center gap-1.5 border-b border-neutral-200 bg-neutral-50 px-2.5 py-2">

              <Select
                v-model="blockType"
                :options="blockTypeOptions"
                class="rounded-md border border-neutral-200 bg-white text-xs text-neutral-700 outline-none focus:border-primary-700"
                :pt="{ label: { class: 'px-1.5 py-1' } }"
              />

              <Select
                v-model="fontFamily"
                :options="fontFamilyOptions"
                class="rounded-md border border-neutral-200 bg-white text-xs text-neutral-700 outline-none focus:border-primary-700"
                :pt="{ label: { class: 'px-1.5 py-1' } }"
              />

              <span class="mx-0.5 h-[18px] w-px bg-neutral-200" />

              <Button
                text
                severity="secondary"
                title="Bold"
                class="min-w-0 rounded-md px-2 py-1 text-[13px] font-bold text-neutral-700 hover:bg-neutral-200"
                label="B"
              />

              <Button
                text
                severity="secondary"
                title="Italic"
                class="min-w-0 rounded-md px-2 py-1 text-[13px] italic text-neutral-700 hover:bg-neutral-200"
                label="I"
              />

              <Button
                text
                severity="secondary"
                title="Underline"
                class="min-w-0 rounded-md px-2 py-1 text-[13px] underline text-neutral-700 hover:bg-neutral-200"
                label="U"
              />

              <span class="mx-0.5 h-[18px] w-px bg-neutral-200" />

              <Button
                text
                severity="secondary"
                icon="pi pi-align-left"
                title="Rata kiri"
                class="min-w-0 rounded-md px-2 py-1 text-neutral-700 hover:bg-neutral-200"
              />

              <Button
                text
                severity="secondary"
                icon="pi pi-list"
                title="List bernomor"
                class="min-w-0 rounded-md px-2 py-1 text-neutral-700 hover:bg-neutral-200"
              />

              <Button
                text
                severity="secondary"
                icon="pi pi-circle-fill"
                title="List poin"
                class="min-w-0 rounded-md px-2 py-1 text-[8px] text-neutral-700 hover:bg-neutral-200"
              />

              <span class="mx-0.5 h-[18px] w-px bg-neutral-200" />

              <Button
                text
                severity="secondary"
                icon="pi pi-image"
                title="Sisipkan gambar"
                class="min-w-0 rounded-md px-2 py-1 text-neutral-700 hover:bg-neutral-200"
              />

              <Button
                text
                severity="secondary"
                icon="pi pi-link"
                title="Sisipkan tautan"
                class="min-w-0 rounded-md px-2 py-1 text-neutral-700 hover:bg-neutral-200"
              />

              <Button
                text
                severity="secondary"
                icon="pi pi-times"
                title="Hapus format"
                class="min-w-0 rounded-md px-2 py-1 text-neutral-700 hover:bg-neutral-200"
              />
            </div>

            <Textarea
              v-model="content"
              placeholder="Tulis isi berita di sini..."
              class="min-h-[220px] w-full resize-y border-0 p-3.5 text-[13px] text-neutral-800 outline-none"
            />
          </div>
        </div>
      </div>

      <aside class="flex flex-col gap-3.5">

        <div class="flex gap-2.5 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
          <Button
            label="Simpan Draft"
            severity="secondary"
            outlined
            class="flex-1 rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
            @click="saveDraft"
          />

          <Button
            :label="mainButtonLabel"
            class="flex-1 rounded-lg border border-primary-700 bg-primary-700 px-3.5 py-2.5 text-[13px] font-medium text-white hover:bg-primary-800"
            @click="publishNews"
          />
        </div>

        <div class="flex flex-col gap-2.5 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
          <div class="flex items-center justify-between text-[13px] text-neutral-700">
            <span>Terbit</span>

            <Button
              label="Pratinjau"
              text
              class="min-w-0 p-0 text-[13px] font-medium text-primary-700 hover:underline"
              @click="previewNews"
            />
          </div>
        </div>

        <div class="flex flex-col gap-2.5 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
          <button
            type="button"
            class="flex items-center justify-between bg-transparent p-0 text-left text-[13px] text-neutral-700"
            @click="statusOpen = !statusOpen"
          >
            <span>
              Status:
              <strong>{{ statusDisplay }}</strong>
            </span>

            <i
              class="pi pi-chevron-up text-[11px] text-neutral-400 transition-transform"
              :class="statusOpen ? 'rotate-180' : ''"
            />
          </button>

          <div v-show="statusOpen" class="flex flex-col gap-1.5">
            <Select
              v-model="status"
              :options="[{ label: 'Draft', value: 'Draft' }, { label: 'Terbit', value: 'Published' }]"
              optionLabel="label"
              optionValue="value"
              class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
              :pt="{ label: { class: 'px-3 py-2.5' } }"
            />
          </div>
        </div>

        <div class="flex flex-col gap-2.5 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
          <div class="text-[13px] text-neutral-700">
            Keterlihatan:
            <strong>{{ visibilityLabel }}</strong>
          </div>

          <div class="flex flex-col gap-2">
            <label class="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-700">
              <RadioButton v-model="visibility" value="publik" class="accent-primary-700" />
              Publik
            </label>

            <label class="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-700">
              <RadioButton v-model="visibility" value="password" class="accent-primary-700" />
              Dilindungi kata sandi
            </label>

            <label class="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-700">
              <RadioButton v-model="visibility" value="privat" class="accent-primary-700" />
              Privat
            </label>
          </div>
        </div>

        <div class="flex flex-col gap-2.5 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
          <label class="text-xs text-neutral-500" for="publishDate">
            Terbit:
          </label>

          <DatePicker
            id="publishDate"
            v-model="publishDate"
            dateFormat="yy-mm-dd"
            showIcon
            iconDisplay="input"
            class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
            :pt="{ pcInputText: { root: { class: 'w-full px-3 py-2.5' } } }"
          />
        </div>

        <div class="flex flex-col gap-2.5 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
          <label class="text-xs text-neutral-500">
            Penulis
          </label>

          <Select
            v-model="author"
            :options="authorOptions"
            class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
            :pt="{ label: { class: 'px-3 py-2.5' } }"
          />
        </div>

        <div class="flex flex-col gap-2.5 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
          <label class="text-xs text-neutral-500">
            Kategori
          </label>

          <div class="flex flex-col gap-2">
            <label
              v-for="option in categoryOptions"
              :key="option.id"
              class="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-700"
            >
              <Checkbox v-model="option.checked" binary class="accent-primary-700" />
              {{ option.label }}
            </label>
          </div>
        </div>

        <Button
          label="Pindahkan ke sampah"
          icon="pi pi-trash"
          severity="secondary"
          outlined
          class="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
          @click="moveToTrash"
        />

      </aside>
    </div>
  </div>
</template>