import { ref } from 'vue'

/**
 * Peta section -> section_id (tabel `profile_sections`).
 * `slug` di sini HARUS sama persis dengan `sectionSlug` di
 * router/modules/village-profile.routes.js.
 *
 * TODO: kalau backend sudah siap, ganti dengan GET /profile-sections
 * dan cocokkan section_id asli dari sana (jangan hardcode 1/2/3
 * kalau ternyata beda di database).
 */
export const SECTION_MAP = {
  history: { section_id: 1, label: 'Sejarah' },
  'vision-mission': { section_id: 2, label: 'Visi & Misi' },
  'organizational-structure': { section_id: 3, label: 'Struktur Organisasi' },
}

/**
 * Dummy data tabel `profile_contents`, dipakai bareng oleh
 * VillageProfileListView.vue dan VillageProfileFormView.vue supaya
 * data yang ditambah/diedit di form langsung kelihatan di list
 * (simulasi sederhana tanpa backend). Ganti dengan state dari API
 * (Pinia store atau hasil fetch) begitu backend siap.
 */
export const profileContents = ref([
  {
    profile_content_id: 1,
    section_id: 1,
    title: 'Sejarah Berdirinya Kalurahan Bimomartani',
    content: 'Kalurahan Bimomartani terbentuk dari penggabungan beberapa dusun...',
    thumbnail: '',
    status: 'Published',
    published_at: '2026-01-15',
  },
  {
    profile_content_id: 2,
    section_id: 2,
    title: 'Visi & Misi Kalurahan Bimomartani',
    content: 'Visi: Terwujudnya masyarakat Bimomartani yang mandiri, sejahtera...',
    thumbnail: '',
    status: 'Published',
    published_at: '2026-01-15',
  },
  {
    profile_content_id: 3,
    section_id: 3,
    title: 'Struktur Organisasi Pemerintah Kalurahan',
    content: 'Susunan perangkat kalurahan terdiri dari Lurah, Carik, dan Kepala Urusan...',
    thumbnail: '',
    status: 'Draft',
    published_at: null,
  },
])
