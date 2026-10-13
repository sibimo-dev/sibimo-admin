/**
 * Shared state untuk data peran/admin (role-based access control).
 *
 * PENTING: `roles` didefinisikan di LUAR fungsi useAdminRoles(), di level
 * module. Ini membuatnya jadi singleton -- semua komponen yang meng-import
 * composable ini (AdminRoleManagementView.vue, UserManagementListView.vue,
 * dst) berbagi instance ref yang SAMA. Karena itu, toggle status di satu
 * halaman langsung kelihatan di halaman lain, walau Vue Router unmount
 * komponen saat pindah route.
 *
 * Kalau backend sudah siap: ganti isi `roles.value` lewat fungsi
 * `loadRoles()` (panggil sekali di router guard / App.vue), dan sambungkan
 * `toggleRoleStatus` ke userManagement.service.js.
 */
import { ref } from 'vue'

export const modules = [
  { key: 'villageProfile', label: 'Profile Desa' },
  { key: 'agenda', label: 'Kelola Agenda' },
  { key: 'news', label: 'Berita & Pengumuman' },
  { key: 'library', label: 'Kelola Perpustakaan' },
  { key: 'letterService', label: 'Kelola Layanan' },
  { key: 'villagePotential', label: 'Kelola Potensi' },
  { key: 'gallery', label: 'Kelola Gallery' },
  { key: 'userManagement', label: 'Manajemen Admin' },
]

export const permissionKeys = ['view', 'create', 'edit', 'delete']
export const permissionLabels = { view: 'LIHAT', create: 'BUAT', edit: 'EDIT', delete: 'HAPUS' }

function fullAccess() {
  return { view: true, create: true, edit: true, delete: true }
}
function noAccess() {
  return { view: false, create: false, edit: false, delete: false }
}
function viewOnly() {
  return { view: true, create: false, edit: false, delete: false }
}

