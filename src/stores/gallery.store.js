/**
 * Store sementara untuk modul Galeri.
 */
import { defineStore } from 'pinia'

let nextId = 7 // lanjutan dari dummy id 1-6 di bawah

export const useGalleryStore = defineStore('gallery', {
  state: () => ({
    photos: [
      { gallery_id: 1, title: 'Kerja Bakti Balai Desa', description: '', image: null, uploaded_at: '2026-07-02T08:00:00' },
      { gallery_id: 2, title: 'Panen Raya Padi', description: '', image: null, uploaded_at: '2026-06-18T09:30:00' },
      { gallery_id: 3, title: 'Perayaan HUT RI', description: '', image: null, uploaded_at: '2026-08-17T07:00:00' },
      { gallery_id: 4, title: 'Posyandu Balita', description: '', image: null, uploaded_at: '2026-05-10T10:15:00' },
      { gallery_id: 5, title: 'Pembangunan Jalan Dusun', description: '', image: null, uploaded_at: '2026-04-22T13:00:00' },
      { gallery_id: 6, title: 'Pelatihan UMKM', description: '', image: null, uploaded_at: '2026-03-15T14:45:00' },
    ],
  }),

  getters: {
    getById: (state) => (id) => state.photos.find((p) => p.gallery_id === Number(id)),
  },

  actions: {
    // TODO: ganti dengan `const { data } = await fetchGalleries(params)`
    async fetchAll() {
      return this.photos
    },

    // payload: { title, description, image_file (File|null), uploaded_by }
    // TODO: ganti dengan `await createGallery(formData)` (kirim FormData asli ke backend)
    async create(payload) {
      const newPhoto = {
        gallery_id: nextId++,
        title: payload.title,
        description: payload.description ?? '',
        // Sementara pakai object URL biar preview foto tetap tampil di list.
        // Setelah backend siap, ini akan jadi URL asli dari server.
        image: payload.image_file ? URL.createObjectURL(payload.image_file) : null,
        uploaded_by: payload.uploaded_by,
        uploaded_at: new Date().toISOString(),
      }
      this.photos.unshift(newPhoto)
      return newPhoto
    },

    // TODO: ganti dengan `await updateGallery(id, formData)`
    async update(id, payload) {
      const idx = this.photos.findIndex((p) => p.gallery_id === Number(id))
      if (idx === -1) return null

      const updated = {
        ...this.photos[idx],
        title: payload.title,
        description: payload.description ?? '',
      }
      // Foto baru dipilih -> ganti gambar. Kalau tidak, tetap pakai yang lama.
      if (payload.image_file) {
        updated.image = URL.createObjectURL(payload.image_file)
      }
      this.photos[idx] = updated
      return updated
    },

    // TODO: ganti dengan `await deleteGallery(id)`
    async remove(id) {
      this.photos = this.photos.filter((p) => p.gallery_id !== Number(id))
    },
  },
})