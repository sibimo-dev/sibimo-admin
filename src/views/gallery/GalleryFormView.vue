<script>
import Quill from 'quill'

// Simpan perataan teks sebagai inline style `text-align`, bukan class `ql-align-*`,
// supaya tetap tampil di halaman publik tanpa CSS bawaan Quill.
// Harus dijalankan sebelum <Editor> dibuat.
try {
  Quill.register('formats/align', Quill.import('attributors/style/align'), true)
} catch (error) {
  console.warn('Gagal mendaftarkan style align Quill:', error)
}

// Gambar kaya fitur: ukuran (width), tata letak (inline / wrap / break / behind / front),
// perataan, dan posisi bebas. Disimpan sebagai atribut + inline style.
const BaseImage = Quill.import('formats/image')
const IMAGE_ATTRIBUTES = ['alt', 'width', 'data-layout', 'data-align', 'data-x', 'data-y']

// Angka polos dianggap piksel; nilai dengan satuan (%, px) dipakai apa adanya.
function cssLength(raw, fallback = '0px') {
  if (raw === null || raw === undefined || raw === '') return fallback
  const text = String(raw).trim()
  return /^-?\d+(\.\d+)?$/.test(text) ? `${text}px` : text
}

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
    const x = cssLength(node.getAttribute('data-x'))
    const y = cssLength(node.getAttribute('data-y'))
    const rules = ['max-width:100%', 'height:auto']

    if (layout === 'behind' || layout === 'front') {
      // Gambar mengambang tidak memakai ruang di baris teks (margin kanan negatif sebesar lebarnya),
      // sehingga teks mengalir di atas/bawah gambar dan tidak terdorong ke samping.
      // "Di belakang" = float biasa (otomatis tergambar di bawah teks).
      // "Di depan" = float yang diposisikan relatif dengan z-index tinggi.
      const w = cssLength(width, '60%')
      rules.push(`width:${w}`, 'float:left')
      if (layout === 'front') {
        rules.push('position:relative', 'z-index:10', `left:${x}`, `top:${y}`, `margin:0 calc(-1 * ${w}) 0 0`)
      } else {
        rules.push(`margin:${y} calc(-1 * (${w} + ${x})) 0 ${x}`)
      }
    } else {
      if (width) rules.push(`width:${cssLength(width)}`)

      if (layout === 'wrap') {
        rules.push(align === 'right' ? 'float:right' : 'float:left')
        rules.push(align === 'right' ? 'margin:0 0 8px 16px' : 'margin:0 16px 8px 0')
      } else if (layout === 'break') {
        const margin = align === 'center' ? '8px auto' : align === 'right' ? '8px 0 8px auto' : '8px auto 8px 0'
        rules.push('display:block', 'clear:both', `margin:${margin}`)
      } else {
        rules.push('display:inline-block', 'vertical-align:baseline')
      }
    }

    node.setAttribute('style', rules.join(';'))
  }
}

Quill.register(RichImage, true)
</script>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useAuthStore } from '@/stores/auth.store'
import { useGalleryStore } from '@/stores/gallery.store'
import { getGallery } from '@/services/gallery.service'
import { mediaUrl } from '@/services/media'

import Card from 'primevue/card'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import Editor from 'primevue/editor'
import Dialog from 'primevue/dialog'
import Menu from 'primevue/menu'
import AppInput from '@/components/common/AppInput.vue'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import DatePicker from 'primevue/datepicker'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()
const galleryStore = useGalleryStore()

const isEdit = computed(() => !!route.params.id)
const saving = ref(false)
const preview = ref(null)
const fileUploadRef = ref(null)

const form = reactive({
  title: '',
  description: '',
  category: 'kegiatan-sosial',
  location: '',
  event_date: new Date(),
  image_file: null,
  uploaded_at: null,
})

const errors = reactive({ title: '', category: '' })

