import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
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

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="MR Area Assignment" />

      <div className="px-4 py-4 space-y-4">
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
          <div className="space-y-4 animate-fade-in-up">
            {MOCK_AREAS.map(area => {
              const subAreas = MOCK_SUB_AREAS.filter(sa => sa.area_id === area.id);
              return (
                <div key={area.id} className="rounded-xl bg-card p-4 shadow-sm">
                  <p className="font-medium text-foreground text-sm mb-3">{area.name}</p>
                  <div className="space-y-2.5">
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

      <BottomNav role="admin" />
    </div>
  );
}
