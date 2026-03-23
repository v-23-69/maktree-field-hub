import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useMrSubAreas } from '@/hooks/useAreas'
import { useMasterListByMr } from '@/hooks/useMasterList'
import type { Doctor, MasterListCompletion, SubArea } from '@/types/database.types'
import DoctorMasterDrawer from '@/components/mr/DoctorMasterDrawer'
import { supabase } from '@/lib/supabase'

function pctToBucket(pct: number) {
  if (pct > 80) return 'green'
  if (pct >= 50) return 'amber'
  return 'red'
}

function bucketClasses(bucket: 'green' | 'amber' | 'red') {
  if (bucket === 'green') {
    return {
      border: 'border-emerald-600/50',
      text: 'text-emerald-800',
      bg: 'bg-emerald-600/10',
      accent: 'bg-emerald-600',
    }
  }
  if (bucket === 'amber') {
    return {
      border: 'border-amber-500/50',
      text: 'text-amber-900',
      bg: 'bg-amber-500/10',
      accent: 'bg-amber-500',
    }
  }
  return {
    border: 'border-destructive/50',
    text: 'text-destructive',
    bg: 'bg-destructive/10',
    accent: 'bg-destructive',
  }
}

function missingTags(d: Doctor) {
  const tags: string[] = []
  if (d.master_list_complete) return tags
  if (!d.mobile) tags.push('Mobile missing')
  if (!d.address) tags.push('Address missing')
  if (!d.city) tags.push('City missing')
  if (!d.qualification) tags.push('Qualification missing')
  if (!d.birthday) tags.push('Birthday missing')
  if (!d.marriage_anniversary) tags.push('Marriage Anniversary missing')
  if (!d.visit_frequency) tags.push('Visit Frequency missing')
  return tags
}

