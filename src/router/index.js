import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { useAuthStore } from '@/stores/auth.store'
import authRoutes from './modules/auth.routes'
import dashboardRoute from './modules/dashboard.routes'
import letterRoutes from './modules/letter.routes'
import letterTypeRoutes from './modules/letter-type.routes'
import newsRoutes from './modules/news.routes'
import galleryRoutes from './modules/gallery.routes'
import developmentRoutes from './modules/development.routes'
import legalProductRoutes from './modules/legal-product.routes'
import libraryRoutes from './modules/library.routes'
import agendaRoutes from './modules/agenda.routes'
import complaintRoutes from './modules/complaint.routes'
import villagePotentialRoutes from './modules/village-potential.routes'
import citizenRoutes from './modules/citizen.routes'
import villageProfileRoutes from './modules/village-profile.routes'
import userManagementRoutes from './modules/user-management.routes'
import permissionRoutes from './modules/permission.routes'
import footerRoutes from './modules/footer.routes'
import surveyRoutes from './modules/survey.routes'


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
    ...developmentRoutes,
    ...legalProductRoutes,
    ...libraryRoutes,
    ...agendaRoutes,
    ...complaintRoutes,
    ...villagePotentialRoutes,
    ...citizenRoutes,
    ...villageProfileRoutes,
    ...footerRoutes,
    ...userManagementRoutes,
    ...permissionRoutes,
    ...surveyRoutes,
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
      redirect: '/',
    },
  ],
  // Scroll window: halaman baru mulai dari atas,
  // tombol Back/Forward browser tetap mengembalikan posisi sebelumnya.
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash }
    return { top: 0 }
  },
})

// Kalau layout admin memakai container sendiri yang bisa di-scroll
// (mis. <main class="overflow-y-auto">), scrollBehavior di atas tidak menyentuhnya.
// Jadi container itu ikut di-reset ke atas setiap pindah halaman.
// Elemen yang di-reset: <main> dan elemen dengan atribut data-scroll-container.
router.afterEach((to, from) => {
  if (to.path === from.path) return // hanya query/hash yang berubah: jangan reset

  nextTick(() => {
    document
      .querySelectorAll('main, [data-scroll-container]')
      .forEach((el) => el.scrollTo?.({ top: 0 }))
  })
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
    return '/'
  }

  return
})

export default router