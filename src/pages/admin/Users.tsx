import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import {
  useAdminUsersList,
  useCreateUser,
  useToggleUserActive,
  useMrAssignments,
  useSaveMrAssignments,
  type CreateUserPayload,
} from '@/hooks/useAdminUsers';
import { useAllAreas } from '@/hooks/useAreas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { User, UserRole } from '@/types/database.types';
import { useAuth } from '@/hooks/useAuth';
import { useBlockUser, useUnblockUser, useBlockComplaints, useResolveComplaint } from '@/hooks/useBlockSystem';
import { Textarea } from '@/components/ui/textarea';

const ROLE_FILTERS = ['All', 'MR', 'Manager', 'Admin'] as const;

export default function AdminUsers() {
  const { user: authUser } = useAuth();
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter');
  const [filter, setFilter] = useState<typeof ROLE_FILTERS[number]>(
    initialFilter === 'mr' ? 'MR' : initialFilter === 'manager' ? 'Manager' : 'All'
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('mr');
  const [fullName, setFullName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [email, setEmail] = useState('');
  const [selectedManagers, setSelectedManagers] = useState<Set<string>>(new Set());
  const [selectedSubAreas, setSelectedSubAreas] = useState<Set<string>>(new Set());
  const [editManagers, setEditManagers] = useState<Set<string>>(new Set());
  const [editSubAreas, setEditSubAreas] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'users' | 'complaints'>('users');
  const [blockReasonByUserId, setBlockReasonByUserId] = useState<Record<string, string>>({});
  const [complaintNotes, setComplaintNotes] = useState<Record<string, string>>({});

  const { data: allUsers = [], isLoading, isError, refetch } = useAdminUsersList();
  const { data: areasData = [] } = useAllAreas();
  const createUser = useCreateUser();
  const toggleActive = useToggleUserActive();
  const saveMrAssignments = useSaveMrAssignments();
  const { data: existingAssignments, isLoading: assignLoading } = useMrAssignments(editUser?.id ?? '');
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const { data: complaints = [] } = useBlockComplaints();
  const resolveComplaint = useResolveComplaint();

  const managers = useMemo(
    () => allUsers.filter(u => u.role === 'manager' && u.is_active),
    [allUsers],
  );

  const filtered = useMemo(() => {
    return allUsers.filter(u => {
      if (filter === 'All') return true;
      return u.role === filter.toLowerCase();
    });
  }, [allUsers, filter]);

  const resetCreateForm = () => {
    setFullName('');
    setEmployeeCode('');
    setEmail('');
    setNewRole('mr');
    setSelectedManagers(new Set());
    setSelectedSubAreas(new Set());
  };

  const openEditMr = (u: User) => {
    setEditUser(u);
    setEditManagers(new Set());
    setEditSubAreas(new Set());
  };

  useEffect(() => {
    if (!editUser || !existingAssignments) return;
    setEditManagers(new Set(existingAssignments.managerIds));
    setEditSubAreas(new Set(existingAssignments.subAreaIds));
  }, [editUser, existingAssignments]);

  const handleCreate = async () => {
    if (!fullName.trim() || !employeeCode.trim() || !email.trim()) {
      toast.error('Fill in name, employee code, and email');
      return;
    }
    const payload: CreateUserPayload = {
      fullName: fullName.trim(),
      employeeCode: employeeCode.trim(),
      email: email.trim(),
      role: newRole,
      managerIds: newRole === 'mr' ? [...selectedManagers] : [],
      subAreaIds: newRole === 'mr' ? [...selectedSubAreas] : [],
    };
    try {
      await createUser.mutateAsync(payload);
      toast.success('User created. Default password: Maktree@123');
      setDialogOpen(false);
      resetCreateForm();
      void refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create user');
    }
  };

  const handleToggle = async (u: User) => {
    try {
      await toggleActive.mutateAsync({ userId: u.id, isActive: u.is_active });
      toast.success(u.is_active ? 'User deactivated' : 'User activated');
      void refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const handleSaveEditMr = async () => {
    if (!editUser) return;
    try {
      await saveMrAssignments.mutateAsync({
        mrId: editUser.id,
        managerIds: [...editManagers],
        subAreaIds: [...editSubAreas],
      });
      toast.success('Assignments saved');
      setEditUser(null);
      void refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button variant={activeTab === 'users' ? 'default' : 'outline'} onClick={() => setActiveTab('users')} className="flex-1">Users</Button>
          <Button variant={activeTab === 'complaints' ? 'default' : 'outline'} onClick={() => setActiveTab('complaints')} className="flex-1">
            Complaints
          </Button>
        </div>

        {activeTab === 'users' && (
          <>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {ROLE_FILTERS.map(f => (
              <button
                key={f}
                type="button"
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

          <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetCreateForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[360px] rounded-xl backdrop-blur-sm max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Full Name</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter full name" className="rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Employee Code</Label>
                  <Input value={employeeCode} onChange={e => setEmployeeCode(e.target.value)} placeholder="MKT-MR-004" className="rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Role</Label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="mr">MR</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email (login)</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="rounded-lg" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  New users receive the default password <span className="font-medium text-foreground">Maktree@123</span> from the edge function.
                </p>

                {newRole === 'mr' && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assign Managers</Label>
                    <div className="space-y-2">
                      {managers.map(m => (
                        <label key={m.id} className="flex items-center gap-3 cursor-pointer">
                          <Checkbox
                            checked={selectedManagers.has(m.id)}
                            onCheckedChange={checked => {
                              setSelectedManagers(prev => {
                                const next = new Set(prev);
                                if (checked) next.add(m.id);
                                else next.delete(m.id);
                                return next;
                              });
                            }}
                          />
                          <span className="text-sm text-foreground">{m.full_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {newRole === 'mr' && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assign Sub-areas</Label>
                    {areasData.map(area => (
                      <div key={area.id}>
                        <p className="text-xs font-medium text-foreground mb-1.5">{area.name}</p>
                        <div className="space-y-1.5 pl-1">
                          {(area.sub_areas ?? []).map(sa => (
                            <label key={sa.id} className="flex items-center gap-3 cursor-pointer">
                              <Checkbox
                                checked={selectedSubAreas.has(sa.id)}
                                onCheckedChange={checked => {
                                  setSelectedSubAreas(prev => {
                                    const next = new Set(prev);
                                    if (checked) next.add(sa.id);
                                    else next.delete(sa.id);
                                    return next;
                                  });
                                }}
                              />
                              <span className="text-xs text-foreground">{sa.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  type="button"
                  disabled={createUser.isPending}
                  onClick={() => void handleCreate()}
                  className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  {createUser.isPending ? 'Creating…' : 'Create User'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading && <LoadingSpinner />}
        {isError && <EmptyState message="Could not load users." />}
        {!isLoading && !isError && allUsers.length === 0 && (
          <EmptyState message="No users yet." />
        )}
        {!isLoading && !isError && allUsers.length > 0 && filtered.length === 0 && (
          <EmptyState message="No users match this filter." />
        )}
        {!isLoading && !isError && filtered.length > 0 && (
          <div className="space-y-2 overflow-x-auto min-w-0">
            {filtered.map((u, i) => (
              <div
                key={u.id}
                className={cn(
                  'flex items-center gap-3 rounded-xl p-4 shadow-sm animate-fade-in',
                  i % 2 === 0 ? 'bg-card' : 'bg-card/80'
                )}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-sm font-bold text-primary">{u.full_name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{u.full_name}</p>
                  <p className="text-xs text-muted-foreground">{u.employee_code} · <span className="capitalize">{u.role}</span></p>
                  {u.role !== 'admin' && !u.is_blocked && (
                    <Input
                      className="mt-2 h-8 text-xs"
                      placeholder="Block reason"
                      value={blockReasonByUserId[u.id] ?? ''}
                      onChange={e => setBlockReasonByUserId(prev => ({ ...prev, [u.id]: e.target.value }))}
                    />
                  )}
                  {u.is_blocked && (
                    <p className="text-xs text-destructive mt-1">Blocked: {u.block_reason ?? 'No reason'}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {u.role === 'mr' && (
                    <button
                      type="button"
                      className="p-1.5 text-muted-foreground hover:text-foreground"
                      onClick={() => openEditMr(u)}
                      aria-label="Edit MR access"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    className={cn('p-1.5', u.is_active ? 'text-primary' : 'text-muted-foreground')}
                    onClick={() => void handleToggle(u)}
                    disabled={toggleActive.isPending}
                    aria-label={u.is_active ? 'Deactivate user' : 'Activate user'}
                  >
                    {u.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                  {u.role !== 'admin' && (
                    u.is_blocked ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void unblockUser
                            .mutateAsync({ userId: u.id, adminUserId: authUser?.id ?? '' })
                            .then(() => toast.success('User unblocked'))
                        }
                      >
                        Unblock
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          const reason = blockReasonByUserId[u.id]?.trim()
                          if (!reason) {
                            toast.error('Enter block reason first')
                            return
                          }
                          void blockUser
                            .mutateAsync({ userId: u.id, reason, adminUserId: authUser?.id ?? '' })
                            .then(() => toast.success('User blocked'))
                        }}
                      >
                        Block
                      </Button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </>
      )}

      {activeTab === 'complaints' && (
        <div className="space-y-3">
          {complaints.map(c => (
            <div key={c.id} className="rounded-xl border p-3 space-y-2">
              <p className="text-xs uppercase text-muted-foreground">{c.status}</p>
              <p className="text-sm">{c.complaint}</p>
              <Textarea
                value={complaintNotes[c.id] ?? c.admin_note ?? ''}
                onChange={e => setComplaintNotes(prev => ({ ...prev, [c.id]: e.target.value }))}
                placeholder="Admin note"
              />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() =>
                    void resolveComplaint
                      .mutateAsync({
                        complaintId: c.id,
                        status: 'approved',
                        adminNote: complaintNotes[c.id] ?? c.admin_note,
                        resolvedBy: authUser?.id ?? '',
                        userId: c.user_id,
                      })
                      .then(() => toast.success('Complaint approved'))
                  }
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    void resolveComplaint
                      .mutateAsync({
                        complaintId: c.id,
                        status: 'rejected',
                        adminNote: complaintNotes[c.id] ?? c.admin_note,
                        resolvedBy: authUser?.id ?? '',
                        userId: c.user_id,
                      })
                      .then(() => toast.success('Complaint rejected'))
                  }
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      <Dialog open={!!editUser} onOpenChange={open => { if (!open) setEditUser(null); }}>
        <DialogContent className="max-w-[360px] rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit MR: {editUser?.full_name}</DialogTitle>
          </DialogHeader>
          {assignLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Managers</Label>
                {managers.map(m => (
                  <label key={m.id} className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={editManagers.has(m.id)}
                      onCheckedChange={checked => {
                        setEditManagers(prev => {
                          const next = new Set(prev);
                          if (checked) next.add(m.id);
                          else next.delete(m.id);
                          return next;
                        });
                      }}
                    />
                    <span className="text-sm">{m.full_name}</span>
                  </label>
                ))}
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Sub-areas</Label>
                {areasData.map(area => (
                  <div key={area.id}>
                    <p className="text-xs font-medium mb-1">{area.name}</p>
                    {(area.sub_areas ?? []).map(sa => (
                      <label key={sa.id} className="flex items-center gap-3 cursor-pointer pl-1 py-0.5">
                        <Checkbox
                          checked={editSubAreas.has(sa.id)}
                          onCheckedChange={checked => {
                            setEditSubAreas(prev => {
                              const next = new Set(prev);
                              if (checked) next.add(sa.id);
                              else next.delete(sa.id);
                              return next;
                            });
                          }}
                        />
                        <span className="text-xs">{sa.name}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                className="w-full"
                disabled={saveMrAssignments.isPending}
                onClick={() => void handleSaveEditMr()}
              >
                {saveMrAssignments.isPending ? 'Saving…' : 'Save assignments'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
