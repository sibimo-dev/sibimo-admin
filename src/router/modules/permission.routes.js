
export default [
  {
    path: 'user-management/user-permissions',
    name: 'user-permission-management',
    component: () => import('@/views/user-management/UserPermissionView.vue'),
    meta: { breadcrumb: ['Manajemen Pengguna', 'Override User'] },
  },
]