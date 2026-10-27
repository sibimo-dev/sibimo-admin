import { defineStore } from 'pinia'
import {
  createDevelopment,
  deleteDevelopment,
  getDevelopments,
  updateDevelopment,
  getDevelopmentCategories,
  createDevelopmentCategory,
  updateDevelopmentCategory,
  deleteDevelopmentCategory,
} from '@/services/development.service'

// Shared by the list filters and the form dropdowns.
// The labels match what sibimo-public shows on its filters and badges.
export const DEVELOPMENT_CATEGORIES = [
  { label: 'Infrastruktur', value: 'infrastruktur' },
  { label: 'Kesehatan', value: 'kesehatan' },
  { label: 'Pendidikan', value: 'pendidikan' },
  { label: 'Lingkungan', value: 'lingkungan' },
]

export const DEVELOPMENT_STATUSES = [
  { label: 'Perencanaan', value: 'perencanaan', severity: 'warn' },
  { label: 'Sedang Berjalan', value: 'sedang-berjalan', severity: 'info' },
  { label: 'Selesai', value: 'selesai', severity: 'success' },
]

// Suggestions for the volume unit; the field stays free-text (editable dropdown).
export const DEVELOPMENT_VOLUME_UNITS = ['meter', 'm²', 'm³', 'unit', 'titik', 'paket']

export function getDevelopmentCategoryLabel(value) {
  return DEVELOPMENT_CATEGORIES.find((category) => category.value === value)?.label ?? value ?? '-'
}

export function getDevelopmentStatus(value) {
  return (
    DEVELOPMENT_STATUSES.find((status) => status.value === value) ?? {
      label: value ?? '-',
      value,
      severity: 'secondary',
    }
  )
}

export const useDevelopmentStore = defineStore('development', {
  state: () => ({ developments: [], categories: [] }),
  getters: {
    getById: (state) => (id) =>
      state.developments.find((item) => item.development_id === Number(id)),
    // bentuk {id, label, value} dipakai Select dan daftar "Kelola Kategori" di form
    categoryOptions: (state) =>
      state.categories.map((c) => ({ id: c.category_id, label: c.category_name, value: c.slug })),
    getCategoryLabel: (state) => (slug) =>
      state.categories.find((c) => c.slug === slug)?.category_name ?? getDevelopmentCategoryLabel(slug),
  },
  actions: {
    async fetchAll() {
      this.developments = await getDevelopments()
      return this.developments
    },
    async create(payload) {
      const item = await createDevelopment(payload)
      this.developments.unshift(item)
      return item
    },
    async update(id, payload) {
      const item = await updateDevelopment(id, payload)
      const index = this.developments.findIndex((entry) => entry.development_id === Number(id))
      if (index !== -1) this.developments[index] = item
      return item
    },
    async remove(id) {
      await deleteDevelopment(id)
      this.developments = this.developments.filter((item) => item.development_id !== Number(id))
    },
    async fetchCategories() {
      this.categories = await getDevelopmentCategories()
      return this.categories
    },
    async createCategory(payload) {
      const item = await createDevelopmentCategory(payload)
      this.categories.push(item)
      return item
    },
    async updateCategory(id, payload) {
      const item = await updateDevelopmentCategory(id, payload)
      const index = this.categories.findIndex((c) => c.category_id === Number(id))
      if (index !== -1) this.categories[index] = { ...this.categories[index], ...item }
      return item
    },
    async removeCategory(id) {
      await deleteDevelopmentCategory(id)
      this.categories = this.categories.filter((c) => c.category_id !== Number(id))
    },
  },
})