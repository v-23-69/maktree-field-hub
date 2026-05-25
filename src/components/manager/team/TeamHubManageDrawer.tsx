import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useAddDoctor } from '@/hooks/useAdminDoctors';
import { useAddArea, useAddSubArea } from '@/hooks/useAdminAreasMutations';
import { useMrSubAreaAccess, useSaveMrSubAreaAccess } from '@/hooks/useAdminMrAccess';
import { useCreateUser, useDeleteMrUser } from '@/hooks/useAdminUsers';
import { useAllAreas } from '@/hooks/useAreas';
import { useProducts, useUpdateProductPtr } from '@/hooks/useProducts';
import type { User } from '@/types/database.types';
import { employeeCodeFromEmail } from '@/lib/employeeCode';

export type TeamManageAction =
  | 'doctor'
  | 'area'
  | 'subarea'
  | 'assign'
  | 'create-mr'
  | 'delete-mr'
  | 'set-ptr'
  | null;

interface Props {
  action: TeamManageAction;
  onClose: () => void;
  managerId: string;
  mrs: User[];
}

const TITLE: Record<Exclude<TeamManageAction, null>, string> = {
  doctor: 'Add Doctor',
  area: 'Add Territory',
  subarea: 'Add Area',
  assign: 'Assign Area to MR',
  'create-mr': 'Create New MR',
  'delete-mr': 'Delete MR',
  'set-ptr': 'Set brand rates (per unit)',
};

