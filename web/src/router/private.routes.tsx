// src/router/private.routes.tsx (Semua route private/dashboard dalam 1 file!)
import { createRoute } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { DashboardPage } from '@/page/private/_private.dashboard'
import { rootRoute } from './root'

// 1. Layout Private / Dashboard
export const privateLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'private',
  ssr: false,
  head: () => ({ meta: [{ title: 'Dashboard — MyPhotoBut' }] }),
  component: DashboardLayout,
})

// 2. Halaman Dashboard (/dashboard)
export const dashboardRoute = createRoute({
  getParentRoute: () => privateLayoutRoute,
  path: '/dashboard',
  component: DashboardPage,
})

// Gabungkan seluruh tree private menjadi satu export
export const privateRouteTree = privateLayoutRoute.addChildren([dashboardRoute])
