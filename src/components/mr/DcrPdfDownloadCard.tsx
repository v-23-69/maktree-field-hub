import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { fetchSubmittedReportsWithVisitsForMrInDateRange } from '@/hooks/useReport'
import { saveDcrReportsPdf, withPdfGenerationProgress } from '@/lib/dcrPdf'
import { formatInputDate, lastDayOfMonthYyyyMmDd, todayInputDate } from '@/lib/dateUtils'

type Preset = 'today' | 'last7' | 'thisMonth' | 'range'

interface Props {
  mrId: string
  mrName?: string | null
}

export default function DcrPdfDownloadCard({ mrId, mrName }: Props) {
  const today = todayInputDate()
  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return formatInputDate(d)
  })
  const [to, setTo] = useState(today)
  const [busy, setBusy] = useState(false)

  const runExport = async (kind: Preset) => {
    if (!supabase || !mrId) return
    let fromDate = ''
    let toDate = ''
    if (kind === 'today') {
      fromDate = today
      toDate = today
    } else if (kind === 'last7') {
      const end = new Date()
      const start = new Date()
      start.setDate(end.getDate() - 6)
      fromDate = formatInputDate(start)
      toDate = formatInputDate(end)
    } else if (kind === 'thisMonth') {
      const m = today.slice(0, 7)
      fromDate = `${m}-01`
      toDate = lastDayOfMonthYyyyMmDd(m)
    } else {
      fromDate = from
      toDate = to
    }
    if (!fromDate || !toDate || fromDate > toDate) {
      toast.error('Pick a valid date range.')
      return
    }
    setBusy(true)
    const tid = toast.loading('Download started — 0%', {
      duration: 120_000,
      description: 'Fetching submitted DCRs…',
    })
    try {
      await new Promise<void>(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
      const rows = await fetchSubmittedReportsWithVisitsForMrInDateRange(supabase, mrId, fromDate, toDate)
      if (rows.length === 0) {
        toast.error('No submitted DCRs in that range.', { id: tid })
        return
      }
      const safeName = mrName?.replace(/\s+/g, '_') ?? 'DCR'
      toast.loading('Downloading… 20%', { id: tid, duration: 120_000, description: 'Building PDF…' })
      await withPdfGenerationProgress(
        () =>
          saveDcrReportsPdf(rows, {
            fileName: `DCR_${safeName}_${fromDate}_to_${toDate}.pdf`,
            documentTitle: `Daily Call Reports — ${fromDate} to ${toDate}`,
          }),
        { initialToastId: tid },
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Download failed', { id: tid })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Download className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-sm font-semibold text-foreground">Download DCR (PDF)</p>
      </div>
      <p className="text-xs text-muted-foreground">Submitted reports only.</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" className="rounded-lg text-xs" disabled={busy} onClick={() => void runExport('today')}>
          Today
        </Button>
        <Button type="button" variant="secondary" size="sm" className="rounded-lg text-xs" disabled={busy} onClick={() => void runExport('last7')}>
          Last 7 days
        </Button>
        <Button type="button" variant="secondary" size="sm" className="rounded-lg text-xs" disabled={busy} onClick={() => void runExport('thisMonth')}>
          This month
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-9 text-xs rounded-lg" aria-label="From date" />
        <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-9 text-xs rounded-lg" aria-label="To date" />
      </div>
      <Button type="button" className="w-full rounded-xl font-semibold" disabled={busy || !from || !to} onClick={() => void runExport('range')}>
        {busy ? 'Preparing…' : 'Download PDF'}
      </Button>
    </div>
  )
}
