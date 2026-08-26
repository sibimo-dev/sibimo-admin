import AuthLayout from '@/layouts/AuthLayout.vue'

export default {
  path: '/',
  component: AuthLayout,
  meta: { requiresAuth: false },
  children: [
    {
      path: 'login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
    },
  ],
}
