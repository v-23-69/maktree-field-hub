import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  onRefresh: () => Promise<void>
  className?: string
}

export default function DashboardRefreshButton({ onRefresh, className }: Props) {
  const [busy, setBusy] = useState(false)

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={busy}
      className={cn('h-8 rounded-lg text-xs gap-1.5', className)}
      onClick={() => {
        setBusy(true)
        void onRefresh().finally(() => setBusy(false))
      }}
    >
      <RefreshCw className={cn('h-3.5 w-3.5', busy && 'animate-spin')} />
      Refresh
    </Button>
  )
}
