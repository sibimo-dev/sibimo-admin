/**
 * Route module untuk modul Persuratan (Letter Requests).
 * Mengikuti tabel `letter_requests` di ERD backend.
 *
 * Verifikasi, otorisasi, dan preview surat kini digabung di satu halaman
 * detail (LetterDetailView). Route lama dialihkan supaya link lama
 * (mis. dari notifikasi) tidak rusak.
 */
export default [
  {
    path: 'letter',
    name: 'letter-list',
    component: () => import('@/views/letter/LetterListView.vue'),
    meta: { breadcrumb: ['Persuratan', 'Pengelolaan Surat'] },
  },
  {
    // Harus di atas 'letter/:id' supaya "create" tidak dibaca sebagai :id.
    path: 'letter/create',
    name: 'letter-create',
    component: () => import('@/views/letter/LetterCreateView.vue'),
    meta: { breadcrumb: ['Persuratan', 'Pengelolaan Surat', 'Tambah Surat'] },
  },
  {
    path: 'letter/:id',
    name: 'letter-detail',
    component: () => import('@/views/letter/LetterDetailView.vue'),
    meta: { breadcrumb: ['Persuratan', 'Pengelolaan Surat', 'Detail'] },
  },

  /* ---- Pengalihan route lama ---- */
  {
    path: 'letter/verification',
    redirect: { name: 'letter-list' },
  },
  {
    path: 'letter/authorization',
    redirect: { name: 'letter-list' },
  },
  {
    path: 'letter/verification/:id',
    name: 'letter-verification-detail',
    redirect: (to) => ({ name: 'letter-detail', params: { id: to.params.id } }),
  },
  {
    path: 'letter/authorization/:id',
    name: 'letter-authorization-detail',
    redirect: (to) => ({ name: 'letter-detail', params: { id: to.params.id } }),
  },
]