import type { ReactNode } from 'react'
import { appConfig, AppHeaderConfig } from '@/config/app.config'
import AppHeaders from '../common/app-header'
import AppFooter from '../common/app-footer'

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <AppHeaders appConfig={appConfig} navItems={AppHeaderConfig} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        {children}
      </main>
      <AppFooter appConfig={appConfig} />
    </div>
  )
}
