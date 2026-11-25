// src/router/public.routes.tsx (Semua route public dalam 1 file!)
import { createRoute, Outlet } from '@tanstack/react-router'
import { PublicLayout } from '@/components/layouts/public-layout'
import { HomePage } from '@/page/public/_public.home'
import { rootRoute } from './root'

// 1. Layout Public
export const publicLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'public',
  component: () => (
    <PublicLayout>
      <Outlet />
    </PublicLayout>
  ),
})

// 2. Halaman Home (anak dari publicLayoutRoute)
export const homeRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: '/',
  head: () => ({ meta: [{ title: 'Home — MyPhotoBut' }] }),
  component: HomePage,
})

// Gabungkan seluruh tree public menjadi satu export
export const publicRouteTree = publicLayoutRoute.addChildren([homeRoute])
