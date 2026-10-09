/**
 * Route module untuk modul Persuratan (Letter Requests).
 * Mengikuti tabel `letter_requests` di ERD backend.
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
    path: 'letter/verification',
    name: 'letter-verification',
    component: () => import('@/views/letter/LetterVerificationListView.vue'),
    meta: { breadcrumb: ['Persuratan', 'Verifikasi Surat'] },
  },
  {
    path: 'letter/verification/:id',
    name: 'letter-verification-detail',
    component: () => import('@/views/letter/LetterVerificationView.vue'),
    meta: { breadcrumb: ['Persuratan', 'Verifikasi Surat', 'Detail'] },
  },
  {
    path: 'letter/authorization',
    name: 'letter-authorization',
    component: () => import('@/views/letter/LetterAuthorizationListView.vue'),
    meta: { breadcrumb: ['Persuratan', 'Otorisasi Surat'] },
  },
  {
    path: 'letter/authorization/:id',
    name: 'letter-authorization-detail',
    component: () => import('@/views/letter/LetterAuthorizationView.vue'),
    meta: { breadcrumb: ['Persuratan', 'Otorisasi Surat', 'Detail'] },
  },
]