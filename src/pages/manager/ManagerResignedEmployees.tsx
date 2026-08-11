import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, UserMinus } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import { useManagerFormerMrs } from '@/hooks/useManagerTeam'
import { formatDisplayDate } from '@/lib/dateUtils'
import { cn } from '@/lib/utils'
import { dashboardPageClass, dashboardPanelClass } from '@/components/dashboard/dashboard-shell'

export default function ManagerResignedEmployees() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const managerId = user?.id ?? ''
  const { data: formerMrs = [], isLoading } = useManagerFormerMrs(managerId)

  const sorted = useMemo(
    () =>
      [...formerMrs].sort((a, b) => {
        const aAt = a.resigned_at ?? ''
        const bAt = b.resigned_at ?? ''
        if (aAt !== bAt) return bAt.localeCompare(aAt)
        return (a.full_name ?? '').localeCompare(b.full_name ?? '', undefined, { sensitivity: 'base' })
      }),
    [formerMrs],
  )

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Resigned employees" showBack onBack={() => navigate('/manager/history')} />

      <div className={dashboardPageClass()}>
        <div className={cn(dashboardPanelClass(), 'p-4 space-y-1.5')}>
          <div className="flex items-center gap-2 text-foreground">
            <UserMinus className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-semibold">Historical records</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Resigned MRs no longer appear on the live team. Their doctors, areas, territories, and
            DCRs stay here for review.
          </p>
        </div>

        {isLoading && <LoadingSpinner />}

        {!isLoading && sorted.length === 0 && (
          <EmptyState message="No resigned or former MRs on your team." />
        )}

        {!isLoading && sorted.length > 0 && (
          <div className="space-y-2">
            {sorted.map(mr => {
              const initials = (mr.full_name ?? '?')
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
              const resignedLabel = mr.resigned_at
                ? `Resigned ${formatDisplayDate(mr.resigned_at.slice(0, 10))}`
                : mr.is_active === false
                  ? 'Former employee'
                  : 'Resigned'
              return (
                <Link
                  key={mr.id}
                  to={`/manager/history/resigned/${mr.id}`}
                  className={cn(
                    dashboardPanelClass(),
                    'w-full p-3.5 flex items-center gap-3 text-left active:scale-[0.99] transition-all',
                  )}
                >
                  {mr.profile_photo_url ? (
                    <img
                      src={mr.profile_photo_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-muted-foreground">{initials}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{mr.full_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {mr.employee_code ? `${mr.employee_code} · ` : ''}
                      {resignedLabel}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav role="manager" />
    </div>
  )
}
