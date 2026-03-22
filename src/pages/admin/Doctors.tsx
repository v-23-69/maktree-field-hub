import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import EmptyState from '@/components/shared/EmptyState';
import { MOCK_DOCTORS, MOCK_AREAS, MOCK_SUB_AREAS } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminDoctors() {
  const [areaFilter, setAreaFilter] = useState('');
  const [subAreaFilter, setSubAreaFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDocArea, setNewDocArea] = useState('');

  const filteredSubAreas = MOCK_SUB_AREAS.filter(sa => !areaFilter || sa.area_id === areaFilter);
  const filteredDoctors = MOCK_DOCTORS.filter(d => {
    if (subAreaFilter) return d.sub_area_id === subAreaFilter;
    if (areaFilter) return filteredSubAreas.some(sa => sa.id === d.sub_area_id);
    return true;
  });

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
            {MOCK_AREAS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-1" /> Add Doctor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[360px] rounded-xl backdrop-blur-sm">
              <DialogHeader>
                <DialogTitle>Add Doctor</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Doctor Name</Label>
                  <Input placeholder="Dr. Full Name" className="rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Speciality</Label>
                  <Input placeholder="General Physician" className="rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Area</Label>
                  <select
                    value={newDocArea}
                    onChange={e => setNewDocArea(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select area</option>
                    {MOCK_AREAS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Sub-area</Label>
                  <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
                    <option value="">Select sub-area</option>
                    {MOCK_SUB_AREAS.filter(sa => sa.area_id === newDocArea).map(sa => (
                      <option key={sa.id} value={sa.id}>{sa.name}</option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={() => { setDialogOpen(false); toast.success('Doctor added'); }}
                  className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  Add Doctor
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {filteredDoctors.length === 0 ? (
          <EmptyState message="No doctors found. Add a doctor to get started." />
        ) : (
          <div className="space-y-2">
            {filteredDoctors.map((doc, i) => (
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
                  <p className="text-xs text-muted-foreground">{doc.doctor_code} · {doc.speciality}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button className="p-1.5 text-muted-foreground"><Edit className="h-4 w-4" /></button>
                  <button className="p-1.5 text-primary"><ToggleRight className="h-5 w-5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
