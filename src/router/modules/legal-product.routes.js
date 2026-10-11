/**
 * Route module for the Legal Product (Produk Hukum) feature.
 * Backed by the `legal-products` resource: legal_product_id (PK), title, type,
 * number, year, description, document.
 */
export default [
  {
    path: 'legal-product',
    name: 'legal-product-list',
    component: () => import('@/views/legal-product/LegalProductListView.vue'),
    meta: { breadcrumb: ['Konten Publik', 'Produk Hukum'] },
  },
  {
    path: 'legal-product/create',
    name: 'legal-product-create',
    component: () => import('@/views/legal-product/LegalProductFormView.vue'),
    meta: { breadcrumb: ['Konten Publik', 'Produk Hukum', 'Tambah Produk Hukum'] },
  },
  {
    path: 'legal-product/:id/edit',
    name: 'legal-product-edit',
    component: () => import('@/views/legal-product/LegalProductFormView.vue'),
    meta: { breadcrumb: ['Konten Publik', 'Produk Hukum', 'Edit Produk Hukum'] },
  },
]