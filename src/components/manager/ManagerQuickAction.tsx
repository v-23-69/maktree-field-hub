import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { dashboardPanelClass } from '@/components/dashboard/dashboard-shell'

type Props = {
  label: string
  icon: ReactNode
  iconClassName?: string
  onClick?: () => void
  comingSoon?: boolean
  variant?: 'default' | 'destructive'
}

export function ManagerQuickAction({
  label,
  icon,
  iconClassName,
  onClick,
  comingSoon,
  variant = 'default',
}: Props) {
  return (
    <button
      type="button"
      disabled={comingSoon}
      onClick={comingSoon ? undefined : onClick}
      className={cn(
        dashboardPanelClass(),
        'flex flex-col items-center justify-center gap-2 p-3 md:p-4 min-h-[88px] md:min-h-[100px] transition-all',
        comingSoon
          ? 'opacity-75 cursor-default'
          : 'active:scale-95 hover:border-primary/30',
        variant === 'destructive' && !comingSoon && 'border-destructive/20',
      )}
    >
      <div
        className={cn(
          'h-9 w-9 md:h-11 md:w-11 rounded-xl flex items-center justify-center shrink-0',
          iconClassName ?? 'bg-primary/10',
        )}
      >
        {icon}
      </div>
      <span className="text-[10px] md:text-xs font-semibold text-foreground text-center leading-tight">
        {label}
      </span>
      {comingSoon && (
        <span className="text-[8px] md:text-[9px] font-medium text-muted-foreground -mt-1">
          Coming soon
        </span>
      )}
    </button>
  )
}

export const managerQuickActionGridClass =
  'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 md:gap-3'
