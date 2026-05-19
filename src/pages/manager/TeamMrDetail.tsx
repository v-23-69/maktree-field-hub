import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import MrProfileCard from '@/components/manager/MrProfileCard'
import TeamMrOverviewTab from '@/components/manager/team/TeamMrOverviewTab'
import TeamMrTourTab from '@/components/manager/team/TeamMrTourTab'
import TeamMrDcrTab from '@/components/manager/team/TeamMrDcrTab'
import TeamMrMonthlySupportTab from '@/components/manager/team/TeamMrMonthlySupportTab'
import TeamMrTerritoriesTab from '@/components/manager/team/TeamMrTerritoriesTab'
import TeamMrAnalyticsTab from '@/components/manager/team/TeamMrAnalyticsTab'
import TeamMrMasterTab from '@/components/manager/team/TeamMrMasterTab'
import { usePreventAccidentalBack } from '@/hooks/usePreventAccidentalBack'
import { useManagerMrs } from '@/hooks/useManagerTeam'
import { useAuth } from '@/hooks/useAuth'
import { useUnpauseUser } from '@/hooks/useTourProgram'
import {
  useTeamMrsTodayExpenseStatus,
  useTeamMrsTodayReportStatus,
  useTeamMrsTourProgramsForMonth,
} from '@/hooks/useManagerTeamHub'
import { todayInputDate } from '@/lib/dateUtils'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'tp', label: 'Tour' },
  { id: 'dcr', label: 'DCR' },
  { id: 'support', label: 'MS' },
  { id: 'territories', label: 'Areas' },
  { id: 'master', label: 'Doctors' },
  { id: 'analytics', label: 'Stats' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function TeamMrDetail() {
  const { mrId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { goBack: safeGoBack } = usePreventAccidentalBack(true)
  const { data: mrs = [], isLoading } = useManagerMrs(user?.id ?? '')
  const unpauseUser = useUnpauseUser()

  const tab = (searchParams.get('tab') as TabId) || 'overview'
  const setTab = (id: TabId) => setSearchParams({ tab: id }, { replace: true })

  const mr = useMemo(() => mrs.find(m => m.id === mrId), [mrs, mrId])
  const today = todayInputDate()
  const monthStart = `${today.slice(0, 7)}-01`

  const { data: todayReports = [] } = useTeamMrsTodayReportStatus(mrId ? [mrId] : [], today)
  const { data: todayExpenses = [] } = useTeamMrsTodayExpenseStatus(mrId ? [mrId] : [], today)
  const { data: monthTps = [] } = useTeamMrsTourProgramsForMonth(mrId ? [mrId] : [], monthStart)

  const todayReport = todayReports[0]
  const todayExpense = todayExpenses[0]
  const tpRow = monthTps[0]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!mr) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="MR" showBack onBack={safeGoBack} />
        <p className="p-6 text-sm text-muted-foreground text-center">MR not found on your team.</p>
        <BottomNav role="manager" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title={mr.full_name ?? 'MR'} showBack onBack={safeGoBack} />

      <div className="px-4 md:px-6 py-4 space-y-4 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto">
        <MrProfileCard
          mr={mr}
          onOpenProfile={() => navigate(`/profile/${mr.id}`)}
          onUnpause={
            mr.is_paused
              ? () =>
                  void unpauseUser
                    .mutateAsync(mr.id)
                    .then(() => toast.success(`${mr.full_name} unpaused`))
                    .catch(e => toast.error(e instanceof Error ? e.message : 'Failed'))
              : undefined
          }
          unpausePending={unpauseUser.isPending}
        />

        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'shrink-0 px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all',
                tab === t.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border/60 text-muted-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <TeamMrOverviewTab
            mr={mr}
            todayReport={todayReport}
            todayExpense={todayExpense}
            tpStatusLabel={tpRow?.status}
            onOpenTab={id => setTab(id as TabId)}
          />
        )}
        {tab === 'tp' && <TeamMrTourTab mrId={mr.id} />}
        {tab === 'dcr' && <TeamMrDcrTab mrId={mr.id} mrName={mr.full_name ?? 'MR'} />}
        {tab === 'support' && <TeamMrMonthlySupportTab mrId={mr.id} />}
        {tab === 'territories' && <TeamMrTerritoriesTab mrId={mr.id} />}
        {tab === 'master' && <TeamMrMasterTab mrId={mr.id} mrName={mr.full_name ?? 'MR'} />}
        {tab === 'analytics' && <TeamMrAnalyticsTab mrId={mr.id} />}
      </div>

      <BottomNav role="manager" />
    </div>
  )
}
