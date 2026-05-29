import { useEffect, useMemo, useRef, useState } from 'react'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { toastMrPendingManagerApproval } from '@/lib/mrApprovalToast'
import { CheckCircle2, AlertTriangle, Plus, Trash2 } from 'lucide-react'
import type { Chemist, Doctor } from '@/types/database.types'

/** Stable empty list so useEffect deps do not change identity every render when query data is undefined. */
const EMPTY_CHEMISTS: Chemist[] = []
import {
  useDoctorDetail,
  useUpdateDoctorDetail,
  useSyncDoctorChemists,
} from '@/hooks/useMasterList'
import { useSubmitDoctorAddRequest } from '@/hooks/useDoctorAddRequest'
import { useChemistsByDoctor } from '@/hooks/useDoctors'
import { useManagersForMr } from '@/hooks/useManagers'
import { useMyDoctorDeletionRequests, useRequestDoctorDeletion } from '@/hooks/useDoctorDeletion'

type VisitCadence = 'weekly' | 'fortnightly' | 'monthly'

function visitFrequencyForSave(
  v: VisitCadence | '',
): VisitCadence | null {
  if (v === 'weekly' || v === 'fortnightly' || v === 'monthly') return v
  return null
}

type ChemistFormRow = {
  clientKey: string
  chemistId?: string
  name: string
  ownerName: string
  ownerContact: string
}

interface Props {
  open: boolean
  onClose: () => void
  mrId: string
  subAreaId: string
  /** Sub-area display name (add mode). */
  subAreaName?: string
  doctorId: string | null
  doctor: Doctor | null
  onSaved: () => void
}

