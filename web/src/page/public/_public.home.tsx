import { Link } from '@tanstack/react-router'
import { ArrowRight, Cloud, Database, Palette, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const features = [
  {
    icon: Cloud,
    title: 'Cloudflare Workers',
    text: 'SSR on the edge with separate staging and production Workers.',
  },
  {
    icon: Database,
    title: 'TanStack Query',
    text: 'Per-request QueryClient with SSR hydration and typed query options.',
  },
  {
    icon: Palette,
    title: 'Dual-Theme Parkinsans UI',
    text: 'Obsidian Dark (#181818) & Crisp White (#FFFFFF) with Acid Lime & Electric Lavender.',
  },
  {
    icon: ShieldCheck,
    title: 'Strict TypeScript',
    text: 'Typed routes, typed API client, and passwordless Auth integration.',
  },
]

export function HomePage() {
  return (
    <div className="space-y-16">
      <section className="flex flex-col items-center gap-6 py-10 text-center">
        <Badge variant="secondary">
          TanStack Start &middot; Vite &middot; Workers
        </Badge>
        <h1 className="max-w-2xl font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          What do you want to capture{' '}
          <span className="text-brand-lavender italic">today?</span>
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Web-based studio photobooth modern dengan filter kamera analog
          Safari-safe, bingkai komunitas kreator, dan bagi hasil foto instan via
          QR Code.
        </p>
        <div className="flex gap-3">
          <Button
            asChild
            size="lg"
            className="rounded-full bg-brand-lime font-bold text-brand-obsidian hover:bg-brand-lime-hover"
          >
            <Link to="/dashboard">
              Open Studio <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <Link to="/login">Creator Sign In</Link>
          </Button>
        </div>
      </section>

      <section aria-label="Features" className="grid gap-4 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, text }) => (
          <Card key={title}>
            <CardHeader>
              <Icon className="mb-2 size-6" aria-hidden />
              <CardTitle>{title}</CardTitle>
              <CardDescription>{text}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  )
}

export default HomePage
