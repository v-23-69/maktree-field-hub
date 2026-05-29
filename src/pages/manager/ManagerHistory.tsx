import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import ReportHistoryView from '@/components/mr/ReportHistoryView'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useManagerMrs } from '@/hooks/useManagerTeam'
import { cn } from '@/lib/utils'
import type { ReportHistoryLinkMode } from '@/lib/reportHistoryLinks'

export default function ManagerHistory() {
  const { user } = useAuth()
  const managerId = user?.id ?? ''
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: mrs = [], isLoading } = useManagerMrs(managerId)

  const mrIdParam = searchParams.get('mrId')

  const [selectedMrId, setSelectedMrId] = useState<string | null>(null)

  useEffect(() => {
    if (!managerId) return
    if (mrIdParam && (mrIdParam === managerId || mrs.some(m => m.id === mrIdParam))) {
      setSelectedMrId(mrIdParam)
      return
    }
    setSelectedMrId(prev => {
      if (prev && (prev === managerId || mrs.some(m => m.id === prev))) return prev
      return managerId
    })
  }, [managerId, mrIdParam, mrs])

  const selectMr = (id: string) => {
    setSelectedMrId(id)
    const next = new URLSearchParams(searchParams)
    next.set('mrId', id)
    setSearchParams(next, { replace: true })
  }

  const subjectName = useMemo(() => {
    if (!selectedMrId) return ''
    if (selectedMrId === managerId) return user?.full_name ?? 'Myself'
    return mrs.find(m => m.id === selectedMrId)?.full_name ?? 'MR'
  }, [selectedMrId, managerId, user?.full_name, mrs])

  const linkMode: ReportHistoryLinkMode =
    selectedMrId === managerId ? 'manager-self' : 'manager-team'

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="History" />

      <div className="mx-auto w-full px-4 py-4 space-y-4 max-w-lg md:px-8 md:max-w-3xl md:space-y-5 lg:px-10 lg:max-w-5xl">
        {isLoading && <LoadingSpinner />}

        {!isLoading && mrs.length === 0 && (
          <EmptyState message="No medical representatives assigned to you yet." />
        )}

        {!isLoading && (mrs.length > 0 || managerId) && (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Team member
                </p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {selectedMrId ? subjectName : 'Select below'}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-xl shrink-0 gap-1.5"
                asChild
              >
                <Link
                  to={
                    selectedMrId
                      ? `/manager/late-dcr-grant?mrId=${selectedMrId}`
                      : '/manager/late-dcr-grant'
                  }
                >
                  <CalendarClock className="h-4 w-4" />
                  Allow late DCR
                </Link>
              </Button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
              <button
                type="button"
                onClick={() => selectMr(managerId)}
                className={cn(
                  'shrink-0 rounded-xl border px-3 py-2 text-left min-w-[100px] transition-all',
                  selectedMrId === managerId
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border/80 bg-card hover:border-primary/30',
                )}
              >
                <p className="text-xs font-bold">Myself</p>
                <p
                  className={cn(
                    'text-[10px]',
                    selectedMrId === managerId ? 'text-primary-foreground/75' : 'text-muted-foreground',
                  )}
                >
                  Your DCR
                </p>
              </button>
              {mrs.map(mr => (
                <button
                  key={mr.id}
                  type="button"
                  onClick={() => selectMr(mr.id)}
                  className={cn(
                    'shrink-0 rounded-xl border px-3 py-2 text-left min-w-[108px] max-w-[140px] transition-all',
                    selectedMrId === mr.id
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border/80 bg-card hover:border-primary/30',
                  )}
                >
                  <p className="text-xs font-bold leading-snug line-clamp-2">{mr.full_name}</p>
                  <p
                    className={cn(
                      'text-[10px]',
                      selectedMrId === mr.id ? 'text-primary-foreground/75' : 'text-muted-foreground',
                    )}
                  >
                    Team MR
                  </p>
                </button>
              ))}
            </div>
          </>
        )}

        {selectedMrId && (
          <ReportHistoryView
            key={selectedMrId}
            subjectMrId={selectedMrId}
            subjectName={subjectName}
            linkMode={linkMode}
            showPdfCard={selectedMrId === managerId}
            enableLateRequest={false}
            emptyMessage="No reports for this person in the selected period."
          />
        )}
      </div>

      <BottomNav role="manager" />
    </div>
  )
}
