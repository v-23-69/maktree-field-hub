import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import VirtualizedScrollList from '@/components/shared/VirtualizedScrollList';
import {
  useAddDoctor,
  useUpdateDoctor,
  useDeactivateDoctor,
  type DoctorWithArea,
} from '@/hooks/useAdminDoctors';
import {
  useAdminDoctorsPaginated,
  ADMIN_DOCTORS_PAGE_SIZE,
} from '@/hooks/useAdminDoctorsPaginated';
import { useAllAreas } from '@/hooks/useAreas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, ToggleRight, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDoctorLabel } from '@/lib/displayLabels';
import { toast } from 'sonner';

export default function AdminDoctors() {
  const [areaFilter, setAreaFilter] = useState('');
  const [subAreaFilter, setSubAreaFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<DoctorWithArea | null>(null);
  const [newDocArea, setNewDocArea] = useState('');
  const [newSubAreaId, setNewSubAreaId] = useState('');
  const [newName, setNewName] = useState('');
  const [newSpec, setNewSpec] = useState('');
  const [editName, setEditName] = useState('');
  const [editSpec, setEditSpec] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [areaFilter, subAreaFilter, searchDebounced]);

  const { data: allAreas = [] } = useAllAreas();
  const subAreaIdsForArea = useMemo(
    () =>
      areaFilter
        ? allAreas.flatMap(a => a.sub_areas).filter(sa => sa.area_id === areaFilter).map(sa => sa.id)
        : [],
    [allAreas, areaFilter],
  );

  const filteredSubAreas = useMemo(
    () => allAreas.flatMap(a => a.sub_areas).filter(sa => !areaFilter || sa.area_id === areaFilter),
    [allAreas, areaFilter],
  );

  const { data: pageResult, isLoading, isError, refetch, isFetching } = useAdminDoctorsPaginated({
    areaId: areaFilter,
    subAreaId: subAreaFilter,
    search: searchDebounced,
    page,
    subAreaIdsForArea,
  });

  const doctors = pageResult?.rows ?? [];
  const totalCount = pageResult?.totalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / ADMIN_DOCTORS_PAGE_SIZE));
  const rangeStart = totalCount === 0 ? 0 : page * ADMIN_DOCTORS_PAGE_SIZE + 1;
  const rangeEnd = Math.min(totalCount, (page + 1) * ADMIN_DOCTORS_PAGE_SIZE);

  const addDoctor = useAddDoctor();
  const updateDoctor = useUpdateDoctor();
  const deactivateDoctor = useDeactivateDoctor();

  const openAdd = () => {
    setNewDocArea('');
    setNewSubAreaId('');
    setNewName('');
    setNewSpec('');
    setDialogOpen(true);
  };

  const openEdit = (doc: DoctorWithArea) => {
    setEditDoc(doc);
    setEditName(doc.full_name);
    setEditSpec(doc.speciality ?? '');
  };

  const handleAdd = async () => {
    if (!newSubAreaId || !newName.trim()) {
      toast.error('Select area and enter doctor name');
      return;
    }
    try {
      await addDoctor.mutateAsync({
        sub_area_id: newSubAreaId,
        full_name: newName,
        speciality: newSpec,
      });
      toast.success('Doctor added successfully');
      setDialogOpen(false);
      void refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add doctor');
    }
  };

  const handleEditSave = async () => {
    if (!editDoc || !editName.trim()) return;
    try {
      await updateDoctor.mutateAsync({
        id: editDoc.id,
        full_name: editName,
        speciality: editSpec,
      });
      toast.success('Doctor updated');
      setEditDoc(null);
      void refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const handleDeactivate = async (doc: DoctorWithArea) => {
    try {
      await deactivateDoctor.mutateAsync(doc.id);
      toast.success('Doctor deactivated');
      void refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not deactivate');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex gap-2">
          <select
            value={areaFilter}
            onChange={e => { setAreaFilter(e.target.value); setSubAreaFilter(''); }}
            className="flex-1 h-10 rounded-lg border border-input bg-card px-3 text-sm"
          >
            <option value="">All Territories</option>
            {allAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select
            value={subAreaFilter}
            onChange={e => setSubAreaFilter(e.target.value)}
            className="flex-1 h-10 rounded-lg border border-input bg-card px-3 text-sm"
          >
            <option value="">All Areas</option>
            {filteredSubAreas.map(sa => <option key={sa.id} value={sa.id}>{sa.name}</option>)}
          </select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, speciality, code…"
            className="pl-9 h-10 rounded-lg"
          />
        </div>

        <div className="flex justify-between items-center gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground tabular-nums">
            {totalCount === 0
              ? 'No doctors'
              : `Showing ${rangeStart}–${rangeEnd} of ${totalCount}`}
            {isFetching && !isLoading ? ' · Updating…' : ''}
          </p>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-lg"
              disabled={page <= 0 || isLoading}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-lg"
              disabled={page >= pageCount - 1 || isLoading}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm" className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90" type="button" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> Add Doctor
          </Button>
        </div>

        {isLoading && <LoadingSpinner />}
        {isError && <EmptyState message="Could not load doctors." />}
        {!isLoading && !isError && doctors.length === 0 && (
          <EmptyState
            message={
              areaFilter || subAreaFilter || searchDebounced
                ? 'No doctors match filters'
                : 'No doctors found. Add a doctor to get started.'
            }
          />
        )}
        {!isLoading && !isError && doctors.length > 0 && (
          <VirtualizedScrollList
            items={doctors}
            getKey={doc => doc.id}
            estimateSize={76}
            renderItem={(doc, i) => {
              const saName = doc.sub_area?.name ?? '';
              const arName = doc.sub_area?.area?.name ?? '';
              return (
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-xl p-4 shadow-sm',
                    i % 2 === 0 ? 'bg-card' : 'bg-card/80',
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">
                      {formatDoctorLabel(doc.full_name, doc.speciality)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {arName && saName ? `${arName} / ${saName}` : arName || saName || '—'}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button type="button" size="icon" variant="ghost" className="h-9 w-9" onClick={() => openEdit(doc)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-destructive" onClick={() => void handleDeactivate(doc)}>
                      <ToggleRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            }}
          />
        )}

        {/* dialogs unchanged below */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle>Add Doctor</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Territory</Label>
                <select
                  value={newDocArea}
                  onChange={e => { setNewDocArea(e.target.value); setNewSubAreaId(''); }}
                  className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select territory</option>
                  {allAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Area</Label>
                <select
                  value={newSubAreaId}
                  onChange={e => setNewSubAreaId(e.target.value)}
                  className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                  disabled={!newDocArea}
                >
                  <option value="">Select area</option>
                  {allAreas
                    .find(a => a.id === newDocArea)
                    ?.sub_areas.map(sa => (
                      <option key={sa.id} value={sa.id}>{sa.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <Label>Doctor name</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} className="mt-1 rounded-lg" />
              </div>
              <div>
                <Label>Speciality</Label>
                <Input value={newSpec} onChange={e => setNewSpec(e.target.value)} className="mt-1 rounded-lg" />
              </div>
              <Button type="button" className="w-full rounded-xl" onClick={() => void handleAdd()} disabled={addDoctor.isPending}>
                {addDoctor.isPending ? 'Saving…' : 'Add Doctor'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editDoc} onOpenChange={open => !open && setEditDoc(null)}>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Doctor</DialogTitle>
            </DialogHeader>
            {editDoc && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{editDoc.doctor_code}</p>
                <div>
                  <Label>Name</Label>
                  <Input value={editName} onChange={e => setEditName(e.target.value)} className="mt-1 rounded-lg" />
                </div>
                <div>
                  <Label>Speciality</Label>
                  <Input value={editSpec} onChange={e => setEditSpec(e.target.value)} className="mt-1 rounded-lg" />
                </div>
                <Button type="button" className="w-full rounded-xl" onClick={() => void handleEditSave()} disabled={updateDoctor.isPending}>
                  {updateDoctor.isPending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
