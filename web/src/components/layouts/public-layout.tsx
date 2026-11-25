import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Camera, Mail, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { ThemeToggle } from '@/components/common/theme-toggle'
import { Button } from '@/components/ui/button'
import { appConfig } from '@/config/app.config'

const navItems = [
  { to: '/', label: 'Studio' },
  { to: '/examples/query', label: 'Query' },
  { to: '/examples/form', label: 'Form' },
] as const

type SocialPlatformKey = keyof typeof appConfig.social_media

function SocialPlatformIcon({
  icon,
  className = 'size-4',
}: {
  icon: string
  className?: string
}) {
  switch (icon) {
    case 'twitter':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      )
    case 'linkedin':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect width="4" height="12" x="2" y="9" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      )
    case 'youtube':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
          <path d="m10 15 5-3-5-3z" />
        </svg>
      )
    case 'tiktok':
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          aria-hidden="true"
        >
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      )
  }
}

export function PublicLayout({ children }: { children: ReactNode }) {
  const socialEntries = Object.entries(appConfig.social_media) as Array<
    [SocialPlatformKey, { url: string; icon: string }]
  >

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="group flex items-center gap-3 font-display text-lg font-bold tracking-tight"
          >
            <span className="icon-badge-obsidian size-9 transition-transform group-hover:scale-105 dark:bg-brand-lime dark:text-brand-obsidian">
              <Camera className="size-4" aria-hidden />
            </span>
            <span>{appConfig.name}</span>
            <span className="hidden rounded-full bg-brand-lavender px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-brand-obsidian uppercase sm:inline-block">
              300 DPI
            </span>
          </Link>

          <nav aria-label="Main" className="flex items-center gap-1.5">
            {navItems.map((item) => (
              <Button
                key={item.to}
                variant="ghost"
                size="sm"
                className="rounded-full font-medium"
                asChild
              >
                <Link
                  to={item.to}
                  activeProps={{
                    className:
                      'bg-brand-lime text-brand-obsidian hover:bg-brand-lime-hover',
                  }}
                >
                  {item.label}
                </Link>
              </Button>
            ))}
            <Button
              size="sm"
              className="rounded-full bg-brand-lime font-semibold text-brand-obsidian hover:bg-brand-lime-hover"
              asChild
            >
              <Link to="/dashboard">Open Booth</Link>
            </Button>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        {children}
      </main>

      {/* Branded Studio Footer (Driven by appConfig) */}
      <footer className="border-t border-border bg-background-elevated/60">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 md:grid-cols-12">
            {/* Column 1: Brand Identity, Tagline, Description & Email */}
            <div className="space-y-4 md:col-span-6">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/"
                  className="flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight"
                >
                  <span className="icon-badge-obsidian size-9 dark:bg-brand-lime dark:text-brand-obsidian">
                    <Camera className="size-4" aria-hidden />
                  </span>
                  <span>{appConfig.name}</span>
                </Link>
                <span className="sticker-tilt-right inline-flex items-center gap-1 rounded-full bg-brand-lime px-3 py-1 text-xs font-bold text-brand-obsidian">
                  <Sparkles className="size-3" aria-hidden />
                  {appConfig.tagline}
                </span>
              </div>

              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                {appConfig.description}
              </p>

              <div className="pt-1">
                <a
                  href={`mailto:${appConfig.email}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-card-foreground transition-colors hover:border-brand-lavender hover:bg-brand-lavender hover:text-brand-obsidian"
                >
                  <Mail className="size-3.5" aria-hidden />
                  <span>{appConfig.email}</span>
                  <ArrowUpRight className="size-3.5 opacity-60" aria-hidden />
                </a>
              </div>
            </div>

            {/* Column 2: Quick Navigation & Discovery */}
            <div className="space-y-3 md:col-span-3">
              <h2 className="font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Studio &amp; Index
              </h2>
              <ul className="space-y-2 text-sm font-medium">
                <li>
                  <Link
                    to="/"
                    className="text-foreground/80 transition-colors hover:text-brand-lavender"
                  >
                    Landing Showcase
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard"
                    className="text-foreground/80 transition-colors hover:text-brand-lavender"
                  >
                    Photobooth Studio
                  </Link>
                </li>
                <li>
                  <a
                    href="/llms.txt"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-foreground/80 transition-colors hover:text-brand-lavender"
                  >
                    <span>LLM &amp; AI Context (llms.txt)</span>
                    <ArrowUpRight className="size-3" aria-hidden />
                  </a>
                </li>
                <li>
                  <a
                    href="/sitemap.xml"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-foreground/80 transition-colors hover:text-brand-lavender"
                  >
                    <span>XML Sitemap</span>
                    <ArrowUpRight className="size-3" aria-hidden />
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Social Media Links from appConfig.social_media */}
            <div className="space-y-3 md:col-span-3">
              <h2 className="font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Connect With Us
              </h2>
              <p className="text-xs text-muted-foreground">
                Ikuti rilisan frame komunitas terbaru dan showcase hasil foto
                studio setiap minggu.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {socialEntries.map(([platform, item]) => (
                  <a
                    key={platform}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${appConfig.name} on ${platform}`}
                    title={`${appConfig.name} on ${platform}`}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-card-foreground transition-all hover:-translate-y-0.5 hover:border-brand-obsidian hover:bg-brand-lavender hover:text-brand-obsidian"
                  >
                    <SocialPlatformIcon icon={item.icon} className="size-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Metadata Bar */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
            <p>
              &copy; {new Date().getFullYear()}{' '}
              <span className="font-semibold text-foreground">
                {appConfig.name}
              </span>
              . Crafted by {appConfig.metadata.author}.
            </p>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-brand-lime" />
                ZERO-LOGIN GUEST ENGINE
              </span>
              <span>&middot;</span>
              <a
                href="/manifest.webmanifest"
                className="underline-offset-4 hover:text-foreground hover:underline"
              >
                PWA Ready
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
