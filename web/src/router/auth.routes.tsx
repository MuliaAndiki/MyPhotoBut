// src/router/auth.routes.tsx (Semua route auth dalam 1 file!)
import { createRoute, Outlet } from '@tanstack/react-router'
import { PublicLayout } from '@/components/layouts/public-layout'
import { LoginPage } from '@/page/auth/_auth.login'
import { VerifyAuthPage } from '@/page/auth/_auth.verify'
import { rootRoute } from './root'

// 1. Layout Auth
export const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  component: () => (
    <PublicLayout>
      <Outlet />
    </PublicLayout>
  ),
})

// 2. Halaman Login (/login)
export const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/login',
  head: () => ({ meta: [{ title: 'Sign In — MyPhotoBut' }] }),
  component: LoginPage,
})

// 3. Halaman Verifikasi Magic Link & Google Callback (/auth/verify)
export const verifyAuthRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/auth/verify',
  head: () => ({ meta: [{ title: 'Verify Magic Link — MyPhotoBut' }] }),
  component: VerifyAuthPage,
})

// Gabungkan seluruh tree auth menjadi satu export
export const authRouteTree = authLayoutRoute.addChildren([
  loginRoute,
  verifyAuthRoute,
])
