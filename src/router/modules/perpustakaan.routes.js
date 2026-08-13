export default [
  {
    path: 'perpustakaan/katalog',
    name: 'perpustakaan-katalog',
    component: () => import('@/views/perpustakaan/KatalogBukuView.vue'),
    meta: { breadcrumb: ['Perpustakaan', 'Katalog Buku'] },
  },
  
  {
    path: 'perpustakaan/peminjaman',
    name: 'perpustakaan-peminjaman',
    component: () => import('@/views/perpustakaan/PeminjamanFormView.vue'),
    meta: { breadcrumb: ['Perpustakaan', 'Peminjaman Buku'] },
  },
  {
    path: 'perpustakaan/pengembalian',
    name: 'perpustakaan-pengembalian',
    component: () => import('@/views/perpustakaan/PengembalianFormView.vue'),
    meta: { breadcrumb: ['Perpustakaan', 'Pengembalian Buku'] },
  },
]
