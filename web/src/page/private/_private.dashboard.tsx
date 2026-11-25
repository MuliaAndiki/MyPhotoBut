import { Camera, Frame, Sparkles } from 'lucide-react'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const stats = [
  {
    label: 'Active Templates',
    value: '0',
    icon: Frame,
  },
  {
    label: 'Total Frame Usage',
    value: '0',
    icon: Sparkles,
  },
  {
    label: 'Studio Status',
    value: 'Ready',
    icon: Camera,
  },
]

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          Creator Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola bingkai PNG komunitas dan pantau statistik penggunaan frame
          Anda.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>{label}</CardDescription>
              <Icon className="size-4 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardHeader className="pt-0">
              <CardTitle className="font-display text-3xl font-extrabold">
                {value}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default DashboardPage
