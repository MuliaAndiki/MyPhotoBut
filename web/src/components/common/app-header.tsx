import { Link } from '@tanstack/react-router'
import { ThemeToggle } from '@/components/common/theme-toggle'
import { Button } from '@/components/ui/button'
import type { AppHeaderType } from '#/config/app.config'
import { Camera } from 'lucide-react'
import type { AppConfig } from '#/config/app.config'

interface AppHeadersProps {
  navItems: AppHeaderType[]
  appConfig: AppConfig
}

const AppHeaders: React.FC<AppHeadersProps> = ({ navItems, appConfig }) => {
  return (
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
              key={item.url}
              variant="ghost"
              size="sm"
              className="rounded-full font-medium"
              asChild
            >
              <Link
                to={item.url}
                activeProps={{
                  className:
                    'bg-brand-lime text-brand-obsidian hover:bg-brand-lime-hover',
                }}
              >
                {item.title}
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
  )
}

export default AppHeaders
