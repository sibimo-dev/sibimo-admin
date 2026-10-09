/**
 * Route module untuk modul Galeri (Gallery).
 * Mengikuti tabel `galleries` di ERD backend: gallery_id (PK), title,
 * description, image, uploaded_by, uploaded_at.
 */
export default [
  {
    path: 'gallery',
    name: 'gallery-list',
    component: () => import('@/views/gallery/GalleryListView.vue'),
    meta: { breadcrumb: ['Galeri & Perpustakaan', 'Galeri Foto'] },
  },
  {
    path: 'gallery/create',
    name: 'gallery-create',
    component: () => import('@/views/gallery/GalleryFormView.vue'),
    meta: { breadcrumb: ['Galeri & Perpustakaan', 'Galeri Foto', 'Tambah Foto'] },
  },
  {
    path: 'gallery/:id/edit',
    name: 'gallery-edit',
    component: () => import('@/views/gallery/GalleryFormView.vue'),
    meta: { breadcrumb: ['Galeri & Perpustakaan', 'Galeri Foto', 'Edit Foto'] },
  },
]
