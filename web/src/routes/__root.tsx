import type { QueryClient } from '@tanstack/react-query'
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { appConfig } from '@/config/app.config'
import { buildGeoJsonLdGraph, buildSeoMeta } from '@/lib/seo'
import { AppProviders } from '@/providers/app-providers'
import appCss from '@/styles/globals.css?url'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => {
      const { meta, canonicalUrl } = buildSeoMeta()
      const jsonLdGraph = buildGeoJsonLdGraph()

      return {
        meta,
        links: [
          { rel: 'canonical', href: canonicalUrl },
          {
            rel: 'icon',
            type: 'image/png',
            href: '/favicon-96x96.png',
            sizes: '96x96',
          },
          { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
          { rel: 'shortcut icon', href: '/favicon.ico' },
          {
            rel: 'apple-touch-icon',
            sizes: '180x180',
            href: '/apple-touch-icon.png',
          },
          { rel: 'manifest', href: '/site.webmanifest' },
          {
            rel: 'alternate',
            type: 'text/plain',
            href: '/llms.txt',
            title: `${appConfig.name} LLM Context`,
          },
          { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
          {
            rel: 'preconnect',
            href: 'https://fonts.gstatic.com',
            crossOrigin: 'anonymous',
          },
          {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Parkinsans:wght@300..800&display=swap',
          },
          { rel: 'stylesheet', href: appCss },
        ],
        scripts: [
          {
            type: 'application/ld+json',
            children: JSON.stringify(jsonLdGraph),
          },
        ],
      }
    },
    shellComponent: RootDocument,
  },
)

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
        {import.meta.env.DEV && (
          <TanStackDevtools
            config={{ position: 'bottom-right' }}
            plugins={[
              {
                name: 'TanStack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  )
}
