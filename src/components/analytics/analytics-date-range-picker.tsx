import { useMemo, useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { Calendar as CalendarIcon, Settings2 } from 'lucide-react'
import { formatDisplayDate } from '@/lib/dateUtils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { dashboardPanelClass } from '@/components/dashboard/dashboard-shell'
import {
  applyAnalyticsPreset,
  type AnalyticsRangePreset,
} from '@/lib/analyticsDatePresets'

function ymdToDate(ymd: string): Date | undefined {
  if (!ymd || ymd.length < 10) return undefined
  const d = new Date(`${ymd.slice(0, 10)}T12:00:00`)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function dateToYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type Props = {
  fromDate: string
  toDate: string
  onRangeChange: (from: string, to: string) => void
  preset?: AnalyticsRangePreset
  onPresetChange?: (preset: AnalyticsRangePreset) => void
  className?: string
}

const PRESET_LABELS: Record<AnalyticsRangePreset, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  custom: 'Custom',
}

export function AnalyticsDateRangePicker({
  fromDate,
  toDate,
  onRangeChange,
  preset: controlledPreset,
  onPresetChange,
  className,
}: Props) {
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [internalPreset, setInternalPreset] = useState<AnalyticsRangePreset>('monthly')
  const preset = controlledPreset ?? internalPreset

  const now = new Date()
  const [pickerYear, setPickerYear] = useState(now.getFullYear())
  const [pickerMonth, setPickerMonth] = useState(now.getMonth() + 1)

  const yearOptions = useMemo(() => {
    const y = now.getFullYear()
    return [y, y - 1, y - 2, y - 3]
  }, [now])

  const selected: DateRange | undefined = useMemo(
    () => ({
      from: ymdToDate(fromDate),
      to: ymdToDate(toDate),
    }),
    [fromDate, toDate],
  )

  const label =
    fromDate && toDate
      ? `${formatDisplayDate(fromDate)} – ${formatDisplayDate(toDate)}`
      : 'Select date range'

  const setPreset = (id: AnalyticsRangePreset, anchor?: { year?: number; month?: number }) => {
    if (onPresetChange) onPresetChange(id)
    else setInternalPreset(id)
    if (id !== 'custom') {
      const { from, to } = applyAnalyticsPreset(id, anchor)
      onRangeChange(from, to)
    }
  }

  const applyPeriodSettings = () => {
    if (preset === 'monthly') {
      setPreset('monthly', { year: pickerYear, month: pickerMonth })
    } else if (preset === 'yearly') {
      setPreset('yearly', { year: pickerYear })
    }
    setSettingsOpen(false)
  }

  const onSelect = (range: DateRange | undefined) => {
    if (!range?.from) return
    const from = dateToYmd(range.from)
    const to = range.to ? dateToYmd(range.to) : from
    setPreset('custom')
    onRangeChange(from, to)
    if (range.from && range.to) setOpen(false)
  }

  return (
    <div className={cn(dashboardPanelClass('p-4 space-y-3'), className)}>
      <div className="flex flex-wrap items-center gap-2">
        {(['weekly', 'monthly', 'yearly', 'custom'] as AnalyticsRangePreset[]).map(id => (
          <Button
            key={id}
            type="button"
            size="sm"
            variant={preset === id ? 'default' : 'outline'}
            className="h-8 text-xs rounded-lg"
            onClick={() => {
              if (id === 'custom') setOpen(true)
              else setPreset(id)
            }}
          >
            {PRESET_LABELS[id]}
          </Button>
        ))}

        {(preset === 'monthly' || preset === 'yearly') && (
          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg shrink-0">
                <Settings2 className="h-4 w-4" />
                <span className="sr-only">Period settings</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 space-y-3 rounded-xl" align="end">
              <p className="text-xs font-semibold text-foreground">Period settings</p>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground">Year</Label>
                <select
                  value={pickerYear}
                  onChange={e => setPickerYear(Number(e.target.value))}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-2 text-xs"
                >
                  {yearOptions.map(y => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              {preset === 'monthly' && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">Month</Label>
                  <select
                    value={pickerMonth}
                    onChange={e => setPickerMonth(Number(e.target.value))}
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-2 text-xs"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>
                        {new Date(2000, m - 1, 1).toLocaleString(undefined, { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <Button type="button" size="sm" className="w-full h-9 rounded-lg" onClick={applyPeriodSettings}>
                Apply
              </Button>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="analytics-from" className="text-[10px] text-muted-foreground">
            From
          </Label>
          <Input
            id="analytics-from"
            type="date"
            value={fromDate}
            onChange={e => {
              setPreset('custom')
              onRangeChange(e.target.value, toDate || e.target.value)
            }}
            className="h-9 text-xs rounded-lg"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="analytics-to" className="text-[10px] text-muted-foreground">
            To
          </Label>
          <Input
            id="analytics-to"
            type="date"
            value={toDate}
            onChange={e => {
              setPreset('custom')
              onRangeChange(fromDate || e.target.value, e.target.value)
            }}
            className="h-9 text-xs rounded-lg"
          />
        </div>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start text-left font-normal h-10 rounded-lg"
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-xl" align="start">
          <Calendar
            mode="range"
            defaultMonth={selected?.from}
            selected={selected}
            onSelect={onSelect}
            numberOfMonths={1}
            className="rounded-xl"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
