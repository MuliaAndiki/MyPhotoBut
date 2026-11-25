import { Link } from '@tanstack/react-router'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function VerifyAuthPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <Card className="rounded-[20px] border-border text-center">
        <CardHeader className="space-y-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-lavender text-brand-obsidian">
            <ShieldCheck className="size-5" aria-hidden />
          </div>
          <CardTitle className="font-display text-2xl font-extrabold">
            Verifying Magic Link
          </CardTitle>
          <CardDescription>
            Memverifikasi token sesi Anda ke Studio MyPhotoBut...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/dashboard">Lanjut ke Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default VerifyAuthPage
