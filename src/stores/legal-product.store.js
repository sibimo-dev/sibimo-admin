import { defineStore } from 'pinia'
import {
  createLegalProduct,
  deleteLegalProduct,
  getLegalProducts,
  updateLegalProduct,
} from '@/services/legal-product.service'

// Shared by the list filters and the form dropdowns.
// The labels match what sibimo-public shows in its "Kategori" and "Status" columns.
export const LEGAL_PRODUCT_CATEGORIES = [
  {
    label: 'Perkal',
    value: 'perkal',
    badgeClass: 'border-violet-200 bg-violet-50 text-violet-700',
  },
  {
    label: 'SK Lurah',
    value: 'sk-lurah',
    badgeClass: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  },
]

export const LEGAL_PRODUCT_STATUSES = [
  {
    label: 'Berlaku',
    value: 'berlaku',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  {
    label: 'Dicabut',
    value: 'dicabut',
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
  },
]

const FALLBACK_BADGE_CLASS = 'border-slate-200 bg-slate-50 text-slate-600'

export function getLegalProductCategory(value) {
  return (
    LEGAL_PRODUCT_CATEGORIES.find((category) => category.value === value) ?? {
      label: value ?? '-',
      value,
      badgeClass: FALLBACK_BADGE_CLASS,
    }
  )
}

export function getLegalProductStatus(value) {
  return (
    LEGAL_PRODUCT_STATUSES.find((status) => status.value === value) ?? {
      label: value ?? '-',
      value,
      badgeClass: FALLBACK_BADGE_CLASS,
    }
  )
}

export const useLegalProductStore = defineStore('legal-product', {
  state: () => ({ legalProducts: [] }),
  getters: {
    getById: (state) => (id) =>
      state.legalProducts.find((item) => item.legal_product_id === Number(id)),
  },
  actions: {
    async fetchAll() {
      this.legalProducts = await getLegalProducts()
      return this.legalProducts
    },
    async create(payload) {
      const item = await createLegalProduct(payload)
      this.legalProducts.unshift(item)
      return item
    },
    async update(id, payload) {
      const item = await updateLegalProduct(id, payload)
      const index = this.legalProducts.findIndex((entry) => entry.legal_product_id === Number(id))
      if (index !== -1) this.legalProducts[index] = item
      return item
    },
    async remove(id) {
      await deleteLegalProduct(id)
      this.legalProducts = this.legalProducts.filter((item) => item.legal_product_id !== Number(id))
    },
  },
})