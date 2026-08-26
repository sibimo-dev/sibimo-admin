import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { useAuthStore } from '@/stores/auth.store'
import authRoutes from './modules/auth.routes'
import dashboardRoute from './modules/dashboard.routes'
import letterRoutes from './modules/letter.routes'
import letterTypeRoutes from './modules/letter-type.routes'
import newsRoutes from './modules/news.routes'
import galleryRoutes from './modules/gallery.routes'
import libraryRoutes from './modules/library.routes'
import agendaRoutes from './modules/agenda.routes'
import complaintRoutes from './modules/complaint.routes'
import villagePotentialRoutes from './modules/village-potential.routes'
import citizenRoutes from './modules/citizen.routes'
import villageProfileRoutes from './modules/village-profile.routes'
import userManagementRoutes from './modules/user-management.routes'


const protectedRoutes = {
  path: '/',
  component: AdminLayout,
  meta: { requiresAuth: true },
  children: [
    dashboardRoute,
    ...letterRoutes,
    ...letterTypeRoutes,
    ...newsRoutes,
    ...galleryRoutes,
    ...libraryRoutes,
    ...agendaRoutes,
    ...complaintRoutes,
    ...villagePotentialRoutes,
    ...citizenRoutes,
    ...villageProfileRoutes,
    ...userManagementRoutes
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
router.beforeEach((to) => {
  const authStore = useAuthStore()

  const requiresAuth = to.matched.some(
    (record) => record.meta.requiresAuth
  )

  if (requiresAuth && !authStore.isAuthenticated) {
    return '/login'
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return '/dashboard'
  }

  return
})

export default router
