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
    path: 'letter/verification',
    name: 'letter-verification',
    component: () => import('@/views/letter/LetterVerificationView.vue'),
    meta: { breadcrumb: ['Persuratan', 'Verifikasi Surat'] },
  },
  {
    path: 'letter/authorization',
    name: 'letter-authorization',
    component: () => import('@/views/letter/LetterAuthorizationView.vue'),
    meta: { breadcrumb: ['Persuratan', 'Otorisasi Surat'] },
  },
]