export default function TeamHubManageDrawer({ action, onClose, managerId, mrs }: Props) {
  const { data: areas = [] } = useAllAreas();
  const addDoctor = useAddDoctor();
  const addArea = useAddArea();
  const addSubArea = useAddSubArea();
  const saveMrSubAreaAccess = useSaveMrSubAreaAccess();
  const createUser = useCreateUser();
  const deleteMr = useDeleteMrUser();
  const { data: allProducts = [] } = useProducts();
  const updatePtr = useUpdateProductPtr();

  const [doctorName, setDoctorName] = useState('');
  const [doctorSpec, setDoctorSpec] = useState('');
  const [doctorSubAreaId, setDoctorSubAreaId] = useState('');
  const [areaName, setAreaName] = useState('');
  const [subAreaName, setSubAreaName] = useState('');
  const [subAreaAreaId, setSubAreaAreaId] = useState('');
  const [assignMrId, setAssignMrId] = useState('');
  const [assignPickAreaId, setAssignPickAreaId] = useState('');
  const [assignSelectedSubAreas, setAssignSelectedSubAreas] = useState<Set<string>>(new Set());
  const [newMrName, setNewMrName] = useState('');
  const [newMrEmail, setNewMrEmail] = useState('');
  const [newMrSubAreas, setNewMrSubAreas] = useState<Set<string>>(new Set());
  const [deleteMrId, setDeleteMrId] = useState('');
  const [transferToMrId, setTransferToMrId] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: deleteMrSubAreas = [] } = useMrSubAreaAccess(deleteMrId);
  const { data: assignMrServerAccess = [] } = useMrSubAreaAccess(assignMrId);
  const assignServerSet = useMemo(() => new Set(assignMrServerAccess), [assignMrServerAccess]);
  const assignMrServerKey = assignMrServerAccess.slice().sort().join(',');

  const allSubAreas = useMemo(
    () =>
      areas.flatMap(a =>
        (a.sub_areas ?? []).map(sa => ({
          ...sa,
          areaId: a.id,
          areaName: a.name,
        })),
      ),
    [areas],
  );

  const assignSubAreasFiltered = useMemo(
    () =>
      assignPickAreaId
        ? allSubAreas.filter(sa => sa.areaId === assignPickAreaId)
        : allSubAreas,
    [allSubAreas, assignPickAreaId],
  );

  const toggleAssignSubArea = (id: string) => {
    setAssignSelectedSubAreas(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (!assignMrId) {
      setAssignSelectedSubAreas(new Set());
      return;
    }
    setAssignSelectedSubAreas(new Set(assignMrServerAccess));
  }, [assignMrId, assignMrServerKey]);

  const selectAllAssignFiltered = () => {
    setAssignSelectedSubAreas(prev => {
      const next = new Set(prev);
      for (const sa of assignSubAreasFiltered) next.add(sa.id);
      return next;
    });
  };

  const closeDrawer = () => {
    setDoctorName('');
    setDoctorSpec('');
    setDoctorSubAreaId('');
    setAreaName('');
    setSubAreaName('');
    setSubAreaAreaId('');
    setAssignMrId('');
    setAssignPickAreaId('');
    setAssignSelectedSubAreas(new Set());
    setNewMrName('');
    setNewMrEmail('');
    setNewMrSubAreas(new Set());
    setDeleteMrId('');
    setTransferToMrId('');
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <>
      <Drawer open={action !== null} onOpenChange={v => { if (!v) closeDrawer(); }}>
        <DrawerContent className="!mt-0 flex h-[100dvh] max-h-[100dvh] flex-col rounded-t-2xl border bg-background p-0 gap-0">
          <DrawerHeader className="shrink-0 border-b border-border/60 px-4 pb-3 pt-3">
            <DrawerTitle className="text-[15px] font-bold tracking-tight">
              {action ? TITLE[action] : ''}
            </DrawerTitle>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4 space-y-4">
            {action === 'doctor' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Doctor Name</Label>
                  <Input value={doctorName} onChange={e => setDoctorName(e.target.value)} className="touch-target rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Speciality</Label>
                  <Input value={doctorSpec} onChange={e => setDoctorSpec(e.target.value)} className="touch-target rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Area</Label>
                  <select value={doctorSubAreaId} onChange={e => setDoctorSubAreaId(e.target.value)} className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target">
                    <option value="">Choose Area</option>
                    {allSubAreas.map(sa => (
                      <option key={sa.id} value={sa.id}>{sa.areaName} - {sa.name}</option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  disabled={addDoctor.isPending}
                  className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  onClick={() =>
                    void addDoctor
                      .mutateAsync({ sub_area_id: doctorSubAreaId, full_name: doctorName, speciality: doctorSpec })
                      .then(() => {
                        toast.success('Doctor added');
                        closeDrawer();
                      })
                      .catch(e => toast.error(e instanceof Error ? e.message : 'Could not add doctor'))
                  }
                >
                  {addDoctor.isPending ? 'Saving…' : 'Save'}
                </Button>
              </>
            )}

            {action === 'area' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Territory Name</Label>
                  <Input value={areaName} onChange={e => setAreaName(e.target.value)} className="touch-target rounded-lg" />
                </div>
                <Button
                  type="button"
                  disabled={addArea.isPending}
                  className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  onClick={() =>
                    void addArea
                      .mutateAsync(areaName)
                      .then(() => {
                        toast.success('Territory added');
                        closeDrawer();
                      })
                      .catch(e => toast.error(e instanceof Error ? e.message : 'Could not add area'))
                  }
                >
                  {addArea.isPending ? 'Saving…' : 'Save'}
                </Button>
              </>
            )}

            {action === 'subarea' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Territory</Label>
                  <select value={subAreaAreaId} onChange={e => setSubAreaAreaId(e.target.value)} className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target">
                    <option value="">Choose Territory</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Area Name</Label>
                  <Input value={subAreaName} onChange={e => setSubAreaName(e.target.value)} className="touch-target rounded-lg" />
                </div>
                <Button
                  type="button"
                  disabled={addSubArea.isPending}
                  className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  onClick={() =>
                    void addSubArea
                      .mutateAsync({ areaId: subAreaAreaId, name: subAreaName })
                      .then(() => {
                        toast.success('Area added');
                        closeDrawer();
                      })
                      .catch(e => toast.error(e instanceof Error ? e.message : 'Could not add area'))
                  }
                >
                  {addSubArea.isPending ? 'Saving…' : 'Save'}
                </Button>
              </>
            )}

            {action === 'assign' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">MR</Label>
                  <select value={assignMrId} onChange={e => setAssignMrId(e.target.value)} className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target">
                    <option value="">Choose MR</option>
                    {mrs.map(m => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Area</Label>
                  <select
                    value={assignPickAreaId}
                    onChange={e => setAssignPickAreaId(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target"
                  >
                    <option value="">All Territories</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs">Areas (select to assign or remove)</Label>
                    {assignSubAreasFiltered.length > 0 && (
                      <button
                        type="button"
                        onClick={selectAllAssignFiltered}
                        className="text-[10px] font-semibold text-primary shrink-0"
                      >
                        Select all
                      </button>
                    )}
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-2 rounded-lg border border-border p-2">
                    {assignSubAreasFiltered.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-1">No areas in this territory.</p>
                    ) : (
                      assignSubAreasFiltered.map(sa => (
                        <label key={sa.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={assignSelectedSubAreas.has(sa.id)}
                            onChange={() => toggleAssignSubArea(sa.id)}
                          />
                          <span className="flex-1">{sa.areaName} — {sa.name}</span>
                          {assignServerSet.has(sa.id) && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                              <Check className="h-3 w-3" />
                              Assigned
                            </span>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  disabled={saveMrSubAreaAccess.isPending}
                  className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  onClick={() => {
                    if (!assignMrId) {
                      toast.error('Choose an MR');
                      return;
                    }
                    void saveMrSubAreaAccess
                      .mutateAsync({ mrId: assignMrId, subAreaIds: [...assignSelectedSubAreas] })
                      .then(() => {
                        toast.success('Area assignments saved');
                        closeDrawer();
                      })
                      .catch(e => toast.error(e instanceof Error ? e.message : 'Could not save assignments'));
                  }}
                >
                  {saveMrSubAreaAccess.isPending ? 'Saving…' : 'Save assignments'}
                </Button>
              </>
            )}

            {action === 'create-mr' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">MR Name</Label>
                  <Input value={newMrName} onChange={e => setNewMrName(e.target.value)} className="touch-target rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Email</Label>
                  <Input value={newMrEmail} onChange={e => setNewMrEmail(e.target.value)} type="email" className="touch-target rounded-lg" />
                  {newMrEmail.trim() && (
                    <p className="text-[11px] text-muted-foreground">
                      Login code: <span className="font-semibold text-foreground">{employeeCodeFromEmail(newMrEmail)}</span>
                      {' · '}Password: Maktree@123
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Assign Areas</Label>
                  <div className="max-h-56 overflow-y-auto space-y-2 rounded-md border p-2">
                    {allSubAreas.map(sa => (
                      <label key={sa.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={newMrSubAreas.has(sa.id)}
                          onChange={e => {
                            setNewMrSubAreas(prev => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(sa.id);
                              else next.delete(sa.id);
                              return next;
                            });
                          }}
                        />
                        <span>{sa.areaName} - {sa.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button
                  type="button"
                  disabled={createUser.isPending}
                  className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  onClick={() => {
                    if (!newMrName.trim() || !newMrEmail.trim() || !managerId) {
                      toast.error('Name and email are required');
                      return;
                    }
                    const autoCode = employeeCodeFromEmail(newMrEmail);
                    void createUser
                      .mutateAsync({
                        fullName: newMrName.trim(),
                        employeeCode: autoCode,
                        email: newMrEmail.trim(),
                        role: 'mr',
                        managerIds: [managerId],
                        subAreaIds: [...newMrSubAreas],
                      })
                      .then(() => {
                        toast.success('MR created. Default password: Maktree@123');
                        closeDrawer();
                      })
                      .catch(e => toast.error(e instanceof Error ? e.message : 'Could not create MR'));
                  }}
                >
                  {createUser.isPending ? 'Creating…' : 'Create MR'}
                </Button>
              </>
            )}

            {action === 'delete-mr' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">MR to delete</Label>
                  <select value={deleteMrId} onChange={e => setDeleteMrId(e.target.value)} className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target">
                    <option value="">Choose MR</option>
                    {mrs.map(m => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Transfer areas to (optional)</Label>
                  <select value={transferToMrId} onChange={e => setTransferToMrId(e.target.value)} className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target">
                    <option value="">No transfer</option>
                    {mrs.filter(m => m.id !== deleteMrId).map(m => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  disabled={deleteMr.isPending}
                  variant="destructive"
                  className="w-full touch-target rounded-lg font-semibold"
                  onClick={() => {
                    if (!deleteMrId) {
                      toast.error('Select MR to delete');
                      return;
                    }
                    setShowDeleteConfirm(true);
                  }}
                >
                  {deleteMr.isPending ? 'Deleting…' : 'Delete MR'}
                </Button>
              </>
            )}

            {action === 'set-ptr' && (
              <>
                <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-foreground leading-relaxed">
                  <p className="font-semibold text-foreground mb-1">Brand rates</p>
                  <p className="text-muted-foreground">
                    Enter the rupee rate per unit for each company brand. These values are used internally when MRs
                    record monthly support on submitted DCRs so totals stay consistent. Keep them up to date.
                  </p>
                </div>
                <div className="space-y-3">
                  {allProducts.map(p => (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                      <span className="flex-1 text-sm font-medium truncate">{p.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Rs</span>
                        <Input
                          type="number"
                          min={0}
                          defaultValue={p.ptr || ''}
                          onBlur={e => {
                            const val = parseFloat(e.target.value) || 0;
                            if (val !== (p.ptr ?? 0)) {
                              updatePtr.mutate(
                                { productId: p.id, ptr: val },
                                {
                                  onSuccess: () => toast.success(`Rate updated for ${p.name}`),
                                  onError: () => toast.error('Failed to update rate'),
                                },
                              );
                            }
                          }}
                          placeholder="0"
                          className="w-24 rounded-lg text-sm h-9"
                        />
                      </div>
                    </div>
                  ))}
                  {allProducts.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No products found</p>
                  )}
                </div>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete this MR?"
        description={
          transferToMrId
            ? `This MR has ${deleteMrSubAreas.length} assigned areas. They will be transferred before deletion.`
            : `This MR has ${deleteMrSubAreas.length} assigned areas. They will be removed on deletion.`
        }
        onConfirm={() => {
          void deleteMr
            .mutateAsync({ mrId: deleteMrId, transferToMrId: transferToMrId || undefined })
            .then(() => {
              toast.success('MR deleted successfully');
              setShowDeleteConfirm(false);
              closeDrawer();
            })
            .catch(e => toast.error(e instanceof Error ? e.message : 'Could not delete MR'));
        }}
        confirmLabel={deleteMr.isPending ? 'Deleting…' : 'Delete MR'}
        destructive
        confirmDisabled={deleteMr.isPending}
      />
    </>
  );
}