export default function DoctorMasterDrawer({
  open,
  onClose,
  mrId,
  subAreaId,
  subAreaName,
  doctorId,
  doctor,
  onSaved,
}: Props) {
  const { data: doctorDetail } = useDoctorDetail(open ? doctorId : null)
  const activeDoctor = doctorDetail ?? doctor

  const updateDoctor = useUpdateDoctorDetail()
  const submitDoctorAdd = useSubmitDoctorAddRequest()
  const syncChemists = useSyncDoctorChemists()
  const { data: managers = [] } = useManagersForMr(mrId)
  const { data: myDeletionReqs = [] } = useMyDoctorDeletionRequests(mrId)
  const requestDeletion = useRequestDoctorDeletion()

  const isEdit = !!doctorId && !!activeDoctor
  const pendingRemoval = isEdit
    ? myDeletionReqs.find(r => r.doctor_id === doctorId && r.status === 'pending')
    : undefined

  const [fullName, setFullName] = useState('')
  const [speciality, setSpeciality] = useState('')
  const [qualification, setQualification] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [mobile, setMobile] = useState('')
  const [birthday, setBirthday] = useState('')
  const [marriageAnniversary, setMarriageAnniversary] = useState('')
  const [visitFrequency, setVisitFrequency] = useState<VisitCadence | ''>('')
  const [monthlyVisitTarget, setMonthlyVisitTarget] = useState(2)
  const [removalReason, setRemovalReason] = useState('')
  const [chemistRows, setChemistRows] = useState<ChemistFormRow[]>([])
  const lastChemistHydrateKey = useRef<string | null>(null)

  const { data: linkedChemistsData, isFetching: chemistsFetching } = useChemistsByDoctor(
    open && isEdit && doctorId ? doctorId : '',
  )
  const linkedChemists = linkedChemistsData ?? EMPTY_CHEMISTS

  const canSave = useMemo(() => {
    if (!open) return false
    if (isEdit) return true
    return fullName.trim().length > 0 && speciality.trim().length > 0
  }, [open, isEdit, fullName, speciality])

  useEffect(() => {
    if (!open) return

    setFullName(activeDoctor?.full_name ?? '')
    setSpeciality(activeDoctor?.speciality ?? '')
    setQualification(activeDoctor?.qualification ?? '')
    setAddress(activeDoctor?.address ?? '')
    setCity(activeDoctor?.city ?? '')
    setMobile(activeDoctor?.mobile ?? '')
    setBirthday(activeDoctor?.birthday ?? '')
    setMarriageAnniversary(activeDoctor?.marriage_anniversary ?? '')
    setVisitFrequency(activeDoctor?.visit_frequency ?? '')
    setMonthlyVisitTarget(
      typeof activeDoctor?.monthly_visit_target === 'number' && activeDoctor.monthly_visit_target > 0
        ? activeDoctor.monthly_visit_target
        : 2,
    )
    setRemovalReason('')
  }, [open, activeDoctor])

  useEffect(() => {
    if (!open) {
      setChemistRows([])
      lastChemistHydrateKey.current = null
      return
    }
    if (!isEdit || !doctorId) {
      setChemistRows([])
      lastChemistHydrateKey.current = 'add'
      return
    }
    if (chemistsFetching) return
    const hydrateKey = `${doctorId}:${linkedChemists
      .map(c => c.id)
      .sort()
      .join(',')}`
    if (lastChemistHydrateKey.current === hydrateKey) return
    lastChemistHydrateKey.current = hydrateKey
    setChemistRows(
      linkedChemists.map(c => ({
        clientKey: c.id,
        chemistId: c.id,
        name: c.name,
        ownerName: c.owner_name ?? '',
        ownerContact: c.owner_contact ?? '',
      })),
    )
  }, [open, isEdit, doctorId, chemistsFetching, linkedChemists])

  useEffect(() => {
    lastChemistHydrateKey.current = null
  }, [doctorId])

  const addChemistRow = () => {
    setChemistRows(prev => [
      ...prev,
      { clientKey: crypto.randomUUID(), name: '', ownerName: '', ownerContact: '' },
    ])
  }

  const removeChemistRow = (clientKey: string) => {
    setChemistRows(prev => prev.filter(r => r.clientKey !== clientKey))
  }

  const patchChemistRow = (clientKey: string, patch: Partial<ChemistFormRow>) => {
    setChemistRows(prev => prev.map(r => (r.clientKey === clientKey ? { ...r, ...patch } : r)))
  }

  const chemistPayload = useMemo(
    () =>
      chemistRows.map(r => ({
        chemistId: r.chemistId,
        name: r.name,
        ownerName: r.ownerName,
        ownerContact: r.ownerContact,
      })),
    [chemistRows],
  )

  const handleSave = async () => {
    try {
      if (!open) return
      if (isEdit && doctorId) {
        await updateDoctor.mutateAsync({
          doctorId,
          qualification,
          address,
          city,
          mobile,
          birthday,
          marriage_anniversary: marriageAnniversary,
          visit_frequency: visitFrequencyForSave(visitFrequency),
          monthly_visit_target: monthlyVisitTarget,
          speciality,
        })
        await syncChemists.mutateAsync({
          doctorId,
          subAreaId,
          rows: chemistPayload,
        })
        toast.success('Doctor details saved')
        onSaved()
        onClose()
        return
      }

      if (!fullName.trim() || !speciality.trim()) {
        toast.error('Doctor name and speciality are required')
        return
      }

      const managerId = managers[0]?.id ?? null
      if (!managerId) {
        toast.error('No manager is assigned to your account. Contact admin before adding doctors.')
        return
      }
      await submitDoctorAdd.mutateAsync({
        mr_id: mrId,
        sub_area_id: subAreaId,
        manager_id: managerId,
        payload: {
          doctor: {
            full_name: fullName.trim(),
            speciality: speciality.trim(),
            qualification: qualification.trim() || null,
            address: address.trim() || null,
            city: city.trim() || null,
            mobile: mobile.trim() || null,
            birthday: birthday.trim() || null,
            marriage_anniversary: marriageAnniversary.trim() || null,
            visit_frequency: visitFrequencyForSave(visitFrequency),
            monthly_visit_target: monthlyVisitTarget,
          },
          chemists: chemistPayload
            .filter(r => r.name.trim())
            .map(r => ({
              name: r.name.trim(),
              owner_name: r.ownerName.trim() || null,
              owner_contact: r.ownerContact.trim() || null,
            })),
        },
      })
      toastMrPendingManagerApproval('Doctor added (pending approval)')
      onSaved()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    }
  }

  const savePending = updateDoctor.isPending || submitDoctorAdd.isPending || syncChemists.isPending

  return (
    <Drawer open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DrawerContent className="!mt-0 flex h-[100dvh] max-h-[100dvh] flex-col rounded-t-[10px] border bg-background p-0 gap-0">
        <DrawerHeader className="shrink-0 border-b border-border px-4 pb-3 pt-2">
          <DrawerTitle className="text-base break-words">
            {isEdit ? activeDoctor?.full_name ?? 'Doctor' : 'Add doctor'}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            {isEdit
              ? 'Review or update this doctor profile, visit targets, and linked chemists.'
              : 'Enter details to add a new doctor to this sub-area.'}
          </DrawerDescription>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {isEdit ? (
              <>
                <span>{activeDoctor?.doctor_code ?? '—'}</span>
                {activeDoctor?.master_list_complete ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Complete
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Incomplete
                  </span>
                )}
              </>
            ) : (
              <span>{subAreaName?.trim() || '—'}</span>
            )}
          </div>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Name
            </Label>
            <Input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              disabled={isEdit}
              className="touch-target rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Qualification
              </Label>
              <Input
                value={qualification}
                onChange={e => setQualification(e.target.value)}
                className="touch-target rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Speciality
              </Label>
              <Input
                value={speciality}
                onChange={e => setSpeciality(e.target.value)}
                className="touch-target rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Address
            </Label>
            <Textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="touch-target rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                City
              </Label>
              <Input
                value={city}
                onChange={e => setCity(e.target.value)}
                className="touch-target rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Mobile
              </Label>
              <Input
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                inputMode="numeric"
                className="touch-target rounded-lg"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Chemists
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 rounded-lg px-2.5 text-xs touch-manipulation"
                onClick={addChemistRow}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
            {isEdit && chemistsFetching && chemistRows.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">Loading…</p>
            ) : chemistRows.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">Optional. Link one or more outlets to this doctor.</p>
            ) : (
              <div className="space-y-2.5">
                {chemistRows.map((row, idx) => (
                  <div
                    key={row.clientKey}
                    className="rounded-lg border border-border bg-card p-3 space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide pt-0.5">
                        Chemist {idx + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeChemistRow(row.clientKey)}
                        className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive touch-manipulation"
                        aria-label="Remove chemist"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground">Name</Label>
                      <Input
                        value={row.name}
                        onChange={e => patchChemistRow(row.clientKey, { name: e.target.value })}
                        placeholder="Chemist / outlet name"
                        className="h-9 rounded-lg text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground">Owner (optional)</Label>
                        <Input
                          value={row.ownerName}
                          onChange={e => patchChemistRow(row.clientKey, { ownerName: e.target.value })}
                          placeholder="—"
                          className="h-9 rounded-lg text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground">Contact (optional)</Label>
                        <Input
                          value={row.ownerContact}
                          onChange={e => patchChemistRow(row.clientKey, { ownerContact: e.target.value })}
                          placeholder="—"
                          inputMode="tel"
                          className="h-9 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Birthday
              </Label>
              <Input
                type="date"
                value={birthday}
                onChange={e => setBirthday(e.target.value)}
                className="touch-target rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Anniversary
              </Label>
              <Input
                type="date"
                value={marriageAnniversary}
                onChange={e => setMarriageAnniversary(e.target.value)}
                className="touch-target rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Visits / month
            </Label>
            <Input
              type="number"
              min={1}
              max={99}
              value={monthlyVisitTarget}
              onChange={e => setMonthlyVisitTarget(Math.min(99, Math.max(1, parseInt(e.target.value, 10) || 1)))}
              className="touch-target rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cadence
            </Label>
            <select
              value={visitFrequency}
              onChange={e => {
                const v = e.target.value
                setVisitFrequency(
                  v === 'weekly' || v === 'fortnightly' || v === 'monthly' ? v : '',
                )
              }}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target"
            >
              <option value="">—</option>
              <option value="weekly">Weekly</option>
              <option value="fortnightly">Fortnightly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {isEdit && doctorId && (
            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Request removal
              </Label>
              {pendingRemoval ? (
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                  Pending manager approval — this doctor stays on your list until approved.
                </p>
              ) : (
                <>
                  <Textarea
                    value={removalReason}
                    onChange={e => setRemovalReason(e.target.value)}
                    placeholder="Note (optional)"
                    className="touch-target rounded-lg min-h-[72px] text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full touch-target border-destructive/40 text-destructive hover:bg-destructive/10"
                    disabled={requestDeletion.isPending}
                    onClick={() =>
                      void (async () => {
                        const managerId = managers[0]?.id ?? null
                        if (!managerId) {
                          toast.error('No manager is assigned to your account. Contact admin.')
                          return
                        }
                        try {
                          await requestDeletion.mutateAsync({
                            mr_id: mrId,
                            doctor_id: doctorId,
                            manager_id: managerId,
                            reason: removalReason,
                          })
                          toastMrPendingManagerApproval('Removal request sent')
                          setRemovalReason('')
                        } catch (e) {
                          const msg = e instanceof Error ? e.message : 'Request failed'
                          if (/duplicate|unique|already|pending/i.test(msg)) {
                            toast.error('A pending removal request already exists for this doctor.')
                          } else {
                            toast.error(msg)
                          }
                        }
                      })()
                    }
                  >
                    {requestDeletion.isPending ? 'Sending…' : 'Request removal'}
                  </Button>
                </>
              )}
            </div>
          )}

          <div className="pt-2">
            <Button
              type="button"
              disabled={!canSave || savePending}
              onClick={() => void handleSave()}
              className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {savePending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

