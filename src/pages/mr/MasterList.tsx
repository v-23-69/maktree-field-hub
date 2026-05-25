import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, AlertCircle, Plus, Search, Stethoscope } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useMrSubAreas } from '@/hooks/useAreas'
import { useMasterListByMr } from '@/hooks/useMasterList'
import { useMrDoctorsPaginated } from '@/hooks/useMrDoctorsPaginated'
import type { Doctor, MasterListCompletion, SubArea } from '@/types/database.types'
import DoctorMasterDrawer from '@/components/mr/DoctorMasterDrawer'
import AreaSelectPager from '@/components/mr/AreaSelectPager'
import { cn } from '@/lib/utils'

function doctorInitials(name: string) {
  return name
    .split(/\s+/)
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function missingCount(d: Doctor) {
  if (d.master_list_complete) return 0
  let n = 0
  if (!d.mobile) n++
  if (!d.address) n++
  if (!d.city) n++
  if (!d.qualification) n++
  if (!d.birthday) n++
  if (!d.marriage_anniversary) n++
  if (!d.monthly_visit_target || d.monthly_visit_target < 1) n++
  return n
}

function pickInitialSubAreaId(
  subAreas: SubArea[],
  subAreaIdParam: string | null,
  areaIdParam: string | null,
): string | null {
  if (subAreaIdParam && subAreas.some(sa => sa.id === subAreaIdParam)) {
    return subAreaIdParam
  }
  if (areaIdParam) {
    const inTerritory = subAreas.filter(sa => sa.area?.id === areaIdParam)
    if (inTerritory.length > 0) return inTerritory[0].id
  }
  return subAreas[0]?.id ?? null
}

export default function MasterList() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [doctorPage, setDoctorPage] = useState(0)
  const [doctors, setDoctors] = useState<Doctor[]>([])

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const mrId = user?.id ?? ''
  const areaIdParam = searchParams.get('areaId')
  const subAreaIdParam = searchParams.get('subAreaId')
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

  const [selectedSubAreaId, setSelectedSubAreaId] = useState<string | null>(null)

  useEffect(() => {
    if (subAreasLoading || subAreas.length === 0) return
    setSelectedSubAreaId(prev => {
      if (prev && subAreas.some(sa => sa.id === prev)) return prev
      return pickInitialSubAreaId(subAreas, subAreaIdParam, areaIdParam)
    })
  }, [subAreas, subAreasLoading, subAreaIdParam, areaIdParam])

  const selectSubArea = (id: string) => {
    setSelectedSubAreaId(id)
    setSearch('')
    setDoctorPage(0)
    setDoctors([])
    const next = new URLSearchParams(searchParams)
    next.set('subAreaId', id)
    const sa = subAreas.find(s => s.id === id)
    if (sa?.area?.id) next.set('areaId', sa.area.id)
    else next.delete('areaId')
    setSearchParams(next, { replace: true })
  }

  const flatSubAreas = useMemo(
    () =>
      [...subAreas].sort((a, b) => {
        const ta = a.area?.name ?? ''
        const tb = b.area?.name ?? ''
        if (ta !== tb) return ta.localeCompare(tb)
        return a.name.localeCompare(b.name)
      }),
    [subAreas],
  )

  const selectedSubArea = useMemo(
    () => subAreas.find(sa => sa.id === selectedSubAreaId) ?? null,
    [subAreas, selectedSubAreaId],
  )

  const completionBySubArea = useMemo(() => {
    const map = new Map<string, MasterListCompletion>()
    for (const row of completionRows) map.set(row.sub_area_id, row)
    return map
  }, [completionRows])

  useEffect(() => {
    setDoctorPage(0)
    setDoctors([])
  }, [selectedSubAreaId, searchDebounced])

  const {
    data: doctorsPage,
    isLoading: doctorsLoading,
    isError: doctorsError,
    isFetching: doctorsFetching,
  } = useMrDoctorsPaginated(mrId, selectedSubAreaId, searchDebounced, doctorPage)

  useEffect(() => {
    if (!doctorsPage) return
    setDoctors(prev =>
      doctorPage === 0 ? doctorsPage.rows : [...prev, ...doctorsPage.rows],
    )
  }, [doctorsPage, doctorPage])

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerDoctorId, setDrawerDoctorId] = useState<string | null>(null)

  const openEdit = (doctor: Doctor) => {
    setDrawerDoctorId(doctor.id)
    setDrawerOpen(true)
  }

  const openAdd = () => {
    setDrawerDoctorId(null)
    setDrawerOpen(true)
  }

  const activeDoctor = useMemo(() => {
    if (!drawerDoctorId) return null
    return doctors.find(d => d.id === drawerDoctorId) ?? null
  }, [drawerDoctorId, doctors])

  useEffect(() => {
    if (!doctorIdParam || drawerOpen || doctorsLoading || !selectedSubAreaId) return
    const doc = doctors.find(d => d.id === doctorIdParam)
    if (!doc) return
    setDrawerDoctorId(doc.id)
    setDrawerOpen(true)
  }, [doctorIdParam, doctorsLoading, doctors, drawerOpen, selectedSubAreaId])

  const comp = selectedSubAreaId ? completionBySubArea.get(selectedSubAreaId) : undefined
  const total = comp?.total_doctors ?? doctorsPage?.totalCount ?? doctors.length
  const complete = comp?.complete_doctors ?? doctors.filter(d => d.master_list_complete).length
  const pct = comp?.completion_pct ?? (total ? Math.round((complete / total) * 100) : 0)

  const filteredDoctors = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return doctors
    return doctors.filter(
      d =>
        d.full_name.toLowerCase().includes(q) ||
        (d.speciality?.toLowerCase().includes(q) ?? false),
    )
  }, [doctors, search])

  const incompleteDoctors = filteredDoctors.filter(d => !d.master_list_complete)
  const completeDoctors = filteredDoctors.filter(d => d.master_list_complete)

  const loading = subAreasLoading || completionLoading
  const error = subAreasError || completionError || doctorsError

  const onSaved = async () => {
    await queryClient.invalidateQueries({ queryKey: ['doctor-detail'] })
    await queryClient.invalidateQueries({ queryKey: ['master-list-completion'] })
    await queryClient.invalidateQueries({ queryKey: ['mr-doctors'] })
    await queryClient.invalidateQueries({ queryKey: ['doctor-deletion-requests-mr', mrId] })
  }

  return (
    <div className="min-h-screen bg-background pb-24 flex flex-col">
      <PageHeader title="Doctors" />

      <div className="flex-1 px-4 md:px-6 py-4 space-y-4 max-w-2xl lg:max-w-4xl mx-auto w-full">
        {loading && <LoadingSpinner />}
        {error && <EmptyState message="Could not load doctors. Please try again." />}

        {!loading && !error && subAreas.length === 0 && (
          <EmptyState message="No areas assigned yet. Contact your manager." />
        )}

        {!loading && !error && subAreas.length > 0 && (
          <>
            <AreaSelectPager
              subAreas={flatSubAreas}
              selectedId={selectedSubAreaId}
              completionBySubArea={completionBySubArea}
              onSelect={selectSubArea}
            />

            {selectedSubArea && (
              <section className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col min-h-[320px]">
                <div className="px-4 py-3 bg-muted/30 border-b border-border/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground">{selectedSubArea.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedSubArea.area?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold tabular-nums text-foreground">{pct}%</p>
                      <p className="text-[10px] text-muted-foreground">
                        {complete}/{total} profiles
                      </p>
                    </div>
                  </div>
                  <div className="mt-2.5 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        pct > 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-destructive',
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="px-3 py-2.5 border-b border-border/50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search doctor or speciality…"
                      className="pl-9 h-10 rounded-xl bg-background border-border/80"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[min(50vh,400px)]">
                  {doctorsLoading ? (
                    <div className="py-12">
                      <LoadingSpinner />
                    </div>
                  ) : doctors.length === 0 ? (
                    <div className="p-6">
                      <EmptyState message="No doctors in this area yet." />
                    </div>
                  ) : filteredDoctors.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No matches for your search.</p>
                  ) : (
                    <ul className="p-2 space-y-2">
                      {incompleteDoctors.length > 0 && (
                        <li>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 px-2 py-1">
                            Needs details ({incompleteDoctors.length})
                          </p>
                          <ul className="space-y-1.5 mt-1">
                            {incompleteDoctors.map(doc => (
                              <DoctorRow key={doc.id} doc={doc} onPress={() => openEdit(doc)} />
                            ))}
                          </ul>
                        </li>
                      )}
                      {completeDoctors.length > 0 && (
                        <li className={incompleteDoctors.length > 0 ? 'pt-2' : ''}>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 px-2 py-1">
                            Complete ({completeDoctors.length})
                          </p>
                          <ul className="space-y-1.5 mt-1">
                            {completeDoctors.map(doc => (
                              <DoctorRow key={doc.id} doc={doc} onPress={() => openEdit(doc)} />
                            ))}
                          </ul>
                        </li>
                      )}
                    </ul>
                  )}
                </div>

                {doctorsPage?.hasMore && (
                  <div className="px-3 pb-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-xl"
                      disabled={doctorsFetching}
                      onClick={() => setDoctorPage(p => p + 1)}
                    >
                      {doctorsFetching ? 'Loading…' : `Load more (${doctors.length} of ${total})`}
                    </Button>
                  </div>
                )}

                <div className="p-3 border-t border-border/60 bg-background">
                  <Button
                    type="button"
                    className="w-full h-11 rounded-xl font-semibold touch-manipulation"
                    onClick={openAdd}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add doctor to this area
                  </Button>
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <DoctorMasterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mrId={mrId}
        subAreaId={selectedSubAreaId ?? ''}
        subAreaName={selectedSubArea?.name}
        doctorId={drawerDoctorId}
        doctor={activeDoctor}
        onSaved={async () => void onSaved()}
      />

      <BottomNav role="mr" />
    </div>
  )
}

function DoctorRow({ doc, onPress }: { doc: Doctor; onPress: () => void }) {
  const complete = doc.master_list_complete
  const missing = missingCount(doc)

  return (
    <li>
      <button
        type="button"
        onClick={onPress}
        className="w-full flex items-center gap-3 rounded-xl border border-border/70 bg-background px-3 py-3 text-left hover:border-primary/30 hover:bg-muted/20 active:scale-[0.99] transition-all touch-manipulation"
      >
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold',
            complete ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
          )}
        >
          {doctorInitials(doc.full_name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground leading-tight truncate">{doc.full_name}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {doc.speciality && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                <Stethoscope className="h-3 w-3" />
                {doc.speciality}
              </span>
            )}
            {complete ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Complete
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-3 w-3" />
                {missing} field{missing !== 1 ? 's' : ''} left
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  )
}
