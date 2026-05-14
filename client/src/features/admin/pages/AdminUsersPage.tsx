import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Delete02Icon,
  Edit02Icon,
  LockPasswordIcon,
  Mail01Icon,
  UserIcon,
  Search01Icon,
  UserAdd01Icon,
  UserGroupIcon,
  Building05Icon,
  CallIcon,
  ViewIcon,
  ViewOffIcon,
  PlusSignIcon
} from 'hugeicons-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { authApi } from '@/features/auth/api/auth.api';
import { warehousesApi } from '@/features/warehouses/api';
import { showToast } from '@/lib/toast';
import { Role, type Role as RoleType, type User, type Warehouse } from '@/types';
import { cn } from "@/lib/utils";

const assignableRoles = [Role.ADMIN, Role.MANAGER, Role.STAFF, Role.OFFICER];

interface UserFormState {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  department: string;
  role: RoleType;
  isActive: boolean;
}

const emptyForm: UserFormState = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  department: '',
  role: Role.STAFF,
  isActive: true,
};

export const AdminUsersPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'manage' | 'create'>('manage');
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | RoleType>('ALL');
  const [hubFilter, setHubFilter] = useState<string>('ALL');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [formData, setFormData] = useState<UserFormState>(emptyForm);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = editingUserId !== null;

  const filteredUsers = useMemo(() => {
    let result = users;

    if (roleFilter !== 'ALL') {
      result = result.filter(u => u.role === roleFilter);
    }

    if (hubFilter !== 'ALL') {
      result = result.filter(u => u.department === hubFilter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(user =>
        [user.fullName, user.email, user.department, user.phone]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q))
      );
    } else {
      result = [...result].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [users, query, roleFilter, hubFilter]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const nextUsers = await authApi.getAll();
      setUsers(nextUsers);
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Unable to load users.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWarehouses = async () => {
    try {
      const data = await warehousesApi.getAll();
      setWarehouses(data);
    } catch (error) {
      console.error('Failed to load warehouses', error);
    }
  };

  useEffect(() => {
    void loadUsers();
    void loadWarehouses();
  }, []);

  const updateField = (field: keyof UserFormState, value: string | boolean) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setEditingUserId(null);
    setFormData(emptyForm);
    if (activeTab === 'create') setActiveTab('manage');
  };

  const editUser = (user: User) => {
    const active = user.isActive ?? (user as any).active ?? true;
    setEditingUserId(user.userId);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      password: '',
      phone: user.phone ?? '',
      department: user.department ?? '',
      role: user.role,
      isActive: active,
    });
    setActiveTab('create');
  };

  const deleteUser = async (user: User) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${user.fullName}?`);
    if (!confirmed) return;
    try {
      await authApi.deleteUser(user.userId);
      showToast.success('User record removed.');
      await loadUsers();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Unable to delete user.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.fullName || !formData.email || (!isEditing && !formData.password)) {
      showToast.error('Name, email, and password are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await authApi.updateUser(editingUserId, {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone || undefined,
          department: formData.department || undefined,
          role: formData.role,
          isActive: formData.isActive,
        });
        showToast.success('User updated.');
      } else {
        await authApi.register({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
          department: formData.department || undefined,
          role: formData.role,
        });
        showToast.success('User created.');
      }
      resetForm();
      await loadUsers();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Unable to save user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-700 pb-20 px-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-4">
        <div>
          <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3 text-left">Administration</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground text-left">
            Identity Grid
          </h1>
        </div>

        <div className="flex p-2 bg-card/30 rounded-full border border-border shadow-2xl backdrop-blur-md">
          <button
            onClick={() => { setActiveTab('manage'); setEditingUserId(null); setFormData(emptyForm); }}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300",
              activeTab === 'manage' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserGroupIcon className="w-5 h-5" />
            Registry
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300",
              activeTab === 'create' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isEditing ? <Edit02Icon className="w-5 h-5" /> : <PlusSignIcon className="w-5 h-5" />}
            {isEditing ? 'Modify' : 'Provision'}
          </button>
        </div>
      </div>

      {activeTab === 'manage' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col items-center justify-center gap-6 w-full py-4">
            <div className="flex flex-wrap items-center gap-4 w-full max-w-5xl">
              <div className="relative group flex-1 min-w-[300px]">
                <Search01Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  className="h-16 w-full rounded-2xl border border-border bg-card/50 pl-16 pr-6 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/30 shadow-inner"
                  placeholder="Search identities by name, email, hub..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="relative group shrink-0">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="h-16 w-48 rounded-2xl border border-border bg-card/50 px-8 text-[10px] font-black uppercase tracking-wider focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer hover:bg-muted/50 transition-all pr-12 shadow-sm"
                >
                  <option value="ALL">ALL ROLES</option>
                  {assignableRoles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none opacity-40">
                  ▼
                </div>
              </div>

              <div className="relative group shrink-0">
                <select
                  value={hubFilter}
                  onChange={(e) => setHubFilter(e.target.value)}
                  className="h-16 w-56 rounded-2xl border border-border bg-card/50 px-8 text-[10px] font-black uppercase tracking-wider focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer hover:bg-muted/50 transition-all pr-12 shadow-sm"
                >
                  <option value="ALL">ALL HUBS</option>
                  <option value="">GLOBAL HUB</option>
                  {warehouses.map(w => (
                    <option key={w.warehouseId} value={w.name}>{w.name}</option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none opacity-40">
                  ▼
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl shadow-app-card overflow-hidden px-2 backdrop-blur-sm bg-opacity-50">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/60 h-14">
                  <TableHead className="px-10 font-black text-xs text-foreground/70 uppercase tracking-wider">Identity Details</TableHead>
                  <TableHead className="px-10 font-black text-xs text-foreground/70 uppercase tracking-wider">Protocol Role</TableHead>
                  <TableHead className="px-10 font-black text-xs text-foreground/70 uppercase tracking-wider">Deployment Hub</TableHead>
                  <TableHead className="px-10 font-black text-xs text-foreground/70 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="px-10 font-black text-xs text-foreground/70 uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-6">
                        <div className="w-12 h-12 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                        <p className="text-muted-foreground font-black text-[10px] uppercase tracking-wider">Synchronizing Identity Grid...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="py-20 space-y-6">
                        <UserIcon className="w-16 h-16 text-muted-foreground/10 mx-auto" />
                        <p className="text-xl font-bold text-foreground/50 uppercase tracking-tight">No identities located</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow
                      key={user.userId}
                      className="group hover:bg-primary/[0.02] transition-all border-b border-border/10 h-20 cursor-pointer"
                      onClick={() => navigate(`/admin/users/${user.userId}`)}
                    >
                      <TableCell className="px-10">
                        <div className="flex items-center gap-6">
                          <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0 border border-primary/10 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner">
                            <UserIcon className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <span className="font-black text-sm block leading-none tracking-tight group-hover:text-primary transition-all">{user.fullName}</span>
                            <span className="text-[11px] font-bold text-foreground/40 mt-1 block">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-10">
                        <span className={cn(
                          "text-[10px] font-black px-4 py-2 rounded-full border shadow-sm tracking-wide",
                          user.role === Role.ADMIN ? "bg-rose-400/10 text-rose-400 border-rose-400/20" :
                            user.role === Role.MANAGER ? "bg-violet-400/10 text-violet-400 border-violet-400/20" :
                              user.role === Role.OFFICER ? "bg-zinc-400/10 text-zinc-400 border-zinc-400/20" :
                                user.role === Role.STAFF ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/20" :
                                  "bg-primary/10 text-primary border-primary/20"
                        )}>
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell className="px-10">
                        <div className="flex items-center gap-3 text-xs font-bold text-foreground/70 tracking-tight whitespace-nowrap">
                          <Building05Icon className="w-4 h-4 opacity-40" />
                          {user.department || 'Global Hub'}
                        </div>
                      </TableCell>
                      <TableCell className="px-10">
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black tracking-wide border",
                          (user.isActive ?? true)
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-rose-400/10 text-rose-400 border-rose-400/20"
                        )}>
                          {(user.isActive ?? true) ? 'Active' : 'Locked'}
                        </span>
                      </TableCell>
                      <TableCell className="px-10 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              editUser(user);
                            }}
                            className="w-10 h-10 flex items-center justify-center transition-all duration-300 text-primary/60 hover:text-primary hover:bg-primary/5 rounded-xl"
                          >
                            <Edit02Icon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteUser(user);
                            }}
                            className="w-10 h-10 flex items-center justify-center transition-all duration-300 text-rose-400/60 hover:text-rose-400 hover:bg-rose-400/5 rounded-xl"
                          >
                            <Delete02Icon className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="max-w-5xl space-y-12 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-4 px-2 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              {isEditing ? <Edit02Icon className="w-6 h-6" /> : <UserAdd01Icon className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{isEditing ? 'Identity Modification' : 'Identity Provisioning'}</h2>
              <p className="text-xs font-bold text-foreground/70 uppercase tracking-wider mt-1">
                {isEditing ? `RECONFIGURING PERMISSIONS FOR ${formData.fullName}` : 'ENROLLING NEW OPERATIONAL NODE INTO THE GLOBAL REGISTRY'}
              </p>
            </div>
          </div>

          <div className="px-2">
            <form onSubmit={handleSubmit} className="space-y-10 text-left">
              <div className="bg-card/40 backdrop-blur-xl p-10 rounded-[2.5rem] border border-border/40 space-y-10">
                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="space-y-3 sm:col-span-2">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Legal Designation <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative group">
                      <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        placeholder="FULL LEGAL NAME"
                        value={formData.fullName}
                        onChange={(e) => updateField("fullName", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2">Identity Email <span className="text-rose-400">*</span></label>
                    <div className="relative group">
                      <Mail01Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        type="email"
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        placeholder="EMAIL ADDRESS"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px) font-black text-foreground/70 uppercase tracking-wider px-2">Access Protocol {!isEditing && <span className="text-rose-400">*</span>}</label>
                    <div className="relative group">
                      <LockPasswordIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        type="password"
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        placeholder={isEditing ? "LEAVE BLANK TO RETAIN" : "SECURE PASSWORD"}
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                      />
                    </div>
                  </div>

                  {formData.role !== Role.ADMIN && formData.role !== Role.OFFICER ? (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2">Deployment Hub</label>
                      <div className="relative group">
                        <Building05Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                        <select
                          className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-12 text-[10px] font-black uppercase tracking-wider focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer transition-all"
                          value={formData.department}
                          onChange={(e) => updateField("department", e.target.value)}
                        >
                          <option value="">GLOBAL HUB (UNASSIGNED)</option>
                          {warehouses.map(w => (
                            <option key={w.warehouseId} value={w.name}>{w.name}</option>
                          ))}
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none opacity-40 text-xs">
                          ▼
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 opacity-60">
                      <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2">Operational Scope</label>
                      <div className="h-14 w-full rounded-2xl border border-border/40 bg-muted/20 flex items-center px-6 gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Global Authorized Scope</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2">Comms Protocol</label>
                    <div className="relative group">
                      <CallIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        placeholder="PHONE NUMBER"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2">Identity Role <span className="text-rose-400">*</span></label>
                    <div className="relative">
                      <select
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 px-6 text-[10px] font-black uppercase tracking-wider focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer transition-all"
                        value={formData.role}
                        onChange={(e) => updateField("role", e.target.value)}
                      >
                        {assignableRoles.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none opacity-40 text-xs">
                        ▼
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2">Operational State</label>
                    <button
                      type="button"
                      onClick={() => updateField("isActive", !formData.isActive)}
                      className={cn(
                        "h-14 w-full rounded-2xl border transition-all flex items-center justify-center gap-4 px-6",
                        formData.isActive
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                          : "bg-rose-400/10 border-rose-400/20 text-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.1)]"
                      )}
                    >
                      {formData.isActive ? <ViewIcon className="w-4 h-4" /> : <ViewOffIcon className="w-4 h-4" />}
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        {formData.isActive ? 'ACTIVE PROTOCOL' : 'LOCKED IDENTITY'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-8">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-10 h-14 rounded-full border border-border bg-card hover:bg-muted text-foreground font-black text-[10px] uppercase tracking-wider transition-all"
                >
                  ABORT
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-10 h-14 rounded-full bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-wider transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'SYNCHRONIZING...' : isEditing ? 'COMMIT IDENTITY CHANGES' : 'AUTHORIZE PROVISIONING'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
