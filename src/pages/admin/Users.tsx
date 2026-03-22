import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { MOCK_USERS, MOCK_AREAS, MOCK_SUB_AREAS } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ROLE_FILTERS = ['All', 'MR', 'Manager', 'Admin'] as const;

export default function AdminUsers() {
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter');
  const [filter, setFilter] = useState<typeof ROLE_FILTERS[number]>(
    initialFilter === 'mr' ? 'MR' : initialFilter === 'manager' ? 'Manager' : 'All'
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState('mr');

  const managers = MOCK_USERS.filter(u => u.role === 'manager' && u.is_active);

  const filtered = MOCK_USERS.filter(u => {
    if (filter === 'All') return true;
    return u.role === filter.toLowerCase();
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {ROLE_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium border whitespace-nowrap active:scale-95 transition-all',
                  filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border'
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[360px] rounded-xl backdrop-blur-sm">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2 max-h-[70vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <Label className="text-xs">Full Name</Label>
                  <Input placeholder="Enter full name" className="rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Employee Code</Label>
                  <Input placeholder="MKT-MR-004" className="rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Role</Label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="mr">MR</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email (Optional)</Label>
                  <Input type="email" placeholder="email@example.com" className="rounded-lg" />
                </div>

                {/* MR-specific: Assign Managers */}
                {newRole === 'mr' && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assign Managers</Label>
                    <div className="space-y-2">
                      {managers.map(m => (
                        <label key={m.id} className="flex items-center gap-3 cursor-pointer">
                          <Checkbox />
                          <span className="text-sm text-foreground">{m.full_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* MR-specific: Assign Sub-areas */}
                {newRole === 'mr' && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assign Sub-areas</Label>
                    {MOCK_AREAS.map(area => {
                      const subAreas = MOCK_SUB_AREAS.filter(sa => sa.area_id === area.id);
                      return (
                        <div key={area.id}>
                          <p className="text-xs font-medium text-foreground mb-1.5">{area.name}</p>
                          <div className="space-y-1.5 pl-1">
                            {subAreas.map(sa => (
                              <label key={sa.id} className="flex items-center gap-3 cursor-pointer">
                                <Checkbox />
                                <span className="text-xs text-foreground">{sa.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <Button
                  onClick={() => { setDialogOpen(false); toast.success('User created'); }}
                  className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {filtered.map((user, i) => (
            <div
              key={user.id}
              className={cn(
                'flex items-center gap-3 rounded-xl p-4 shadow-sm animate-fade-in',
                i % 2 === 0 ? 'bg-card' : 'bg-card/80'
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <span className="text-sm font-bold text-primary">{user.full_name.split(' ').map(n => n[0]).join('')}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{user.full_name}</p>
                <p className="text-xs text-muted-foreground">{user.employee_code} · <span className="capitalize">{user.role}</span></p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button className="p-1.5 text-muted-foreground hover:text-foreground">
                  <Edit className="h-4 w-4" />
                </button>
                <button className={cn('p-1.5', user.is_active ? 'text-primary' : 'text-muted-foreground')}>
                  {user.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
