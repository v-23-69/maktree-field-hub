import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import ReportHistoryView from '@/components/mr/ReportHistoryView'
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
    if (selectedMrId && (selectedMrId === managerId || mrs.some(m => m.id === selectedMrId))) return
    if (mrs.length > 0) setSelectedMrId(mrs[0].id)
    else setSelectedMrId(managerId)
  }, [managerId, mrIdParam, mrs, selectedMrId])

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

      <div className="px-4 md:px-6 py-4 space-y-4 max-w-2xl lg:max-w-4xl mx-auto">
        <p className="text-sm text-muted-foreground -mt-1">
          Select a team member to view their DCR calendar, or choose yourself for your own field reports.
        </p>

        {isLoading && <LoadingSpinner />}

        {!isLoading && mrs.length === 0 && (
          <EmptyState message="No medical representatives assigned to you yet." />
        )}

        {!isLoading && (mrs.length > 0 || managerId) && (
          <section className="space-y-2">
            <p className="text-xs font-semibold text-foreground">Select MR</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => selectMr(managerId)}
                className={cn(
                  'shrink-0 rounded-xl border px-3 py-2.5 text-left min-w-[120px] transition-all',
                  selectedMrId === managerId
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20'
                    : 'border-border/80 bg-card hover:border-primary/30',
                )}
              >
                <p className="text-xs font-bold leading-snug">Myself</p>
                <p
                  className={cn(
                    'text-[10px] mt-0.5',
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
                    'shrink-0 rounded-xl border px-3 py-2.5 text-left min-w-[128px] transition-all',
                    selectedMrId === mr.id
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20'
                      : 'border-border/80 bg-card hover:border-primary/30',
                  )}
                >
                  <p className="text-xs font-bold leading-snug line-clamp-2">{mr.full_name}</p>
                  <p
                    className={cn(
                      'text-[10px] mt-0.5 tabular-nums',
                      selectedMrId === mr.id ? 'text-primary-foreground/75' : 'text-muted-foreground',
                    )}
                  >
                    {mr.employee_code}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {selectedMrId && (
          <ReportHistoryView
            key={selectedMrId}
            subjectMrId={selectedMrId}
            subjectName={subjectName}
            linkMode={linkMode}
            showPdfCard={selectedMrId === managerId}
            emptyMessage="No reports for this person in the selected period."
          />
        )}
      </div>

      <BottomNav role="manager" />
    </div>
  )
}
