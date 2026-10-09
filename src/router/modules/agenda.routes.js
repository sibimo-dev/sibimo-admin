export default [
  {
    path: 'agenda',
    name: 'agenda-list',
    component: () => import('@/views/agenda/AgendaListView.vue'),
    meta: { breadcrumb: ['Kelola Agenda', 'List agenda'] },
  },
  {
    path: 'agenda/create',
    name: 'agenda-create',
    component: () => import('@/views/agenda/AgendaFormView.vue'),
    meta: { breadcrumb: ['Kelola Agenda', 'Tambah agenda'] },
  },
  {
    path: 'agenda/:id/edit',
    name: 'agenda-edit',
    component: () => import('@/views/agenda/AgendaFormView.vue'),
    meta: { breadcrumb: ['Kelola Agenda', 'Edit agenda'] },
  },
] 