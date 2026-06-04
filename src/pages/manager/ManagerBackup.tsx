import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Archive, Download, CalendarRange } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/useAuth'
import { useManagerMrs } from '@/hooks/useManagerTeam'
import { useLogManagerBackup } from '@/hooks/useManagerBackup'
import {
  assertManagerExcelExport,
  buildManagerBackupWorkbook,
  downloadWorkbook,
  type BackupSubject,
} from '@/lib/managerBackupExport'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { todayInputDate } from '@/lib/dateUtils'
import { toast } from 'sonner'

function monthOptions(count = 24): { value: string; label: string }[] {
  const now = todayInputDate()
  const base = new Date(`${now.slice(0, 7)}-01T00:00:00`)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base)
    d.setMonth(d.getMonth() - i)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    return { value, label }
  })
}

export default function ManagerBackup() {
  const { user } = useAuth()
  const managerId = user?.id ?? ''
  const { data: mrs = [], isLoading } = useManagerMrs(managerId)
  const logBackup = useLogManagerBackup()

  const months = useMemo(() => monthOptions(120), [])
  const [scope, setScope] = useState<'month' | 'range'>('month')
  const [month, setMonth] = useState(months[1]?.value ?? months[0]?.value ?? '')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selected, setSelected] = useState<Set<string>>(() => new Set([managerId].filter(Boolean)))
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState({ message: '', pct: 0 })

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    setSelected(new Set([managerId, ...mrs.map(m => m.id)]))
  }

  const subjects: BackupSubject[] = useMemo(() => {
    const list: BackupSubject[] = []
    if (selected.has(managerId)) {
      list.push({ id: managerId, name: user?.full_name ?? 'Myself', isSelf: true })
    }
    for (const mr of mrs) {
      if (selected.has(mr.id)) list.push({ id: mr.id, name: mr.full_name })
    }
    return list
  }, [selected, managerId, mrs, user?.full_name])

  const handleDownload = async () => {
    if (!supabase) return
    try {
      assertManagerExcelExport(user?.role)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Not allowed')
      return
    }
    if (subjects.length === 0) {
      toast.error('Select at least one person')
      return
    }
    if (scope === 'month' && !month) {
      toast.error('Select a month')
      return
    }
    if (scope === 'range' && (!fromDate || !toDate)) {
      toast.error('Select from and to dates')
      return
    }
    if (scope === 'range' && fromDate > toDate) {
      toast.error('From date must be before to date')
      return
    }

    setBusy(true)
    setProgress({ message: 'Starting…', pct: 5 })
    try {
      const { wb, fileName, periodStart, periodEnd } = await buildManagerBackupWorkbook(supabase, {
        scope,
        monthYyyyMm: scope === 'month' ? month : undefined,
        fromDate: scope === 'range' ? fromDate : undefined,
        toDate: scope === 'range' ? toDate : undefined,
        subjects,
        onProgress: (message, pct) => setProgress({ message, pct }),
      })
      await downloadWorkbook(wb, fileName)
      await logBackup.mutateAsync({
        periodStart,
        periodEnd,
        subjectUserIds: subjects.map(s => s.id),
        fileName,
        backupLabel: scope === 'month' ? month : `${fromDate}_${toDate}`,
      })
      toast.success('Backup downloaded')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Backup failed')
    } finally {
      setBusy(false)
      setProgress({ message: '', pct: 0 })
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Data backup" showBack />

      <div className="mx-auto w-full px-4 py-4 space-y-5 max-w-lg md:max-w-xl">
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Archive className="h-5 w-5" />
            <p className="text-sm font-semibold">Manager Excel backup</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Download DCRs, doctor/chemist additions, monthly support, and tour plans for yourself
            and team MRs. MR accounts can only export PDF — Excel is manager-only.
          </p>
        </div>

        {isLoading && <LoadingSpinner />}

        {!isLoading && (
          <>
            <section className="space-y-2">
              <p className="text-xs font-semibold text-foreground">People</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="text-[10px] font-semibold text-primary hover:underline"
                  onClick={selectAll}
                >
                  Select all
                </button>
                <button
                  type="button"
                  className="text-[10px] font-semibold text-muted-foreground hover:underline"
                  onClick={() => setSelected(new Set())}
                >
                  Clear
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => toggle(managerId)}
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all',
                    selected.has(managerId)
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
                    onClick={() => toggle(mr.id)}
                    className={cn(
                      'rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all line-clamp-2',
                      selected.has(mr.id)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border/80 bg-card',
                    )}
                  >
                    {mr.full_name}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-xs font-semibold text-foreground">Period</p>
              <div className="flex rounded-lg border border-border/80 p-0.5 bg-muted/30">
                <button
                  type="button"
                  className={cn(
                    'flex-1 py-2 text-xs font-semibold rounded-md',
                    scope === 'month' ? 'bg-background shadow-sm' : 'text-muted-foreground',
                  )}
                  onClick={() => setScope('month')}
                >
                  Full month
                </button>
                <button
                  type="button"
                  className={cn(
                    'flex-1 py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-1',
                    scope === 'range' ? 'bg-background shadow-sm' : 'text-muted-foreground',
                  )}
                  onClick={() => setScope('range')}
                >
                  <CalendarRange className="h-3.5 w-3.5" /> Date range
                </button>
              </div>

              {scope === 'month' ? (
                <select
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                  className="flex h-11 w-full rounded-xl border-2 border-border/60 bg-card px-3 text-sm font-medium"
                >
                  {months.map(m => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground">From</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={e => setFromDate(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-border/60 bg-card px-3 text-xs"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground">To</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={e => setToDate(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-border/60 bg-card px-3 text-xs"
                    />
                  </label>
                </div>
              )}
            </section>

            {busy && (
              <div className="space-y-2 rounded-xl border border-border/60 bg-card p-3">
                <p className="text-xs text-muted-foreground">{progress.message}</p>
                <Progress value={progress.pct} className="h-2" />
              </div>
            )}

            <Button
              type="button"
              className="w-full rounded-xl font-semibold gap-2"
              disabled={busy || subjects.length === 0}
              onClick={() => void handleDownload()}
            >
              <Download className="h-4 w-4" />
              {busy ? 'Preparing…' : `Download Excel (${subjects.length} selected)`}
            </Button>

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
