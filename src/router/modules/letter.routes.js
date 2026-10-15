/**
 * Route module untuk modul Persuratan (Letter Requests).
 * Mengikuti tabel `letter_requests` di ERD backend.
 *
 * Semua alur surat berpusat di Pengelolaan Surat (`/letter`):
 *   daftar (letter-list) -> tambah (letter-create) -> verifikasi + otorisasi (letter-detail).
 * Halaman Review / Verifikasi / Otorisasi terpisah sudah dihapus.
 */
export default [
  {
    path: 'letter',
    name: 'letter-list',
    component: () => import('@/views/letter/LetterListView.vue'),
    meta: { breadcrumb: ['Persuratan', 'Pengelolaan Surat'] },
  },
  {
    path: 'letter/create',
    name: 'letter-create',
    component: () => import('@/views/letter/LetterCreateView.vue'),
    meta: { breadcrumb: ['Persuratan', 'Pengelolaan Surat', 'Tambah Surat'] },
  },
  {
    // Halaman Verifikasi + Otorisasi (satu halaman) untuk satu pengajuan surat.
    path: 'letter/detail/:id',
    name: 'letter-detail',
    component: () => import('@/views/letter/LetterDetailView.vue'),
    meta: { breadcrumb: ['Persuratan', 'Pengelolaan Surat', 'Verifikasi & Otorisasi'] },
  },

  {
    // Alat bantu admin/developer: cek pemetaan field SEMUA surat terhadap backend (tidak ada di sidebar).
    path: 'letter/mapping-check',
    name: 'letter-mapping-check',
    component: () => import('@/views/letter/LetterMappingCheckView.vue'),
    meta: { breadcrumb: ['Persuratan', 'Pengelolaan Surat', 'Cek Pemetaan Field'] },
  },

  // Alamat lama (bookmark / notifikasi lama) diarahkan ke halaman yang baru.
  { path: 'letter/review/:id', redirect: (to) => ({ name: 'letter-detail', params: { id: to.params.id } }) },
  { path: 'letter/verification/:id', redirect: (to) => ({ name: 'letter-detail', params: { id: to.params.id } }) },
  { path: 'letter/authorization/:id', redirect: (to) => ({ name: 'letter-detail', params: { id: to.params.id } }) },
  { path: 'letter/verification', redirect: { name: 'letter-list' } },
  { path: 'letter/authorization', redirect: { name: 'letter-list' } },
]