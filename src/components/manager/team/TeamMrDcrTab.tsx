import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { useManagerMrReportDates, useManagerReportByMrAndDate } from '@/hooks/useReport'
import { formatDisplayDate } from '@/lib/dateUtils'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  mrId: string
  mrName: string
}

export default function TeamMrDcrTab({ mrId, mrName }: Props) {
  const navigate = useNavigate()
  const { data: dates = [] } = useManagerMrReportDates(mrId)
  const [selectedDate, setSelectedDate] = useState('')
  const [showReport, setShowReport] = useState(false)
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!selectedDate && dates.length > 0) setSelectedDate(dates[0])
  }, [dates, selectedDate])

  const { data: report, isLoading } = useManagerReportByMrAndDate(
    showReport ? mrId : '',
    showReport ? selectedDate : '',
  )

  const visits = report?.visits ?? []

  const toggleCard = (id: string) => {
    setOpenCards(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full rounded-xl text-xs"
        onClick={() => navigate(`/manager/reports?mrId=${encodeURIComponent(mrId)}`)}
      >
        <ExternalLink className="h-3.5 w-3.5 mr-1" />
        Open full reports &amp; filters
      </Button>

      <div className="space-y-2">
        <Label className="text-xs">Submitted DCR date</Label>
        <select
          value={selectedDate}
          onChange={e => {
            setSelectedDate(e.target.value)
            setShowReport(false)
          }}
          className="flex h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
        >
          {dates.length === 0 ? (
            <option value="">No submitted reports</option>
          ) : (
            dates.map(d => (
              <option key={d} value={d}>
                {formatDisplayDate(d)}
              </option>
            ))
          )}
        </select>
        <Button
          type="button"
          className="w-full rounded-xl"
          disabled={!selectedDate}
          onClick={() => setShowReport(true)}
        >
          Load visits
        </Button>
      </div>

      {showReport && isLoading && <LoadingSpinner />}

      {showReport && !isLoading && visits.length === 0 && (
        <EmptyState message={`No visits on ${formatDisplayDate(selectedDate)}.`} />
      )}

      {showReport && !isLoading && visits.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {mrName} — {visits.length} visit(s) on {formatDisplayDate(selectedDate)}
          </p>
          {visits.map(visit => {
            const doc = visit.doctor
            const key = visit.id
            const products = (visit.promoted_products ?? [])
              .map(pp => pp.product?.name)
              .filter(Boolean) as string[]
            return (
              <Collapsible key={key} open={openCards[key]} onOpenChange={() => toggleCard(key)}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left w-full">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{doc?.full_name ?? 'Doctor'}</p>
                      <p className="text-xs text-muted-foreground">{doc?.speciality}</p>
                    </div>
                    <ChevronDown
                      className={cn('h-4 w-4 shrink-0 transition-transform', openCards[key] && 'rotate-180')}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-3 pb-3 space-y-2 text-xs border-x border-b border-border rounded-b-xl">
                    <p>
                      <span className="text-muted-foreground">Area: </span>
                      {doc?.sub_area?.name ?? '—'}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Chemist: </span>
                      {visit.chemist?.name ?? '—'}
                    </p>
                    {products.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {products.map(p => (
                          <Badge key={p} variant="secondary" className="text-[10px]">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {report?.id && (
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-xs"
                        onClick={() => navigate(`/manager/report/${report.id}`)}
                      >
                        Open full report
                      </Button>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
      )}
    </div>
  )
}
