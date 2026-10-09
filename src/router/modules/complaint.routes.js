/**
 * Route module untuk modul Pengaduan (Complaints).
 * Mengikuti tabel `complaints` di ERD backend.
 */
export default [
  {
    path: 'complaint',
    name: 'complaint-list',
    component: () => import('@/views/complaint/ComplaintListView.vue'),
    meta: { breadcrumb: ['Pengaduan', 'Daftar Aduan'] },
  },
  {
    path: 'complaint/:id',
    name: 'complaint-response',
    component: () => import('@/views/complaint/ComplaintResponseView.vue'),
    meta: { breadcrumb: ['Pengaduan', 'Detail Aduan'] },
  },
]