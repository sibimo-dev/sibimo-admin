import { defineStore } from 'pinia'
import {
  createGallery, deleteGallery, getGalleries, updateGallery,
  getGalleryCategories, createGalleryCategory, updateGalleryCategory, deleteGalleryCategory,
} from '@/services/gallery.service'

export const useGalleryStore = defineStore('gallery', {
  state: () => ({ photos: [], categories: [] }),
  getters: {
    getById: (state) => (id) => state.photos.find((photo) => photo.gallery_id === Number(id)),
    // bentuk {id, label, value} dipakai Select dan daftar "Kelola Kategori" di form
    categoryOptions: (state) =>
      state.categories.map((c) => ({ id: c.category_id, label: c.name, value: c.slug })),
    getCategoryLabel: (state) => (slug) =>
      state.categories.find((c) => c.slug === slug)?.name ?? slug ?? '-',
  },
  actions: {
    async fetchAll() { this.photos = await getGalleries(); return this.photos },
    async create(payload) { const photo = await createGallery(payload); this.photos.unshift(photo); return photo },
    async update(id, payload) { const photo = await updateGallery(id, payload); const index = this.photos.findIndex((item) => item.gallery_id === Number(id)); if (index !== -1) this.photos[index] = photo; return photo },
    async remove(id) { await deleteGallery(id); this.photos = this.photos.filter((photo) => photo.gallery_id !== Number(id)) },

    async fetchCategories() {
      this.categories = await getGalleryCategories()
      return this.categories
    },
    async createCategory(payload) {
      const item = await createGalleryCategory(payload)
      this.categories.push(item)
      return item
    },
    async updateCategory(id, payload) {
      const item = await updateGalleryCategory(id, payload)
      const index = this.categories.findIndex((c) => c.category_id === Number(id))
      if (index !== -1) this.categories[index] = { ...this.categories[index], ...item }
      return item
    },
    async removeCategory(id) {
      await deleteGalleryCategory(id)
      this.categories = this.categories.filter((c) => c.category_id !== Number(id))
    },
  },
})