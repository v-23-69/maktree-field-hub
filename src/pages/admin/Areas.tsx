import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { useAllAreas } from '@/hooks/useAreas';
import { useAddArea, useAddSubArea } from '@/hooks/useAdminAreasMutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAreas() {
  const [areaDialogOpen, setAreaDialogOpen] = useState(false);
  const [subAreaDialogOpen, setSubAreaDialogOpen] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [newSubAreaName, setNewSubAreaName] = useState('');

  const { data: areas = [], isLoading, isError, refetch } = useAllAreas();
  const addArea = useAddArea();
  const addSubArea = useAddSubArea();

  const handleAddArea = async () => {
    try {
      await addArea.mutateAsync(newAreaName);
      toast.success('Area added successfully ✓');
      setNewAreaName('');
      setAreaDialogOpen(false);
      void refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add area');
    }
  };

  const handleAddSubArea = async () => {
    if (!selectedAreaId) return;
    try {
      await addSubArea.mutateAsync({ areaId: selectedAreaId, name: newSubAreaName });
      toast.success('Sub-area added successfully ✓');
      setNewSubAreaName('');
      setSubAreaDialogOpen(false);
      void refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add sub-area');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Dialog open={areaDialogOpen} onOpenChange={setAreaDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-1" /> Add Area
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[340px] rounded-xl backdrop-blur-sm">
              <DialogHeader><DialogTitle>Add Area</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Area Name</Label>
                  <Input value={newAreaName} onChange={e => setNewAreaName(e.target.value)} placeholder="Enter area name" className="rounded-lg" />
                </div>
                <Button
                  type="button"
                  disabled={addArea.isPending}
                  onClick={() => void handleAddArea()}
                  className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  {addArea.isPending ? 'Adding…' : 'Add Area'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading && <LoadingSpinner />}
        {isError && <EmptyState message="Could not load areas." />}
        {!isLoading && !isError && areas.length === 0 && (
          <EmptyState message="No areas yet. Add an area to get started." />
        )}
        {!isLoading && !isError && areas.length > 0 && (
          <div className="space-y-3 overflow-x-auto min-w-0">
            {areas.map((area, i) => {
              const subAreas = area.sub_areas ?? [];
              return (
                <div
                  key={area.id}
                  className="rounded-xl bg-card shadow-sm overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-foreground text-sm">{area.name}</p>
                      <p className="text-xs text-muted-foreground">{subAreas.length} sub-areas</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button type="button" className="p-1.5 text-muted-foreground" aria-label="Edit area (coming soon)">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 text-primary"
                        onClick={() => {
                          setSelectedAreaId(area.id);
                          setNewSubAreaName('');
                          setSubAreaDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {subAreas.length > 0 && (
                    <div className="border-t border-border px-4 py-2 space-y-1">
                      {subAreas.map((sa, j) => (
                        <div key={sa.id} className={`flex items-center justify-between py-1.5 ${j % 2 === 1 ? 'bg-muted/30 -mx-4 px-4 rounded' : ''}`}>
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm text-foreground">{sa.name}</span>
                          </div>
                          <button type="button" className="p-1 text-muted-foreground" aria-label="Edit sub-area (coming soon)">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={subAreaDialogOpen} onOpenChange={setSubAreaDialogOpen}>
        <DialogContent className="max-w-[340px] rounded-xl backdrop-blur-sm">
          <DialogHeader><DialogTitle>Add Sub-area</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Sub-area Name</Label>
              <Input value={newSubAreaName} onChange={e => setNewSubAreaName(e.target.value)} placeholder="Enter sub-area name" className="rounded-lg" />
            </div>
            <Button
              type="button"
              disabled={addSubArea.isPending}
              onClick={() => void handleAddSubArea()}
              className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {addSubArea.isPending ? 'Adding…' : 'Add Sub-area'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
