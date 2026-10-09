import AuthLayout from '@/layouts/AuthLayout.vue'

export default {
  path: '/login',
  component: AuthLayout,
  meta: { requiresAuth: false },
  children: [
    {
      path: '',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
    },
  ],
}
