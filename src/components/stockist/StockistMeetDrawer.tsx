import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useStockists } from '@/hooks/useStockists'
import { useUpsertStockistMeet } from '@/hooks/useStockistMeets'
import { useMyHqAreas } from '@/hooks/useMyHq'
import { formatIstTimeNow, todayInputDate } from '@/lib/dateUtils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

export default function StockistMeetDrawer({ open, onOpenChange, userId }: Props) {
  const [meetDate, setMeetDate] = useState(todayInputDate())
  const [meetTime, setMeetTime] = useState(formatIstTimeNow())
  const [stockistId, setStockistId] = useState('')
  const [hqAreaId, setHqAreaId] = useState('')
  const [notes, setNotes] = useState('')

  const { data: myHqs = [] } = useMyHqAreas(userId)
  const hasMultipleHqs = myHqs.length > 1
  const effectiveHqId = hasMultipleHqs ? hqAreaId : myHqs[0]?.area_id ?? ''

  useEffect(() => {
    if (!open) return
    setMeetDate(todayInputDate())
    setMeetTime(formatIstTimeNow())
    setStockistId('')
    setNotes('')
  }, [open])

  useEffect(() => {
    if (myHqs.length > 0 && !hqAreaId) {
      setHqAreaId(myHqs[0].area_id)
    }
  }, [myHqs, hqAreaId])

  const { data: stockists = [] } = useStockists(effectiveHqId || null)
  const upsertMeet = useUpsertStockistMeet()

  const canSave = useMemo(
    () => !!stockistId && !!meetDate && (!hasMultipleHqs || !!effectiveHqId),
    [stockistId, meetDate, hasMultipleHqs, effectiveHqId],
  )

  const handleSave = async () => {
    if (!userId) return
    if (!stockistId) {
      toast.error('Select a stockist')
      return
    }
    try {
      await upsertMeet.mutateAsync({
        userId,
        meetDate,
        meetTime: meetTime || null,
        stockistId,
        notes: notes.trim() || null,
      })
      toast.success('Stockist meet saved')
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save stockist meet')
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="!mt-0 flex max-h-[85dvh] flex-col rounded-t-2xl border bg-background p-0 gap-0">
        <DrawerHeader className="shrink-0 border-b border-border/60 px-4 pb-3 pt-3">
          <DrawerTitle className="text-[15px] font-bold tracking-tight">Stockist meet</DrawerTitle>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4 space-y-4">
          {hasMultipleHqs && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                HQ (Territory)
              </label>
              <select
                value={hqAreaId}
                onChange={e => {
                  setHqAreaId(e.target.value)
                  setStockistId('')
                }}
                className="w-full rounded-xl border border-border/70 bg-background px-3 py-3 text-sm"
              >
                {myHqs.map(a => (
                  <option key={a.area_id} value={a.area_id}>
                    {a.area_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Stockist
            </label>
            <select
              value={stockistId}
              onChange={e => setStockistId(e.target.value)}
              disabled={stockists.length === 0}
              className="w-full rounded-xl border border-border/70 bg-background px-3 py-3 text-sm disabled:opacity-60"
            >
              <option value="">Select stockist</option>
              {stockists.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Date
              </label>
              <Input type="date" value={meetDate} onChange={e => setMeetDate(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Time (optional)
              </label>
              <Input type="time" value={meetTime} onChange={e => setMeetTime(e.target.value)} className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Notes (optional)
            </label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes…"
              className="rounded-xl min-h-[90px]"
            />
          </div>

          <Button
            type="button"
            className="w-full rounded-2xl h-12 font-bold"
            disabled={!canSave || upsertMeet.isPending}
            onClick={() => void handleSave()}
          >
            {upsertMeet.isPending ? 'Saving…' : 'Save stockist meet'}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
