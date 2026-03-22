import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { MOCK_AREAS, MOCK_SUB_AREAS } from '@/lib/mock-data';
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
                  <Input placeholder="Enter area name" className="rounded-lg" />
                </div>
                <Button
                  onClick={() => { setAreaDialogOpen(false); toast.success('Area added'); }}
                  className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  Add Area
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {MOCK_AREAS.map((area, i) => {
            const subAreas = MOCK_SUB_AREAS.filter(sa => sa.area_id === area.id);
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
                    <button className="p-1.5 text-muted-foreground"><Edit className="h-4 w-4" /></button>
                    <button
                      className="p-1.5 text-primary"
                      onClick={() => { setSelectedAreaId(area.id); setSubAreaDialogOpen(true); }}
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
                        <button className="p-1 text-muted-foreground"><Edit className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={subAreaDialogOpen} onOpenChange={setSubAreaDialogOpen}>
        <DialogContent className="max-w-[340px] rounded-xl backdrop-blur-sm">
          <DialogHeader><DialogTitle>Add Sub-area</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Sub-area Name</Label>
              <Input placeholder="Enter sub-area name" className="rounded-lg" />
            </div>
            <Button
              onClick={() => { setSubAreaDialogOpen(false); toast.success('Sub-area added'); }}
              className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              Add Sub-area
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
