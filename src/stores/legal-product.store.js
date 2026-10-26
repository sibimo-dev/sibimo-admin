import { defineStore } from 'pinia'
import {
  createLegalProduct,
  createLegalProductCategory,
  deleteLegalProduct,
  deleteLegalProductCategory,
  getLegalProductCategories,
  getLegalProducts,
  updateLegalProduct,
  updateLegalProductCategory,
} from '@/services/legal-product.service'


// Dipakai oleh dropdown form dan badge di halaman daftar.
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

// Warna badge kategori ditentukan dari nama (hash), jadi kategori baru otomatis dapat warna.
const CATEGORY_BADGES = [
  'border-sky-200 bg-sky-50 text-sky-700',
  'border-teal-200 bg-teal-50 text-teal-700',
  'border-violet-200 bg-violet-50 text-violet-700',
  'border-amber-200 bg-amber-50 text-amber-700',
  'border-rose-200 bg-rose-50 text-rose-700',
]
const BADGE_BY_SLUG = {
  perkal: 'border-violet-200 bg-violet-50 text-violet-700',
  'sk-lurah': 'border-cyan-200 bg-cyan-50 text-cyan-700',
  laporan: 'border-amber-200 bg-amber-50 text-amber-700',
}

function hashString(value) {
  let hash = 0
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  return hash
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
  state: () => ({ legalProducts: [], categories: [] }),
  getters: {
    getById: (state) => (id) =>
      state.legalProducts.find((item) => item.legal_product_id === Number(id)),

    // Bawaan + tambahan dari backend, dalam satu daftar untuk dropdown dan badge.
    allCategories: (state) =>
      state.categories.map((c) => ({
        label: c.category_name,
        value: c.slug,
        categoryId: c.category_id,
        builtin: false,
        badgeClass:
          BADGE_BY_SLUG[c.slug] ??
          CATEGORY_BADGES[hashString(String(c.category_name)) % CATEGORY_BADGES.length],
      })),
    // `value` = slug kategori yang tersimpan pada produk hukum.
    getCategory() {
      return (value) =>
        this.allCategories.find((c) => c.value === value) ?? {
          label: value ?? '-',
          value,
          badgeClass: FALLBACK_BADGE_CLASS,
        }
    },
  },
  actions: {
    async fetchAll() {
      this.legalProducts = (await getLegalProducts()) ?? []
      return this.legalProducts
    },
    async create(payload) {
      const item = await createLegalProduct(payload)
      // Bila backend tidak mengembalikan data item, muat ulang dari server agar daftar tetap akurat.
      if (item) this.legalProducts.unshift(item)
      else await this.fetchAll()
      return item
    },
    async update(id, payload) {
      const item = await updateLegalProduct(id, payload)
      if (!item) {
        await this.fetchAll()
        return item
      }
      const index = this.legalProducts.findIndex((entry) => entry.legal_product_id === Number(id))
      if (index !== -1) this.legalProducts[index] = item
      else this.legalProducts.unshift(item)
      return item
    },
    async remove(id) {
      await deleteLegalProduct(id)
      this.legalProducts = this.legalProducts.filter((item) => item.legal_product_id !== Number(id))
    },

    /* ---- Kategori ---- */
    async fetchCategories() {
      this.categories = (await getLegalProductCategories()) ?? []
      return this.categories
    },
    async createCategory(categoryName) {
      const created = await createLegalProductCategory({ category_name: categoryName })
      if (created) {
        this.categories = [...this.categories, created]
        return created
      }
      // Respons kosong: sinkronkan dari server lalu cari kategori yang baru dibuat.
      await this.fetchCategories()
      return this.categories.find((c) => c.category_name === categoryName)
    },
    async updateCategory(categoryId, categoryName) {
      const updated = await updateLegalProductCategory(categoryId, { category_name: categoryName })
      if (updated) {
        this.categories = this.categories.map((c) => (c.category_id === categoryId ? updated : c))
        return updated
      }
      await this.fetchCategories()
      return this.categories.find((c) => c.category_id === categoryId)
    },
    async removeCategory(categoryId) {
      await deleteLegalProductCategory(categoryId)
      this.categories = this.categories.filter((c) => c.category_id !== categoryId)
    },
  },
})