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
import DoctorEntrySourceBadge from '@/components/doctors/DoctorEntrySourceBadge'
import {
  composeDoctorAddress,
  emptyParsedDoctor,
  parsedDoctorFromFields,
  type ParsedVisitingCardDoctor,
  type VisitingCardIntake,
} from '@/lib/visitingCard'

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
  /** Native visiting-card scan/upload result. Ignored in edit mode. */
  intake?: VisitingCardIntake | null
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
  intake = null,
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
  const [hospitalName, setHospitalName] = useState('')
  const [email, setEmail] = useState('')
  const [doctorDrafts, setDoctorDrafts] = useState<ParsedVisitingCardDoctor[]>([])
  const [doctorTab, setDoctorTab] = useState(0)
  const lastChemistHydrateKey = useRef<string | null>(null)
  const ocrSource = !isEdit ? (intake?.source ?? 'manual') : null
  const cardImages = !isEdit ? (intake?.images ?? []) : []
  const multiDoctor = !isEdit && doctorDrafts.length > 1

  const { data: linkedChemistsData, isFetching: chemistsFetching } = useChemistsByDoctor(
    open && isEdit && doctorId ? doctorId : '',
  )
  const linkedChemists = linkedChemistsData ?? EMPTY_CHEMISTS

  const canSave = useMemo(() => {
    if (!open) return false
    if (isEdit) return true
    if (fullName.trim().length > 0 && speciality.trim().length > 0) return true
    return doctorDrafts.some(d => d.full_name.trim().length > 0 && d.speciality.trim().length > 0)
  }, [open, isEdit, fullName, speciality, doctorDrafts])

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
    if (isEdit) {
      setHospitalName('')
      setEmail('')
      setDoctorDrafts([])
      setDoctorTab(0)
      return
    }
    const parsed = intake?.doctors?.length ? intake.doctors : [emptyParsedDoctor()]
    const first = parsed[0]
    setFullName(first.full_name)
    setSpeciality(first.speciality)
    setQualification(first.qualification)
    setHospitalName(first.hospital_name)
    setAddress(first.address)
    setCity(first.city)
    setMobile(first.mobile)
    setEmail(first.email)
    setDoctorDrafts(parsed)
    setDoctorTab(0)
  }, [open, activeDoctor, isEdit, intake])

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

  const snapshotCurrentDoctor = (): ParsedVisitingCardDoctor =>
    parsedDoctorFromFields({
      fullName,
      speciality,
      qualification,
      hospitalName,
      address,
      city,
      mobile,
      email,
    })

  const applyParsedDoctor = (d: ParsedVisitingCardDoctor) => {
    setFullName(d.full_name)
    setSpeciality(d.speciality)
    setQualification(d.qualification)
    setHospitalName(d.hospital_name)
    setAddress(d.address)
    setCity(d.city)
    setMobile(d.mobile)
    setEmail(d.email)
  }

  const goDoctorTab = (next: number) => {
    const current = snapshotCurrentDoctor()
    const nextDrafts = doctorDrafts.map((d, i) => (i === doctorTab ? current : d))
    setDoctorDrafts(nextDrafts)
    setDoctorTab(next)
    applyParsedDoctor(nextDrafts[next] ?? emptyParsedDoctor())
  }

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

      const current = snapshotCurrentDoctor()
      const drafts =
        doctorDrafts.length > 1
          ? doctorDrafts.map((d, i) => (i === doctorTab ? current : d))
          : [current]
      const toSend = drafts.filter(d => d.full_name.trim() && d.speciality.trim())
      if (toSend.length === 0) {
        toast.error('Doctor name and speciality are required')
        return
      }

      const managerId = managers[0]?.id ?? null
      if (!managerId) {
        toast.error('No manager is assigned to your account. Contact admin before adding doctors.')
        return
      }

      const chemists = chemistPayload
        .filter(r => r.name.trim())
        .map(r => ({
          name: r.name.trim(),
          owner_name: r.ownerName.trim() || null,
          owner_contact: r.ownerContact.trim() || null,
        }))

      for (const [idx, d] of toSend.entries()) {
        await submitDoctorAdd.mutateAsync({
          mr_id: mrId,
          sub_area_id: subAreaId,
          manager_id: managerId,
          payload: {
            entry_source: ocrSource ?? 'manual',
            card_images: cardImages,
            doctor: {
              full_name: d.full_name.trim(),
              speciality: d.speciality.trim(),
              qualification: d.qualification.trim() || null,
              address: composeDoctorAddress(d.hospital_name, d.address) || null,
              city: d.city.trim() || null,
              mobile: d.mobile.trim() || null,
              email: d.email.trim() || null,
              hospital_name: d.hospital_name.trim() || null,
              birthday: idx === 0 ? birthday.trim() || null : null,
              marriage_anniversary: idx === 0 ? marriageAnniversary.trim() || null : null,
              visit_frequency: idx === 0 ? visitFrequencyForSave(visitFrequency) : null,
              monthly_visit_target: monthlyVisitTarget,
            },
            chemists: idx === 0 ? chemists : [],
          },
        })
      }
      toastMrPendingManagerApproval(
        toSend.length > 1
          ? `${toSend.length} doctors sent for approval`
          : 'Doctor sent for approval',
      )
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
            {isEdit ? activeDoctor?.full_name ?? 'Doctor' : ocrSource === 'manual' ? 'Add doctor' : 'Review doctor'}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            {isEdit
              ? 'Review or update this doctor profile, visit targets, and linked chemists.'
              : 'Check the details, then send this doctor to your manager for approval.'}
          </DrawerDescription>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
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
              <>
                <span>{subAreaName?.trim() || '—'}</span>
                {ocrSource && <DoctorEntrySourceBadge source={ocrSource} />}
              </>
            )}
          </div>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-4 space-y-4">
          {!isEdit && (cardImages.length > 0 || ocrSource !== 'manual') && (
            <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-2">
              <p className="text-[11px] text-muted-foreground">
                Preview the captured details, correct anything that looks wrong, then send for approval.
              </p>
              {cardImages.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {cardImages.map(img => (
                    <a
                      key={`${img.side}-${img.url}`}
                      href={img.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0"
                    >
                      <img
                        src={img.url}
                        alt={`${img.side} of visiting card`}
                        className="h-20 w-28 rounded-lg object-cover border border-border"
                      />
                      <p className="text-[10px] text-center text-muted-foreground mt-0.5 capitalize">{img.side}</p>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {multiDoctor && (
            <div className="flex gap-2">
              {doctorDrafts.map((d, i) => (
                <button
                  key={`doc-tab-${i}`}
                  type="button"
                  onClick={() => goDoctorTab(i)}
                  className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold border touch-manipulation ${
                    i === doctorTab
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  Doctor {i + 1}
                  {d.full_name ? ` · ${d.full_name.split(' ').slice(-1)[0]}` : ''}
                </button>
              ))}
            </div>
          )}

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

          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Hospital / clinic
                </Label>
                <Input
                  value={hospitalName}
                  onChange={e => setHospitalName(e.target.value)}
                  placeholder="Optional"
                  className="touch-target rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Email
                </Label>
                <Input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  type="email"
                  placeholder="Optional"
                  className="touch-target rounded-lg"
                />
              </div>
            </div>
          )}

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
              {savePending ? (isEdit ? 'Saving…' : 'Sending…') : isEdit ? 'Save' : 'Send for approval'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

