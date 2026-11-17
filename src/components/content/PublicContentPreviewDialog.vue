<script setup>
import { computed, ref, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import DOMPurify from 'dompurify'
import villageLogo from '@/assets/logo-kalurahan-placeholder.svg'
import { newsService, serviceHoursService } from '@/services/content.service'
import { mediaUrl } from '@/services/media'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  kind: { type: String, default: 'Berita' }, // 'Berita' | 'Agenda' | 'Potensi Desa' | 'Potensi'
  title: { type: String, default: '' },
  category: { type: String, default: 'Umum' },
  date: { type: String, default: '' },
  author: { type: String, default: 'Admin Desa' },
  image: { type: String, default: '' },
  content: { type: String, default: '' },
  summary: { type: String, default: '' },
  details: { type: Array, default: () => [] },
  location: { type: String, default: '' },
  time: { type: String, default: '' },
  attendees: { type: String, default: '' },
  contact: { type: String, default: '' },
  slug: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const simulatedPath = computed(() => {
  const s = props.slug || slugify(props.title) || 'preview'
  const k = props.kind.toLowerCase()
  if (k.includes('berita')) return `/berita/${s}`
  if (k.includes('agenda')) return `/events`
  if (k.includes('potensi')) return `/potential/${s}`
  return `/${s}`
})

/* ============ Kategori & Warna Berita (Identik dgn public NewsDetailView) ============ */
const CATEGORY_PALETTE = [
  {
    dot: 'bg-sky-500',
    topBar: 'bg-gradient-to-r from-sky-400 to-cyan-500',
    imageGradient: 'from-sky-100 via-cyan-100 to-sky-200',
    activeBadge: 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white border-transparent shadow-lg shadow-sky-500/30',
    softBadge: 'bg-sky-50 text-sky-700 border border-sky-200',
    hoverRing: 'hover:border-sky-300 hover:bg-sky-50/40',
    glow: 'from-sky-400/20 via-cyan-400/10 to-transparent',
  },
  {
    dot: 'bg-rose-500',
    topBar: 'bg-gradient-to-r from-rose-400 to-pink-500',
    imageGradient: 'from-rose-100 via-pink-100 to-rose-200',
    activeBadge: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-transparent shadow-lg shadow-rose-500/30',
    softBadge: 'bg-rose-50 text-rose-700 border border-rose-200',
    hoverRing: 'hover:border-rose-300 hover:bg-rose-50/40',
    glow: 'from-rose-400/20 via-pink-400/10 to-transparent',
  },
  {
    dot: 'bg-amber-500',
    topBar: 'bg-gradient-to-r from-amber-400 to-orange-500',
    imageGradient: 'from-amber-100 via-orange-100 to-amber-200',
    activeBadge: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-lg shadow-amber-500/30',
    softBadge: 'bg-amber-50 text-amber-700 border border-amber-200',
    hoverRing: 'hover:border-amber-300 hover:bg-amber-50/40',
    glow: 'from-amber-400/20 via-orange-400/10 to-transparent',
  },
  {
    dot: 'bg-violet-500',
    topBar: 'bg-gradient-to-r from-violet-400 to-purple-500',
    imageGradient: 'from-violet-100 via-purple-100 to-violet-200',
    activeBadge: 'bg-gradient-to-r from-violet-500 to-purple-500 text-white border-transparent shadow-lg shadow-violet-500/30',
    softBadge: 'bg-violet-50 text-violet-700 border border-violet-200',
    hoverRing: 'hover:border-violet-300 hover:bg-violet-50/40',
    glow: 'from-violet-400/20 via-purple-400/10 to-transparent',
  },
  {
    dot: 'bg-emerald-500',
    topBar: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    imageGradient: 'from-emerald-100 via-teal-100 to-emerald-200',
    activeBadge: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/30',
    softBadge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    hoverRing: 'hover:border-emerald-300 hover:bg-emerald-50/40',
    glow: 'from-emerald-400/20 via-teal-400/10 to-transparent',
  },
]

function hashString(value) {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function getCategoryStyle(category) {
  if (!category) return CATEGORY_PALETTE[0]
  return CATEGORY_PALETTE[hashString(category) % CATEGORY_PALETTE.length]
}

/* ============ Sanitasi & Format Link/List HTML ============ */
const sanitizeContent = (html) => DOMPurify.sanitize(String(html || ''), {
  ADD_ATTR: ['target', 'rel', 'class', 'style'],
  ADD_TAGS: ['iframe'],
})

function enhanceContent(html) {
  const safeHtml = sanitizeContent(html)
  if (!safeHtml || typeof DOMParser === 'undefined') return safeHtml
  try {
    const doc = new DOMParser().parseFromString(safeHtml, 'text/html')

    doc.querySelectorAll('a').forEach((a) => {
      a.setAttribute('target', '_blank')
      a.setAttribute('rel', 'noopener noreferrer')
      a.classList.add('cursor-pointer', 'underline', 'text-sky-700', 'hover:text-sky-800', 'break-all')
    })

    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT)
    const textNodes = []
    while (walker.nextNode()) {
      if (walker.currentNode.parentElement?.tagName !== 'A') {
        textNodes.push(walker.currentNode)
      }
    }

    const urlRegex = /(https?:\/\/[^\s<]+)/g
    for (const node of textNodes) {
      const value = node.nodeValue || ''
      urlRegex.lastIndex = 0
      if (!urlRegex.test(value)) continue

      urlRegex.lastIndex = 0
      const fragment = doc.createDocumentFragment()
      let lastIndex = 0
      let match

      while ((match = urlRegex.exec(value)) !== null) {
        fragment.appendChild(doc.createTextNode(value.slice(lastIndex, match.index)))

        const link = doc.createElement('a')
        link.setAttribute('href', match[0])
        link.setAttribute('target', '_blank')
        link.setAttribute('rel', 'noopener noreferrer')
        link.className = 'cursor-pointer underline text-sky-700 hover:text-sky-800 break-all'
        link.textContent = match[0]
        fragment.appendChild(link)
        lastIndex = match.index + match[0].length
      }

      fragment.appendChild(doc.createTextNode(value.slice(lastIndex)))
      node.replaceWith(fragment)
    }

    doc.body.querySelectorAll('ul, ol').forEach((list) => {
      if (Array.from(list.children).some((li) => li.hasAttribute('data-list'))) return
      let depth = 0
      for (let p = list.parentElement?.closest('ul, ol'); p; p = p.parentElement?.closest('ul, ol')) depth += 1
      const level = Math.min(depth, 2)
      const styles = list.tagName === 'OL'
        ? ['list-decimal', 'list-[lower-alpha]', 'list-[lower-roman]']
        : ['list-disc', 'list-[circle]', 'list-[square]']
      list.classList.add(styles[level], 'pl-6', 'my-2')
    })

    return doc.body.innerHTML
  } catch {
    return safeHtml
  }
}

const renderedContent = computed(() => {
  return enhanceContent(props.content || '<p class="text-neutral-400 italic">Belum ada isi konten.</p>')
})

/* ============ Data Berita Terkait & Running Text Ticker ============ */
const DEFAULT_JAM_LAYANAN = 'Jam Layanan Kalurahan: Senin–Kamis 08.00–15.00 WIB, Jumat 08.00–11.00 WIB'
const serviceHoursText = ref(DEFAULT_JAM_LAYANAN)
const tickerAnnouncement = ref('Berita Seeder 05')
const relatedNewsList = ref([
  {
    title: 'Berita Seeder 02',
    category: 'Sosial',
    date: '13 Nov 2026',
    image: '',
  },
  {
    title: 'Berita Seeder 05',
    category: 'Pemerintahan',
    date: '13 Nov 2026',
    image: '',
  },
  {
    title: 'Berita Seeder 08',
    category: 'Kegiatan Warga',
    date: '13 Nov 2026',
    image: '',
  },
])

onMounted(async () => {
  try {
    const [newsRes, hoursRes] = await Promise.allSettled([
      newsService.list(),
      serviceHoursService.list(),
    ])

    if (newsRes.status === 'fulfilled' && Array.isArray(newsRes.value)) {
      const published = newsRes.value.filter(n => String(n.status || '').toLowerCase() === 'published')
      if (published.length > 0) {
        relatedNewsList.value = published.slice(0, 3).map(n => ({
          title: n.title,
          category: n.category?.category_name || 'Berita Desa',
          date: n.published_at
            ? new Date(n.published_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
            : '13 Nov 2026',
          image: n.thumbnail ? mediaUrl(n.thumbnail) : '',
        }))
        tickerAnnouncement.value = published[0]?.title || 'Berita Kalurahan Terkini'
      }
    }

    if (hoursRes.status === 'fulfilled' && Array.isArray(hoursRes.value)) {
      // Simpan format jika tersedia
    }
  } catch {
    // Gunakan fallback data
  }
})

const mockRelatedPotentials = [
  {
    name: 'Desa Wisata Budaya Bimomartani',
    category: 'Pariwisata',
    shortDesc: 'Potensi wisata edukasi dan kebudayaan lokal dengan pesona alam pedesaan.',
  },
  {
    name: 'Sentra Olahan Keripik Jamur',
    category: 'UMKM',
    shortDesc: 'Produksi rumahan aneka olahan jamur tiram renyah khas warga Bimomartani.',
  },
  {
    name: 'Kebun Bibit Hortikultura Lestari',
    category: 'Pertanian',
    shortDesc: 'Pusat pembibitan buah dan sayuran unggul berbasis pertanian organik terpadu.',
  },
]

const mapEmbedSrc = 'https://www.google.com/maps?q=Kalurahan+Bimomartani,+Ngemplak,+Sleman,+DIY&output=embed'
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    maximizable
    :draggable="false"
    :style="{ width: 'min(1280px, 96vw)' }"
    :breakpoints="{ '960px': '98vw' }"
    :pt="{
      root: { class: '!rounded-2xl !overflow-hidden !border !border-slate-300 !shadow-2xl !p-0' },
      header: { class: '!hidden' },
      content: { class: '!p-0 !overflow-y-auto max-h-[90vh]' },
    }"
  >
    <!-- ============ BROWSER-LIKE HEADER FRAME ============ -->
    <div class="sticky top-0 z-50 flex items-center justify-between border-b border-slate-700 bg-slate-900 px-4 py-2 text-slate-200 select-none">
      <div class="flex items-center gap-3 min-w-0">
        <div class="flex items-center gap-1.5 shrink-0">
          <span
            class="h-3 w-3 rounded-full bg-rose-500 inline-block cursor-pointer hover:opacity-80 transition-opacity"
            title="Tutup Pratinjau"
            @click="visible = false"
          />
          <span class="h-3 w-3 rounded-full bg-amber-500 inline-block" />
          <span class="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
        </div>
        <div class="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium truncate">
          <i class="pi pi-desktop text-[11px] text-sky-400" />
          <span>Pratinjau Publik SIBIMO</span>
        </div>
      </div>

      <!-- Address Bar: bimomartani.id -->
      <div class="flex items-center gap-2 bg-slate-950/90 px-3.5 py-1 rounded-full text-xs text-slate-300 border border-slate-800 max-w-[460px] mx-2 min-w-0 flex-1 justify-center sm:justify-start">
        <i class="pi pi-lock text-[10px] text-emerald-400 shrink-0" />
        <span class="text-slate-400">https://bimomartani.id</span>
        <span class="text-sky-300 font-mono truncate">{{ simulatedPath }}</span>
      </div>

      <!-- Right actions -->
      <div class="flex items-center gap-2 shrink-0">
        <span class="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
          <span class="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
          Pratinjau Langsung
        </span>
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Tutup"
          @click="visible = false"
        >
          <i class="pi pi-times text-xs" />
        </button>
      </div>
    </div>

    <!-- ============ PUBLIC CANVAS ============ -->
    <div class="public-canvas min-h-screen bg-[#f6f8f9] text-[#434c4f] antialiased">
      <!-- 1. Running Text (Announcement Ticker) persis seperti di public -->
      <div class="border-b border-[#e2e6e8] bg-white px-4 py-2 text-[12px] sm:text-[12.5px] text-[#434c4f] overflow-hidden whitespace-nowrap">
        <div class="max-w-[1350px] mx-auto flex items-center gap-3">
          <span class="font-medium text-[#212525] shrink-0">{{ serviceHoursText }}</span>
          <span class="text-neutral-300">•</span>
          <span class="text-[#707d81] truncate">{{ tickerAnnouncement }}</span>
        </div>
      </div>

      <!-- 2. Navbar Publik (Sama persis dengan PublicLayout.vue) -->
      <header class="sticky top-0 z-40 bg-gradient-to-r from-[#22314f] to-[#1c3f61] border-b border-white/10 shadow-sm px-4 sm:px-6 md:px-10 lg:px-12 py-2.5">
        <div class="max-w-[1350px] mx-auto flex items-center justify-between">
          <!-- Logo & Nama Kalurahan -->
          <div class="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
            <img
              :src="villageLogo"
              alt="Logo Sleman Kalurahan Bimomartani"
              class="w-9 h-9 sm:w-10 sm:h-10 object-contain shrink-0"
            />
            <span class="flex flex-col leading-tight min-w-0">
              <b class="font-bold tracking-tight text-sm sm:text-base lg:text-lg uppercase text-white truncate">
                Kalurahan Bimomartani
              </b>
              <small class="block text-[10px] sm:text-[11.5px] text-white/80 font-medium truncate">
                Kapanewon Ngemplak, Kabupaten Sleman
              </small>
            </span>
          </div>

          <!-- Menu Navigasi Publik -->
          <nav class="hidden lg:flex items-center gap-1 xl:gap-2 text-[15px] xl:text-[16px] text-white tracking-tight font-normal">
            <span class="px-3 py-1.5 rounded-lg hover:text-white/80 transition-colors cursor-pointer">Beranda</span>
            <span class="px-3 py-1.5 rounded-lg hover:text-white/80 transition-colors cursor-pointer">Profil</span>
            <span class="px-3 py-1.5 rounded-lg hover:text-white/80 transition-colors cursor-pointer">Layanan Mandiri</span>
            <span
              class="px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              :class="kind === 'Berita' ? 'border-b-2 border-white font-bold' : ''"
            >
              Informasi
              <i class="pi pi-angle-down text-xs text-white/70" />
            </span>
            <span class="px-3 py-1.5 rounded-lg hover:text-white/80 transition-colors cursor-pointer">Aduan</span>
            <span class="px-3 py-1.5 rounded-lg hover:text-white/80 transition-colors cursor-pointer">Survei Kepuasan</span>
            <span
              class="px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              :class="kind.includes('Potensi') ? 'border-b-2 border-white font-bold' : ''"
            >
              Potensi
            </span>
            <span
              class="px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              :class="kind === 'Agenda' ? 'border-b-2 border-white font-bold' : ''"
            >
              Agenda
            </span>
            <span class="px-3 py-1.5 rounded-lg hover:text-white/80 transition-colors cursor-pointer">Data</span>
          </nav>
        </div>
      </header>

      <!-- ============ KONTEN UTAMA ============ -->
      <main class="max-w-[1350px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 py-6 lg:py-8">

        <!-- ======================================================== -->
        <!-- 1. PRATINJAU BERITA (Sama persis dgn NewsDetailView.vue) -->
        <!-- ======================================================== -->
        <section v-if="kind === 'Berita'" class="relative overflow-hidden">
          <!-- Ambient glow warna kategori -->
          <div
            class="pointer-events-none absolute -top-10 left-0 -z-10 h-72 w-full animate-pulse bg-gradient-to-b blur-3xl opacity-60"
            :class="getCategoryStyle(category).glow"
          />

          <!-- Breadcrumb -->
          <nav class="mb-5 flex flex-wrap items-center gap-1.5 text-[12.5px] text-[#707d81]">
            <span class="hover:text-[#175380] cursor-pointer">Beranda</span>
            <i class="pi pi-angle-right text-[9px]" />
            <span class="hover:text-[#175380] cursor-pointer">Berita Desa</span>
            <i class="pi pi-angle-right text-[9px]" />
            <span class="max-w-[240px] truncate font-medium text-[#212525] sm:max-w-none">
              {{ title || 'Judul Berita' }}
            </span>
          </nav>

          <div class="grid items-start gap-8 lg:grid-cols-3">
            <!-- Konten Utama Berita (2 Kolom) -->
            <article class="min-w-0 lg:col-span-2">
              <span
                class="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
                :class="getCategoryStyle(category).activeBadge"
              >
                {{ category || 'Berita Desa' }}
              </span>

              <h1 class="mt-3 text-2xl font-extrabold leading-tight text-[#212525] sm:text-3xl lg:text-[32px]">
                {{ title || 'Judul Berita Belum Diisi' }}
              </h1>

              <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-[#707d81]">
                <span class="flex items-center gap-1.5">
                  <i class="pi pi-calendar text-[11px]" />
                  {{ date || '13 Nov 2026' }}
                </span>
                <span class="flex items-center gap-1.5">
                  <i class="pi pi-user text-[11px]" />
                  {{ author || 'Admin Desa' }}
                </span>
              </div>

              <!-- Hero Image Berita -->
              <div
                class="relative mt-5 flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br shadow-lg shadow-slate-900/5 border border-[#e2e6e8]"
                :class="image ? 'bg-slate-50' : getCategoryStyle(category).imageGradient"
              >
                <span class="absolute inset-x-0 top-0 h-1.5 z-10" :class="getCategoryStyle(category).topBar" />
                <img
                  v-if="image"
                  :src="image"
                  :alt="title || 'Gambar Berita'"
                  class="h-full w-full object-cover"
                />
                <div v-else class="flex flex-col items-center gap-2 text-white/70">
                  <i class="pi pi-image text-4xl" />
                  <span class="text-xs font-semibold">Foto Berita Belum Diunggah</span>
                </div>
              </div>

              <!-- Isi Konten HTML -->
              <div
                class="news-content mt-6 w-full min-w-0 max-w-full overflow-hidden text-[14.5px] leading-relaxed text-[#434c4f] sm:text-[15px]"
                v-html="renderedContent"
              />

              <!-- Bagikan Section -->
              <div class="mt-8 flex flex-wrap items-center gap-3 border-t border-[#e2e6e8] pt-6">
                <span class="text-[12.5px] font-bold text-[#212525]">Bagikan:</span>
                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 transition-all hover:bg-emerald-600 hover:text-white"
                >
                  <i class="pi pi-whatsapp text-[14px]" />
                </button>
                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-600 transition-all hover:bg-sky-600 hover:text-white"
                >
                  <i class="pi pi-facebook text-[14px]" />
                </button>
                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-slate-600 transition-all hover:bg-slate-800 hover:text-white"
                >
                  <i class="pi pi-twitter text-[14px]" />
                </button>
              </div>

              <div class="mt-6 inline-flex items-center gap-2 text-[13px] font-bold text-[#175380] cursor-pointer">
                <i class="pi pi-arrow-left text-[11px]" />
                Kembali ke Berita Desa
              </div>
            </article>

            <!-- Sidebar: Berita Terkait (Sesuai Screenshot 1) -->
            <aside class="rounded-2xl border border-[#e2e6e8] bg-white p-5 shadow-xs">
              <h2 class="mb-3.5 flex items-center gap-2 text-[15px] font-extrabold text-[#212525]">
                <i class="pi pi-book text-[#175380]" />
                Berita Terkait
              </h2>
              <div class="flex flex-col gap-3">
                <div
                  v-for="(item, idx) in relatedNewsList"
                  :key="item.title"
                  class="group flex items-center gap-3 rounded-xl border border-[#e2e6e8] bg-white p-2.5 transition-all hover:border-sky-300 hover:shadow-xs"
                >
                  <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200">
                    <img
                      v-if="item.image"
                      :src="item.image"
                      :alt="item.title"
                      class="h-full w-full object-cover"
                    />
                    <i v-else class="pi pi-image text-lg text-slate-400" />
                  </div>
                  <div class="flex min-w-0 flex-col gap-1.5">
                    <p class="line-clamp-2 text-[13px] font-extrabold leading-snug text-[#212525] group-hover:text-[#175380] transition-colors">
                      {{ item.title }}
                    </p>
                    <span
                      class="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
                      :class="idx === 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : idx === 1 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'"
                    >
                      <span
                        class="h-1.5 w-1.5 rounded-full"
                        :class="idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-emerald-500' : 'bg-rose-500'"
                      />
                      {{ item.date }}
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <!-- ======================================================== -->
        <!-- 2. PRATINJAU AGENDA (Sama persis dgn Events detail/list) -->
        <!-- ======================================================== -->
        <section v-else-if="kind === 'Agenda'">
          <div class="inline-flex items-center gap-1.5 text-[13px] font-bold text-sky-700 cursor-pointer">
            <i class="pi pi-arrow-left text-[11px]" />
            Kembali ke Agenda Bimomartani
          </div>

          <div class="max-w-2xl mt-4">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-sky-500" />
              <span class="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-600">Agenda Kalurahan</span>
            </div>
            <h1 class="mt-2 text-2xl font-extrabold text-[#212525] sm:text-3xl">
              Agenda
              <span class="bg-gradient-to-r from-sky-600 via-cyan-500 to-violet-600 bg-clip-text text-transparent">
                Bimomartani
              </span>
            </h1>
            <p class="mt-1 text-[13.5px] text-[#707d81] sm:text-[14.5px]">
              Jadwal kegiatan, musyawarah, dan acara penting komunitas Kalurahan Bimomartani.
            </p>
          </div>

          <!-- Tampilan Kartu Agenda Linimasa -->
          <div class="mt-6">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-extrabold uppercase tracking-wider text-[#707d81] flex items-center gap-1.5">
                <i class="pi pi-id-card text-sky-600" />
                Tampilan Kartu Linimasa (Halaman /events & Beranda)
              </span>
            </div>

            <div class="relative overflow-hidden rounded-2xl border border-[#e2e6e8] bg-white flex flex-col sm:flex-row shadow-sm hover:shadow-md transition-shadow">
              <span class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 to-violet-500 z-10" />

              <div class="w-full sm:w-[220px] aspect-[16/9] sm:aspect-auto shrink-0 bg-gradient-to-br from-sky-50 via-violet-50 to-sky-100 flex flex-col items-center justify-center p-6 text-center border-b sm:border-b-0 sm:border-r border-[#e2e6e8]">
                <img
                  v-if="image"
                  :src="image"
                  :alt="title || 'Lampiran Agenda'"
                  class="h-full w-full object-cover rounded-xl"
                />
                <template v-else>
                  <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-violet-600 text-white flex flex-col items-center justify-center shadow-md shadow-sky-600/25">
                    <i class="pi pi-calendar text-2xl" />
                  </div>
                  <span class="mt-2.5 text-xs font-bold text-sky-800 uppercase tracking-wider">
                    {{ date || 'Jadwal Agenda' }}
                  </span>
                  <span v-if="time" class="text-[11px] text-[#707d81] font-medium mt-0.5">
                    {{ time }}
                  </span>
                </template>
              </div>

              <div class="p-5 sm:p-6 min-w-0 flex-1 flex flex-col justify-between">
                <div>
                  <div class="flex flex-wrap items-center gap-2.5 text-xs">
                    <span class="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                      <i class="pi pi-map-marker text-[11px]" />
                      {{ location || 'Lokasi Belum Ditentukan' }}
                    </span>
                    <span v-if="time" class="inline-flex items-center gap-1.5 font-semibold text-[#434c4f] bg-slate-100 px-2.5 py-1 rounded-full">
                      <i class="pi pi-clock text-[11px] text-sky-600" />
                      {{ time }}
                    </span>
                  </div>

                  <h3 class="text-lg sm:text-xl font-extrabold text-[#212525] mt-3 uppercase tracking-tight">
                    {{ title || 'NAMA KEGIATAN / ACARA BELUM DIISI' }}
                  </h3>

                  <div class="mt-3 rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-sm text-[#434c4f]">
                    <div class="text-[11.5px] font-bold uppercase tracking-wide text-[#707d81] mb-1 flex items-center gap-1.5">
                      <i class="pi pi-users text-sky-600" />
                      Yang Menghadiri / Keterangan:
                    </div>
                    <div class="text-[13.5px] leading-relaxed whitespace-pre-wrap">
                      {{ attendees || 'Belum ada keterangan peserta atau rincian agenda.' }}
                    </div>
                  </div>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#707d81]">
                  <span>Penyelenggara: Pemerintah Kalurahan Bimomartani</span>
                  <span class="font-bold text-sky-700 flex items-center gap-1 cursor-pointer">
                    Lihat Jadwal Lengkap
                    <i class="pi pi-arrow-right text-[10px]" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tampilan Tabel Bulanan (/events/:month) -->
          <div class="mt-8">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-extrabold uppercase tracking-wider text-[#707d81] flex items-center gap-1.5">
                <i class="pi pi-table text-sky-600" />
                Tampilan Pada Tabel Bulanan Agenda (/events/:month)
              </span>
            </div>

            <div class="relative overflow-hidden rounded-2xl border border-[#e2e6e8] bg-white shadow-sm">
              <span class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 to-violet-500" />

              <div class="px-5 py-3.5 bg-gradient-to-r from-sky-50 to-violet-50 border-b border-[#e2e6e8] flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-sky-500" />
                <h4 class="text-[15px] font-extrabold text-[#212525] m-0">
                  Daftar Agenda Kegiatan Kalurahan
                </h4>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm border-collapse min-w-[760px]">
                  <thead>
                    <tr class="border-b border-[#e2e6e8] bg-slate-50 text-xs font-bold text-[#707d81]">
                      <th class="py-3 px-4 w-14 text-center">No</th>
                      <th class="py-3 px-4 min-w-[150px]">Hari, Tanggal</th>
                      <th class="py-3 px-4 min-w-[100px]">Jam</th>
                      <th class="py-3 px-4 min-w-[200px]">Acara</th>
                      <th class="py-3 px-4 min-w-[160px]">Tempat</th>
                      <th class="py-3 px-4 min-w-[200px]">Yang Menghadiri/Keterangan</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#e2e6e8]">
                    <tr class="bg-sky-50/80 font-medium">
                      <td class="py-3 px-4 text-center font-bold text-sky-700">1</td>
                      <td class="py-3 px-4 font-bold text-[#212525]">{{ date || '-' }}</td>
                      <td class="py-3 px-4 text-[#434c4f]">{{ time || '-' }}</td>
                      <td class="py-3 px-4 font-bold text-sky-900">
                        {{ title || '-' }}
                        <span class="ml-1.5 inline-block text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-sky-600 text-white">Baru</span>
                      </td>
                      <td class="py-3 px-4 text-[#434c4f]">{{ location || '-' }}</td>
                      <td class="py-3 px-4 text-[#434c4f]">{{ attendees || '-' }}</td>
                    </tr>
                    <tr class="text-slate-500 hover:bg-slate-50/50">
                      <td class="py-3 px-4 text-center text-slate-400">2</td>
                      <td class="py-3 px-4 font-semibold text-slate-600">Jumat, 14 November 2026</td>
                      <td class="py-3 px-4">08:30 WIB</td>
                      <td class="py-3 px-4 font-semibold text-slate-700">Rapat Koordinasi Perangkat Kalurahan</td>
                      <td class="py-3 px-4">Balai Kalurahan</td>
                      <td class="py-3 px-4">Lurah & Seluruh Pamong Kalurahan</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <!-- ======================================================== -->
        <!-- 3. PRATINJAU POTENSI (Sama persis dgn PotentialDetailView)-->
        <!-- ======================================================== -->
        <section v-else-if="kind.includes('Potensi')">
          <div class="inline-flex items-center gap-2 text-sm font-semibold text-[#707d81] cursor-pointer">
            <i class="pi pi-arrow-left text-xs" />
            Kembali ke Potensi Bimomartani
          </div>

          <!-- Hero Image -->
          <div class="relative mt-4 flex h-60 md:h-80 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-[#e2e6e8] shadow-sm">
            <img
              v-if="image"
              :src="image"
              :alt="title || 'Foto Potensi'"
              class="h-full w-full object-cover"
              style="object-position: center 30%"
            />
            <div v-else class="flex flex-col items-center gap-2 text-slate-400">
              <i class="pi pi-image text-5xl" />
              <span class="text-xs font-semibold">Foto Potensi Belum Diunggah</span>
            </div>
          </div>

          <!-- 2 Columns Grid: Content + Sidebar -->
          <div class="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div class="min-w-0 max-w-full">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 mb-2">
                <i class="pi pi-tag text-[10px]" />
                {{ category || 'Potensi Desa' }}
              </span>

              <h1 class="break-words text-2xl md:text-3xl font-bold text-[#212525]">
                {{ title || 'Nama Potensi Desa Belum Diisi' }}
              </h1>

              <div class="mt-2 flex items-center gap-1.5 text-sm font-medium text-[#707d81]">
                <i class="pi pi-map-marker text-emerald-600" />
                {{ location || 'Kalurahan Bimomartani, Sleman' }}
              </div>

              <div v-if="summary" class="mt-5 rounded-xl border-l-4 border-emerald-500 bg-emerald-50/60 p-4 text-[14px] leading-relaxed text-[#434c4f] font-medium">
                {{ summary }}
              </div>

              <div
                class="potential-content mt-6 min-w-0 max-w-full overflow-hidden text-sm md:text-[15px] leading-relaxed text-[#434c4f]"
                v-html="renderedContent"
              />
            </div>

            <!-- Sidebar Informasi -->
            <aside class="h-fit min-w-0 rounded-2xl border border-[#e2e6e8] bg-white p-6 shadow-sm">
              <p class="text-xs font-semibold uppercase tracking-wide text-[#707d81] m-0">
                Informasi Potensi
              </p>

              <dl class="mt-4 space-y-4">
                <div>
                  <dt class="text-xs font-medium text-[#707d81]">Kategori</dt>
                  <dd class="mt-0.5 break-words text-sm font-semibold text-[#212525]">{{ category || '-' }}</dd>
                </div>
                <div>
                  <dt class="text-xs font-medium text-[#707d81]">Lokasi</dt>
                  <dd class="mt-0.5 break-words text-sm font-semibold text-[#212525]">{{ location || '-' }}</dd>
                </div>
                <div v-for="d in details" :key="d.label" v-show="d.value && d.label !== 'Lokasi' && d.label !== 'Kontak'">
                  <dt class="text-xs font-medium text-[#707d81]">{{ d.label }}</dt>
                  <dd class="mt-0.5 break-words text-sm font-semibold text-[#212525]">{{ d.value }}</dd>
                </div>
              </dl>

              <div class="mt-6 border-t border-[#e2e6e8] pt-4">
                <p class="text-xs font-medium text-[#707d81] m-0">Kontak Pengelola</p>
                <p class="mt-0.5 break-words text-sm font-semibold text-[#212525]">{{ contact || '-' }}</p>
              </div>

              <button
                type="button"
                class="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <i class="pi pi-phone text-xs" />
                Hubungi Kontak
              </button>
            </aside>
          </div>

          <!-- Potensi Lainnya -->
          <div class="mt-14 border-t border-[#e2e6e8] pt-8">
            <h2 class="text-lg font-bold text-[#212525]">Potensi Kalurahan Lainnya</h2>

            <div class="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="item in mockRelatedPotentials"
                :key="item.name"
                class="group overflow-hidden rounded-2xl border border-[#e2e6e8] bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div class="flex h-36 w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-100">
                  <i class="pi pi-image text-3xl text-emerald-400/80" />
                </div>
                <div class="p-4">
                  <span class="inline-block px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
                    {{ item.category }}
                  </span>
                  <p class="text-sm font-bold text-[#212525]">{{ item.name }}</p>
                  <p class="mt-1 text-xs text-[#707d81] line-clamp-2 leading-relaxed">{{ item.shortDesc }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <!-- ======================================================== -->
      <!-- 4. FOOTER RESMI PUBLIK (Sama persis dgn AppFooter.vue)   -->
      <!-- ======================================================== -->
      <footer class="mt-14 lg:mt-16 bg-gradient-to-br from-[#22314f] to-[#1c3f61] text-white pt-12 pb-8 lg:pb-10">
        <div class="max-w-[1350px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12">
          <div class="grid gap-10 md:grid-cols-3">
            <!-- Kolom 1: Logo & Info Kalurahan -->
            <div>
              <div class="flex items-center gap-2.5 mb-3.5">
                <img
                  :src="villageLogo"
                  alt="Logo Kalurahan Bimomartani"
                  class="w-9 h-9 object-contain shrink-0"
                />
                <b class="font-bold tracking-tight text-lg uppercase text-white">Kalurahan Bimomartani</b>
              </div>

              <p class="text-[14.5px] text-white/90 leading-relaxed mb-4 max-w-[340px]">
                Website resmi Pemerintah Kalurahan Bimomartani, Kapanewon Ngemplak, Kabupaten Sleman, Provinsi Daerah Istimewa Yogyakarta.
              </p>

              <!-- Social Media Circle Buttons -->
              <div class="flex gap-2.5">
                <a
                  href="#"
                  class="w-[38px] h-[38px] rounded-full border border-white/25 text-white flex items-center justify-center hover:bg-[#ecc44e] hover:border-[#ecc44e] hover:text-[#22314f] transition-all"
                >
                  <i class="pi pi-facebook text-base" />
                </a>
                <a
                  href="#"
                  class="w-[38px] h-[38px] rounded-full border border-white/25 text-white flex items-center justify-center hover:bg-[#ecc44e] hover:border-[#ecc44e] hover:text-[#22314f] transition-all"
                >
                  <i class="pi pi-instagram text-base" />
                </a>
                <a
                  href="#"
                  class="w-[38px] h-[38px] rounded-full border border-white/25 text-white flex items-center justify-center hover:bg-[#ecc44e] hover:border-[#ecc44e] hover:text-[#22314f] transition-all"
                >
                  <i class="pi pi-youtube text-base" />
                </a>
                <a
                  href="#"
                  class="w-[38px] h-[38px] rounded-full border border-white/25 text-white flex items-center justify-center hover:bg-[#ecc44e] hover:border-[#ecc44e] hover:text-[#22314f] transition-all"
                >
                  <i class="pi pi-whatsapp text-base" />
                </a>
              </div>
            </div>

            <!-- Kolom 2: Hubungi Kami & Mini Map -->
            <div>
              <p class="text-[15px] font-bold text-[#ecc44e] uppercase tracking-wide mb-3.5">
                Hubungi Kami
              </p>

              <div class="flex gap-2.5 text-[14.5px] text-white/90 leading-relaxed mb-3">
                <i class="pi pi-map-marker text-[#ecc44e] mt-0.5 shrink-0" />
                Jl. Cangkringan No.50, Area Sawah, Bimomartani, Kec. Ngemplak, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55584
              </div>

              <div class="flex gap-2.5 text-[14.5px] text-white/90 leading-relaxed mb-3">
                <i class="pi pi-phone text-[#ecc44e] mt-0.5 shrink-0" />
                0812-3456-7890
              </div>

              <div class="flex gap-2.5 text-[14.5px] text-white/90 leading-relaxed mb-4">
                <i class="pi pi-envelope text-[#ecc44e] mt-0.5 shrink-0" />
                desa.bimomartani@slemankab.go.id
              </div>

              <div class="rounded-xl overflow-hidden border border-white/15 h-[130px]">
                <iframe
                  :src="mapEmbedSrc"
                  class="w-full h-full grayscale-[35%] contrast-[1.05]"
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                  title="Peta lokasi Kalurahan Bimomartani"
                />
              </div>
            </div>

            <!-- Kolom 3: Tautan Cepat -->
            <div>
              <p class="text-[15px] font-bold text-[#ecc44e] uppercase tracking-wide mb-3.5">
                Tautan Cepat
              </p>

              <div class="grid grid-cols-2 gap-x-4 gap-y-3.5 text-[14.5px] text-white/90">
                <span class="flex items-center gap-2 hover:text-[#ecc44e] transition-colors cursor-pointer">
                  <i class="pi pi-angle-right text-[10px] text-[#ecc44e]" />
                  Profil Kalurahan
                </span>
                <span class="flex items-center gap-2 hover:text-[#ecc44e] transition-colors cursor-pointer">
                  <i class="pi pi-angle-right text-[10px] text-[#ecc44e]" />
                  Layanan Mandiri
                </span>
                <span class="flex items-center gap-2 hover:text-[#ecc44e] transition-colors cursor-pointer">
                  <i class="pi pi-angle-right text-[10px] text-[#ecc44e]" />
                  Aduan Masyarakat
                </span>
                <span class="flex items-center gap-2 hover:text-[#ecc44e] transition-colors cursor-pointer">
                  <i class="pi pi-angle-right text-[10px] text-[#ecc44e]" />
                  Potensi Bimomartani
                </span>
                <span class="flex items-center gap-2 hover:text-[#ecc44e] transition-colors cursor-pointer">
                  <i class="pi pi-angle-right text-[10px] text-[#ecc44e]" />
                  Galeri Kalurahan
                </span>
                <span class="flex items-center gap-2 hover:text-[#ecc44e] transition-colors cursor-pointer">
                  <i class="pi pi-angle-right text-[10px] text-[#ecc44e]" />
                  Agenda Kalurahan
                </span>
                <span class="flex items-center gap-2 hover:text-[#ecc44e] transition-colors cursor-pointer">
                  <i class="pi pi-angle-right text-[10px] text-[#ecc44e]" />
                  Produk Hukum
                </span>
                <span class="flex items-center gap-2 hover:text-[#ecc44e] transition-colors cursor-pointer">
                  <i class="pi pi-angle-right text-[10px] text-[#ecc44e]" />
                  Pembangunan
                </span>
              </div>
            </div>
          </div>

          <!-- Bottom Bar -->
          <div class="mt-9 pt-5 border-t border-dashed border-white/20 flex flex-col md:flex-row items-center justify-between gap-3 text-[13.5px] text-white/80">
            <span>Hak cipta © 2026 — Kalurahan Bimomartani</span>
            <span>Dibangun dengan SIBIMO</span>
          </div>
        </div>
      </footer>
    </div>
  </Dialog>
</template>

<style scoped>
/* Reset dan scope styling agar identik dengan halaman publik */
.public-canvas {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  text-align: left;
}

/* ================== TYPOGRAPHY BERITA (IDENTIK DGN SIBIMO-PUBLIC) ================== */
.news-content {
  overflow-wrap: anywhere;
  word-break: normal;
}
.news-content :deep(*) {
  box-sizing: border-box;
  max-width: 100%;
}
.news-content :deep(p) {
  margin-bottom: 0.75rem;
  line-height: 1.75;
  white-space: normal !important;
  overflow-wrap: anywhere;
}
.news-content :deep(a) {
  color: #175380;
  text-decoration: underline;
  word-break: break-all;
}
.news-content :deep(a:hover) {
  color: #1c3f61;
}
.news-content :deep(strong),
.news-content :deep(b) {
  font-weight: 700;
  color: #212525;
}
.news-content :deep(em),
.news-content :deep(i) {
  font-style: italic;
}
.news-content :deep(ul),
.news-content :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 0.75rem;
}
.news-content :deep(ul) {
  list-style-type: disc;
}
.news-content :deep(ol) {
  list-style-type: decimal;
}
.news-content :deep(li) {
  margin-bottom: 0.25rem;
  white-space: normal !important;
  overflow-wrap: anywhere;
}
.news-content :deep(img) {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  border-radius: 0.75rem;
  margin: 0.75rem 0;
}
.news-content :deep(pre),
.news-content :deep(code) {
  max-width: 100%;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
.news-content :deep(pre) {
  overflow-x: auto;
  border-radius: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.75rem 1rem;
  font-size: 13px;
}
.news-content :deep(table) {
  display: block;
  width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
  margin: 0.75rem 0;
}
.news-content :deep(th),
.news-content :deep(td) {
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.65rem;
  text-align: left;
  vertical-align: top;
  white-space: normal;
}
.news-content :deep(th) {
  background: #f8fafc;
  font-weight: 700;
  color: #212525;
}
.news-content :deep(blockquote) {
  border-left: 4px solid #cbd5e1;
  padding-left: 1rem;
  color: #64748b;
  font-style: italic;
  margin: 0.75rem 0;
}
.news-content :deep(h1),
.news-content :deep(h2),
.news-content :deep(h3) {
  font-weight: 700;
  margin-bottom: 0.5rem;
  line-height: 1.3;
  color: #212525;
}
.news-content :deep(.ql-align-center) {
  text-align: center;
}
.news-content :deep(.ql-align-right) {
  text-align: right;
}
.news-content :deep(.ql-align-justify) {
  text-align: justify;
}

/* ================== TYPOGRAPHY POTENSI (IDENTIK DGN SIBIMO-PUBLIC) ================== */
.potential-content {
  overflow-wrap: anywhere;
}
.potential-content :deep(p) {
  margin-bottom: 0.75rem;
  line-height: 1.75;
}
.potential-content :deep(a) {
  color: #16a34a;
  text-decoration: underline;
}
.potential-content :deep(strong),
.potential-content :deep(b) {
  font-weight: 700;
  color: #212525;
}
.potential-content :deep(ul),
.potential-content :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 0.75rem;
}
.potential-content :deep(ul) {
  list-style-type: disc;
}
.potential-content :deep(ol) {
  list-style-type: decimal;
}
.potential-content :deep(li) {
  margin-bottom: 0.25rem;
}
.potential-content :deep(img) {
  max-width: 100%;
  border-radius: 0.75rem;
  margin: 0.75rem 0;
}
.potential-content :deep(blockquote) {
  border-left: 4px solid #cbd5e1;
  padding-left: 1rem;
  color: #64748b;
  font-style: italic;
  margin: 0.75rem 0;
}
</style>
