/**
 * Route module untuk modul Perpustakaan (Library).
 * Mengikuti tabel `books` dan `book_loans` di ERD backend.
 */
export default [
  {
    path: 'library/catalog',
    name: 'library-catalog',
    component: () => import('@/views/library/BookCatalogView.vue'),
    meta: { breadcrumb: ['Perpustakaan', 'Katalog Buku'] },
  },
  {
    path: 'library/loan',
    name: 'library-loan',
    component: () => import('@/views/library/BookLoanFormView.vue'),
    meta: { breadcrumb: ['Perpustakaan', 'Peminjaman Buku'] },
  },
  {
    path: 'library/return',
    name: 'library-return',
    component: () => import('@/views/library/BookReturnFormView.vue'),
    meta: { breadcrumb: ['Perpustakaan', 'Pengembalian Buku'] },
  },
]
