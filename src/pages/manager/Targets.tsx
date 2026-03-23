import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useManagerMrs } from '@/hooks/useManagerTeam'
import { useProducts } from '@/hooks/useProducts'
import { useMrSubAreas } from '@/hooks/useAreas'
import { useCreateTarget, useDeleteTarget, useManagerTargets } from '@/hooks/useTargets'

export default function ManagerTargets() {
  const { user } = useAuth()
  const managerId = user?.id ?? ''

  const { data: mrs = [], isLoading: mrsLoading } = useManagerMrs(managerId)
  const { data: products = [], isLoading: productsLoading } = useProducts()
  const { data: targets = [], isLoading: targetsLoading, isError } = useManagerTargets(managerId)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [mrId, setMrId] = useState('')
  const [productId, setProductId] = useState('')
  const [subAreaId, setSubAreaId] = useState('')
  const [targetQty, setTargetQty] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data: mrSubAreas = [] } = useMrSubAreas(mrId)
  const createTarget = useCreateTarget()
  const deleteTarget = useDeleteTarget()

  const productNameById = useMemo(
    () => new Map(products.map(p => [p.id, p.name])),
    [products],
  )
  const mrNameById = useMemo(
    () => new Map(mrs.map(m => [m.id, m.full_name])),
    [mrs],
  )
  const subAreaNameById = useMemo(
    () => new Map(mrSubAreas.map(sa => [sa.id, sa.name])),
    [mrSubAreas],
  )

  const resetForm = () => {
    setEditingId(null)
    setMrId('')
    setProductId('')
    setSubAreaId('')
    setTargetQty('')
    setStartDate('')
    setEndDate('')
  }

  const handleSave = async () => {
    try {
      const qty = Number(targetQty)
      if (!mrId || !productId || !startDate || !endDate || !qty) {
        toast.error('Please fill all required target fields.')
        return
      }
      await createTarget.mutateAsync({
        id: editingId ?? undefined,
        mr_id: mrId,
        product_id: productId,
        sub_area_id: subAreaId || null,
        target_qty: qty,
        start_date: startDate,
        end_date: endDate,
        set_by: managerId,
      })
      toast.success(editingId ? 'Target updated ✓' : 'Target created ✓')
      resetForm()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save target')
    }
  }

  const beginEdit = (t: any) => {
    setEditingId(t.id)
    setMrId(t.mr_id)
    setProductId(t.product_id)
    setSubAreaId(t.sub_area_id ?? '')
    setTargetQty(String(t.target_qty ?? ''))
    setStartDate(t.start_date ?? '')
    setEndDate(t.end_date ?? '')
  }

  const getColor = (pct: number) =>
    pct > 80 ? 'bg-emerald-600' : pct >= 50 ? 'bg-amber-500' : 'bg-destructive'

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Targets" />

      <div className="px-4 py-4 space-y-4">
        <div className="rounded-xl bg-card p-4 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {editingId ? 'Edit Target' : 'Set New Target'}
          </p>

          <div className="space-y-2">
            <Label className="text-xs">Select MR</Label>
            {mrsLoading ? (
              <LoadingSpinner />
            ) : (
              <select
                value={mrId}
                onChange={e => setMrId(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target"
              >
                <option value="">Choose MR</option>
                {mrs.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.employee_code})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Select Product</Label>
            {productsLoading ? (
              <LoadingSpinner />
            ) : (
              <select
                value={productId}
                onChange={e => setProductId(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target"
              >
                <option value="">Choose Product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Select Sub-area (Optional)</Label>
            <select
              value={subAreaId}
              onChange={e => setSubAreaId(e.target.value)}
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target"
              disabled={!mrId}
            >
              <option value="">All assigned sub-areas</option>
              {mrSubAreas.map(sa => (
                <option key={sa.id} value={sa.id}>
                  {(sa.area?.name ?? 'Area')} - {sa.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Target Quantity</Label>
            <Input
              type="number"
              min={1}
              value={targetQty}
              onChange={e => setTargetQty(e.target.value)}
              className="touch-target rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="touch-target rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="touch-target rounded-lg"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {editingId && (
              <Button
                type="button"
                variant="outline"
                className="flex-1 touch-target rounded-lg"
                onClick={resetForm}
              >
                Cancel Edit
              </Button>
            )}
            <Button
              type="button"
              disabled={createTarget.isPending}
              onClick={() => void handleSave()}
              className="flex-1 touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {createTarget.isPending ? 'Saving…' : 'Save Target'}
            </Button>
          </div>
        </div>

        {targetsLoading && <LoadingSpinner />}
        {isError && <EmptyState message="Could not load targets." />}
        {!targetsLoading && !isError && targets.length === 0 && (
          <EmptyState message="No targets set yet." />
        )}

        {!targetsLoading && !isError && targets.length > 0 && (
          <div className="space-y-3">
            {targets.map(t => {
              const ach = t.achievement
              const pct = Math.max(0, Math.min(100, Math.round(ach?.achievement_pct ?? 0)))
              return (
                <div key={t.id} className="rounded-xl bg-card border border-border p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {productNameById.get(t.product_id) ?? 'Product'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        MR: {mrNameById.get(t.mr_id) ?? 'MR'}
                        {t.sub_area_id ? ` | ${subAreaNameById.get(t.sub_area_id) ?? 'Sub-area'}` : ' | All sub-areas'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {ach?.achieved_qty ?? t.achieved_qty ?? 0}/{t.target_qty}
                    </Badge>
                  </div>

                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${getColor(pct)}`} style={{ width: `${pct}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {t.start_date} to {t.end_date}
                    </span>
                    <span>{pct}%</span>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1 touch-target rounded-lg" onClick={() => beginEdit(t)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="flex-1 touch-target rounded-lg"
                      disabled={deleteTarget.isPending}
                      onClick={() =>
                        void deleteTarget
                          .mutateAsync(t.id)
                          .then(() => toast.success('Target deleted ✓'))
                          .catch(e =>
                            toast.error(
                              e instanceof Error ? e.message : 'Delete failed',
                            ),
                          )
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav role="manager" />
    </div>
  )
}

