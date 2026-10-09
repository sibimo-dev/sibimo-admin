/**
 * Route module untuk modul Tipe Surat (Letter Types).
 * Mengikuti tabel `letter_types` di ERD backend.
 */
export default [
  {
    path: 'letter-type',
    name: 'letter-type-list',
    component: () => import('@/views/letter-type/LetterTypeListView.vue'),
    meta: { breadcrumb: ['Persuratan', 'Pengelolaan Tipe Surat'] },
  },
  {
    path: 'letter-type/:id',
    name: 'letter-type-manage',
    component: () => import('@/views/letter-type/ManageLetterType.vue'),
    meta: { breadcrumb: ['Persuratan', 'Kelola Tipe Surat'] },
  },
]