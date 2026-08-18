<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import Quill from 'quill'
import 'quill/dist/quill.core.css'

import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import RadioButton from 'primevue/radiobutton'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()

const potentialId = computed(() => route.params.id ?? null)
const isEditMode = computed(() => potentialId.value !== null)

const pageTitle = computed(() => (
  isEditMode.value ? 'Edit Potensi' : 'Buat Potensi Baru'
))

const mainButtonLabel = computed(() => (
  isEditMode.value ? 'Perbarui' : 'Terbitkan'
))

const photoPreview = ref(null)
const title = ref('')

const editorRef = ref(null)
const imageInputRef = ref(null)

let quill = null
const content = ref('')

const blockTypeOptions = [
  { label: 'Heading', value: 2 },
  { label: 'Paragraf', value: false },
]

const fontFamilyOptions = [
  { label: 'Sans Serif', value: false },
  { label: 'Serif', value: 'serif' },
  { label: 'Monospace', value: 'monospace' },
]

const alignCycle = [false, 'center', 'right']
const alignIconMap = {
  false: 'pi pi-align-left',
  center: 'pi pi-align-center',
  right: 'pi pi-align-right',
}

const activeFormats = ref({
  bold: false,
  italic: false,
  underline: false,
  list: null,
  align: false,
  header: false,
  font: false,
})

function focusEditor() {
  quill?.focus()
}

function getRange() {
  return quill?.getSelection(true) ?? null
}

function refreshActiveFormats() {
  if (!quill) return
  const range = quill.getSelection()
  const fmt = range ? quill.getFormat(range) : {}

  activeFormats.value.bold = !!fmt.bold
  activeFormats.value.italic = !!fmt.italic
  activeFormats.value.underline = !!fmt.underline
  activeFormats.value.list = fmt.list ?? null
  activeFormats.value.align = fmt.align ?? false
  activeFormats.value.header = fmt.header ?? false
  activeFormats.value.font = fmt.font ?? false
}

function toggleFormat(name) {
  if (!quill) return
  focusEditor()
  const range = getRange()
  const fmt = quill.getFormat(range)
  quill.format(name, !fmt[name])
  refreshActiveFormats()
}

function toggleBold() {
  toggleFormat('bold')
}

function toggleItalic() {
  toggleFormat('italic')
}

function toggleUnderline() {
  toggleFormat('underline')
}

function applyHeader(value) {
  if (!quill) return
  focusEditor()
  quill.format('header', value)
  refreshActiveFormats()
}

function applyFont(value) {
  if (!quill) return
  focusEditor()
  quill.format('font', value)
  refreshActiveFormats()
}

function cycleAlign() {
  if (!quill) return
  const currentIndex = alignCycle.indexOf(activeFormats.value.align || false)
  const nextAlign = alignCycle[(currentIndex + 1) % alignCycle.length]
  focusEditor()
  quill.format('align', nextAlign)
  refreshActiveFormats()
}

function toggleList(type) {
  if (!quill) return
  focusEditor()
  const range = getRange()
  const fmt = quill.getFormat(range)
  quill.format('list', fmt.list === type ? false : type)
  refreshActiveFormats()
}

function openImagePicker() {
  imageInputRef.value?.click()
}

function handleContentImageSelect(event) {
  const file = event.target.files?.[0]
  if (!file || !quill) return

  const reader = new FileReader()
  reader.onload = () => {
    focusEditor()
    const range = getRange() ?? { index: quill.getLength() }
    quill.insertEmbed(range.index, 'image', reader.result, 'user')
    quill.setSelection(range.index + 1)
  }
  reader.readAsDataURL(file)

  event.target.value = ''
}

function insertLink() {
  if (!quill) return
  const url = window.prompt('Masukkan URL tautan:', 'https://')
  if (!url) return

  focusEditor()
  const range = getRange() ?? { index: quill.getLength(), length: 0 }

  if (range.length > 0) {
    quill.format('link', url)
  } else {
    quill.insertText(range.index, url, { link: url }, 'user')
    quill.setSelection(range.index + url.length)
  }
}

function clearFormatting() {
  if (!quill) return
  focusEditor()
  const range = getRange()
  if (range) quill.removeFormat(range.index, range.length)
  refreshActiveFormats()
}

function setEditorHtml(html) {
  content.value = html
  if (quill) {
    quill.root.innerHTML = html
  }
}

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

