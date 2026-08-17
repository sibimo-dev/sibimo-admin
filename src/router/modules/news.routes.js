/**
 * Route module untuk modul Berita (News).
 * Mengikuti tabel `news` di ERD backend.
 */
export default [
  {
    path: 'news',
    name: 'news-list',
    component: () => import('@/views/news/NewsListView.vue'),
    meta: { breadcrumb: ['Konten Publik', 'Berita'] },
  },
  {
    path: 'news/create',
    name: 'news-create',
    component: () => import('@/views/news/NewsFormView.vue'),
    meta: { breadcrumb: ['Konten Publik', 'Berita', 'Tambah'] },
  },
  {
    path: 'news/:id/edit',
    name: 'news-edit',
    component: () => import('@/views/news/NewsFormView.vue'),
    meta: { breadcrumb: ['Konten Publik', 'Berita', 'Edit'] },
  },
]
