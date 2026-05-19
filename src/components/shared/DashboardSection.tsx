import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  icon?: LucideIcon
  title: string
  hint?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export default function DashboardSection({
  icon: Icon,
  title,
  hint,
  action,
  children,
  className,
}: Props) {
  return (
    <section className={cn('glass-card !rounded-2xl p-4 space-y-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {Icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground tracking-tight">{title}</h3>
            {hint && (
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{hint}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
