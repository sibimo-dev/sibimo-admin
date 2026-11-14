<script>
import Quill from 'quill'

const BaseImage = Quill.import('formats/image')
const IMAGE_ATTRIBUTES = ['alt', 'width', 'data-layout', 'data-align', 'data-x', 'data-y']

class RichImage extends BaseImage {
  static formats(domNode) {
    const result = {}
    IMAGE_ATTRIBUTES.forEach((name) => {
      if (domNode.hasAttribute(name)) result[name] = domNode.getAttribute(name)
    })
    return result
  }

  format(name, value) {
    if (!IMAGE_ATTRIBUTES.includes(name)) {
      super.format(name, value)
      return
    }
    if (value) this.domNode.setAttribute(name, value)
    else this.domNode.removeAttribute(name)
    this.refreshStyle()
  }

  refreshStyle() {
    const node = this.domNode
    const layout = node.getAttribute('data-layout') || 'inline'
    const align = node.getAttribute('data-align') || 'left'
    const width = node.getAttribute('width')
    const offsetX = Number(node.getAttribute('data-x')) || 0
    const offsetY = Number(node.getAttribute('data-y')) || 0
    const rules = ['max-width:100%', 'height:auto']

    if (width) rules.push(`width:${width}`)

    if (layout === 'wrap') {
      rules.push(align === 'right' ? 'float:right' : 'float:left')
      rules.push(align === 'right' ? 'margin:0 0 8px 16px' : 'margin:0 16px 8px 0')
    } else if (layout === 'break') {
      const margin = align === 'center' ? '8px auto' : align === 'right' ? '8px 0 8px auto' : '8px auto 8px 0'
      rules.push('display:block', 'clear:both', `margin:${margin}`)
    } else if (layout === 'behind' || layout === 'front') {
      rules.push('display:inline-block', 'position:relative', `z-index:${layout === 'behind' ? -1 : 10}`)
      rules.push(`left:${offsetX}px`, `top:${offsetY}px`)
    } else {
      rules.push('display:inline-block', 'vertical-align:baseline')
    }

    node.setAttribute('style', rules.join(';'))
  }
}

Quill.register(RichImage, true)
</script>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useToast } from 'primevue/usetoast'

import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Editor from 'primevue/editor'
import Dialog from 'primevue/dialog'
import Menu from 'primevue/menu'

import { getVisionMissions, saveVisionMission } from '@/services/profile.service'

const toast = useToast()
const saving = ref(false)

const isEdit = computed(() => !!form.vision_mission_id)

const pageTitle = computed(() => (isEdit.value ? 'Edit Visi & Misi' : 'Tambah Visi & Misi'))
const mainButtonLabel = computed(() => (isEdit.value ? 'Perbarui' : 'Terbitkan'))

const statusOptions = [
  { label: 'Draft', value: 'Draft' },
  { label: 'Terbit', value: 'Published' },
]

const MIN_MISSIONS = 4

function createMissionItem(text = '') {
  return {
    id: `mission-${crypto.randomUUID()}`,
    text,
  }
}

const form = reactive({
  vision_mission_id: null,
  title: '',
  vision: '',
  status: 'Draft',
  published_at: null,
})

const missions = ref(Array.from({ length: MIN_MISSIONS }, () => createMissionItem()))

const statusOpen = ref(true)
const statusDisplay = computed(() => (
  statusOptions.find((item) => item.value === form.status)?.label ?? form.status
))

function loadExisting(visionMission) {
  if (!visionMission) return
  Object.assign(form, {
    vision_mission_id: visionMission.vision_mission_id,
    title: visionMission.title ?? '',
    vision: visionMission.vision ?? '',
    status: visionMission.status ?? 'Draft',
    published_at: visionMission.published_at ?? null,
  })
  const existingMissions = Array.isArray(visionMission.missions) ? visionMission.missions : []
  missions.value = existingMissions.length
    ? existingMissions.map((text) => createMissionItem(text))
    : Array.from({ length: MIN_MISSIONS }, () => createMissionItem())
}

onMounted(async () => {
  try {
    const visionMissions = await getVisionMissions()
    loadExisting(visionMissions[0])
  } catch (error) {
    toast.add({ severity: 'error', summary: error.response?.data?.message ?? 'Gagal memuat data visi dan misi', life: 3000 })
  }
})

