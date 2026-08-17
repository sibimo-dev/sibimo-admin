<script setup>
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

const potentialId = computed(() => route.params.id ?? null)

const isEditMode = computed(() => potentialId.value !== null)

const pageTitle = computed(() => (
  isEditMode.value
    ? 'Edit Potensi'
    : 'Buat Potensi Baru'
))

const mainButtonLabel = computed(() => (
  isEditMode.value
    ? 'Perbarui'
    : 'Terbitkan'
))

const photoPreview = ref(null)
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
  { id: 'pertanian', label: 'Pertanian', checked: false },
  { id: 'bumdes', label: 'Bumdes', checked: false },
  { id: 'pariwisata', label: 'Pariwisata', checked: false },
  { id: 'umkm', label: 'UMKM', checked: false },
])

const statusLabelMap = {
  Draft: 'Draft',
  Published: 'Published',
}

const statusDisplay = computed(() => (
  statusLabelMap[status.value] ?? status.value
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

  title.value = 'Judul Potensi desa'

  content.value = `
    Lorem ipsum dolor sit amet, id enim eiusmod elit dolore aute.
    Non qui labore in in ea id pariatur consequat velit qui sunt
    sit exercitation commodo excepteur.
  `

  status.value = 'Published'
  visibility.value = 'publik'

  const agricultureCategory = categoryOptions.value.find(
    category => category.id === 'pertanian'
  )

  if (agricultureCategory) {
    agricultureCategory.checked = true
  }
})

function selectPhoto(event) {
  const file = event.files?.[0]

  if (!file) return

  photoPreview.value = URL.createObjectURL(file)
}

function previewPotential() {
  window.open(`/village-potential/preview/${potentialId.value ?? ''}`, '_blank')
}

function saveDraft() {
  status.value = 'Draft'

  router.push({
    name: 'village-potential-list',
  })
}

function saveMain() {
  status.value = 'Published'

  router.push({
    name: 'village-potential-list',
  })
}

function moveToTrash() {
  router.push({
    name: 'village-potential-list',
  })
}
</script>

<template>
  <div class="min-h-full px-6 py-6 text-neutral-800 lg:px-8">

    <div class="mb-5">
      <h1 class="m-0 text-[22px] font-bold text-primary-900">
        {{ pageTitle }}
      </h1>
    </div>

    <div class="grid grid-cols-1 items-start gap-5 md:grid-cols-[1fr_300px]">

      <div class="flex flex-col gap-5 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">

        <div class="flex flex-col gap-2">

          <label class="text-[13px] font-semibold text-neutral-700">
            Foto
          </label>

          <div
            class="relative flex h-60 items-center justify-center overflow-hidden rounded-[10px] bg-neutral-100"
            :class="
              photoPreview
                ? 'border border-solid border-neutral-300'
                : 'border-[1.5px] border-dashed border-neutral-300'
            "
          >

            <img
              v-if="photoPreview"
              :src="photoPreview"
              alt="Preview foto"
              class="h-full w-full object-cover"
            />

            <span v-else class="text-[13px] text-neutral-400">
              Klik atau seret foto ke sini
            </span>

            <span class="absolute right-2.5 top-2.5 rounded-md bg-white p-1.5 text-primary-600 shadow">
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
              @select="selectPhoto"
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
            placeholder="Judul potensi desa"
            class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
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
                class="rounded-md border border-neutral-200 bg-white text-xs text-neutral-700"
                :pt="{ label: { class: 'px-1.5 py-1' } }"
              />

              <Select
                v-model="fontFamily"
                :options="fontFamilyOptions"
                class="rounded-md border border-neutral-200 bg-white text-xs text-neutral-700"
                :pt="{ label: { class: 'px-1.5 py-1' } }"
              />

              <span class="mx-0.5 h-[18px] w-px bg-neutral-200" />

              <Button
                text
                severity="secondary"
                title="Bold"
                label="B"
                class="min-w-0 rounded-md px-2 py-1 text-[13px] font-bold text-neutral-700 hover:bg-neutral-200"
              />

              <Button
                text
                severity="secondary"
                title="Italic"
                label="I"
                class="min-w-0 rounded-md px-2 py-1 text-[13px] italic text-neutral-700 hover:bg-neutral-200"
              />

              <Button
                text
                severity="secondary"
                title="Underline"
                label="U"
                class="min-w-0 rounded-md px-2 py-1 text-[13px] underline text-neutral-700 hover:bg-neutral-200"
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
              placeholder="Tulis deskripsi potensi desa di sini..."
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
            class="flex-1 rounded-lg border border-transparent bg-primary-600 px-3.5 py-2.5 text-[13px] font-medium text-white hover:bg-primary-700"
            @click="saveMain"
          />

        </div>

        <div class="flex flex-col gap-2.5 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">

          <div class="flex items-center justify-between text-[13px] text-neutral-700">

            <span>Terbit</span>

            <Button
              label="Pratinjau"
              text
              class="min-w-0 p-0 text-[13px] font-medium text-primary-600 hover:underline"
              @click="previewPotential"
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
              :class="{ 'rotate-180': statusOpen }"
            />

          </button>

          <div v-show="statusOpen" class="flex flex-col gap-1.5">

            <Select
              v-model="status"
              :options="[{ label: 'Draft', value: 'Draft' }, { label: 'Published', value: 'Published' }]"
              optionLabel="label"
              optionValue="value"
              class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
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
              <RadioButton v-model="visibility" value="publik" class="accent-primary-600" />
              Publik
            </label>

            <label class="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-700">
              <RadioButton v-model="visibility" value="password" class="accent-primary-600" />
              Dilindungi kata sandi
            </label>

            <label class="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-700">
              <RadioButton v-model="visibility" value="privat" class="accent-primary-600" />
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
            class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
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
            class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
            :pt="{ label: { class: 'px-3 py-2.5' } }"
          />

        </div>

        <div class="flex flex-col gap-2.5 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">

          <label class="text-xs text-neutral-500">
            Kategori
          </label>

          <div class="flex flex-col gap-2">

            <label
              v-for="category in categoryOptions"
              :key="category.id"
              class="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-700"
            >
              <Checkbox v-model="category.checked" binary class="accent-primary-600" />
              {{ category.label }}
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