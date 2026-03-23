import { useState, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  useAdminDoctorsList,
  useAddDoctor,
  useUpdateDoctor,
  useDeactivateDoctor,
  type DoctorWithArea,
} from '@/hooks/useAdminDoctors';
import { useAllAreas } from '@/hooks/useAreas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminDoctors() {
  const [areaFilter, setAreaFilter] = useState('');
  const [subAreaFilter, setSubAreaFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<DoctorWithArea | null>(null);
  const [newDocArea, setNewDocArea] = useState('');
  const [newSubAreaId, setNewSubAreaId] = useState('');
  const [newName, setNewName] = useState('');
  const [newSpec, setNewSpec] = useState('');
  const [editName, setEditName] = useState('');
  const [editSpec, setEditSpec] = useState('');

  const { data: allAreas = [] } = useAllAreas();
  const { data: doctors = [], isLoading, isError, refetch } = useAdminDoctorsList();
  const addDoctor = useAddDoctor();
  const updateDoctor = useUpdateDoctor();
  const deactivateDoctor = useDeactivateDoctor();

  const filteredSubAreas = useMemo(
    () => allAreas.flatMap(a => a.sub_areas).filter(sa => !areaFilter || sa.area_id === areaFilter),
    [allAreas, areaFilter],
  );

  const filteredDoctors = useMemo(() => {
    return doctors.filter(d => {
      if (subAreaFilter) return d.sub_area_id === subAreaFilter;
      if (areaFilter) return filteredSubAreas.some(sa => sa.id === d.sub_area_id);
      return true;
    });
  }, [doctors, subAreaFilter, areaFilter, filteredSubAreas]);

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
      toast.error('Select sub-area and enter doctor name');
      return;
    }
    try {
      await addDoctor.mutateAsync({
        sub_area_id: newSubAreaId,
        full_name: newName,
        speciality: newSpec,
      });
      toast.success('Doctor added successfully ✓');
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
            <option value="">All Areas</option>
            {allAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select
            value={subAreaFilter}
            onChange={e => setSubAreaFilter(e.target.value)}
            className="flex-1 h-10 rounded-lg border border-input bg-card px-3 text-sm"
          >
            <option value="">All Sub-areas</option>
            {filteredSubAreas.map(sa => <option key={sa.id} value={sa.id}>{sa.name}</option>)}
          </select>
        </div>

        <div className="flex justify-end">
          <Button size="sm" className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90" type="button" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> Add Doctor
          </Button>
        </div>

        {isLoading && <LoadingSpinner />}
        {isError && <EmptyState message="Could not load doctors." />}
        {!isLoading && !isError && filteredDoctors.length === 0 && (
          <EmptyState
            message={
              areaFilter || subAreaFilter
                ? 'No doctors found'
                : 'No doctors found. Add a doctor to get started.'
            }
          />
        )}
        {!isLoading && !isError && filteredDoctors.length > 0 && (
          <div className="space-y-2 overflow-x-auto min-w-0">
            {filteredDoctors.map((doc, i) => {
              const saName = doc.sub_area?.name ?? '';
              const arName = doc.sub_area?.area?.name ?? '';
              return (
                <div
                  key={doc.id}
                  className={cn(
                    'flex items-center gap-3 rounded-xl p-4 shadow-sm animate-fade-in',
                    i % 2 === 0 ? 'bg-card' : 'bg-card/80'
                  )}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{doc.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.doctor_code} · {doc.speciality}
                      {arName && ` · ${arName}`}{saName && ` / ${saName}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button type="button" className="p-1.5 text-muted-foreground" onClick={() => openEdit(doc)}>
                      <Edit className="h-4 w-4" />
                    </button>
                    <button type="button" className="p-1.5 text-primary" onClick={() => void handleDeactivate(doc)}>
                      <ToggleRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[360px] rounded-xl backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Add Doctor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Doctor Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Dr. Full Name" className="rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Speciality</Label>
              <Input value={newSpec} onChange={e => setNewSpec(e.target.value)} placeholder="General Physician" className="rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Area</Label>
              <select
                value={newDocArea}
                onChange={e => { setNewDocArea(e.target.value); setNewSubAreaId(''); }}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Select area</option>
                {allAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sub-area</Label>
              <select
                value={newSubAreaId}
                onChange={e => setNewSubAreaId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Select sub-area</option>
                {allAreas.find(a => a.id === newDocArea)?.sub_areas.map(sa => (
                  <option key={sa.id} value={sa.id}>{sa.name}</option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              disabled={addDoctor.isPending}
              onClick={() => void handleAdd()}
              className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {addDoctor.isPending ? 'Adding…' : 'Add Doctor'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editDoc} onOpenChange={open => { if (!open) setEditDoc(null); }}>
        <DialogContent className="max-w-[360px] rounded-xl">
          <DialogHeader>
            <DialogTitle>Edit Doctor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Doctor Name</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Speciality</Label>
              <Input value={editSpec} onChange={e => setEditSpec(e.target.value)} className="rounded-lg" />
            </div>
            <Button type="button" className="w-full" disabled={updateDoctor.isPending} onClick={() => void handleEditSave()}>
              {updateDoctor.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
