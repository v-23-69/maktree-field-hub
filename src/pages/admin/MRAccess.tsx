import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { MOCK_USERS, MOCK_AREAS, MOCK_SUB_AREAS } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AdminMRAccess() {
  const [selectedMr, setSelectedMr] = useState('');
  const [checkedSubAreas, setCheckedSubAreas] = useState<string[]>([]);

  const mrs = MOCK_USERS.filter(u => u.role === 'mr' && u.is_active);

  const toggleSubArea = (id: string) => {
    setCheckedSubAreas(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleArea = (areaId: string) => {
    const subAreas = MOCK_SUB_AREAS.filter(sa => sa.area_id === areaId);
    const allChecked = subAreas.every(sa => checkedSubAreas.includes(sa.id));
    if (allChecked) {
      setCheckedSubAreas(prev => prev.filter(id => !subAreas.some(sa => sa.id === id)));
    } else {
      const newIds = subAreas.map(sa => sa.id).filter(id => !checkedSubAreas.includes(id));
      setCheckedSubAreas(prev => [...prev, ...newIds]);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Select MR</Label>
          <select
            value={selectedMr}
            onChange={e => { setSelectedMr(e.target.value); setCheckedSubAreas([]); }}
            className="flex h-11 w-full rounded-lg border border-input bg-card px-3 text-sm touch-target"
          >
            <option value="">Choose MR</option>
            {mrs.map(m => <option key={m.id} value={m.id}>{m.full_name} ({m.employee_code})</option>)}
          </select>
        </div>

        {selectedMr && (
          <div className="space-y-4 animate-fade-in">
            {/* Selected count */}
            <p className="text-xs font-medium text-primary">
              {checkedSubAreas.length} of {MOCK_SUB_AREAS.length} sub-areas selected
            </p>

            {MOCK_AREAS.map(area => {
              const subAreas = MOCK_SUB_AREAS.filter(sa => sa.area_id === area.id);
              const checkedCount = subAreas.filter(sa => checkedSubAreas.includes(sa.id)).length;
              const allChecked = subAreas.length > 0 && checkedCount === subAreas.length;
              const someChecked = checkedCount > 0 && !allChecked;

              return (
                <div key={area.id} className="rounded-xl bg-card p-4 shadow-sm">
                  {/* Area header with select all */}
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={allChecked}
                        // Use indeterminate-like visual when partial
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
              onClick={() => toast.success('Access updated successfully')}
              className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              Save Assignment
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
