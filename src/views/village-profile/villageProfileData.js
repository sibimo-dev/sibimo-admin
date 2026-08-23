import { ref } from 'vue'

// --- Sejarah (section_id: 1) ---
export const historyContent = ref({
  profile_content_id: 1,
  title: 'Sejarah Berdirinya Kalurahan Bimomartani',
  content: '',
  thumbnail: '',
  status: 'Published',
  published_at: '2026-01-15',
})

// --- Visi & Misi (section_id: 2) ---
export const visionMissionContent = ref({
  profile_content_id: 2,
  title: 'Visi & Misi Kalurahan Bimomartani',
  content: '',
  thumbnail: '',
  status: 'Published',
  published_at: '2026-01-15',
})

// --- Struktur Organisasi (section_id: 3) ---
export const orgStructureContent = ref({
  profile_content_id: 3,
  title: '',
  content: '',
  thumbnail: '',
  status: 'Draft',
  published_at: null,
})
