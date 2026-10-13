import { defineStore } from 'pinia'
import { createGallery, deleteGallery, getGalleries, updateGallery } from '@/services/gallery.service'

export const useGalleryStore = defineStore('gallery', {
  state: () => ({ photos: [] }),
  getters: { getById: (state) => (id) => state.photos.find((photo) => photo.gallery_id === Number(id)) },
  actions: {
    async fetchAll() { this.photos = await getGalleries(); return this.photos },
    async create(payload) { const photo = await createGallery(payload); this.photos.unshift(photo); return photo },
    async update(id, payload) { const photo = await updateGallery(id, payload); const index = this.photos.findIndex((item) => item.gallery_id === Number(id)); if (index !== -1) this.photos[index] = photo; return photo },
    async remove(id) { await deleteGallery(id); this.photos = this.photos.filter((photo) => photo.gallery_id !== Number(id)) },
  },
})
