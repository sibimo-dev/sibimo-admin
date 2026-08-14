<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const beritaId = computed(() => route.params.id ?? null)
const isEditMode = computed(() => beritaId.value !== null)
const judulHalaman = computed(() => (isEditMode.value ? 'Edit Berita' : 'Buat Berita Baru'))

const gambarPreview = ref(null)
const judul = ref('')
const isiKonten = ref('')

const status = ref('Draft')
const statusOpen = ref(true)
const keterlihatan = ref('publik')
const tanggalTerbit = ref(new Date().toISOString().slice(0, 10))
const penulis = ref('User Name')

const kategoriOptions = ref([
  { id: 'infrastruktur', label: 'Infrastruktur', checked: false },
  { id: 'pertanian', label: 'Pertanian', checked: false },
  { id: 'kesehatan', label: 'Kesehatan', checked: false },
  { id: 'sosial', label: 'Sosial', checked: true },
  { id: 'keuangan', label: 'Keuangan', checked: true },
  { id: 'teknologi', label: 'Teknologi', checked: false },
])

const tags = ref(['Sosial', 'Keuangan'])
const tagInput = ref('')

const statusLabelMap = { Draft: 'Draft', Published: 'Terbit' }
const statusDisplay = computed(() => statusLabelMap[status.value] ?? status.value)

onMounted(() => {
  if (!isEditMode.value) return

  judul.value = 'Judul berita'
  isiKonten.value = 'Isi konten berita yang sudah tersimpan sebelumnya...'
  status.value = 'Published'
})

function pilihGambar(e) {
  const file = e.target.files?.[0]
  if (!file) return
  gambarPreview.value = URL.createObjectURL(file)
}

function tambahTagDariInput(e) {
  const val = tagInput.value.trim()
  if (!val || e.key !== 'Enter') return
  if (!tags.value.includes(val)) tags.value.push(val)
  tagInput.value = ''
}

function hapusTag(tag) {
  tags.value = tags.value.filter(t => t !== tag)
}

function lihatPratinjau() {
  // TODO: buka pratinjau halaman publik berita
}

function simpanDraft() {
  status.value = 'Draft'
  router.push({ name: 'berita-list' })
}

function terbitkan() {
  status.value = 'Published'
  router.push({ name: 'berita-list' })
}

