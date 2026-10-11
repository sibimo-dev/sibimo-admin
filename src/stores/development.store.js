import { defineStore } from 'pinia'
import {
  createDevelopment,
  deleteDevelopment,
  getDevelopments,
  updateDevelopment,
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
  state: () => ({ developments: [] }),
  getters: {
    getById: (state) => (id) =>
      state.developments.find((item) => item.development_id === Number(id)),
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
  },
})