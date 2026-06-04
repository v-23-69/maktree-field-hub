import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, ChevronDown, Plus, Users } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import DoctorVisitDrawer from '@/components/mr/DoctorVisitDrawer'
import { cn } from '@/lib/utils'
import { formatDisplayDate } from '@/lib/dateUtils'
import {
  useCompleteDcrImport,
  useDismissDcrImport,
  useDcrImportDetail,
  type ExtraVisitPayload,
} from '@/hooks/useDcrImport'
import { useProducts } from '@/hooks/useProducts'
import { useDoctorsBySubAreas } from '@/hooks/useDoctors'
import { useMrSubAreas } from '@/hooks/useAreas'
import { useAuth } from '@/hooks/useAuth'
import type { VisitFormEntry } from '@/pages/mr/NewReport'
import type { Doctor } from '@/types/database.types'

export default function ManagerDcrImport() {
  const { importId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: detail, isLoading, isError } = useDcrImportDetail(importId)
  const { data: products = [] } = useProducts()
  const { data: mgrSubAreas = [] } = useMrSubAreas(user?.id ?? '')
  const completeImport = useCompleteDcrImport()
  const dismissImport = useDismissDcrImport()

  const [includedVisitIds, setIncludedVisitIds] = useState<Set<string> | null>(null)
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({})
  const [extraVisits, setExtraVisits] = useState<Record<string, VisitFormEntry>>({})
  const [pickDoctorOpen, setPickDoctorOpen] = useState(false)
  const [activeDoctorId, setActiveDoctorId] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showDismiss, setShowDismiss] = useState(false)

  const subAreaIdsFromMr = useMemo(() => {
    if (!detail) return []
    const ids = new Set<string>()
    for (const v of detail.visits) {
      const sid = v.doctor?.sub_area_id
      if (sid) ids.add(sid)
    }
    return [...ids]
  }, [detail])

  const subAreaIds = useMemo(() => {
    const ids = new Set(subAreaIdsFromMr)
    for (const sa of mgrSubAreas) ids.add(sa.id)
    return [...ids]
  }, [subAreaIdsFromMr, mgrSubAreas])

  const { data: doctors = [] } = useDoctorsBySubAreas(subAreaIds)

  const effectiveIncluded = useMemo(() => {
    if (!detail) return new Set<string>()
    if (includedVisitIds !== null) return includedVisitIds
    return new Set(detail.visits.map(v => v.id))
  }, [detail, includedVisitIds])

  const importedDoctorIds = useMemo(() => {
    const ids = new Set<string>()
    if (!detail) return ids
    for (const v of detail.visits) {
      if (effectiveIncluded.has(v.id)) ids.add(v.doctor_id)
    }
    return ids
  }, [detail, effectiveIncluded])

  const addableDoctors = useMemo(
    () => doctors.filter(d => !importedDoctorIds.has(d.id) && !extraVisits[d.id]),
    [doctors, importedDoctorIds, extraVisits],
  )

  const selectedCount = effectiveIncluded.size + Object.keys(extraVisits).length

  const toggleVisit = (visitId: string, checked: boolean) => {
    if (!detail) return
    const base = includedVisitIds ?? new Set(detail.visits.map(v => v.id))
    const next = new Set(base)
    if (checked) next.add(visitId)
    else next.delete(visitId)
    setIncludedVisitIds(next)
  }

  const productName = (id: string) => products.find(p => p.id === id)?.name ?? id

  const buildExtraPayload = (): ExtraVisitPayload[] =>
    Object.values(extraVisits).map(v => ({
      doctor_id: v.doctorId,
      doctor_sub_area_id: v.subAreaId,
      products_promoted: v.productsPromoted,
      chemist_name: v.chemistName,
      competitors: v.competitors
        .filter(c => c.brandName.trim())
        .map(c => ({ brand_name: c.brandName.trim(), quantity: Number(c.quantity) || 0 })),
      monthly_support: v.monthlySupport
        .filter(m => m.productId)
        .map(m => ({ product_id: m.productId, quantity: Number(m.quantity) || 0 })),
    }))

  const handleSubmit = async () => {
    if (!detail) return
    if (selectedCount === 0) {
      toast.error('Select at least one call')
      return
    }
    try {
      const reportId = await completeImport.mutateAsync({
        importId: detail.import_id,
        includedVisitIds: [...effectiveIncluded],
        extraVisits: buildExtraPayload(),
      })
      toast.success('Calls added to your DCR for this day')
      navigate(`/manager/report/${reportId}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setShowConfirm(false)
    }
  }

  const handleDismiss = async () => {
    if (!detail) return
    try {
      await dismissImport.mutateAsync(detail.import_id)
      toast.success('Import dismissed — you can file DCR manually')
      navigate('/manager/dashboard')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not dismiss')
    } finally {
      setShowDismiss(false)
    }
  }

  const activeDoctor: Doctor | null =
    activeDoctorId ? doctors.find(d => d.id === activeDoctorId) ?? null : null
  const activeSubAreaId = activeDoctor?.sub_area_id ?? ''

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="Import DCR" showBack />
        <LoadingSpinner />
        <BottomNav role="manager" />
      </div>
    )
  }

  if (isError || !detail) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="Import DCR" showBack />
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          This import is no longer available.
        </div>
        <BottomNav role="manager" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <PageHeader title="Import DCR" showBack />

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-violet-600 shrink-0" />
            <p className="text-sm font-semibold text-foreground">Worked with {detail.mr_name}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDisplayDate(detail.report_date)} · Review MR calls below. Uncheck any you did not do together, or add your own calls.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">MR calls ({detail.visits.length})</p>
          <p className="text-xs text-muted-foreground tabular-nums">{effectiveIncluded.size} selected</p>
        </div>

        <div className="space-y-2">
          {detail.visits.map(visit => {
            const doc = visit.doctor
            const checked = effectiveIncluded.has(visit.id)
            const isOpen = openCards[visit.id] ?? false
            return (
              <Collapsible
                key={visit.id}
                open={isOpen}
                onOpenChange={() => setOpenCards(prev => ({ ...prev, [visit.id]: !prev[visit.id] }))}
              >
                <div className={cn('glass-card !rounded-xl overflow-hidden', !checked && 'opacity-60')}>
                  <div className="flex items-center gap-3 p-3">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={v => toggleVisit(visit.id, v === true)}
                      aria-label={`Include ${doc?.full_name ?? 'doctor'}`}
                    />
                    <CollapsibleTrigger className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-foreground truncate">{doc?.full_name ?? 'Doctor'}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {visit.chemist?.name ?? '—'}
                        {(visit.promoted_products?.length ?? 0) > 0 &&
                          ` · ${visit.promoted_products!.length} products`}
                      </p>
                    </CollapsibleTrigger>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-muted-foreground shrink-0 transition-transform',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </div>
                  <CollapsibleContent>
                    <div className="px-3 pb-3 pt-0 ml-9 space-y-2 border-t border-border/40">
                      {(visit.promoted_products?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                            Products
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {visit.promoted_products!.map(pp => (
                              <Badge key={pp.id} className="text-[10px] bg-primary/10 text-primary border-0">
                                {productName(pp.product_id)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {(visit.competitor_entries?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                            Competitors
                          </p>
                          {visit.competitor_entries!.map(c => (
                            <p key={c.id} className="text-xs text-foreground">
                              {c.brand_name} — {c.quantity}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )
          })}
        </div>

        {Object.keys(extraVisits).length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Your added calls</p>
            {Object.entries(extraVisits).map(([doctorId, v]) => {
              const doc = doctors.find(d => d.id === doctorId)
              return (
                <div key={doctorId} className="glass-card !rounded-xl p-3 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{doc?.full_name ?? 'Doctor'}</p>
                    <p className="text-[11px] text-muted-foreground">{v.productsPromoted.length} products</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => setActiveDoctorId(doctorId)}>
                    Edit
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full rounded-xl"
          onClick={() => setPickDoctorOpen(true)}
          disabled={addableDoctors.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add call you did separately
        </Button>

        <Button type="button" variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => setShowDismiss(true)}>
          File DCR manually instead
        </Button>
      </div>

      <div className="fixed bottom-16 left-0 right-0 px-4 pb-2 bg-gradient-to-t from-background via-background/95 to-transparent pt-4">
        <div className="max-w-lg mx-auto">
          <Button
            className="w-full rounded-2xl h-12 text-sm font-semibold"
            disabled={completeImport.isPending || selectedCount === 0}
            onClick={() => setShowConfirm(true)}
          >
            {completeImport.isPending
              ? 'Submitting…'
              : `Submit DCR (${selectedCount} call${selectedCount !== 1 ? 's' : ''})`}
          </Button>
        </div>
      </div>

      {pickDoctorOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold">Pick a doctor</p>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {addableDoctors.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">No more doctors in these areas</p>
              ) : (
                addableDoctors.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-muted text-sm font-medium"
                    onClick={() => {
                      setPickDoctorOpen(false)
                      setActiveDoctorId(d.id)
                    }}
                  >
                    {d.full_name}
                    <span className="block text-[11px] text-muted-foreground font-normal">{d.sub_area?.name ?? ''}</span>
                  </button>
                ))
              )}
            </div>
            <div className="p-3 border-t border-border">
              <Button variant="outline" className="w-full" onClick={() => setPickDoctorOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <DoctorVisitDrawer
        open={!!activeDoctorId}
        onClose={() => setActiveDoctorId(null)}
        doctorId={activeDoctorId}
        subAreaId={activeSubAreaId}
        doctor={activeDoctor}
        products={products}
        existingVisit={activeDoctorId ? extraVisits[activeDoctorId] : undefined}
        onSave={(doctorId, subAreaId, visit) => {
          setExtraVisits(prev => ({ ...prev, [doctorId]: { ...visit, doctorId, subAreaId } }))
          setActiveDoctorId(null)
        }}
      />

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Submit your DCR?"
        description={`This will submit your DCR for ${formatDisplayDate(detail.report_date)} with ${selectedCount} call(s). You cannot edit after submission.`}
        onConfirm={() => void handleSubmit()}
        confirmLabel="Submit"
        confirmDisabled={completeImport.isPending}
      />

      <ConfirmDialog
        open={showDismiss}
        onOpenChange={setShowDismiss}
        title="Skip import?"
        description="You can file your DCR manually from the dashboard. The MR report will stay as submitted."
        onConfirm={() => void handleDismiss()}
        confirmLabel="Skip import"
        confirmDisabled={dismissImport.isPending}
      />

      <BottomNav role="manager" />
    </div>
  )
}