export default function MasterList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const mrId = user?.id ?? ''
  const areaIdFilter = searchParams.get('areaId')
  const doctorIdParam = searchParams.get('doctorId')

  const {
    data: subAreas = [],
    isLoading: subAreasLoading,
    isError: subAreasError,
  } = useMrSubAreas(mrId)

  const {
    data: completionRows = [],
    isLoading: completionLoading,
    isError: completionError,
  } = useMasterListByMr(mrId)

  const completionBySubArea = useMemo(() => {
    const map = new Map<string, MasterListCompletion>()
    for (const row of completionRows) map.set(row.sub_area_id, row)
    return map
  }, [completionRows])

  const filteredSubAreas = useMemo(() => {
    if (!areaIdFilter) return subAreas
    return subAreas.filter(sa => sa.area?.id === areaIdFilter)
  }, [subAreas, areaIdFilter])

  const subAreaIds = useMemo(
    () => filteredSubAreas.map(sa => sa.id),
    [filteredSubAreas],
  )

  const {
    data: doctors = [],
    isLoading: doctorsLoading,
    isError: doctorsError,
  } = useQuery({
    queryKey: ['mr-doctors', mrId, subAreaIds.join(',')],
    enabled: !!mrId && subAreaIds.length > 0 && !!supabase,
    queryFn: async (): Promise<Doctor[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .in('sub_area_id', subAreaIds)
        .eq('is_active', true)
        .order('full_name')
      if (error) throw error
      return (data ?? []) as Doctor[]
    },
  })

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerDoctorId, setDrawerDoctorId] = useState<string | null>(null)
  const [drawerSubAreaId, setDrawerSubAreaId] = useState<string>('')

  const openEdit = (doctor: Doctor) => {
    setDrawerDoctorId(doctor.id)
    setDrawerSubAreaId(doctor.sub_area_id)
    setDrawerOpen(true)
  }

  const openNew = (subAreaId: string) => {
    setDrawerDoctorId(null)
    setDrawerSubAreaId(subAreaId)
    setDrawerOpen(true)
  }

  const activeDoctor = useMemo(() => {
    if (!drawerDoctorId) return null
    return doctors.find(d => d.id === drawerDoctorId) ?? null
  }, [drawerDoctorId, doctors])

  // Auto-open from alert navigation, if present.
  useEffect(() => {
    if (!doctorIdParam || drawerOpen) return
    if (doctorsLoading) return
    const doc = doctors.find(d => d.id === doctorIdParam)
    if (!doc) return
    setDrawerDoctorId(doc.id)
    setDrawerSubAreaId(doc.sub_area_id)
    setDrawerOpen(true)
  }, [doctorIdParam, doctorsLoading, doctors, drawerOpen])

  const areaGroups = useMemo(() => {
    const map = new Map<
      string,
      { areaId: string; areaName: string; subAreas: SubArea[] }
    >()

    for (const sa of filteredSubAreas) {
      const area = sa.area
      if (!area) continue
      const key = area.id
      const existing = map.get(key)
      if (!existing) {
        map.set(key, { areaId: area.id, areaName: area.name, subAreas: [sa] })
      } else {
        existing.subAreas.push(sa)
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.areaName.localeCompare(b.areaName),
    )
  }, [filteredSubAreas])

  const loading = subAreasLoading || completionLoading || doctorsLoading
  const error = subAreasError || completionError || doctorsError

  const onSaved = async () => {
    await queryClient.invalidateQueries({ queryKey: ['doctor-detail'] })
    await queryClient.invalidateQueries({ queryKey: ['master-list-completion'] })
    await queryClient.invalidateQueries({ queryKey: ['mr-doctors'] })
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Master List" />

      <div className="px-4 py-4 space-y-4">
        {loading && <LoadingSpinner />}
        {error && (
          <EmptyState message="Could not load master list data. Please try again." />
        )}
        {!loading && !error && areaGroups.length === 0 && (
          <EmptyState message="No assigned doctors found for your account." />
        )}

        {!loading && !error && areaGroups.map(g => (
          <div key={g.areaId} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">{g.areaName}</p>
              <button
                type="button"
                className="text-xs text-primary font-medium hover:underline"
                onClick={() =>
                  navigate(
                    `/mr/master-list?areaId=${encodeURIComponent(g.areaId)}`,
                  )
                }
              >
                Filter
              </button>
            </div>

            <div className="space-y-3">
              {g.subAreas.map(sa => {
                const comp = completionBySubArea.get(sa.id)
                const docs = doctors.filter(d => d.sub_area_id === sa.id)
                const total = comp?.total_doctors ?? docs.length
                const complete = comp?.complete_doctors ?? docs.filter(d => d.master_list_complete).length
                const pct = comp?.completion_pct ?? (total ? Math.round((complete / total) * 100) : 0)

                const bucket = pctToBucket(pct)
                const c = bucketClasses(bucket)

                return (
                  <section
                    key={sa.id}
                    className={`rounded-xl border p-3 shadow-sm ${c.bg} ${c.border}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {sa.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {complete} of {total} doctors complete
                        </p>
                      </div>
                      <div className={`text-xs font-semibold ${c.text}`}>{pct}%</div>
                    </div>

                    <div className="mt-2">
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${c.accent}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {docs.length === 0 ? (
                        <EmptyState message="No doctors in this sub-area yet." />
                      ) : (
                        docs.map(doc => {
                          const completeDoc = !!doc.master_list_complete
                          const tags = missingTags(doc)
                          return (
                            <button
                              key={doc.id}
                              type="button"
                              className="w-full text-left rounded-xl bg-card border border-border hover:border-primary/40 shadow-sm px-3 py-2 active:scale-[0.99] transition"
                              onClick={() => openEdit(doc)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 shrink-0">
                                  {completeDoc ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-foreground truncate">
                                    {doc.full_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {doc.speciality ?? ''}
                                  </p>
                                  {!completeDoc && tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {tags.slice(0, 4).map(t => (
                                        <Badge
                                          key={t}
                                          variant="destructive"
                                          className="text-[10px] py-0 px-2"
                                        >
                                          {t}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>

                    <div className="mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openNew(sa.id)}
                        className="w-full touch-target rounded-lg border-primary/50 text-primary hover:bg-primary/5"
                      >
                        Add New Doctor
                      </Button>
                    </div>
                  </section>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <DoctorMasterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mrId={mrId}
        subAreaId={drawerSubAreaId}
        doctorId={drawerDoctorId}
        doctor={activeDoctor}
        onSaved={async () => void onSaved()}
      />

      <BottomNav role="mr" />
    </div>
  )
}

