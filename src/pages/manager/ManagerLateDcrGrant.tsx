import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import LateDcrDateMultiSelect from '@/components/mr/LateDcrDateMultiSelect'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useManagerMrs } from '@/hooks/useManagerTeam'
import {
  useActiveLateSlotCount,
  useActiveLateSlots,
  useGrantLateDcrFill,
  useRevokeLateDcrFill,
} from '@/hooks/useLateDcr'
import { useMrReportsWithVisitCounts } from '@/hooks/useReport'
import { cn } from '@/lib/utils'
import { formatDisplayDate, todayInputDate } from '@/lib/dateUtils'
import { MAX_LATE_DCR_BATCH } from '@/lib/lateDcrEligibility'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

import { toast } from 'sonner'

export default function ManagerLateDcrGrant() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const managerId = user?.id ?? ''
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data: mrs = [], isLoading } = useManagerMrs(managerId)
  const grant = useGrantLateDcrFill()
  const revoke = useRevokeLateDcrFill()

  const initialMr = searchParams.get('mrId') ?? managerId
  const [selectedMrId, setSelectedMrId] = useState(initialMr)
  const [tab, setTab] = useState<'grant' | 'revoke'>('grant')
  const [grantDates, setGrantDates] = useState<Set<string>>(new Set())
  const [revokeDates, setRevokeDates] = useState<Set<string>>(new Set())

  const todayStr = todayInputDate()
  const { data: reports = [] } = useMrReportsWithVisitCounts(selectedMrId)
  const { isLoading: slotsLoading } = useActiveLateSlotCount(selectedMrId)
  const { data: activeSlotRows = [], isLoading: slotsListLoading } = useActiveLateSlots(selectedMrId)

  const submittedDates = useMemo(() => {
    const set = new Set<string>()
    for (const r of reports) {
      if (r.status === 'submitted') set.add(r.report_date)
    }
    return set
  }, [reports])

  const staleOpenSlots = useMemo(
    () => activeSlotRows.filter(row => !submittedDates.has(row.report_date)),
    [activeSlotRows, submittedDates],
  )
  const effectiveActiveSlots = staleOpenSlots.length

  useEffect(() => {
    if (!selectedMrId || !supabase) return
    const hasStale = activeSlotRows.some(row => submittedDates.has(row.report_date))
    if (!hasStale) return
    void supabase.rpc('reconcile_late_fill_slots', { p_mr_id: selectedMrId }).then(({ error }) => {
      if (error && error.code !== 'PGRST202') return
      queryClient.invalidateQueries({ queryKey: ['active-late-slots', selectedMrId] })
      queryClient.invalidateQueries({ queryKey: ['active-late-slots-list', selectedMrId] })
    })
  }, [selectedMrId, activeSlotRows, submittedDates, queryClient])

  const subjectName = useMemo(() => {
    if (selectedMrId === managerId) return user?.full_name ?? 'Myself'
    return mrs.find(m => m.id === selectedMrId)?.full_name ?? 'MR'
  }, [selectedMrId, managerId, user?.full_name, mrs])

  const toggleGrant = (date: string) => {
    setGrantDates(prev => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else {
        if (next.size >= MAX_LATE_DCR_BATCH) {
          toast.error(`You can grant at most ${MAX_LATE_DCR_BATCH} dates per batch`)
          return prev
        }
        next.add(date)
      }
      return next
    })
  }

  const toggleRevoke = (date: string) => {
    setRevokeDates(prev => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }

  const allRevokeSelected =
    staleOpenSlots.length > 0 && revokeDates.size === staleOpenSlots.length

  const selectAllRevoke = () => {
    setRevokeDates(new Set(staleOpenSlots.map(row => row.report_date)))
  }

  const clearRevokeSelection = () => {
    setRevokeDates(new Set())
  }

  const handleGrant = async () => {
    const dates = [...grantDates].sort()
    if (dates.length === 0) {
      toast.error('Select at least one date on the calendar')
      return
    }
    try {
      const result = await grant.mutateAsync({ mrId: selectedMrId, dates })
      toast.success(`Granted ${result?.granted_count ?? dates.length} late DCR date(s) for ${subjectName}`)
      setGrantDates(new Set())
      navigate('/manager/history', { replace: true, state: { mrId: selectedMrId } })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not grant dates')
    }
  }

  const handleRevoke = async () => {
    const dates = [...revokeDates].sort()
    if (dates.length === 0) {
      toast.error('Select dates to revoke')
      return
    }
    try {
      const result = await revoke.mutateAsync({ mrId: selectedMrId, dates })
      toast.success(`Revoked ${result?.revoked_count ?? dates.length} open slot(s)`)
      setRevokeDates(new Set())
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not revoke')
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Late DCR access" showBack onBack={() => navigate(-1)} />

      <div className="mx-auto w-full px-4 py-4 space-y-5 max-w-lg md:max-w-xl">
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <CalendarClock className="h-5 w-5" />
            <p className="text-sm font-semibold">How batches work</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Normal filing is today plus the previous 2 days. Pick up to{' '}
            <strong>{MAX_LATE_DCR_BATCH} specific dates</strong> per batch (not a range). The person
            must submit all granted late DCRs before you can grant the next batch. Managers can grant
            for themselves or team MRs — no approval needed.
          </p>
        </div>

        <div className="flex rounded-lg border border-border/80 p-0.5 bg-muted/30">
          <button
            type="button"
            className={cn(
              'flex-1 py-2 text-xs font-semibold rounded-md',
              tab === 'grant' ? 'bg-background shadow-sm' : 'text-muted-foreground',
            )}
            onClick={() => setTab('grant')}
          >
            Grant dates
          </button>
          <button
            type="button"
            className={cn(
              'flex-1 py-2 text-xs font-semibold rounded-md',
              tab === 'revoke' ? 'bg-background shadow-sm' : 'text-muted-foreground',
            )}
            onClick={() => setTab('revoke')}
          >
            Revoke
          </button>
        </div>

        {isLoading && <LoadingSpinner />}

        {!isLoading && (
          <>
            <section className="space-y-2">
              <p className="text-xs font-semibold text-foreground">Person</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMrId(managerId)
                    setGrantDates(new Set())
                    setRevokeDates(new Set())
                  }}
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all',
                    selectedMrId === managerId
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border/80 bg-card',
                  )}
                >
                  Myself
                </button>
                {mrs.map(mr => (
                  <button
                    key={mr.id}
                    type="button"
                    onClick={() => {
                      setSelectedMrId(mr.id)
                      setGrantDates(new Set())
                      setRevokeDates(new Set())
                    }}
                    className={cn(
                      'rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all line-clamp-2',
                      selectedMrId === mr.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border/80 bg-card',
                    )}
                  >
                    {mr.full_name}
                  </button>
                ))}
              </div>
            </section>

            {tab === 'grant' && (
              <>
                {!slotsLoading && effectiveActiveSlots > 0 && (
                  <p className="text-sm text-amber-800 bg-amber-500/10 rounded-lg px-3 py-2">
                    {subjectName} still has {effectiveActiveSlots} open late DCR(s). Revoke or wait until they
                    are all submitted before granting a new batch.
                  </p>
                )}

                <LateDcrDateMultiSelect
                  submittedDates={submittedDates}
                  selectedDates={grantDates}
                  onToggle={toggleGrant}
                  todayStr={todayStr}
                />

                <Button
                  type="button"
                  className="w-full rounded-xl font-semibold"
                  disabled={grant.isPending || effectiveActiveSlots > 0 || grantDates.size === 0}
                  onClick={() => void handleGrant()}
                >
                  {grant.isPending
                    ? 'Granting…'
                    : `Grant ${grantDates.size} selected date(s)`}
                </Button>
              </>
            )}

            {tab === 'revoke' && (
              <>
                {slotsListLoading && <LoadingSpinner />}
                {!slotsListLoading && staleOpenSlots.length === 0 && activeSlotRows.length > 0 && (
                  <p className="text-sm text-emerald-800 bg-emerald-500/10 rounded-lg px-3 py-2">
                    All granted late DCRs are submitted. You can grant a new batch from the Grant dates tab.
                  </p>
                )}
                {!slotsListLoading && staleOpenSlots.length === 0 && activeSlotRows.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No open late DCR slots for {subjectName}.
                  </p>
                )}
                {!slotsListLoading && staleOpenSlots.length > 0 && (
                  <div className="space-y-2 rounded-xl border border-border/60 bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold">
                        Open late slots ({staleOpenSlots.length})
                      </p>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          className="text-[10px] font-semibold text-primary hover:underline disabled:opacity-50"
                          disabled={allRevokeSelected}
                          onClick={selectAllRevoke}
                        >
                          Select all
                        </button>
                        <span className="text-muted-foreground text-[10px]">·</span>
                        <button
                          type="button"
                          className="text-[10px] font-semibold text-muted-foreground hover:underline disabled:opacity-50"
                          disabled={revokeDates.size === 0}
                          onClick={clearRevokeSelection}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    {staleOpenSlots.map(row => (
                      <label
                        key={row.slot_id}
                        className="flex items-center gap-2 text-sm py-1.5 border-b border-border/40 last:border-0"
                      >
                        <input
                          type="checkbox"
                          checked={revokeDates.has(row.report_date)}
                          onChange={() => toggleRevoke(row.report_date)}
                          className="rounded border-border"
                        />
                        {formatDisplayDate(row.report_date)}
                      </label>
                    ))}
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full rounded-xl mt-2"
                      disabled={revoke.isPending || revokeDates.size === 0}
                      onClick={() => void handleRevoke()}
                    >
                      {revoke.isPending ? 'Revoking…' : `Revoke ${revokeDates.size} slot(s)`}
                    </Button>
                  </div>
                )}
              </>
            )}

            <Button variant="outline" className="w-full rounded-xl" asChild>
              <Link to="/manager/history">Back to history</Link>
            </Button>
          </>
        )}
      </div>

      <BottomNav role="manager" />
    </div>
  )
}
