import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Stethoscope, Store, Trash2 } from 'lucide-react'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import {
  useManagerDeactivateChemist,
  useManagerDeactivateDoctor,
  useTeamMrMasterData,
  type TeamMrChemistRow,
} from '@/hooks/useManagerTeamHub'
import type { Doctor } from '@/types/database.types'

type DoctorRow = Doctor & { sub_area_name: string; area_name: string }

interface Props {
  mrId: string
  mrName: string
}

export default function TeamMrMasterTab({ mrId, mrName }: Props) {
  const { data, isLoading } = useTeamMrMasterData(mrId)
  const deactivateDoctor = useManagerDeactivateDoctor()
  const deactivateChemist = useManagerDeactivateChemist()
  const [confirmDoctor, setConfirmDoctor] = useState<{ id: string; name: string } | null>(null)
  const [confirmChemist, setConfirmChemist] = useState<{ id: string; name: string } | null>(null)

  const doctors = data?.doctors ?? []
  const chemists = data?.chemists ?? []

  const doctorsByArea = useMemo(() => {
    const map = new Map<string, DoctorRow[]>()
    for (const d of doctors) {
      const key = `${d.area_name} · ${d.sub_area_name}`
      const list = map.get(key) ?? []
      list.push(d)
      map.set(key, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [doctors])

  const chemistsByArea = useMemo(() => {
    const map = new Map<string, TeamMrChemistRow[]>()
    for (const c of chemists) {
      const key = `${c.area_name} · ${c.sub_area_name}`
      const list = map.get(key) ?? []
      list.push(c)
      map.set(key, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [chemists])

  if (isLoading) return <LoadingSpinner />

  const areaCount = data?.subAreaIds.length ?? 0

  if (areaCount === 0) {
    return (
      <EmptyState
        title="No territories assigned"
        description={`Assign areas in the Areas tab before ${mrName} can add doctors and chemists.`}
      />
    )
  }

  return (
    <div className="space-y-5 animate-fade-in pb-4">
      <div className="grid grid-cols-3 gap-2">
        <StatPill label="Areas" value={areaCount} />
        <StatPill label="Doctors" value={doctors.length} />
        <StatPill label="Chemists" value={chemists.length} />
      </div>

      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Stethoscope className="h-3.5 w-3.5" />
          Doctors ({doctors.length})
        </p>
        {doctors.length === 0 ? (
          <p className="text-xs text-muted-foreground rounded-xl bg-muted/30 px-3 py-2">
            No active doctors in assigned areas yet.
          </p>
        ) : (
          doctorsByArea.map(([label, docs]) => (
            <div key={label} className="rounded-xl border border-border/60 bg-card overflow-hidden">
              <p className="text-[11px] font-semibold text-primary px-3 py-2 bg-primary/5 border-b border-border/40">
                {label}
              </p>
              <ul className="divide-y divide-border/40">
                {docs.map(d => (
                  <li key={d.id} className="flex items-center gap-2 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{d.full_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {d.speciality || '—'} · {d.doctor_code}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => setConfirmDoctor({ id: d.id, name: d.full_name })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Store className="h-3.5 w-3.5" />
          Chemists ({chemists.length})
        </p>
        {chemists.length === 0 ? (
          <p className="text-xs text-muted-foreground rounded-xl bg-muted/30 px-3 py-2">
            No active chemists linked to assigned areas yet.
          </p>
        ) : (
          chemistsByArea.map(([label, chems]) => (
            <div key={label} className="rounded-xl border border-border/60 bg-card overflow-hidden">
              <p className="text-[11px] font-semibold text-primary px-3 py-2 bg-primary/5 border-b border-border/40">
                {label}
              </p>
              <ul className="divide-y divide-border/40">
                {chems.map(c => (
                  <li key={c.id} className="flex items-center gap-2 px-3 py-2.5">
                    <p className="text-sm font-medium text-foreground flex-1 truncate">{c.name}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => setConfirmChemist({ id: c.id, name: c.name })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <ConfirmDialog
        open={!!confirmDoctor}
        onOpenChange={open => { if (!open) setConfirmDoctor(null) }}
        title="Remove doctor?"
        description={
          confirmDoctor
            ? `Deactivate ${confirmDoctor.name} from ${mrName}'s master list? They will no longer appear in DCR.`
            : ''
        }
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          if (!confirmDoctor) return
          void deactivateDoctor
            .mutateAsync({ doctorId: confirmDoctor.id, mrId })
            .then(() => {
              toast.success('Doctor removed')
              setConfirmDoctor(null)
            })
            .catch(e => toast.error(e instanceof Error ? e.message : 'Failed'))
        }}
      />

      <ConfirmDialog
        open={!!confirmChemist}
        onOpenChange={open => { if (!open) setConfirmChemist(null) }}
        title="Remove chemist?"
        description={confirmChemist ? `Deactivate ${confirmChemist.name}?` : ''}
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          if (!confirmChemist) return
          void deactivateChemist
            .mutateAsync({ chemistId: confirmChemist.id, mrId })
            .then(() => {
              toast.success('Chemist removed')
              setConfirmChemist(null)
            })
            .catch(e => toast.error(e instanceof Error ? e.message : 'Failed'))
        }}
      />
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted/40 px-3 py-2 text-center">
      <p className="text-lg font-bold text-foreground tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground font-medium uppercase">{label}</p>
    </div>
  )
}