/* ---------- Kelola Kategori ---------- */
const categoryOptions = computed(() => galleryStore.categoryOptions)
const newCategory = ref('')
const editingCategoryId = ref(null)
const editingCategoryLabel = ref('')

function errorToast(summary, error) {
  toast.add({
    severity: 'error',
    summary,
    detail: error.response?.data?.errors?.name?.[0] ?? error.response?.data?.message,
    life: 3000,
  })
}

async function addCategory() {
  const name = newCategory.value.trim()
  if (!name) return
  try {
    const created = await galleryStore.createCategory({ name })
    form.category = created.slug
    errors.category = ''
    newCategory.value = ''
  } catch (error) {
    errorToast('Gagal menambah kategori', error)
  }
}

function startEditCategory(category) {
  editingCategoryId.value = category.id
  editingCategoryLabel.value = category.label
}

function cancelEditCategory() {
  editingCategoryId.value = null
  editingCategoryLabel.value = ''
}

async function saveEditCategory(category) {
  const name = editingCategoryLabel.value.trim()
  if (!name) return
  try {
    await galleryStore.updateCategory(category.id, { name })
    cancelEditCategory()
  } catch (error) {
    errorToast('Gagal memperbarui kategori', error)
  }
}

function removeCategory(category) {
  confirm.require({
    message: `Hapus kategori "${category.label}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await galleryStore.removeCategory(category.id)
        if (form.category === category.value) form.category = null
      } catch (error) {
        errorToast('Gagal menghapus kategori', error)
      }
    },
  })
}
/* ---------- /Kelola Kategori ---------- */

/* ---------- Rich text editor (sama dengan Visi & Misi dan Berita) ---------- */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_IMAGE_WIDTH = 1280
const MIN_WIDTH_PERCENT = 10
const DEFAULT_WIDTH_PERCENT = 60

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

// Handle sedikit lebih besar di layar sentuh (h-4) dan kembali kecil di desktop (md:h-3).
const resizeHandles = [
  { key: 'nw', direction: -1, class: '-left-2 -top-2 md:-left-1.5 md:-top-1.5 cursor-nwse-resize' },
  { key: 'ne', direction: 1, class: '-right-2 -top-2 md:-right-1.5 md:-top-1.5 cursor-nesw-resize' },
  { key: 'sw', direction: -1, class: '-bottom-2 -left-2 md:-bottom-1.5 md:-left-1.5 cursor-nesw-resize' },
  { key: 'se', direction: 1, class: '-bottom-2 -right-2 md:-bottom-1.5 md:-right-1.5 cursor-nwse-resize' },
]

// Tinggi editor deskripsi: minimum 160px, tumbuh mengikuti isi, lalu scroll di dalam editor.
const editorPt = {
  root: {
    class: 'min-w-0 max-w-full',
  },
  content: {
    class: '!h-auto [&_.ql-editor]:isolate [&_.ql-editor]:!min-h-[160px] [&_.ql-editor]:!max-h-[45vh] md:[&_.ql-editor]:!max-h-[55vh] [&_.ql-editor]:overflow-y-auto [&_.ql-editor]:break-words [&_.ql-editor_h1]:text-2xl [&_.ql-editor_h1]:font-bold [&_.ql-editor_h2]:text-xl [&_.ql-editor_h2]:font-bold [&_.ql-editor_h3]:text-lg [&_.ql-editor_h3]:font-semibold [&_.ql-editor_img]:cursor-pointer',
  },
}

const wrapperRef = ref(null)
const imageInputRef = ref(null)
const layoutMenu = ref(null)
const imageToolbarRef = ref(null)

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

// Rata tengah tidak tersedia untuk "Bungkus teks" (gambar mengambang di kiri/kanan teks).
function canAlign(value) {
  return !(layout.value === 'wrap' && value === 'center')
}

// Gambar sebaris mengikuti perataan paragrafnya; layout lain memakai atribut data-align.
function currentAlign(element) {
  const mode = element.getAttribute('data-layout') || 'inline'
  if (mode !== 'inline') return element.getAttribute('data-align') || 'left'
  const block = element.closest('p, h1, h2, h3, li, blockquote, pre')
  const value = block?.style.textAlign
  if (value === 'center' || block?.classList.contains('ql-align-center')) return 'center'
  if (value === 'right' || block?.classList.contains('ql-align-right')) return 'right'
  return 'left'
}

function imageElement() {
  if (!quill || selectedIndex.value === null) return null
  const [leaf] = quill.getLeaf(selectedIndex.value)
  const node = leaf?.domNode
  return node instanceof HTMLImageElement ? node : null
}

// Toolbar gambar dijaga agar tidak keluar dari lebar editor (penting di HP),
// dan dipindah ke atas gambar bila di bawah sudah tidak muat.
function placeImageToolbar() {
  const bar = imageToolbarRef.value
  if (!bar || !wrapperRef.value || !quill) return
  const wrapperRect = wrapperRef.value.getBoundingClientRect()
  const rootRect = quill.root.getBoundingClientRect()
  const barWidth = bar.offsetWidth
  const barHeight = bar.offsetHeight

  toolbarPos.left = Math.min(Math.max(0, overlay.left), Math.max(0, wrapperRect.width - barWidth))

  const rootTop = rootRect.top - wrapperRect.top
  const rootBottom = rootRect.bottom - wrapperRect.top
  let top = overlay.top + overlay.height + 8
  if (top + barHeight > rootBottom) {
    const above = overlay.top - barHeight - 8
    top = above >= rootTop ? above : Math.max(rootTop + 8, rootBottom - barHeight - 8)
  }
  toolbarPos.top = top
}

function refreshOverlay() {
  const element = imageElement()
  if (!element || !wrapperRef.value) {
    overlay.visible = false
    return
  }
  const rect = element.getBoundingClientRect()
  const root = quill.root
  const rootRect = root.getBoundingClientRect()
  const wrapperRect = wrapperRef.value.getBoundingClientRect()

  // Bingkai hanya digambar pada bagian gambar yang terlihat di dalam editor,
  // supaya tidak menjulur keluar dan menimpa toolbar / kolom form di sekitarnya.
  const viewTop = rootRect.top + root.clientTop
  const viewLeft = rootRect.left + root.clientLeft
  const top = Math.max(rect.top, viewTop)
  const left = Math.max(rect.left, viewLeft)
  const bottom = Math.min(rect.bottom, viewTop + root.clientHeight)
  const right = Math.min(rect.right, viewLeft + root.clientWidth)

  if (right - left < Math.min(rect.width, 28) || bottom - top < Math.min(rect.height, 28)) {
    overlay.visible = false
    return
  }

  overlay.top = top - wrapperRect.top
  overlay.left = left - wrapperRect.left
  overlay.width = right - left
  overlay.height = bottom - top
  overlay.visible = true
  nextTick(placeImageToolbar)
}

function syncSelection() {
  const element = imageElement()
  if (!element) {
    overlay.visible = false
    return
  }
  layout.value = element.getAttribute('data-layout') || 'inline'
  align.value = currentAlign(element)
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

function setImageAlignment(value) {
  const element = imageElement()
  if (!element || !canAlign(value)) return
  const mode = element.getAttribute('data-layout') || 'inline'

  if (mode === 'inline') {
    // Gambar sebaris mengikuti perataan paragrafnya, sama seperti teks.
    // Agar hanya gambarnya yang berpindah, letakkan gambar di baris/paragraf sendiri.
    quill.formatLine(selectedIndex.value, 1, 'align', value === 'left' ? false : value, 'user')
    scheduleRefresh()
    return
  }

  if (mode === 'behind' || mode === 'front') {
    // Posisi horizontal dihitung dalam persen lebar konten, jadi tetap pas di ukuran layar apa pun.
    const percent = Math.min(100, (element.getBoundingClientRect().width / contentWidth()) * 100)
    const x = value === 'left' ? 0 : value === 'center' ? (100 - percent) / 2 : 100 - percent
    applyFormat({ 'data-align': value, 'data-x': `${Math.max(0, Math.round(x * 10) / 10)}%` })
    return
  }

  applyFormat({ 'data-align': value })
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

function readOffset(element, name) {
  const raw = element.getAttribute(name) || '0'
  if (raw.trim().endsWith('%')) return ((parseFloat(raw) || 0) * contentWidth()) / 100
  return Number(raw) || 0
}

function startMove(event) {
  const element = imageElement()
  if (!element) return
  event.preventDefault()

  const startX = event.clientX
  const startY = event.clientY
  const originX = readOffset(element, 'data-x')
  const originY = readOffset(element, 'data-y')
  let deltaX = 0
  let deltaY = 0

  // Selama menggeser hanya pratinjau visual (transform); posisi sebenarnya disimpan saat dilepas.
  const onMove = (moveEvent) => {
    deltaX = moveEvent.clientX - startX
    deltaY = moveEvent.clientY - startY
    element.style.transform = `translate(${deltaX}px, ${deltaY}px)`
    refreshOverlay()
  }

  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
    element.style.removeProperty('transform')
    if (deltaX === 0 && deltaY === 0) {
      refreshOverlay()
      return
    }
    applyFormat({ 'data-x': String(Math.round(originX + deltaX)), 'data-y': String(Math.round(originY + deltaY)) })
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

// Gambar yang tertutup teks (mis. "Di belakang teks") tidak menerima klik langsung,
// jadi semua gambar dicek lewat posisinya; yang paling atas (terakhir di dokumen) diprioritaskan.
function findImageFromEvent(event) {
  if (event.target instanceof HTMLImageElement) return event.target
  const images = Array.from(quill.root.querySelectorAll('img')).reverse()
  return images.find((image) => {
    const rect = image.getBoundingClientRect()
    return event.clientX >= rect.left && event.clientX <= rect.right
      && event.clientY >= rect.top && event.clientY <= rect.bottom
  }) ?? null
}

function selectImageElement(image) {
  const blot = Quill.find(image) ?? quill.scroll.find(image, true)
  if (!blot) {
    console.warn('Gambar tidak dikenali oleh editor, pilihan dibatalkan.', image)
    return false
  }
  selectedIndex.value = quill.getIndex(blot)
  syncSelection()
  return true
}

function onEditorClick(event) {
  try {
    const image = findImageFromEvent(event)
    if (!image) {
      clearSelection()
      return
    }
    selectImageElement(image)
  } catch (error) {
    console.error('Gagal memilih gambar:', error)
  }
}

// Cadangan: saat Quill sendiri menyeleksi satu gambar (klik, tap, atau Shift + panah), gambar ikut dipilih.
function onSelectionChange(range) {
  if (!quill || !range || range.length !== 1) return
  const [leaf] = quill.getLeaf(range.index)
  const node = leaf?.domNode
  if (node instanceof HTMLImageElement) selectImageElement(node)
}

// Delete / Backspace menghapus gambar yang sedang dipilih; tombol lain menutup pilihan.
function onEditorKeydown(event) {
  if (selectedIndex.value === null) return
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    deleteImage()
  } else if (!['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) {
    clearSelection()
  }
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
  quill.root.addEventListener('keydown', onEditorKeydown)
  quill.root.addEventListener('scroll', refreshOverlay)
  quill.on('selection-change', onSelectionChange)
  resizeObserver = new ResizeObserver(refreshOverlay)
  resizeObserver.observe(quill.root)
}

watch(() => form.description, scheduleRefresh)

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
      // GIF/SVG dipakai apa adanya agar animasi/vektor tidak rusak
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
    input.value = '' // izinkan memilih file yang sama lagi
  }
}
/* ---------- /Rich text editor ---------- */

const pageTitle = computed(() => (isEdit.value ? 'Edit Foto' : 'Tambah Foto'))
const mainButtonLabel = computed(() => (isEdit.value ? 'Perbarui' : 'Tambah Foto'))

onMounted(async () => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  window.addEventListener('resize', refreshOverlay)

  try {
    await galleryStore.fetchCategories()
  } catch (error) {
    errorToast('Gagal memuat kategori', error)
  }

  // Default 'kegiatan-sosial' bisa saja sudah dihapus
  if (!categoryOptions.value.some((c) => c.value === form.category)) {
    form.category = null
  }

  if (isEdit.value) {
    const existing = await getGallery(route.params.id)
    if (existing) {
      form.title = existing.title
      form.description = existing.description
      form.category = existing.category ?? null
      form.location = existing.location ?? ''
      form.uploaded_at = existing.uploaded_at
      preview.value = existing.image ? mediaUrl(existing.image) : null
      form.event_date = existing.event_date
        ? new Date(`${existing.event_date.slice(0, 10)}T00:00:00`)
        : new Date()
    }
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  window.removeEventListener('resize', refreshOverlay)
  resizeObserver?.disconnect()
  quill?.root?.removeEventListener('click', onEditorClick)
  quill?.root?.removeEventListener('keydown', onEditorKeydown)
  quill?.root?.removeEventListener('scroll', refreshOverlay)
  quill?.off('selection-change', onSelectionChange)
})

function handleFileSelect(event) {
  const file = event.files?.[0]
  if (!file) return
  form.image_file = file
  const reader = new FileReader()
  reader.onload = () => {
    preview.value = reader.result
  }
  reader.readAsDataURL(file)
}

function toDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function handleValidationError(event) {
  const message = event.files?.[0]?.name
    ? `File "${event.files[0].name}" tidak valid (format/ukuran tidak sesuai)`
    : 'File tidak valid'
  toast.add({ severity: 'error', summary: message, life: 3000 })
}

function changeImage(removeFileCallback) {
  removeFileCallback?.(0)
  fileUploadRef.value?.choose()
}

function removeImage(removeFileCallback) {
  removeFileCallback?.(0)
  preview.value = null
  form.image_file = null
}

function validate() {
  errors.title = form.title.trim() ? '' : 'Judul foto wajib diisi'
  errors.category = form.category ? '' : 'Kategori wajib dipilih'
  return !errors.title && !errors.category
}

async function handleSubmit() {
  if (!validate()) return
  saving.value = true
  try {
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      location: form.location,
      event_date: toDateInputValue(form.event_date),
      uploaded_by: authStore.user?.id ?? '',
      image_file: form.image_file,
    }

    if (isEdit.value) {
      await galleryStore.update(route.params.id, payload)
    } else {
      await galleryStore.create(payload)
    }

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
  <div class="min-h-full min-w-0 text-slate-800">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-5">
      <h1 class="m-0 text-xl font-bold text-slate-900 sm:text-[22px]">
        {{ pageTitle }}
      </h1>

      <Button
        label="Kembali"
        outlined
        type="button"
        @click="handleCancel"
      />
    </div>

    <div class="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Card class="min-w-0 [&>.p-card-body]:min-w-0">
        <template #content>
          <div class="flex min-w-0 flex-col gap-5">
            <div class="flex flex-col gap-2">
              <span class="text-[13px] font-semibold text-slate-700">
                Foto <span class="text-danger-500">*</span>
              </span>

              <FileUpload
                ref="fileUploadRef"
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
                @select="handleFileSelect"
                @file-validation-failed="handleValidationError"
              >
                <template #empty>
                  <div
                    v-if="!preview"
                    class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/40 px-4 py-8 text-center transition-colors hover:bg-primary-50 sm:py-10"
                    @click="fileUploadRef?.choose()"
                  >
                    <i class="pi pi-cloud-upload mb-2 text-3xl text-primary-400" />
                    <p class="m-0 text-sm text-slate-600">
                      <span class="font-medium text-primary-600">Klik untuk unggah</span>
                      <span class="hidden sm:inline"> atau seret foto ke sini</span>
                    </p>
                    <p class="mt-1 text-xs text-slate-400">PNG, JPG, maks. 5MB</p>
                  </div>
                </template>

                <template #content="{ removeFileCallback }">
                  <div v-if="preview" class="group relative overflow-hidden rounded-xl border border-slate-200">
                    <img :src="preview" alt="Preview foto" class="h-40 w-full object-cover sm:h-48" />
                    <!--
                      HP tidak punya "hover", jadi di layar kecil tombolnya selalu tampil di pojok kanan atas.
                      Di layar >= md, kembali ke overlay yang muncul saat di-hover.
                    -->
                    <div
                      class="absolute right-2 top-2 flex gap-2 md:inset-0 md:items-center md:justify-center md:bg-slate-900/0 md:opacity-0 md:transition-colors md:group-hover:bg-slate-900/40 md:group-hover:opacity-100"
                    >
                      <Button
                        type="button"
                        icon="pi pi-refresh"
                        severity="secondary"
                        rounded
                        aria-label="Ganti foto"
                        @click="changeImage(removeFileCallback)"
                      />
                      <Button
                        type="button"
                        icon="pi pi-trash"
                        severity="danger"
                        rounded
                        aria-label="Hapus foto"
                        @click="removeImage(removeFileCallback)"
                      />
                    </div>
                  </div>
                </template>
              </FileUpload>
            </div>

            <div class="flex flex-col gap-2">
              <label for="title" class="text-[13px] font-semibold text-slate-700">
                Judul
              </label>
              <AppInput
                id="title"
                v-model="form.title"
                placeholder="Contoh: Kerja Bakti Balai Desa"
                :error="errors.title"
                required
              />
            </div>

            <div class="flex flex-col gap-2">
              <label for="category" class="text-[13px] font-semibold text-slate-700">
                Kategori <span class="text-danger-500">*</span>
              </label>
              <Select
                id="category"
                v-model="form.category"
                :options="categoryOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Pilih kategori"
                :invalid="!!errors.category"
                class="w-full"
              />
              <small v-if="errors.category" class="text-danger-500">{{ errors.category }}</small>
              <small class="text-xs text-slate-400">
                Ingin kategori baru? Tambahkan lewat "Kelola Kategori" di samping.
              </small>
            </div>

            <div class="flex flex-col gap-2">
              <label for="location" class="text-[13px] font-semibold text-slate-700">
                Lokasi
              </label>
              <AppInput
                id="location"
                v-model="form.location"
                placeholder="Contoh: Balai Kalurahan Bimomartani"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label for="event_date" class="text-[13px] font-semibold text-slate-700">
                Tanggal Kegiatan
              </label>
              <DatePicker
                id="event_date"
                v-model="form.event_date"
                dateFormat="dd/mm/yy"
                showIcon
                iconDisplay="input"
                appendTo="body"
                class="w-full"
              />
            </div>

            <div v-if="isEdit" class="flex flex-col gap-2">
              <label class="text-[13px] font-semibold text-slate-700">
                Diunggah Pada
              </label>
              <AppInput
                :model-value="new Date(form.uploaded_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })"
                disabled
              />
            </div>

            <div class="flex min-w-0 flex-col gap-2">
              <label class="text-[13px] font-semibold text-slate-700">
                Deskripsi
              </label>

              <div ref="wrapperRef" class="relative min-w-0">
                <Editor
                  v-model="form.description"
                  :pt="editorPt"
                  placeholder="Deskripsi atau keterangan singkat dari foto (opsional)"
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

                <!-- Input file asli yang disembunyikan; dibuka lewat tombol Image di toolbar editor -->
                <input
                  ref="imageInputRef"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  tabindex="-1"
                  aria-hidden="true"
                  @change="onImageSelect"
                />

                <!-- Kotak pilihan gambar + handle resize -->
                <div
                  v-if="overlay.visible"
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
                    class="pointer-events-auto absolute h-4 w-4 touch-none rounded-sm border border-white bg-primary-500 md:h-3 md:w-3"
                    :class="handle.class"
                    @pointerdown.prevent.stop="startResize($event, handle.direction)"
                  />
                </div>

                <!-- Toolbar gambar: terpisah dari kotak pilihan supaya posisinya bisa dijaga tetap di dalam editor -->
                <div
                  v-if="overlay.visible"
                  ref="imageToolbarRef"
                  class="absolute z-30 flex max-w-full flex-wrap items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg"
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
                    @click="setImageAlignment(option.value)"
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

              <small class="text-xs text-slate-400">
                Tip: klik gambar di dalam deskripsi untuk mengatur tata letak, perataan, ukuran, atau menghapusnya.
              </small>
            </div>
          </div>
        </template>
      </Card>

      <aside class="flex min-w-0 flex-col gap-3.5">
        <!-- Di layar kecil kartu ini menempel di bawah layar agar tombol selalu mudah dijangkau -->
        <Card class="max-lg:sticky max-lg:bottom-2 max-lg:z-10 max-lg:shadow-lg">
          <template #content>
            <div class="flex gap-2.5">
              <Button
                label="Batal"
                severity="secondary"
                outlined
                class="flex-1"
                type="button"
                @click="handleCancel"
              />

              <Button
                :label="mainButtonLabel"
                class="flex-1"
                type="button"
                :loading="saving"
                @click="handleSubmit"
              />
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-3">
              <label class="text-xs text-slate-500">Kelola Kategori</label>

              <div class="flex gap-2">
                <InputText
                  v-model="newCategory"
                  placeholder="Contoh: Laporan"
                  class="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px]"
                  @keyup.enter="addCategory"
                />
                <Button label="Tambah" icon="pi pi-plus" class="shrink-0 rounded-lg" type="button" @click="addCategory" />
              </div>

              <div class="flex max-h-56 flex-col gap-1 overflow-y-auto pr-1">
                <div
                  v-for="category in categoryOptions"
                  :key="category.id"
                  class="flex items-center justify-between gap-2 py-1.5"
                >
                  <template v-if="editingCategoryId === category.id">
                    <InputText
                      v-model="editingCategoryLabel"
                      class="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-[13px]"
                      @keyup.enter="saveEditCategory(category)"
                      @keyup.esc="cancelEditCategory"
                    />
                    <div class="flex shrink-0 items-center">
                      <Button icon="pi pi-check" text rounded size="small" type="button" aria-label="Simpan" @click="saveEditCategory(category)" />
                      <Button icon="pi pi-times" text rounded size="small" severity="secondary" type="button" aria-label="Batal" @click="cancelEditCategory" />
                    </div>
                  </template>

                  <template v-else>
                    <span class="min-w-0 flex-1 truncate text-[13px] text-slate-700">{{ category.label }}</span>
                    <div class="flex shrink-0 items-center">
                      <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" type="button" aria-label="Edit kategori" @click="startEditCategory(category)" />
                      <Button icon="pi pi-trash" text rounded size="small" severity="danger" type="button" aria-label="Hapus kategori" @click="removeCategory(category)" />
                    </div>
                  </template>
                </div>

                <p v-if="!categoryOptions.length" class="m-0 text-xs text-slate-400">
                  Belum ada kategori. Tambahkan di atas.
                </p>
              </div>
            </div>
          </template>
        </Card>
      </aside>
    </div>
  </div>
</template>

<style>
/* Cadangan untuk konten lama yang masih memakai class perataan Quill */
.p-editor .ql-editor .ql-align-center {
  text-align: center;
}
.p-editor .ql-editor .ql-align-right {
  text-align: right;
}
.p-editor .ql-editor .ql-align-justify {
  text-align: justify;
}
</style>
