import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { useAuthStore } from '@/stores/auth.store'

import authRoutes from './modules/auth.routes'
import dashboardRoute from './modules/dashboard.routes'
import suratRoutes from './modules/surat.routes'
import beritaRoutes from './modules/berita.routes'
import galeriRoutes from './modules/galeri.routes'
import perpustakaanRoutes from './modules/perpustakaan.routes'
import letterRoutes from './modules/letter.routes'

// Tambahkan import modul baru di sini
// import agendaRoutes from './modules/agenda.routes'
// import potensiRoutes from './modules/potensi.routes'
// import wilayahRoutes from './modules/wilayah.routes'
// import wargaRoutes from './modules/warga.routes'
// import perpustakaanRoutes from './modules/perpustakaan.routes'
// import profilDesaRoutes from './modules/profil-desa.routes'
// import pengaduanRoutes from './modules/aduan.routes'
// import penggunaRoutes from './modules/pengguna.routes'


/**
 * Semua route yang butuh login digabung jadi children dari
 * satu parent yang pakai AdminLayout (sidebar+navbar tampil otomatis).
 * Modul array (surat, berita, dst) di-flatten pakai spread.
 */
const protectedRoutes = {
  path: '/',
  component: AdminLayout,
  meta: { requiresAuth: true },
  children: [
    dashboardRoute,
    ...suratRoutes,   
    ...beritaRoutes,
    ...galeriRoutes,
    ...perpustakaanRoutes,
    ...letterRoutes,
    
    // ...tambahkan modul baru di sini juga, dengan pola yang sama
  ],
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    authRoutes,
    protectedRoutes,
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
})

// Route guard: tendang ke /login kalau belum login,
// dan jangan biarkan user yang sudah login buka /login lagi.
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
