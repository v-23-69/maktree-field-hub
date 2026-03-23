import { useEffect, useMemo, useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import type { Doctor } from '@/types/database.types'
import { useDoctorDetail, useAddDoctorToSubArea, useUpdateDoctorDetail } from '@/hooks/useMasterList'

interface Props {
  open: boolean
  onClose: () => void
  mrId: string
  subAreaId: string
  doctorId: string | null
  doctor: Doctor | null
  onSaved: () => void
}

export default function DoctorMasterDrawer({
  open,
  onClose,
  mrId,
  subAreaId,
  doctorId,
  doctor,
  onSaved,
}: Props) {
  const { data: doctorDetail } = useDoctorDetail(open ? doctorId : null)
  const activeDoctor = doctorDetail ?? doctor

  const isEdit = !!doctorId && !!activeDoctor

  const updateDoctor = useUpdateDoctorDetail()
  const addDoctor = useAddDoctorToSubArea()

  const [fullName, setFullName] = useState('')
  const [speciality, setSpeciality] = useState('')
  const [qualification, setQualification] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [mobile, setMobile] = useState('')
  const [birthday, setBirthday] = useState('')
  const [marriageAnniversary, setMarriageAnniversary] = useState('')
  const [visitFrequency, setVisitFrequency] = useState<
    'weekly' | 'fortnightly' | 'monthly' | ''
  >('')

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
  }, [open, activeDoctor])

  useEffect(() => {
    if (!open) return
    if (!isEdit) return
  }, [open, isEdit])

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
          visit_frequency: visitFrequency ? (visitFrequency as any) : null,
          speciality,
        })
        toast.success('Doctor details saved ✓')
        onSaved()
        onClose()
        return
      }

      if (!fullName.trim() || !speciality.trim()) {
        toast.error('Doctor name and speciality are required')
        return
      }

      await addDoctor.mutateAsync({
        mrId,
        subAreaId,
        fullName,
        speciality,
        qualification,
        address,
        city,
        mobile,
        birthday,
        marriage_anniversary: marriageAnniversary,
        visit_frequency: visitFrequency ? (visitFrequency as any) : null,
      })
      toast.success('New doctor added ✓')
      onSaved()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    }
  }

  const savePending =
    updateDoctor.isPending || addDoctor.isPending

  return (
    <Drawer open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DrawerContent className="!mt-0 flex h-[100dvh] max-h-[100dvh] flex-col rounded-t-[10px] border bg-background p-0 gap-0">
        <DrawerHeader className="shrink-0 border-b border-border px-4 pb-3 pt-2">
          <DrawerTitle className="text-base break-words">
            {isEdit ? activeDoctor?.full_name ?? 'Doctor' : 'Add New Doctor'}
          </DrawerTitle>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {isEdit ? (
              <>
                <span>Sr. No.: {activeDoctor?.doctor_code ?? '—'}</span>
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
              <span>Sub-area: {subAreaId}</span>
            )}
          </div>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Doctor Name
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
              Address (complete address + area)
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
                Marriage Anniversary
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
              Visit Frequency
            </Label>
            <select
              value={visitFrequency}
              onChange={e => setVisitFrequency(e.target.value as any)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target"
            >
              <option value="">Select frequency</option>
              <option value="weekly">Weekly</option>
              <option value="fortnightly">Fortnightly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

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

