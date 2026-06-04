import { useEffect, useMemo, useState } from 'react'
import type { ManagerStatsFilter } from '@/hooks/useDashboardStats'
import { useManagerDashboardStats } from '@/hooks/useDashboardStats'
import { useLocation, useNavigate } from 'react-router-dom'
import { Users, Plus, ChevronRight, Lock, MapPin, Stethoscope } from 'lucide-react'
import { useManagerCustomAreasSummary } from '@/hooks/useManagerCustomAreas'
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
import AnalyticsDonutPie from '@/components/charts/AnalyticsDonutPie'
import ChartStatsSplit from '@/components/charts/ChartStatsSplit'
import LazySpecialityBarChart from '@/components/charts/LazySpecialityBarChart'
import { rollupSpecialityRows } from '@/lib/chartRollup'
import TeamHubManageDrawer, { type TeamManageAction } from '@/components/manager/team/TeamHubManageDrawer'
import TeamPerformanceLeaderboard from '@/components/manager/TeamPerformanceLeaderboard'
import { DashboardSection, dashboardPageClass, dashboardPanelClass } from '@/components/dashboard/dashboard-shell'

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
  const [performanceFilter, setPerformanceFilter] = useState<ManagerStatsFilter>('This Month')
  const [search, setSearch] = useState('')

  const teamMemberIds = useMemo(() => mrIds, [mrIds])
  const { data: teamActivity, isLoading: teamActivityLoading } = useManagerDashboardStats(
    managerId,
    teamMemberIds,
    performanceFilter,
    user?.full_name ?? 'Manager',
    mrs,
  )

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
  const { data: customSummary } = useManagerCustomAreasSummary()
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

  const teamSpecialityChart = useMemo(
    () => rollupSpecialityRows(teamCallAnalytics?.bySpeciality ?? [], 8),
    [teamCallAnalytics?.bySpeciality],
  )

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

      <div className={dashboardPageClass()}>
        <div className={cn(dashboardPanelClass(), 'p-4 space-y-3')}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">Team overview</p>
              <p className="text-[10px] text-muted-foreground">
                {mrs.length} medical representative{mrs.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button size="sm" className="rounded-xl h-9 shrink-0" onClick={() => setManageAction('create-mr')}>
              <Plus className="h-4 w-4 mr-1" />
              Manage team
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className={cn(dashboardPanelClass(), 'px-3 py-2.5 bg-muted/30')}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Today DCR</p>
              <p className="text-lg font-bold tabular-nums text-foreground">
                {dcrDone}<span className="text-muted-foreground font-medium">/{mrs.length}</span>
              </p>
            </div>
            <div className={cn(dashboardPanelClass(), 'px-3 py-2.5 bg-primary/5 border-primary/15')}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Team MS (month)</p>
              <p className="text-lg font-bold tabular-nums text-primary">
                Rs {(teamMonthlySupport?.total_inr ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          {customSummary && customSummary.area_count > 0 && (
            <button
              type="button"
              onClick={() => navigate('/manager/custom-areas')}
              className={cn(
                dashboardPanelClass(),
                'w-full p-3 flex items-center gap-3 text-left active:scale-[0.99] border-sky-500/20 bg-sky-500/5',
              )}
            >
              <div className="h-10 w-10 rounded-xl bg-sky-500/15 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Your field visits (custom)</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {customSummary.area_count} area{customSummary.area_count !== 1 ? 's' : ''} ·{' '}
                  {customSummary.doctor_count} doctors · {customSummary.visit_count} calls logged
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-sky-700 font-medium shrink-0">
                <Stethoscope className="h-3.5 w-3.5" />
                Open
                <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          )}
        </div>

        <TeamPerformanceLeaderboard
          managerId={managerId}
          mrCount={mrs.length}
          activeFilter={performanceFilter}
          onFilterChange={setPerformanceFilter}
          activity={teamActivity}
          loading={teamActivityLoading}
        />

        <DashboardSection title="Team calls">
        <div className={cn(dashboardPanelClass(), 'p-4 space-y-3')}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-semibold text-foreground">Call volume</p>
            <div className="flex gap-1 flex-wrap">
              {(['weekly', 'monthly', 'yearly'] as const).map(p => (
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
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ChartStatsSplit
            chart={
              teamSpecialityChart.length > 0 ? (
                <LazySpecialityBarChart data={teamSpecialityChart} heightPx={180} />
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">No calls in this period.</p>
              )
            }
            stats={
              <>
                <div className="rounded-lg bg-muted/40 px-3 py-2.5 flex-1 sm:w-full">
                  <p className="text-[10px] text-muted-foreground">Total calls</p>
                  <p className="text-lg font-bold tabular-nums">{teamCallAnalytics?.totalCalls ?? 0}</p>
                </div>
                <div className="rounded-lg bg-primary/5 border border-primary/15 px-3 py-2.5 flex-1 sm:w-full">
                  <p className="text-[10px] text-muted-foreground">Avg / day</p>
                  <p className="text-lg font-bold text-primary tabular-nums">
                    {teamCallAnalytics && teamCallAnalytics.daysWithReports > 0
                      ? teamCallAnalytics.avgPerDay.toFixed(1)
                      : '—'}
                  </p>
                </div>
              </>
            }
            footer={
              teamSpecialityChart.length > 0 ? (
                <div className="border-t border-border/60 pt-2 space-y-1 max-h-28 overflow-y-auto">
                  {teamSpecialityChart.slice(0, 6).map(row => (
                    <div key={row.speciality} className="flex justify-between gap-2 text-[11px]">
                      <span className="text-muted-foreground truncate">{row.speciality}</span>
                      <span className="font-semibold tabular-nums shrink-0">{row.visits}</span>
                    </div>
                  ))}
                </div>
              ) : undefined
            }
          />
        </div>
        </DashboardSection>

        {(teamMonthlySupport?.byMr ?? []).length > 0 && (
          <DashboardSection
            title="Monthly support by MR"
            description={`Total Rs ${(teamMonthlySupport?.total_inr ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} this month`}
          >
            <div className={cn(dashboardPanelClass(), 'p-4')}>
              <ChartStatsSplit
                chart={
                  <AnalyticsDonutPie
                    title="Distribution"
                    data={(teamMonthlySupport?.byMr ?? []).map(row => ({
                      key: row.mr_id,
                      label: row.full_name,
                      value: Math.round(row.total_inr),
                    }))}
                    valueLabel="Rs"
                    maxHeightPx={180}
                  />
                }
                stats={
                  <>
                    {(teamMonthlySupport?.byMr ?? []).slice(0, 4).map(row => {
                      const pct =
                        (teamMonthlySupport?.total_inr ?? 0) > 0
                          ? Math.round((row.total_inr / (teamMonthlySupport?.total_inr ?? 1)) * 100)
                          : 0
                      return (
                        <div
                          key={row.mr_id}
                          className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2 flex-1 sm:w-full"
                        >
                          <p className="text-[11px] font-medium truncate leading-tight">{row.full_name}</p>
                          <p className="text-sm font-bold text-primary tabular-nums mt-0.5">
                            Rs {row.total_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{pct}% of team</p>
                        </div>
                      )
                    })}
                  </>
                }
                footer={
                  (teamMonthlySupport?.byMr ?? []).length > 4 ? (
                    <div className="border-t border-border/60 pt-2 space-y-1.5 max-h-32 overflow-y-auto">
                      {(teamMonthlySupport?.byMr ?? []).slice(4).map(row => (
                        <div key={row.mr_id} className="flex justify-between gap-2 text-xs">
                          <span className="truncate">{row.full_name}</span>
                          <span className="font-semibold text-primary tabular-nums shrink-0">
                            Rs {row.total_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : undefined
                }
              />
            </div>
          </DashboardSection>
        )}

        <div className={cn(dashboardPanelClass(), 'p-3 space-y-2')}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Team tools</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs h-10 justify-start"
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
                className="rounded-xl text-xs h-10 justify-start"
                onClick={() => setManageAction(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <DashboardSection
          title="Your MRs"
          description="Pending DCR shown first"
        >
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
                    dashboardPanelClass(),
                    'w-full p-3.5 flex items-center gap-3 text-left active:scale-[0.99] transition-all',
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
        </DashboardSection>
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
