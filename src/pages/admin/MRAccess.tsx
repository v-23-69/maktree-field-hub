import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useAllAreas } from '@/hooks/useAreas';
import { useAdminMrsList, useMrSubAreaAccess, useSaveMrSubAreaAccess } from '@/hooks/useAdminMrAccess';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AdminMRAccess() {
  const [selectedMr, setSelectedMr] = useState('');
  const [checkedSubAreas, setCheckedSubAreas] = useState<string[]>([]);

  const { data: mrs = [], isLoading: mrsLoading } = useAdminMrsList();
  const { data: areas = [], isLoading: areasLoading } = useAllAreas();
  const { data: serverAccess = [], isLoading: accessLoading } = useMrSubAreaAccess(selectedMr);
  const saveAccess = useSaveMrSubAreaAccess();

  const allSubAreaIds = useMemo(
    () => areas.flatMap(a => a.sub_areas ?? []).map(sa => sa.id),
    [areas],
  );

  useEffect(() => {
    if (!selectedMr) {
      setCheckedSubAreas([]);
      return;
    }
    setCheckedSubAreas([...serverAccess]);
  }, [selectedMr, serverAccess]);

  const toggleSubArea = (id: string) => {
    setCheckedSubAreas(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    );
  };

  const toggleArea = (areaId: string) => {
    const subAreas = (areas.find(a => a.id === areaId)?.sub_areas ?? []);
    const allChecked = subAreas.length > 0 && subAreas.every(sa => checkedSubAreas.includes(sa.id));
    if (allChecked) {
      setCheckedSubAreas(prev => prev.filter(id => !subAreas.some(sa => sa.id === id)));
    } else {
      const toAdd = subAreas.map(sa => sa.id).filter(id => !checkedSubAreas.includes(id));
      setCheckedSubAreas(prev => [...prev, ...toAdd]);
    }
  };

  const handleSave = async () => {
    if (!selectedMr) return;
    try {
      await saveAccess.mutateAsync({ mrId: selectedMr, subAreaIds: checkedSubAreas });
      toast.success('MR area access saved ✓');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const loading = mrsLoading || areasLoading || (selectedMr !== '' && accessLoading);

  return (
    <AdminLayout>
      <div className="space-y-4 min-w-0">
        {mrsLoading && <LoadingSpinner />}
        <div className="space-y-2">
          <Label className="text-xs">Select MR</Label>
          <select
            value={selectedMr}
            onChange={e => setSelectedMr(e.target.value)}
            className="flex h-11 w-full rounded-lg border border-input bg-card px-3 text-sm touch-target"
          >
            <option value="">Choose MR</option>
            {mrs.map(m => (
              <option key={m.id} value={m.id}>{m.full_name} ({m.employee_code})</option>
            ))}
          </select>
        </div>

        {loading && selectedMr && <LoadingSpinner />}

        {selectedMr && !loading && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs font-medium text-primary">
              {checkedSubAreas.length} of {allSubAreaIds.length} sub-areas selected
            </p>

            {areas.map(area => {
              const subAreas = area.sub_areas ?? [];
              const checkedCount = subAreas.filter(sa => checkedSubAreas.includes(sa.id)).length;
              const allChecked = subAreas.length > 0 && checkedCount === subAreas.length;
              const someChecked = checkedCount > 0 && !allChecked;

              return (
                <div key={area.id} className="rounded-xl bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={allChecked}
                        className={someChecked ? 'data-[state=unchecked]:bg-primary/30 data-[state=unchecked]:border-primary' : ''}
                        onCheckedChange={() => toggleArea(area.id)}
                      />
                      <span className="font-medium text-foreground text-sm">{area.name}</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground">{checkedCount} of {subAreas.length}</span>
                  </div>

                  <div className="space-y-2.5 pl-1">
                    {subAreas.map(sa => (
                      <label key={sa.id} className="flex items-center gap-3 touch-target cursor-pointer">
                        <Checkbox
                          checked={checkedSubAreas.includes(sa.id)}
                          onCheckedChange={() => toggleSubArea(sa.id)}
                        />
                        <span className="text-sm text-foreground">{sa.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}

            <Button
              type="button"
              disabled={saveAccess.isPending}
              onClick={() => void handleSave()}
              className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {saveAccess.isPending ? 'Saving…' : 'Save Assignment'}
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
