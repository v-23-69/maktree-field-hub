import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export default function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('glass-card p-4 space-y-3', className)}>
      <Skeleton className="h-9 w-9 rounded-xl" />
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}
