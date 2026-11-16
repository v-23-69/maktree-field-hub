import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FileText, Plus, Stethoscope } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useAddDoctorToCustomArea,
  useManagerCustomAreas,
} from '@/hooks/useManagerCustomAreas'
import { useDoctorsBySubAreas } from '@/hooks/useDoctors'
import { dashboardPanelClass } from '@/components/dashboard/dashboard-shell'
import { VisitingCardOcrButtons } from '@/components/doctors/VisitingCardIntakeControls'
import VisitingCardIntakeOverlay from '@/components/doctors/VisitingCardIntakeOverlay'
import DoctorEntrySourceBadge from '@/components/doctors/DoctorEntrySourceBadge'
import { useVisitingCardIntake, useApplyVisitingCardResult } from '@/hooks/useVisitingCardIntake'
import type { DoctorEntrySource, VisitingCardImage } from '@/lib/visitingCard'

export default function ManagerCustomAreaDetail() {
  const { customAreaId = '' } = useParams()
  const navigate = useNavigate()
  const { data: areas = [], isLoading } = useManagerCustomAreas()
  const area = useMemo(
    () => areas.find(a => a.custom_area_id === customAreaId),
    [areas, customAreaId],
  )
  const { data: doctors = [], isLoading: doctorsLoading } = useDoctorsBySubAreas(
    area?.sub_area_id ? [area.sub_area_id] : [],
  )
  const addDoctor = useAddDoctorToCustomArea()
  const cardIntake = useVisitingCardIntake()
  useApplyVisitingCardResult(result => {
    const first = result.doctors[0]
    if (first) {
      setDocName(first.full_name)
      setSpeciality(first.speciality)
      setMobile(first.mobile)
    }
    setEntrySource(result.source)
    setCardImages(result.images)
    if (result.doctors.length > 1) {
      toast.message(`This card has ${result.doctors.length} doctors. Review the first, save, then scan again for the next.`)
    }
  })

  const [docName, setDocName] = useState('')
  const [speciality, setSpeciality] = useState('')
  const [mobile, setMobile] = useState('')
  const [entrySource, setEntrySource] = useState<DoctorEntrySource>('manual')
  const [cardImages, setCardImages] = useState<VisitingCardImage[]>([])

  const handleAddDoctor = async () => {
    if (!area) return
    if (!docName.trim()) {
      toast.error('Doctor name is required')
      return
    }
    try {
      await addDoctor.mutateAsync({
        customAreaId: area.custom_area_id,
        fullName: docName.trim(),
        speciality: speciality.trim() || undefined,
        mobile: mobile.trim() || undefined,
        entrySource,
        visitingCardImages: cardImages,
      })
      toast.success('Doctor added')
      setDocName('')
      setSpeciality('')
      setMobile('')
      setEntrySource('manual')
      setCardImages([])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add doctor')
    }
  }

  const startDcr = () => {
    if (!area) return
    navigate('/manager/report/new', {
      state: { preselectSubAreaIds: [area.sub_area_id] },
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!area) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="Custom area" showBack />
        <EmptyState message="Area not found." />
        <BottomNav role="manager" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title={area.name} showBack />
      <div className="mx-auto w-full max-w-lg md:max-w-3xl px-4 py-4 space-y-4 md:px-8">
        <p className="text-sm text-muted-foreground">
          {area.territory_name
            ? `Assigned to territory: ${area.territory_name}`
            : 'Not linked to a territory yet — assign from the custom areas list.'}
        </p>

        <Button type="button" className="w-full rounded-xl gap-2" onClick={startDcr}>
          <FileText className="h-4 w-4" />
          File DCR with this area
        </Button>

        <div className={dashboardPanelClass('p-4 space-y-3')}>
          <p className="text-sm font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add doctor
          </p>
          <VisitingCardOcrButtons
            disabled={cardIntake.parsing}
            onCamera={() => void cardIntake.start('camera')}
            onUpload={() => void cardIntake.start('upload')}
          />
          {entrySource !== 'manual' && (
            <div className="flex items-center gap-2">
              <DoctorEntrySourceBadge source={entrySource} />
              <span className="text-[11px] text-muted-foreground">Preview and correct before saving.</span>
            </div>
          )}
          {cardImages.length > 0 && (
            <div className="flex gap-2">
              {cardImages.map(img => (
                <img
                  key={`${img.side}-${img.url}`}
                  src={img.url}
                  alt={`${img.side} visiting card`}
                  className="h-16 w-24 rounded-lg object-cover border border-border"
                />
              ))}
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs">Doctor name *</Label>
            <Input
              value={docName}
              onChange={e => setDocName(e.target.value)}
              className="rounded-xl"
              placeholder="Dr. name"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Speciality</Label>
            <Input
              value={speciality}
              onChange={e => setSpeciality(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Mobile</Label>
            <Input
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="w-full rounded-xl"
            disabled={addDoctor.isPending}
            onClick={() => void handleAddDoctor()}
          >
            Save doctor
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">
            Doctors ({doctors.length})
          </p>
          {doctorsLoading && <LoadingSpinner />}
          {!doctorsLoading && doctors.length === 0 && (
            <EmptyState message="No doctors yet. Add one above before filing a DCR." />
          )}
          <ul className="space-y-2">
            {doctors.map(d => (
              <li key={d.id} className={dashboardPanelClass('p-3 flex items-center gap-3')}>
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Stethoscope className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground">{d.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[d.speciality, d.mobile].filter(Boolean).join(' · ') || '—'}
                  </p>
                  {d.entry_source && d.entry_source !== 'manual' && (
                    <div className="mt-1">
                      <DoctorEntrySourceBadge source={d.entry_source} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <BottomNav role="manager" />
      <VisitingCardIntakeOverlay intake={cardIntake} />
    </div>
  )
}
