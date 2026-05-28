import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  chart: ReactNode
  stats: ReactNode
  footer?: ReactNode
  className?: string
}

/** Chart on the left, compact metrics on the right (stacks on small screens). */
export default function ChartStatsSplit({ chart, stats, footer, className }: Props) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_9.5rem] lg:grid-cols-[minmax(0,1fr)_11rem] gap-4 md:gap-5 items-center">
        <div className="min-w-0">{chart}</div>
        <div className="flex md:flex-col gap-2 md:gap-2.5">{stats}</div>
      </div>
      {footer}
    </div>
  )
}
