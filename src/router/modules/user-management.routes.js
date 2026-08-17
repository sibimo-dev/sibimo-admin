/**
 * Route module untuk modul Manajemen Pengguna (User Management / RBAC).
 * Pola sama seperti modul lain (complaint.routes.js, letter.routes.js, dst) --
 * cukup import file ini di router/index.js lalu spread ke children.
 */
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
    meta: { breadcrumb: ['Manajemen Pengguna', 'Kelola Admin'] },
  },
]