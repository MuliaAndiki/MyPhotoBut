import type { AppConfig } from '#/config/app.config'
import { Link } from '@tanstack/react-router'
import { Mail, ArrowUpRight, Camera } from 'lucide-react'
import { SocialPlatformIcon } from './sosial-icon'

interface AppFooterProps {
  appConfig: AppConfig
}
const AppFooter: React.FC<AppFooterProps> = ({ appConfig }) => {
  type SocialPlatformKey = keyof typeof appConfig.social_media

  const socialEntries = Object.entries(appConfig.social_media) as Array<
    [SocialPlatformKey, { url: string; icon: string }]
  >
  return (
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
  )
}

export default AppFooter