onMounted(async () => {
  await nextTick()

  quill = new Quill(editorRef.value, {
    placeholder: 'Tulis deskripsi potensi desa di sini...',
    modules: { toolbar: false },
  })

  quill.on('text-change', () => {
    content.value = quill.root.innerHTML
    refreshActiveFormats()
  })

  quill.on('selection-change', () => {
    refreshActiveFormats()
  })

  if (!isEditMode.value) return

  title.value = 'Judul Potensi desa'

  setEditorHtml(`
    <p>Lorem ipsum dolor sit amet, id enim eiusmod elit dolore aute.
    Non qui labore in in ea id pariatur consequat velit qui sunt
    sit exercitation commodo excepteur.</p>
  `)

  status.value = 'Published'
  visibility.value = 'publik'

  const agricultureCategory = categoryOptions.value.find(
    category => category.id === 'pertanian'
  )
  if (agricultureCategory) agricultureCategory.checked = true
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
  router.push({ name: 'village-potential-list' })
}

function saveMain() {
  status.value = 'Published'
  router.push({ name: 'village-potential-list' })
}

function moveToTrash() {
  confirm.require({
    message: `Pindahkan potensi "${title.value || 'ini'}" ke sampah?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: () => {
      router.push({ name: 'village-potential-list' })
    },
  })
}
</script>

<template>
  <div>

    <div class="mb-6">
      <h1 class="m-0 text-2xl font-bold text-primary-900">
        {{ pageTitle }}
      </h1>
    </div>

    <div class="grid grid-cols-1 items-start gap-5 md:grid-cols-[1fr_300px]">

      <Card>
        <template #content>
          <div class="flex flex-col gap-5">

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
                    :modelValue="activeFormats.header"
                    :options="blockTypeOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="rounded-md border border-neutral-200 bg-white text-xs text-neutral-700"
                    :pt="{ label: { class: 'px-1.5 py-1' } }"
                    @update:modelValue="applyHeader"
                  />

                  <Select
                    :modelValue="activeFormats.font"
                    :options="fontFamilyOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="rounded-md border border-neutral-200 bg-white text-xs text-neutral-700"
                    :pt="{ label: { class: 'px-1.5 py-1' } }"
                    @update:modelValue="applyFont"
                  />

                  <span class="mx-0.5 h-[18px] w-px bg-neutral-200" />

                  <Button
                    text
                    :severity="activeFormats.bold ? 'primary' : 'secondary'"
                    title="Bold"
                    label="B"
                    class="min-w-0 rounded-md px-2 py-1 text-[13px] font-bold hover:bg-neutral-200"
                    @click="toggleBold"
                  />

                  <Button
                    text
                    :severity="activeFormats.italic ? 'primary' : 'secondary'"
                    title="Italic"
                    label="I"
                    class="min-w-0 rounded-md px-2 py-1 text-[13px] italic hover:bg-neutral-200"
                    @click="toggleItalic"
                  />

                  <Button
                    text
                    :severity="activeFormats.underline ? 'primary' : 'secondary'"
                    title="Underline"
                    label="U"
                    class="min-w-0 rounded-md px-2 py-1 text-[13px] underline hover:bg-neutral-200"
                    @click="toggleUnderline"
                  />

                  <span class="mx-0.5 h-[18px] w-px bg-neutral-200" />

                  <Button
                    text
                    severity="secondary"
                    :icon="alignIconMap[activeFormats.align || false]"
                    title="Perataan teks"
                    class="min-w-0 rounded-md px-2 py-1 text-neutral-700 hover:bg-neutral-200"
                    @click="cycleAlign"
                  />

                  <Button
                    text
                    :severity="activeFormats.list === 'ordered' ? 'primary' : 'secondary'"
                    icon="pi pi-list"
                    title="List bernomor"
                    class="min-w-0 rounded-md px-2 py-1 hover:bg-neutral-200"
                    @click="toggleList('ordered')"
                  />

                  <Button
                    text
                    :severity="activeFormats.list === 'bullet' ? 'primary' : 'secondary'"
                    icon="pi pi-circle-fill"
                    title="List poin"
                    class="min-w-0 rounded-md px-2 py-1 text-[8px] hover:bg-neutral-200"
                    @click="toggleList('bullet')"
                  />

                  <span class="mx-0.5 h-[18px] w-px bg-neutral-200" />

                  <Button
                    text
                    severity="secondary"
                    icon="pi pi-image"
                    title="Sisipkan gambar"
                    class="min-w-0 rounded-md px-2 py-1 text-neutral-700 hover:bg-neutral-200"
                    @click="openImagePicker"
                  />

                  <Button
                    text
                    severity="secondary"
                    icon="pi pi-link"
                    title="Sisipkan tautan"
                    class="min-w-0 rounded-md px-2 py-1 text-neutral-700 hover:bg-neutral-200"
                    @click="insertLink"
                  />

                  <Button
                    text
                    severity="secondary"
                    icon="pi pi-times"
                    title="Hapus format"
                    class="min-w-0 rounded-md px-2 py-1 text-neutral-700 hover:bg-neutral-200"
                    @click="clearFormatting"
                  />

                  <input
                    ref="imageInputRef"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleContentImageSelect"
                  />
                </div>

                <div
                  ref="editorRef"
                  class="min-h-[220px] w-full text-[13px] text-neutral-800 [&_.ql-editor]:min-h-[220px] [&_.ql-editor]:p-3.5 [&_.ql-editor]:outline-none [&_.ql-editor_a]:text-primary-600 [&_.ql-editor_a]:underline [&_.ql-editor_img]:max-w-full [&_.ql-editor_ol]:list-decimal [&_.ql-editor_ol]:pl-5 [&_.ql-editor_ul]:list-disc [&_.ql-editor_ul]:pl-5"
                />
              </div>
            </div>
          </div>
        </template>
      </Card>

      <aside class="flex flex-col gap-5">

        <Card>
          <template #content>
            <div class="flex gap-2.5">
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
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex items-center justify-between text-[13px] text-neutral-700">
              <span>Terbit</span>

              <Button
                label="Pratinjau"
                text
                class="min-w-0 p-0 text-[13px] font-medium text-primary-600 hover:underline"
                @click="previewPotential"
              />
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-2.5">
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
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-2.5">
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
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-2.5">
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
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-2.5">
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
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-2.5">
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
          </template>
        </Card>

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