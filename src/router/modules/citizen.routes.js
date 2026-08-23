export default [
  {
    path: 'citizen',
    name: 'citizen-list',
    component: () => import('@/views/citizen/CitizenListView.vue'),
    meta: { breadcrumb: ['Data Desa', 'Kelola Data Warga'] },
  },
  {
    path: 'citizen/create',
    name: 'citizen-create',
    component: () => import('@/views/citizen/CitizenFormView.vue'),
    meta: { breadcrumb: ['Data Desa', 'Kelola Data Warga', 'Tambah Data Warga'] },
  },
  {
    path: 'citizen/:id/edit',
    name: 'citizen-edit',
    component: () => import('@/views/citizen/CitizenFormView.vue'),
    props: true,
    meta: { breadcrumb: ['Data Desa', 'Kelola Data Warga', 'Edit Data Warga'] },
  },
]