// Dummy data -- hapus setelah integrasi API.
// Setiap "role" di sini mewakili satu baris di Manajemen Pengguna juga,
// jadi role.status dipakai bareng sebagai status Active/Deactive user itu.
//
// - name          : nama peran RBAC (dipakai untuk matching antar halaman,
//                    mis. query ?role=... dan panel Hak Akses di List Admin)
// - positionTitle : jabatan orangnya, ditampilkan di kolom "Role / Posisi"
//                    pada halaman Manajemen Pengguna (boleh beda dari `name`)
// - userName      : nama orang yang memegang peran ini
const roles = ref([
  {
    id: 'super-admin',
    name: 'Super Admin',
    positionTitle: 'Super Admin',
    userName: 'User Name',
    description: 'Akses Sistem Penuh dan Konfigurasi.',
    status: 'active',
    isProtected: true, // tidak boleh dinonaktifkan
    department: 'Sekretaris Desa',
    accessLabel: 'Full Access',
    permissions: {
      villageProfile: fullAccess(),
      agenda: fullAccess(),
      news: fullAccess(),
      library: fullAccess(),
      letterService: fullAccess(),
      villagePotential: fullAccess(),
      gallery: fullAccess(),
      userManagement: { view: true, create: true, edit: true, delete: false },
    },
  },
  {
    id: 'admin-desa',
    name: 'Admin Desa',
    positionTitle: 'Kaur Pemerintahan',
    userName: 'User Name',
    description: 'Mengelola data umum profil dan layanan desa.',
    status: 'active',
    department: 'Administrasi Umum',
    accessLabel: 'Profile Desa Access only',
    permissions: {
      villageProfile: fullAccess(),
      agenda: viewOnly(),
      news: viewOnly(),
      library: noAccess(),
      letterService: fullAccess(),
      villagePotential: viewOnly(),
      gallery: noAccess(),
      userManagement: noAccess(),
    },
  },
  {
    id: 'admin-agenda',
    name: 'Admin Agenda',
    positionTitle: 'Kaur Agenda',
    userName: 'User Name',
    description: 'Mengelola jadwal dan agenda kegiatan desa.',
    status: 'active',
    department: 'Administrasi',
    accessLabel: 'Agenda Access only',
    permissions: {
      villageProfile: noAccess(),
      agenda: fullAccess(),
      news: noAccess(),
      library: noAccess(),
      letterService: noAccess(),
      villagePotential: noAccess(),
      gallery: noAccess(),
      userManagement: noAccess(),
    },
  },
  {
    id: 'admin-berita',
    name: 'Admin Berita',
    positionTitle: 'Kaur Berita',
    userName: 'User Name',
    description: 'Mengelola berita dan pengumuman desa.',
    status: 'inactive',
    department: 'Administrasi Umum',
    accessLabel: 'Berita Access only',
    permissions: {
      villageProfile: noAccess(),
      agenda: noAccess(),
      news: fullAccess(),
      library: noAccess(),
      letterService: noAccess(),
      villagePotential: noAccess(),
      gallery: noAccess(),
      userManagement: noAccess(),
    },
  },
  {
    id: 'admin-perpustakaan',
    name: 'Admin Perpustakaan',
    positionTitle: 'Kaur Perpustakaan',
    userName: 'User Name',
    description: 'Mengelola koleksi dan data perpustakaan desa.',
    status: 'active',
    department: 'Pelayanan',
    accessLabel: 'Perpustakaan Access only',
    permissions: {
      villageProfile: noAccess(),
      agenda: noAccess(),
      news: noAccess(),
      library: fullAccess(),
      letterService: noAccess(),
      villagePotential: noAccess(),
      gallery: noAccess(),
      userManagement: noAccess(),
    },
  },
  {
    id: 'admin-layanan',
    name: 'Admin Layanan',
    positionTitle: 'Kaur Layanan',
    userName: 'User Name',
    description: 'Mengelola pengajuan dan verifikasi surat layanan.',
    status: 'active',
    department: 'Pelayanan',
    accessLabel: 'Layanan Access only',
    permissions: {
      villageProfile: noAccess(),
      agenda: noAccess(),
      news: noAccess(),
      library: noAccess(),
      letterService: fullAccess(),
      villagePotential: noAccess(),
      gallery: noAccess(),
      userManagement: noAccess(),
    },
  },
  {
    id: 'admin-potensi',
    name: 'Admin Potensi',
    positionTitle: 'Kaur Potensi Desa',
    userName: 'User Name',
    description: 'Mengelola data potensi dan UMKM desa.',
    status: 'active',
    department: 'Administrasi Umum',
    accessLabel: 'Potensi Desa Access only',
    permissions: {
      villageProfile: noAccess(),
      agenda: noAccess(),
      news: noAccess(),
      library: noAccess(),
      letterService: noAccess(),
      villagePotential: fullAccess(),
      gallery: noAccess(),
      userManagement: noAccess(),
    },
  },
  {
    id: 'admin-gallery',
    name: 'Admin Gallery',
    positionTitle: 'Kaur Gallery',
    userName: 'User Name',
    description: 'Mengelola galeri foto dan dokumentasi kegiatan.',
    status: 'active',
    department: 'Pelayanan',
    accessLabel: 'Gallery Access only',
    permissions: {
      villageProfile: noAccess(),
      agenda: noAccess(),
      news: noAccess(),
      library: noAccess(),
      letterService: noAccess(),
      villagePotential: noAccess(),
      gallery: fullAccess(),
      userManagement: noAccess(),
    },
  },
])

export function useAdminRoles() {
  function findRoleByName(name) {
    if (!name) return null
    return roles.value.find((r) => r.name.toLowerCase() === String(name).toLowerCase()) || null
  }

  function findRoleById(id) {
    return roles.value.find((r) => r.id === id) || null
  }

  // Dipakai baik dari List Admin maupun Manajemen Pengguna.
  // Super Admin (isProtected) tidak pernah bisa dinonaktifkan.
  function toggleRoleStatus(role) {
    if (!role || role.isProtected) return
    role.status = role.status === 'active' ? 'inactive' : 'active'
  }

  function addRole() {
    const newRole = {
      id: `role-${Date.now()}`,
      name: 'Peran Baru',
      positionTitle: 'Peran Baru',
      userName: 'User Name',
      description: 'Deskripsi peran belum diatur.',
      status: 'active',
      department: '-',
      accessLabel: 'No Access',
      permissions: Object.fromEntries(modules.map((m) => [m.key, noAccess()])),
    }
    roles.value.push(newRole)
    return newRole
  }

  // Dipakai dari Manajemen Pengguna (icon hapus). Super Admin tidak boleh dihapus.
  function removeRole(id) {
    const role = findRoleById(id)
    if (!role || role.isProtected) return false
    roles.value = roles.value.filter((r) => r.id !== id)
    return true
  }

  return {
    roles,
    modules,
    permissionKeys,
    permissionLabels,
    findRoleByName,
    findRoleById,
    toggleRoleStatus,
    addRole,
    removeRole,
  }
}