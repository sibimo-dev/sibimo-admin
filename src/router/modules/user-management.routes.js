
export default [
  {
    path: 'user-management',
    name: 'user-management-list',
    component: () => import('@/views/user-management/UserManagementListView.vue'),
    meta: { breadcrumb: ['Manajemen Pengguna', 'Daftar Pengguna'] },
  },
  {
    path: 'user-management/roles',
    name: 'admin-role-management',
    component: () => import('@/views/user-management/AdminRoleManagementView.vue'),
    meta: { breadcrumb: ['Manajemen Pengguna', 'Role & Hak Akses'] },
  },
]