function addMission() {
  missions.value.push(createMissionItem())
}

function removeMission(missionId) {
  if (missions.value.length <= 1) return
  missions.value = missions.value.filter((mission) => mission.id !== missionId)
}

async function persist(nextStatus) {
  if (!form.title.trim()) {
    toast.add({ severity: 'error', summary: 'Judul wajib diisi', life: 2500 })
    return
  }

  if (!form.vision.trim()) {
    toast.add({ severity: 'error', summary: 'Visi wajib diisi', life: 2500 })
    return
  }

  const filledMissions = missions.value.map((mission) => mission.text.trim()).filter(Boolean)
  if (!filledMissions.length) {
    toast.add({ severity: 'error', summary: 'Minimal isi salah satu misi', life: 2500 })
    return
  }

  form.status = nextStatus
  saving.value = true
  try {
    if (form.status === 'Published' && !form.published_at) {
      form.published_at = new Date().toISOString().slice(0, 10)
    }

    const saved = await saveVisionMission({
      id: form.vision_mission_id,
      payload: {
        title: form.title.trim(),
        status: form.status,
        published_at: form.published_at,
        vision: form.vision,
        missions: filledMissions,
      },
    })
    loadExisting(saved)

    toast.add({ severity: 'success', summary: 'Berhasil disimpan', life: 2000 })
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

// ===================== Rich text editor (inline) =====================

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_IMAGE_WIDTH = 1280
const MIN_WIDTH_PERCENT = 10
const DEFAULT_WIDTH_PERCENT = 40
const TOOLBAR_WIDTH = 330

const layoutOptions = [
  { value: 'inline', label: 'Sebaris teks' },
  { value: 'wrap', label: 'Bungkus teks' },
  { value: 'break', label: 'Pisah teks' },
  { value: 'behind', label: 'Di belakang teks' },
  { value: 'front', label: 'Di depan teks' },
]

const alignOptions = [
  { value: 'left', icon: 'pi pi-align-left', label: 'Rata kiri' },
  { value: 'center', icon: 'pi pi-align-center', label: 'Rata tengah' },
  { value: 'right', icon: 'pi pi-align-right', label: 'Rata kanan' },
]

const resizeHandles = [
  { key: 'nw', direction: -1, class: '-left-[7px] -top-[7px] cursor-nwse-resize' },
  { key: 'ne', direction: 1, class: '-right-[7px] -top-[7px] cursor-nesw-resize' },
  { key: 'sw', direction: -1, class: '-bottom-[7px] -left-[7px] cursor-nesw-resize' },
  { key: 'se', direction: 1, class: '-bottom-[7px] -right-[7px] cursor-nwse-resize' },
]

// Daftar: penomoran memakai counter bawaan PrimeVue (list-N), hanya poin & padding yang ditimpa.
// Semua utilitas memakai "!" supaya tidak kalah dari CSS bawaan PrimeVue.
const listClasses = [
  '[&_.ql-editor_ol]:!p-0 [&_.ql-editor_ol]:!m-0 [&_.ql-editor_ul]:!p-0',
  '[&_.ql-editor_li>.ql-ui]:!hidden',
  '[&_.ql-editor_li]:!list-none [&_.ql-editor_li]:!relative',
  '[&_.ql-editor_li[data-list]]:!pl-[1.75em]',
  '[&_.ql-editor_li::before]:!inline-block [&_.ql-editor_li::before]:!w-[1.5em] [&_.ql-editor_li::before]:!-ml-[1.75em] [&_.ql-editor_li::before]:!mr-[0.25em] [&_.ql-editor_li::before]:!text-right',
  "[&_.ql-editor_li[data-list=bullet]:not([class*=ql-indent])]:before:!content-['•']",
  "[&_.ql-editor_li[data-list=bullet].ql-indent-1]:before:!content-['◦']",
  "[&_.ql-editor_li[data-list=bullet].ql-indent-2]:before:!content-['▪']",
  "[&_.ql-editor_li[data-list=bullet].ql-indent-3]:before:!content-['•']",
  "[&_.ql-editor_li[data-list=bullet].ql-indent-4]:before:!content-['◦']",
  "[&_.ql-editor_li[data-list=bullet].ql-indent-5]:before:!content-['▪']",
  "[&_.ql-editor_li[data-list=bullet].ql-indent-6]:before:!content-['•']",
  "[&_.ql-editor_li[data-list=bullet].ql-indent-7]:before:!content-['◦']",
  "[&_.ql-editor_li[data-list=bullet].ql-indent-8]:before:!content-['▪']",
].join(' ')

// Indentasi: tombol +/- menambah class ql-indent-N (3em per tingkat, maks. 8).
const indentClasses = [
  '[&_.ql-editor_:is(p,h1,h2,h3,blockquote).ql-indent-1]:!pl-[3em]',
  '[&_.ql-editor_:is(p,h1,h2,h3,blockquote).ql-indent-2]:!pl-[6em]',
  '[&_.ql-editor_:is(p,h1,h2,h3,blockquote).ql-indent-3]:!pl-[9em]',
  '[&_.ql-editor_:is(p,h1,h2,h3,blockquote).ql-indent-4]:!pl-[12em]',
  '[&_.ql-editor_:is(p,h1,h2,h3,blockquote).ql-indent-5]:!pl-[15em]',
  '[&_.ql-editor_:is(p,h1,h2,h3,blockquote).ql-indent-6]:!pl-[18em]',
  '[&_.ql-editor_:is(p,h1,h2,h3,blockquote).ql-indent-7]:!pl-[21em]',
  '[&_.ql-editor_:is(p,h1,h2,h3,blockquote).ql-indent-8]:!pl-[24em]',
  '[&_.ql-editor_li[data-list].ql-indent-1]:!pl-[calc(3em+1.75em)]',
  '[&_.ql-editor_li[data-list].ql-indent-2]:!pl-[calc(6em+1.75em)]',
  '[&_.ql-editor_li[data-list].ql-indent-3]:!pl-[calc(9em+1.75em)]',
  '[&_.ql-editor_li[data-list].ql-indent-4]:!pl-[calc(12em+1.75em)]',
  '[&_.ql-editor_li[data-list].ql-indent-5]:!pl-[calc(15em+1.75em)]',
  '[&_.ql-editor_li[data-list].ql-indent-6]:!pl-[calc(18em+1.75em)]',
  '[&_.ql-editor_li[data-list].ql-indent-7]:!pl-[calc(21em+1.75em)]',
  '[&_.ql-editor_li[data-list].ql-indent-8]:!pl-[calc(24em+1.75em)]',
].join(' ')

// Tampilan blok kode.
const codeBlockClasses = [
  '[&_.ql-editor_.ql-code-block-container]:my-2 [&_.ql-editor_.ql-code-block-container]:px-3 [&_.ql-editor_.ql-code-block-container]:py-2 [&_.ql-editor_.ql-code-block-container]:rounded-md [&_.ql-editor_.ql-code-block-container]:bg-[#23241f] [&_.ql-editor_.ql-code-block-container]:text-[#f8f8f2] [&_.ql-editor_.ql-code-block-container]:font-mono [&_.ql-editor_.ql-code-block-container]:text-[13px] [&_.ql-editor_.ql-code-block-container]:overflow-visible',
  '[&_.ql-editor_.ql-code-block]:whitespace-pre-wrap',
].join(' ')

const editorPt = {
  root: { class: 'flex min-w-0 flex-1 flex-col' },
  toolbar: { class: 'sticky top-[var(--editor-sticky-top,0px)] z-[25] bg-white' },
  content: {
    class: [
      'relative !h-auto min-h-[320px] flex-1 overflow-hidden [&_.ql-editor]:absolute [&_.ql-editor]:inset-0 [&_.ql-editor]:!h-auto [&_.ql-editor]:!overflow-y-auto [&_.ql-editor]:break-words [&_.ql-editor_img]:max-w-full [&_.ql-editor]:isolate [&_.ql-editor_h1]:text-2xl [&_.ql-editor_h1]:font-bold [&_.ql-editor_h2]:text-xl [&_.ql-editor_h2]:font-bold [&_.ql-editor_h3]:text-lg [&_.ql-editor_h3]:font-semibold [&_.ql-editor_img]:cursor-pointer',
      listClasses,
      indentClasses,
      codeBlockClasses,
    ].join(' '),
  },
}

const wrapperRef = ref(null)
const imageInputRef = ref(null)
const layoutMenu = ref(null)

let quill = null
let resizeObserver = null
let insertIndex = null
let linkRange = null

const selectedIndex = ref(null)
const layout = ref('inline')
const align = ref('left')
const overlay = reactive({ visible: false, top: 0, left: 0, width: 0, height: 0 })
const toolbarPos = reactive({ top: 0, left: 0 })

const linkVisible = ref(false)
const linkUrl = ref('')
const linkText = ref('')
const linkHasSelection = ref(false)
const linkIsExisting = ref(false)

const overlayStyle = computed(() => ({
  top: `${overlay.top}px`,
  left: `${overlay.left}px`,
  width: `${overlay.width}px`,
  height: `${overlay.height}px`,
}))

const toolbarStyle = computed(() => ({
  top: `${toolbarPos.top}px`,
  left: `${toolbarPos.left}px`,
}))

const isFloating = computed(() => layout.value === 'behind' || layout.value === 'front')

const layoutLabel = computed(() => (
  layoutOptions.find((option) => option.value === layout.value)?.label ?? 'Sebaris teks'
))

const layoutItems = computed(() => layoutOptions.map((option) => ({
  label: option.label,
  active: option.value === layout.value,
  command: () => applyFormat({ 'data-layout': option.value }),
})))

function canAlign(value) {
  if (layout.value === 'break') return true
  if (layout.value === 'wrap') return value !== 'center'
  return false
}

function imageElement() {
  if (!quill || selectedIndex.value === null) return null
  const [leaf] = quill.getLeaf(selectedIndex.value)
  const node = leaf?.domNode
  return node instanceof HTMLImageElement ? node : null
}

function refreshOverlay() {
  const element = imageElement()
  if (!element || !wrapperRef.value || !quill) {
    overlay.visible = false
    return
  }
  const rect = element.getBoundingClientRect()
  const rootRect = quill.root.getBoundingClientRect()
  const wrapperRect = wrapperRef.value.getBoundingClientRect()

  const top = Math.max(rect.top, rootRect.top)
  const left = Math.max(rect.left, rootRect.left)
  const bottom = Math.min(rect.bottom, rootRect.bottom)
  const right = Math.min(rect.right, rootRect.right)

  if (bottom <= top || right <= left) {
    overlay.visible = false
    return
  }

  overlay.top = top - wrapperRect.top
  overlay.left = left - wrapperRect.left
  overlay.width = right - left
  overlay.height = bottom - top

  const maxLeft = Math.max(0, wrapperRect.width - TOOLBAR_WIDTH)
  toolbarPos.left = Math.min(Math.max(0, overlay.left), maxLeft)
  toolbarPos.top = overlay.top + overlay.height + 8
  overlay.visible = true
}

function syncSelection() {
  const element = imageElement()
  if (!element) {
    overlay.visible = false
    return
  }
  layout.value = element.getAttribute('data-layout') || 'inline'
  align.value = element.getAttribute('data-align') || 'left'
  refreshOverlay()
}

function scheduleRefresh() {
  nextTick(() => requestAnimationFrame(syncSelection))
}

function clearSelection() {
  selectedIndex.value = null
  overlay.visible = false
}

function applyFormat(formats) {
  if (!imageElement()) return
  quill.formatText(selectedIndex.value, 1, formats, 'user')
  scheduleRefresh()
}

function contentWidth() {
  const style = getComputedStyle(quill.root)
  return quill.root.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
}

function startResize(event, direction) {
  const element = imageElement()
  if (!element) return

  const startX = event.clientX
  const startWidth = element.getBoundingClientRect().width
  const containerWidth = contentWidth()
  let nextPercent = (startWidth / containerWidth) * 100

  const onMove = (moveEvent) => {
    const widthPx = Math.max(24, startWidth + direction * (moveEvent.clientX - startX))
    nextPercent = Math.min(100, Math.max(MIN_WIDTH_PERCENT, (widthPx / containerWidth) * 100))
    element.style.width = `${nextPercent}%`
    refreshOverlay()
  }

  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
    applyFormat({ width: `${Math.round(nextPercent)}%` })
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}

function startMove(event) {
  const element = imageElement()
  if (!element) return
  event.preventDefault()

  const startX = event.clientX
  const startY = event.clientY
  const originX = Number(element.getAttribute('data-x')) || 0
  const originY = Number(element.getAttribute('data-y')) || 0
  let nextX = originX
  let nextY = originY

  const onMove = (moveEvent) => {
    nextX = originX + (moveEvent.clientX - startX)
    nextY = originY + (moveEvent.clientY - startY)
    element.style.left = `${nextX}px`
    element.style.top = `${nextY}px`
    refreshOverlay()
  }

  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
    applyFormat({ 'data-x': String(Math.round(nextX)), 'data-y': String(Math.round(nextY)) })
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}

function toggleLayoutMenu(event) {
  layoutMenu.value?.toggle(event)
}

function deleteImage() {
  if (!imageElement()) return
  quill.deleteText(selectedIndex.value, 1, 'user')
  clearSelection()
}

function findImageFromEvent(event) {
  if (event.target instanceof HTMLImageElement) return event.target
  const behindImages = Array.from(quill.root.querySelectorAll('img[data-layout="behind"]'))
  return behindImages.find((image) => {
    const rect = image.getBoundingClientRect()
    return event.clientX >= rect.left && event.clientX <= rect.right
      && event.clientY >= rect.top && event.clientY <= rect.bottom
  }) ?? null
}

function onEditorClick(event) {
  const image = findImageFromEvent(event)
  if (!image) {
    clearSelection()
    return
  }
  const blot = Quill.find(image)
  if (!blot) return
  selectedIndex.value = quill.getIndex(blot)
  syncSelection()
}

function onDocumentPointerDown(event) {
  if (selectedIndex.value === null) return
  const target = event.target
  if (!(target instanceof Element)) return
  if (wrapperRef.value?.contains(target) || target.closest('.p-menu-overlay')) return
  clearSelection()
}

function onEditorLoad({ instance }) {
  quill = instance
  const toolbar = quill.getModule('toolbar')
  toolbar.addHandler('link', openLinkDialog)
  toolbar.addHandler('image', openImagePicker)
  quill.root.addEventListener('click', onEditorClick)
  quill.root.addEventListener('scroll', refreshOverlay)
  resizeObserver = new ResizeObserver(refreshOverlay)
  resizeObserver.observe(quill.root)
}

watch(() => form.vision, scheduleRefresh)

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  window.addEventListener('resize', refreshOverlay)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  window.removeEventListener('resize', refreshOverlay)
  resizeObserver?.disconnect()
  quill?.root?.removeEventListener('click', onEditorClick)
  quill?.root?.removeEventListener('scroll', refreshOverlay)
})

