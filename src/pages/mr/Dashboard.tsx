import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDisplayDate, todayInputDate } from '@/lib/dateUtils';
import { useAuth } from '@/hooks/useAuth';
import { FilePlus, FileText, Stethoscope, Calendar } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import StatCard from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useMasterListByMr } from '@/hooks/useMasterList';
import { useMrSubAreas } from '@/hooks/useAreas';
import { useMrTargets } from '@/hooks/useTargets';
import { supabase } from '@/lib/supabase';
import type { DoctorAlert } from '@/types/database.types';

export default function MRDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = formatDisplayDate(todayInputDate());

  const { data: completionRows = [], isLoading: completionLoading } = useMasterListByMr(
    user?.id ?? '',
  )
  const { data: subAreas = [] } = useMrSubAreas(user?.id ?? '')
  const { data: targetRows = [], isLoading: targetsLoading } = useMrTargets(user?.id ?? '')

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['doctor-alerts', user?.id],
    enabled: !!user?.id && !!supabase,
    queryFn: async (): Promise<DoctorAlert[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('get_doctor_alerts', {
        p_mr_id: user?.id,
      })
      if (error) throw error
      return (data ?? []) as DoctorAlert[]
    },
  })

  const areaProgress = useMemo(() => {
    const areaIdByName = new Map<string, string>()
    for (const sa of subAreas) {
      if (sa.area?.name && sa.area?.id) areaIdByName.set(sa.area.name, sa.area.id)
    }

    const map = new Map<string, { areaId: string | null; total: number; complete: number }>()
    for (const row of completionRows) {
      const existing = map.get(row.area) ?? {
        areaId: areaIdByName.get(row.area) ?? null,
        total: 0,
        complete: 0,
      }
      existing.total += row.total_doctors ?? 0
      existing.complete += row.complete_doctors ?? 0
      map.set(row.area, existing)
    }

    return Array.from(map.entries()).map(([areaName, v]) => {
      const pct = v.total > 0 ? Math.round((v.complete / v.total) * 100) : 0
      let color: 'green' | 'amber' | 'red' = 'red'
      if (pct > 80) color = 'green'
      else if (pct >= 50) color = 'amber'
      return {
        areaName,
        areaId: v.areaId,
        total: v.total,
        complete: v.complete,
        pct,
        color,
      }
    })
  }, [completionRows, subAreas])

  const activeTargets = useMemo(() => {
    const today = new Date()
    return targetRows
      .filter(t => new Date(t.start_date) <= today && new Date(t.end_date) >= today)
      .map(t => {
        const pct = Math.max(0, Math.min(100, Math.round(t.achievement_pct ?? 0)))
        const end = new Date(t.end_date)
        const daysRemaining = Math.max(
          0,
          Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
        )
        return { ...t, pct, daysRemaining }
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
  }, [targetRows])

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Dashboard" />

      <div className="px-4 py-4 space-y-5">
        {!alertsLoading && alerts.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Alerts
            </p>
            <div className="space-y-2">
              {alerts.map(a => {
                const isBirthday = a.alert_type === 'birthday'
                const icon = isBirthday ? '🎂' : '💍'
                const msg =
                  a.days_until === 0
                    ? `${icon} ${a.doctor_name}'s ${isBirthday ? 'birthday' : 'anniversary'} is today!`
                    : `${icon} ${a.doctor_name}'s ${isBirthday ? 'birthday' : 'anniversary'} is in ${a.days_until} days`
                return (
                  <button
                    key={a.doctor_id}
                    type="button"
                    className="w-full text-left rounded-xl bg-card border border-border p-3 shadow-sm active:scale-[0.99] transition"
                    onClick={() => navigate(`/mr/master-list?doctorId=${encodeURIComponent(a.doctor_id)}`)}
                  >
                    <p className="text-sm font-medium text-foreground">{msg}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Welcome */}
        <div className="animate-fade-in-up">
          <h2 className="text-xl font-bold text-foreground">Welcome, {user?.full_name?.split(' ')[0]}!</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{today}</p>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={() => navigate('/mr/report/new')}
          className="w-full touch-target rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-base font-semibold shadow-md active:scale-[0.98] transition-transform"
        >
          <FilePlus className="mr-2 h-5 w-5" />
          Start Today's Report
        </Button>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Master List Progress
            </p>
          </div>

          {completionLoading ? (
            <LoadingSpinner />
          ) : areaProgress.length === 0 ? null : (
            <div className="space-y-2">
              {areaProgress.map(a => (
                <button
                  key={a.areaName}
                  type="button"
                  onClick={() => {
                    if (!a.areaId) return
                    navigate(`/mr/master-list?areaId=${encodeURIComponent(a.areaId)}`)
                  }}
                  disabled={!a.areaId}
                  className="w-full text-left rounded-xl bg-card border border-border p-3 shadow-sm active:scale-[0.99] transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground truncate">
                      {a.areaName}: {a.complete}/{a.total} doctors complete
                    </p>
                    <Badge className="text-[11px]" variant={a.color === 'green' ? 'default' : a.color === 'amber' ? 'secondary' : 'destructive'}>
                      {a.pct}%
                    </Badge>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted mt-2 overflow-hidden">
                    <div
                      className={
                        a.color === 'green'
                          ? 'h-full rounded-full bg-emerald-600'
                          : a.color === 'amber'
                            ? 'h-full rounded-full bg-amber-500'
                            : 'h-full rounded-full bg-destructive'
                      }
                      style={{ width: `${a.pct}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            My Targets
          </p>

          {targetsLoading ? (
            <LoadingSpinner />
          ) : activeTargets.length === 0 ? (
            <p className="text-xs text-muted-foreground">No active targets right now.</p>
          ) : (
            <div className="space-y-2">
              {activeTargets.map(t => (
                <div key={t.target_id} className="rounded-xl bg-card border border-border p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground truncate">
                      {t.product_name}
                      {t.sub_area ? ` - ${t.sub_area}` : ''}
                    </p>
                    <Badge variant="secondary" className="text-[11px]">
                      {t.pct}%
                    </Badge>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted mt-2 overflow-hidden">
                    <div
                      className={
                        t.pct > 80
                          ? 'h-full rounded-full bg-emerald-600'
                          : t.pct >= 50
                            ? 'h-full rounded-full bg-amber-500'
                            : 'h-full rounded-full bg-destructive'
                      }
                      style={{ width: `${t.pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {t.achieved_qty}/{t.target_qty} | {t.daysRemaining} days remaining
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={FileText} value={12} label="Reports This Month" />
          <StatCard icon={Stethoscope} value={8} label="Doctors This Week" />
        </div>
      </div>

      <BottomNav role="mr" />
    </div>
  );
}
