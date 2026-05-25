import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Users, Plus, ChevronRight, Lock, PiggyBank } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useManagerMrs } from '@/hooks/useManagerTeam'
import {
  useTeamMrsTodayExpenseStatus,
  useTeamMrsTodayReportStatus,
  useTeamMrsTourProgramsForMonth,
} from '@/hooks/useManagerTeamHub'
import { useMonthlySupportAggregateForManagerTeam } from '@/hooks/useReport'
import { useCallsAndSpecialityAnalytics, type PeriodPreset } from '@/hooks/useFieldActivityAnalytics'
import { useDashboardRefresh } from '@/hooks/useDashboardRefresh'
import { Input } from '@/components/ui/input'
import { todayInputDate } from '@/lib/dateUtils'
import { cn } from '@/lib/utils'
import LazySpecialityPieChart from '@/components/charts/LazySpecialityPieChart'
import TeamHubManageDrawer, { type TeamManageAction } from '@/components/manager/team/TeamHubManageDrawer'

type TeamHubLocationState = { openManage?: TeamManageAction }

export default function TeamHub() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const managerId = user?.id ?? ''
  const { data: mrs = [], isLoading } = useManagerMrs(managerId)
  const mrIds = useMemo(() => mrs.map(m => m.id), [mrs])
  const today = todayInputDate()
  const monthStart = `${today.slice(0, 7)}-01`

  const [manageAction, setManageAction] = useState<TeamManageAction>(null)
  const [teamCallPreset, setTeamCallPreset] = useState<PeriodPreset>('monthly')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const state = location.state as TeamHubLocationState | null
    if (state?.openManage) {
      setManageAction(state.openManage)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.pathname, location.state, navigate])

  useDashboardRefresh(!!managerId)

  const { data: todayReports = [] } = useTeamMrsTodayReportStatus(mrIds, today)
  const { data: todayExpenses = [] } = useTeamMrsTodayExpenseStatus(mrIds, today)
  const { data: monthTps = [] } = useTeamMrsTourProgramsForMonth(mrIds, monthStart)
  const { data: teamMonthlySupport } = useMonthlySupportAggregateForManagerTeam(managerId, today.slice(0, 7))
  const { data: teamCallAnalytics } = useCallsAndSpecialityAnalytics(
    mrIds,
    teamCallPreset,
    today,
    mrIds.length > 0,
  )

  const reportByMr = useMemo(() => new Map(todayReports.map(r => [r.mrId, r])), [todayReports])
  const expenseByMr = useMemo(() => new Map(todayExpenses.map(r => [r.mrId, r])), [todayExpenses])
  const tpByMr = useMemo(() => new Map(monthTps.map(r => [r.mr_id, r])), [monthTps])

  const dcrDone = todayReports.filter(r => r.submitted).length

  const sortedMrs = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q
      ? mrs.filter(m => (m.full_name ?? '').toLowerCase().includes(q))
      : [...mrs]
    return list.sort((a, b) => {
      const aDone = reportByMr.get(a.id)?.submitted === true
      const bDone = reportByMr.get(b.id)?.submitted === true
      if (aDone !== bDone) return aDone ? 1 : -1
      return (a.full_name ?? '').localeCompare(b.full_name ?? '', undefined, { sensitivity: 'base' })
    })
  }, [mrs, search, reportByMr])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Team" showBack />

      <div className="px-4 md:px-6 py-5 space-y-5 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto">
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">Team overview</p>
              <p className="text-[10px] text-muted-foreground">{mrs.length} medical representatives</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" className="rounded-xl h-9" onClick={() => setManageAction('create-mr')}>
                <Plus className="h-4 w-4 mr-1" />
                Manage
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-muted-foreground">Today DCR</p>
              <p className="font-bold tabular-nums">
                {dcrDone}/{mrs.length}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-muted-foreground">Team MS (month)</p>
              <p className="font-bold text-primary tabular-nums">
                Rs {(teamMonthlySupport?.total_inr ?? 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-3.5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-semibold">Team calls</p>
            <div className="flex gap-1 flex-wrap">
              {(['daily', 'weekly', 'monthly', 'all'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTeamCallPreset(p)}
                  className={cn(
                    'text-[10px] px-2 py-1 rounded-lg font-semibold border',
                    teamCallPreset === p
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border bg-card text-muted-foreground',
                  )}
                >
                  {p === 'all' ? 'Till date' : p}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Total calls</p>
              <p className="text-lg font-bold tabular-nums">{teamCallAnalytics?.totalCalls ?? 0}</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Avg / day</p>
              <p className="text-lg font-bold text-primary tabular-nums">
                {teamCallAnalytics && teamCallAnalytics.daysWithReports > 0
                  ? teamCallAnalytics.avgPerDay.toFixed(1)
                  : '—'}
              </p>
            </div>
          </div>
          {teamCallAnalytics && teamCallAnalytics.bySpeciality.length > 0 && (
            <LazySpecialityPieChart
              data={teamCallAnalytics.bySpeciality}
              heightPx={180}
              outerRadius={65}
              legendFontSize={10}
              colors={['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']}
            />
          )}
        </div>

        {(teamMonthlySupport?.byMr ?? []).length > 0 && (
          <div className="glass-card p-3 space-y-2">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Monthly support by MR</p>
            </div>
            <div className="space-y-1 max-h-28 overflow-y-auto text-xs">
              {(teamMonthlySupport?.byMr ?? []).map(row => (
                <div key={row.mr_id} className="flex justify-between gap-2">
                  <span className="truncate">{row.full_name}</span>
                  <span className="font-semibold text-primary tabular-nums shrink-0">
                    Rs {row.total_inr.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg text-xs"
            onClick={() => navigate('/manager/team/visit-frequency')}
          >
            Visit frequency
          </Button>
          {(
            [
              ['assign', 'Assign areas'],
              ['create-mr', 'Create MR'],
              ['doctor', 'Add doctor'],
              ['set-ptr', 'Brand rates'],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg text-xs"
              onClick={() => setManageAction(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="section-title mb-0">Your MRs</p>
          <p className="text-[10px] text-muted-foreground">Pending DCR first</p>
        </div>
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search MR by name…"
          className="h-10 rounded-xl"
        />
        {sortedMrs.length === 0 ? (
          <EmptyState message={mrs.length === 0 ? 'No MRs on your team yet. Create one to get started.' : 'No MRs match your search.'} />
        ) : (
          <div className="space-y-2">
            {sortedMrs.map(mr => {
              const tr = reportByMr.get(mr.id)
              const ex = expenseByMr.get(mr.id)
              const tp = tpByMr.get(mr.id)
              const paused = mr.is_paused === true
              const initials = (mr.full_name ?? '?')
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
              return (
                <button
                  key={mr.id}
                  type="button"
                  onClick={() => navigate(`/manager/team/${mr.id}`)}
                  className={cn(
                    'w-full glass-card p-3.5 flex items-center gap-3 text-left active:scale-[0.99] transition-all',
                    paused && 'opacity-80 ring-1 ring-destructive/20',
                  )}
                >
                  {mr.profile_photo_url ? (
                    <img src={mr.profile_photo_url} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{initials}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{mr.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      DCR: {tr?.submitted ? 'Done' : 'Pending'} · Exp: {ex?.status === 'submitted' ? 'Done' : ex?.status === 'draft' ? 'Draft' : '—'}
                      {tp ? ` · TP: ${tp.status}` : ''}
                    </p>
                  </div>
                  {paused ? (
                    <Lock className="h-4 w-4 text-destructive shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <TeamHubManageDrawer
        action={manageAction}
        onClose={() => setManageAction(null)}
        managerId={managerId}
        mrs={mrs}
      />

      <BottomNav role="manager" />
    </div>
  )
}