function pindahkanKeSampah() {
  router.push({ name: 'berita-list' })
}
</script>
<template>
  <div class="min-h-full px-6 py-6 text-slate-800 lg:px-8">
    <div class="mb-5">
      <h1 class="m-0 text-[22px] font-bold text-[#0f2540]">{{ judulHalaman }}</h1>
    </div>

    <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <!-- Kolom utama -->
      <div class="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-2">
          <label class="text-[13px] font-semibold text-slate-700">Gambar</label>

          <label
            class="relative flex h-[240px] cursor-pointer items-center justify-center overflow-hidden rounded-[10px] border-[1.5px] border-dashed border-slate-300 bg-slate-100"
            :class="gambarPreview ? 'border-solid' : ''"
          >
            <img
              v-if="gambarPreview"
              :src="gambarPreview"
              alt="Preview gambar"
              class="h-full w-full object-cover"
            />

            <span v-else class="text-[13px] text-slate-400">
              Klik atau seret gambar ke sini
            </span>

            <span class="absolute right-2.5 top-2.5 rounded-md bg-white p-1.5 text-blue-700 shadow">
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>

            <input
              type="file"
              accept="image/*"
              class="absolute inset-0 cursor-pointer opacity-0"
              @change="pilihGambar"
            />
          </label>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-[13px] font-semibold text-slate-700" for="judul">Judul</label>
          <input
            id="judul"
            v-model="judul"
            type="text"
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-700/10"
            placeholder="Judul berita"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-[13px] font-semibold text-slate-700">Isi Konten</label>

          <div class="overflow-hidden rounded-lg border border-slate-300">
            <div class="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-2.5 py-2">
              <select class="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-700 outline-none focus:border-blue-700">
                <option>Heading</option>
                <option>Paragraf</option>
              </select>

              <select class="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-700 outline-none focus:border-blue-700">
                <option>Sans Serif</option>
                <option>Serif</option>
                <option>Monospace</option>
              </select>

              <span class="mx-0.5 h-[18px] w-px bg-slate-200"></span>

              <button type="button" class="rounded-md px-2 py-1 text-[13px] text-slate-700 hover:bg-slate-200" title="Bold"><b>B</b></button>
              <button type="button" class="rounded-md px-2 py-1 text-[13px] text-slate-700 hover:bg-slate-200" title="Italic"><i>I</i></button>
              <button type="button" class="rounded-md px-2 py-1 text-[13px] text-slate-700 hover:bg-slate-200" title="Underline"><u>U</u></button>

              <span class="mx-0.5 h-[18px] w-px bg-slate-200"></span>

              <button type="button" class="rounded-md px-2 py-1 text-[13px] text-slate-700 hover:bg-slate-200" title="Rata kiri">≡</button>
              <button type="button" class="rounded-md px-2 py-1 text-[13px] text-slate-700 hover:bg-slate-200" title="List bernomor">1.</button>
              <button type="button" class="rounded-md px-2 py-1 text-[13px] text-slate-700 hover:bg-slate-200" title="List poin">•</button>

              <span class="mx-0.5 h-[18px] w-px bg-slate-200"></span>

              <button type="button" class="rounded-md px-2 py-1 text-[13px] text-slate-700 hover:bg-slate-200" title="Sisipkan gambar">🖼</button>
              <button type="button" class="rounded-md px-2 py-1 text-[13px] text-slate-700 hover:bg-slate-200" title="Sisipkan tautan">🔗</button>
              <button type="button" class="rounded-md px-2 py-1 text-[13px] text-slate-700 hover:bg-slate-200" title="Hapus format">✕</button>
            </div>

            <textarea
              v-model="isiKonten"
              class="min-h-[220px] w-full resize-y border-0 p-3.5 text-[13px] text-slate-800 outline-none"
              placeholder="Tulis isi berita di sini..."
            />
          </div>
        </div>
      </div>

      <!-- Kolom sidebar -->
      <aside class="flex flex-col gap-3.5">
        <div class="flex gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <button
            class="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
            @click="simpanDraft"
          >
            Simpan Draft
          </button>

          <button
            class="inline-flex flex-1 items-center justify-center rounded-lg border border-blue-700 bg-blue-700 px-3.5 py-2.5 text-[13px] font-medium text-white transition hover:bg-blue-800"
            @click="simpanUtama"
          >
            {{ labelTombolUtama }}
          </button>
        </div>

        <div class="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <div class="flex items-center justify-between text-[13px] text-slate-700">
            <span>Terbit</span>
            <button type="button" class="p-0 text-[13px] font-medium text-blue-700 hover:underline" @click="lihatPratinjau">
              Pratinjau
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <button
            class="flex items-center justify-between bg-transparent p-0 text-left text-[13px] text-slate-700"
            @click="statusOpen = !statusOpen"
          >
            <span>Status: <strong>{{ statusDisplay }}</strong></span>
            <span class="text-slate-400 transition-transform" :class="statusOpen ? 'rotate-180' : ''">⌃</span>
          </button>

          <div v-show="statusOpen" class="flex flex-col gap-1.5">
            <select
              v-model="status"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-700/10"
            >
              <option value="Draft">Draft</option>
              <option value="Published">Terbit</option>
            </select>
          </div>
        </div>

        <div class="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <div class="text-[13px] text-slate-700">
            Keterlihatan:
            <strong>
              {{ keterlihatan === 'publik' ? 'Publik' : keterlihatan === 'password' ? 'Dilindungi kata sandi' : 'Privat' }}
            </strong>
          </div>

          <div class="flex flex-col gap-2">
            <label class="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700">
              <input type="radio" value="publik" v-model="keterlihatan" class="accent-blue-700" />
              Publik
            </label>
            <label class="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700">
              <input type="radio" value="password" v-model="keterlihatan" class="accent-blue-700" />
              Dilindungi kata sandi
            </label>
            <label class="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700">
              <input type="radio" value="privat" v-model="keterlihatan" class="accent-blue-700" />
              Privat
            </label>
          </div>
        </div>

        <div class="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <label class="text-xs text-slate-500" for="tanggal">Terbit:</label>
          <input
            id="tanggal"
            v-model="tanggalTerbit"
            type="date"
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-700/10"
          />
        </div>

        <div class="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <label class="text-xs text-slate-500">Penulis</label>
          <select
            v-model="penulis"
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-700/10"
          >
            <option>User Name</option>
          </select>
        </div>

        <div class="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <label class="text-xs text-slate-500">Kategori</label>
          <div class="flex flex-col gap-2">
            <label v-for="opt in kategoriOptions" :key="opt.id" class="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700">
              <input type="checkbox" v-model="opt.checked" class="accent-blue-700" />
              {{ opt.label }}
            </label>
          </div>
        </div>

        <button
          class="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
          @click="pindahkanKeSampah"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Pindahkan ke sampah
        </button>
      </aside>
    </div>
  </div>
</template>
