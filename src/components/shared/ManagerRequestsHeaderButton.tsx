import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useManagerPendingRequestsCount } from '@/hooks/useManagerPendingRequestsCount'

export default function ManagerRequestsHeaderButton() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const managerId = user?.id ?? ''
  const pendingCount = useManagerPendingRequestsCount(managerId)

  return (
    <button
      type="button"
      onClick={() => navigate('/manager/requests')}
      className={cn(
        'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
        'hover:bg-foreground/5 active:scale-95 transition-transform touch-manipulation',
      )}
      aria-label={pendingCount > 0 ? `Requests, ${pendingCount} pending` : 'Requests'}
    >
      <Bell className="h-5 w-5 text-foreground" />
      {pendingCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[17px] px-0.5 h-[17px] text-[9px] rounded-full bg-destructive text-white flex items-center justify-center border-2 border-background font-bold">
          {pendingCount > 99 ? '99+' : pendingCount}
        </span>
      )}
    </button>
  )
}