function currentRange() {
  return quill.getSelection(true) ?? { index: Math.max(quill.getLength() - 1, 0), length: 0 }
}

function normalizeUrl(raw) {
  const url = (raw ?? '').trim()
  if (!url) return ''
  return /^(https?:\/\/|mailto:|tel:|sms:|\/|#)/i.test(url) ? url : `https://${url}`
}

function openLinkDialog() {
  if (!quill) return
  let range = currentRange()
  const existing = quill.getFormat(range).link ?? null

  if (existing && range.length === 0) {
    const [leaf] = quill.getLeaf(range.index)
    const blot = leaf?.parent
    if (blot?.statics?.blotName === 'link') {
      range = { index: quill.getIndex(blot), length: blot.length() }
    }
  }

  linkRange = range
  linkUrl.value = existing ?? ''
  linkText.value = ''
  linkHasSelection.value = range.length > 0
  linkIsExisting.value = !!existing
  linkVisible.value = true
}

function applyLink() {
  const url = normalizeUrl(linkUrl.value)
  if (!quill || !linkRange || !url) return

  const { index, length } = linkRange
  if (length > 0) {
    quill.formatText(index, length, 'link', url, 'user')
    quill.setSelection(index + length, 0)
  } else {
    const text = linkText.value.trim() || url
    quill.insertText(index, text, 'link', url, 'user')
    quill.setSelection(index + text.length, 0)
  }
  linkVisible.value = false
}

function removeLink() {
  if (!quill || !linkRange || linkRange.length === 0) return
  quill.formatText(linkRange.index, linkRange.length, 'link', false, 'user')
  linkVisible.value = false
}

function openImagePicker() {
  if (!quill) return
  insertIndex = currentRange().index
  imageInputRef.value?.click()
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      if (file.type === 'image/gif' || file.type === 'image/svg+xml') return resolve(reader.result)
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_WIDTH / img.width)
        if (scale === 1) return resolve(reader.result)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

function insertImage(src) {
  if (!quill || !src) return
  const index = insertIndex ?? Math.max(quill.getLength() - 1, 0)
  quill.insertEmbed(index, 'image', src, 'user')
  quill.formatText(index, 1, { 'data-layout': 'inline', width: `${DEFAULT_WIDTH_PERCENT}%` }, 'user')
  quill.setSelection(index + 1, 0)
  selectedIndex.value = index
  insertIndex = null
  scheduleRefresh()
}

async function onImageSelect(event) {
  const input = event.target
  const file = input.files?.[0]
  if (!file) return
  try {
    if (!file.type.startsWith('image/')) {
      toast.add({ severity: 'error', summary: 'File harus berupa gambar', life: 3000 })
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.add({ severity: 'error', summary: 'Ukuran gambar maksimal 5MB', life: 3000 })
      return
    }
    insertImage(await readImage(file))
  } catch {
    toast.add({ severity: 'error', summary: 'Gambar gagal dimuat', life: 3000 })
  } finally {
    input.value = ''
  }
}
</script>

<template>
  <div class="min-h-full text-slate-800">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 class="m-0 text-[22px] font-bold text-slate-900">
        {{ pageTitle }}
      </h1>
    </div>

    <div class="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Card :pt="{ root: { class: 'h-full min-w-0 flex flex-col' }, body: { class: 'flex-1 flex flex-col' }, content: { class: 'flex-1 flex flex-col' } }">
        <template #content>
          <div class="flex flex-1 flex-col gap-5">
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

            <div class="flex flex-1 flex-col gap-2">
              <label class="text-[13px] font-semibold text-slate-700">
                Visi
              </label>

              <div ref="wrapperRef" class="relative flex min-w-0 flex-1 flex-col">
                <Editor
                  v-model="form.vision"
                  :pt="editorPt"
                  placeholder="Tulis visi desa di sini"
                  @load="onEditorLoad"
                  @text-change="scheduleRefresh"
                >
                  <template #toolbar>
                    <span class="ql-formats">
                      <select class="ql-header" title="Gaya teks">
                        <option value="1">Heading 1</option>
                        <option value="2">Heading 2</option>
                        <option value="3">Heading 3</option>
                        <option selected>Normal</option>
                      </select>
                    </span>
                    <span class="ql-formats">
                      <button type="button" class="ql-bold" title="Tebal" />
                      <button type="button" class="ql-italic" title="Miring" />
                      <button type="button" class="ql-underline" title="Garis bawah" />
                      <button type="button" class="ql-strike" title="Coret" />
                    </span>
                    <span class="ql-formats">
                      <select class="ql-color" title="Warna teks" />
                      <select class="ql-background" title="Warna latar" />
                    </span>
                    <span class="ql-formats">
                      <button type="button" class="ql-list" value="ordered" title="Daftar bernomor" />
                      <button type="button" class="ql-list" value="bullet" title="Daftar poin" />
                      <button type="button" class="ql-indent" value="-1" title="Kurangi indentasi" />
                      <button type="button" class="ql-indent" value="+1" title="Tambah indentasi" />
                    </span>
                    <span class="ql-formats">
                      <select class="ql-align" title="Rata teks">
                        <option selected />
                        <option value="center" />
                        <option value="right" />
                        <option value="justify" />
                      </select>
                    </span>
                    <span class="ql-formats">
                      <button type="button" class="ql-blockquote" title="Kutipan" />
                      <button type="button" class="ql-code-block" title="Blok kode" />
                    </span>
                    <span class="ql-formats">
                      <button type="button" class="ql-link" title="Tambah / ubah tautan" />
                      <button type="button" class="ql-image" title="Tambah gambar" />
                    </span>
                    <span class="ql-formats">
                      <button type="button" class="ql-clean" title="Hapus format" />
                    </span>
                  </template>
                </Editor>

                <input
                  ref="imageInputRef"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="onImageSelect"
                />

                <template v-if="overlay.visible">
                <div
                  class="pointer-events-none absolute z-20 border-2 border-primary-500"
                  :style="overlayStyle"
                >
                  <div
                    v-if="isFloating"
                    class="pointer-events-auto absolute inset-0 cursor-move touch-none"
                    @pointerdown="startMove"
                  />

                  <span
                    v-for="handle in resizeHandles"
                    :key="handle.key"
                    class="pointer-events-auto absolute h-4 w-4 touch-none rounded-sm border border-white bg-primary-500"
                    :class="handle.class"
                    @pointerdown.prevent.stop="startResize($event, handle.direction)"
                  />

                </div>

                  <div
                    class="pointer-events-auto absolute z-30 flex max-w-full flex-wrap items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg"
                    :style="toolbarStyle"
                  >
                    <Button
                      :label="layoutLabel"
                      icon="pi pi-chevron-down"
                      iconPos="right"
                      text
                      size="small"
                      severity="secondary"
                      type="button"
                      class="whitespace-nowrap"
                      aria-label="Tata letak gambar"
                      @click="toggleLayoutMenu"
                    />
                    <Menu ref="layoutMenu" :model="layoutItems" popup>
                      <template #item="{ item }">
                        <div class="flex w-48 cursor-pointer items-center justify-between gap-3 px-3 py-2 text-[13px] text-neutral-700">
                          <span>{{ item.label }}</span>
                          <i v-if="item.active" class="pi pi-check text-xs" />
                        </div>
                      </template>
                    </Menu>

                    <span class="mx-1 h-5 w-px bg-neutral-200" />

                    <Button
                      v-for="option in alignOptions"
                      :key="option.value"
                      :icon="option.icon"
                      :text="align !== option.value"
                      :severity="align === option.value ? 'primary' : 'secondary'"
                      :disabled="!canAlign(option.value)"
                      :aria-label="option.label"
                      rounded
                      size="small"
                      type="button"
                      @click="applyFormat({ 'data-align': option.value })"
                    />

                    <span class="mx-1 h-5 w-px bg-neutral-200" />

                    <Button
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      rounded
                      size="small"
                      type="button"
                      aria-label="Hapus gambar"
                      @click="deleteImage"
                    />
                  </div>
                </template>

                <Dialog
                  v-model:visible="linkVisible"
                  modal
                  header="Tambah Tautan"
                  :draggable="false"
                  class="w-[92vw] max-w-md"
                >
                  <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-2">
                      <label for="editorLinkUrl" class="text-[13px] font-semibold text-neutral-700">URL Tautan</label>
                      <InputText
                        id="editorLinkUrl"
                        v-model="linkUrl"
                        placeholder="https://contoh.com"
                        fluid
                        autofocus
                        @keyup.enter="applyLink"
                      />
                    </div>

                    <div v-if="!linkHasSelection" class="flex flex-col gap-2">
                      <label for="editorLinkText" class="text-[13px] font-semibold text-neutral-700">Teks Tautan</label>
                      <InputText
                        id="editorLinkText"
                        v-model="linkText"
                        placeholder="Teks yang ditampilkan (opsional)"
                        fluid
                        @keyup.enter="applyLink"
                      />
                    </div>

                    <div class="flex flex-wrap justify-end gap-2">
                      <Button
                        v-if="linkIsExisting"
                        label="Hapus Tautan"
                        icon="pi pi-trash"
                        severity="danger"
                        outlined
                        type="button"
                        class="mr-auto"
                        @click="removeLink"
                      />
                      <Button label="Batal" severity="secondary" outlined type="button" @click="linkVisible = false" />
                      <Button label="Simpan" icon="pi pi-check" type="button" :disabled="!linkUrl.trim()" @click="applyLink" />
                    </div>
                  </div>
                </Dialog>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="text-[13px] font-semibold text-slate-700">
                  Misi
                </span>
                <Button
                  label="Tambah Misi"
                  icon="pi pi-plus"
                  text
                  size="small"
                  @click="addMission"
                />
              </div>

              <div
                v-for="(mission, index) in missions"
                :key="mission.id"
                class="flex items-start gap-2.5"
              >
                <span
                  class="mt-2 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-600"
                >
                  {{ index + 1 }}
                </span>

                <Textarea
                  v-model="mission.text"
                  :placeholder="`Tulis misi ke-${index + 1}`"
                  autoResize
                  rows="1"
                  class="flex-1"
                  fluid
                />

                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  aria-label="Hapus misi"
                  :disabled="missions.length <= 1"
                  @click="removeMission(mission.id)"
                />
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
      </aside>
    </div>
  </div>
</template>