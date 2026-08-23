<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'

import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import RadioButton from 'primevue/radiobutton'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import Editor from 'primevue/editor'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()

const newsId = computed(() => route.params.id ?? null)
const isEditMode = computed(() => newsId.value !== null)
const pageTitle = computed(() => (
  isEditMode.value ? 'Edit Berita' : 'Buat Berita Baru'
))

const imagePreview = ref(null)
const title = ref('')

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

function handleContentImageSelect(event) {
  const file = event.files?.[0]
  if (!file || !quill) return

  const reader = new FileReader()
  reader.onload = () => {
    focusEditor()
    const range = getRange() ?? { index: quill.getLength() }
    quill.insertEmbed(range.index, 'image', reader.result, 'user')
    quill.setSelection(range.index + 1)
  }
  reader.readAsDataURL(file)
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

function onEditorLoad(event) {
  quill = event.instance
  refreshActiveFormats()
}

function onEditorTextChange() {
  refreshActiveFormats()
}

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
  setEditorHtml('<p>Isi konten berita yang sudah tersimpan sebelumnya...</p>')
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
  confirm.require({
    message: `Pindahkan berita "${title.value || 'ini'}" ke sampah?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: () => {
      router.push({ name: 'news-list' })
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

    <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">

      <Card>
        <template #content>
          <div class="flex flex-col gap-5">

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
                <Editor
                  v-model="content"
                  placeholder="Tulis isi berita di sini..."
                  :pt="{
                    toolbar: { class: 'flex flex-wrap items-center gap-1.5 border-b border-neutral-200 bg-neutral-50 px-2.5 py-2' },
                    content: { class: 'min-h-[220px] w-full text-[13px] text-neutral-800 [&_.ql-clipboard]:absolute [&_.ql-clipboard]:-left-[100000px] [&_.ql-clipboard]:top-1/2 [&_.ql-clipboard]:h-px [&_.ql-clipboard]:overflow-y-hidden [&_.ql-editor]:min-h-[220px] [&_.ql-editor]:p-3.5 [&_.ql-editor]:outline-none [&_.ql-editor]:whitespace-pre-wrap [&_.ql-editor_a]:text-primary-700 [&_.ql-editor_a]:underline [&_.ql-editor_blockquote]:my-2.5 [&_.ql-editor_blockquote]:border-l-4 [&_.ql-editor_blockquote]:border-neutral-300 [&_.ql-editor_blockquote]:pl-4 [&_.ql-editor_img]:max-w-full [&_.ql-editor_ol]:list-decimal [&_.ql-editor_ol]:pl-5 [&_.ql-editor_ul]:list-disc [&_.ql-editor_ul]:pl-5' },
                  }"
                  @load="onEditorLoad"
                  @text-change="onEditorTextChange"
                  @selection-change="refreshActiveFormats"
                >
                  <template #toolbar>
                    <Select
                      :modelValue="activeFormats.header"
                      :options="blockTypeOptions"
                      optionLabel="label"
                      optionValue="value"
                      class="rounded-md border border-neutral-200 bg-white text-xs text-neutral-700 outline-none focus:border-primary-700"
                      :pt="{ label: { class: 'px-1.5 py-1' } }"
                      @update:modelValue="applyHeader"
                    />

                    <Select
                      :modelValue="activeFormats.font"
                      :options="fontFamilyOptions"
                      optionLabel="label"
                      optionValue="value"
                      class="rounded-md border border-neutral-200 bg-white text-xs text-neutral-700 outline-none focus:border-primary-700"
                      :pt="{ label: { class: 'px-1.5 py-1' } }"
                      @update:modelValue="applyFont"
                    />

                    <span class="mx-0.5 h-[18px] w-px bg-neutral-200" />

                    <Button
                      text
                      :severity="activeFormats.bold ? 'primary' : 'secondary'"
                      title="Bold"
                      class="min-w-0 rounded-md px-2 py-1 text-[13px] font-bold hover:bg-neutral-200"
                      label="B"
                      @click="toggleBold"
                    />

                    <Button
                      text
                      :severity="activeFormats.italic ? 'primary' : 'secondary'"
                      title="Italic"
                      class="min-w-0 rounded-md px-2 py-1 text-[13px] italic hover:bg-neutral-200"
                      label="I"
                      @click="toggleItalic"
                    />

                    <Button
                      text
                      :severity="activeFormats.underline ? 'primary' : 'secondary'"
                      title="Underline"
                      class="min-w-0 rounded-md px-2 py-1 text-[13px] underline hover:bg-neutral-200"
                      label="U"
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

                    <FileUpload
                      mode="basic"
                      accept="image/*"
                      :auto="false"
                      customUpload
                      chooseLabel=""
                      chooseIcon="pi pi-image"
                      title="Sisipkan gambar"
                      :pt="{
                        root: { class: 'inline-flex' },
                        chooseButton: { class: 'min-w-0 rounded-md border-0 bg-transparent px-2 py-1 text-neutral-700 hover:bg-neutral-200' },
                      }"
                      @select="handleContentImageSelect"
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
                  </template>
                </Editor>
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
                class="flex-1 rounded-lg border border-primary-700 bg-primary-700 px-3.5 py-2.5 text-[13px] font-medium text-white hover:bg-primary-800"
                @click="publishNews"
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
                class="min-w-0 p-0 text-[13px] font-medium text-primary-700 hover:underline"
                @click="previewNews"
              />
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-2.5">
              <Button
                text
                severity="secondary"
                class="w-full min-w-0 justify-between rounded-md border-0 bg-transparent p-0 text-left text-[13px] font-normal text-neutral-700 hover:bg-transparent"
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
              </Button>

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
                class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
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
                class="w-full rounded-lg border border-neutral-300 bg-white text-[13px] text-neutral-800 outline-none focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
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
                  v-for="option in categoryOptions"
                  :key="option.id"
                  class="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-700"
                >
                  <Checkbox v-model="option.checked" binary class="accent-primary-700" />
                  {{ option.label }}
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