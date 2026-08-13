/**

 * 3 halaman:
 * - galeri-list   -> grid + search + pagination
 * - galeri-tambah -> form tambah foto baru
 * - galeri-edit   -> form yang sama, dipakai ulang untuk edit foto (via :id)
 */
export default [
  {
    path: 'galeri',
    name: 'galeri-list',
    component: () => import('@/views/galeri/GaleriListView.vue'),
    meta: { breadcrumb: ['Galeri & Perpustakaan', 'Galeri Foto'] },
  },
  {
    path: 'galeri/tambah',
    name: 'galeri-tambah',
    component: () => import('@/views/galeri/GaleriFormView.vue'),
    meta: { breadcrumb: ['Galeri & Perpustakaan', 'Galeri Foto', 'Tambah Foto'] },
  },
  {
    path: 'galeri/:id/edit',
    name: 'galeri-edit',
    component: () => import('@/views/galeri/GaleriFormView.vue'),
    meta: { breadcrumb: ['Galeri & Perpustakaan', 'Galeri Foto', 'Edit Foto'] },
  },
]
