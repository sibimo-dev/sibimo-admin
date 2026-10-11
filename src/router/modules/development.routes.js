/**
 * Route module for the Development (Pembangunan) feature.
 * Backed by the `developments` resource: development_id (PK), name, address,
 * hamlet, funding_source, budget, volume, executor, year, description,
 * latitude, longitude, document, plus a list of progress photos.
 */
export default [
  {
    path: 'development',
    name: 'development-list',
    component: () => import('@/views/development/DevelopmentListView.vue'),
    meta: { breadcrumb: ['Konten Publik', 'Pembangunan'] },
  },
  {
    path: 'development/create',
    name: 'development-create',
    component: () => import('@/views/development/DevelopmentFormView.vue'),
    meta: { breadcrumb: ['Konten Publik', 'Pembangunan', 'Tambah Pembangunan'] },
  },
  {
    path: 'development/:id/edit',
    name: 'development-edit',
    component: () => import('@/views/development/DevelopmentFormView.vue'),
    meta: { breadcrumb: ['Konten Publik', 'Pembangunan', 'Edit Pembangunan'] },
  },
]