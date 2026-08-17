export default [
  {
    path: 'village-potential',
    name: 'village-potential-list',
    component: () => import('@/views/village-potential/VillagePotentialListView.vue'),
    meta: { breadcrumb: ['Konten Publik', 'Kelola Potensi'] },
  },
  {
    path: 'village-potential/create',
    name: 'village-potential-create',
    component: () => import('@/views/village-potential/VillagePotentialFormView.vue'),
    meta: { breadcrumb: ['Konten Publik', 'Kelola Potensi', 'Tambah'] },
  },
  {
    path: 'village-potential/:id/edit',
    name: 'village-potential-edit',
    component: () => import('@/views/village-potential/VillagePotentialFormView.vue'),
    meta: { breadcrumb: ['Konten Publik', 'Kelola Potensi', 'Edit'] },
  },
]