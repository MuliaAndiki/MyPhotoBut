import { Link } from '@tanstack/react-router'
import { Camera, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <Card className="rounded-[20px] border-border">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-lime text-brand-obsidian">
            <Camera className="size-5" aria-hidden />
          </div>
          <CardTitle className="font-display text-2xl font-extrabold">
            Creator Studio Sign In
          </CardTitle>
          <CardDescription>
            Masuk tanpa password menggunakan Email Magic Link atau Google OAuth
            untuk mengelola frame komunitas Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="creator@myphotobut.com"
              className="rounded-full"
            />
            <Button className="w-full rounded-full bg-brand-lime font-bold text-brand-obsidian hover:bg-brand-lime-hover">
              <Mail className="size-4" aria-hidden />
              Send Magic Link
            </Button>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:underline">
              &larr; Kembali ke Beranda
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage
