import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { useNavigate, useLocation } from 'react-router-dom';
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
  PlusSignIcon,
  ArrowRight01Icon
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
  const location = useLocation();
  const editUserIdFromState = location?.state?.editUserId;

  useEffect(() => {
    if (editUserIdFromState && users.length > 0) {
      const userToEdit = users.find(u => u.userId === editUserIdFromState);
      if (userToEdit) {
        editUser(userToEdit);
        // Clear state to prevent re-triggering
        window.history.replaceState({}, document.title);
      }
    }
  }, [editUserIdFromState, users]);

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
          <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3 text-left">System Access</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground text-left">
            Users
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
            All Users
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300",
              activeTab === 'create' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isEditing ? <Edit02Icon className="w-5 h-5" /> : <PlusSignIcon className="w-5 h-5" />}
            {isEditing ? 'Edit User' : 'New User'}
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
                  placeholder="Search by name, email, or location..."
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
                  <option value="ALL">ALL WAREHOUSES</option>
                  <option value="">NO WAREHOUSE</option>
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

          <div className="bg-card border border-border rounded-3xl shadow-app-card overflow-x-auto px-2 backdrop-blur-sm bg-opacity-50 no-scrollbar">
            <Table className="min-w-[1000px] w-full">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/40 h-14">
                  <TableHead className="px-8 font-black text-[11px] text-foreground/70 uppercase tracking-widest">User Information</TableHead>
                  <TableHead className="px-6 font-black text-[11px] text-foreground/70 uppercase tracking-widest w-[200px]">Role</TableHead>
                  <TableHead className="px-6 font-black text-[11px] text-foreground/70 uppercase tracking-widest">Warehouse</TableHead>
                  <TableHead className="px-6 font-black text-[11px] text-foreground/70 uppercase tracking-widest w-[150px]">Status</TableHead>
                  <TableHead className="px-8 font-black text-[11px] text-foreground/70 uppercase tracking-widest text-right w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-6">
                        <div className="w-12 h-12 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                        <p className="text-muted-foreground font-black text-[10px] uppercase tracking-wider">Loading users...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <EmptyState
                        icon={UserIcon}
                        title="No Users Found"
                        description="No users match your search."
                        containerClassName="border-none bg-transparent py-20"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow
                      key={user.userId}
                      className="group hover:bg-muted/20 border-b border-border/40 transition-all cursor-pointer h-20"
                      onClick={() => navigate(`/admin/users/${user.userId}`)}
                    >
                      <TableCell className="px-8">
                        <div className="flex items-center gap-5">
                          <div className="w-11 h-11 rounded-xl bg-muted/50 text-primary flex items-center justify-center shrink-0 border border-border/40 group-hover:border-primary/20 transition-all shadow-app-subtle">
                            <UserIcon className="w-6 h-6" />
                          </div>
                          <div className="text-left min-w-0">
                            <span className="font-bold text-base block leading-tight tracking-tight group-hover:text-primary transition-all truncate">{user.fullName}</span>
                            <span className="text-xs font-bold text-foreground/50 mt-1 block uppercase tracking-wider truncate">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6">
                        <span className={cn(
                          "text-[10px] font-black px-3.5 py-1.5 rounded-full border shadow-app-subtle tracking-[0.1em] uppercase",
                          user.role === Role.ADMIN ? "bg-role-admin/10 text-role-admin border-role-admin/20" :
                            user.role === Role.MANAGER ? "bg-role-manager/10 text-role-manager border-role-manager/20" :
                              user.role === Role.OFFICER ? "bg-role-officer/10 text-role-officer border-role-officer/20" :
                                user.role === Role.STAFF ? "bg-role-staff/10 text-role-staff border-role-staff/20" :
                                  "bg-primary/10 text-primary border-primary/20"
                        )}>
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell className="px-6">
                        <div className="flex items-center gap-3 text-xs font-bold text-foreground/50 uppercase tracking-wider whitespace-nowrap">
                          <Building05Icon className="w-5 h-5 opacity-40 text-primary/40" />
                          {user.department || 'None'}
                        </div>
                      </TableCell>
                      <TableCell className="px-6">
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.1em] uppercase border inline-flex items-center whitespace-nowrap shadow-app-subtle",
                          (user.isActive ?? true)
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-status-error/10 text-status-error border-status-error/20"
                        )}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-2" />
                          {(user.isActive ?? true) ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </TableCell>
                      <TableCell className="px-8 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => editUser(user)}
                            className="w-10 h-10 flex items-center justify-center transition-all duration-300 text-primary/60 hover:text-primary hover:bg-primary/10 rounded-xl"
                          >
                            <Edit02Icon className="w-5.5 h-5.5" />
                          </button>
                          <button
                            onClick={() => deleteUser(user)}
                            className="w-10 h-10 flex items-center justify-center transition-all duration-300 text-status-error/60 hover:text-status-error hover:bg-status-error/10 rounded-xl"
                          >
                            <Delete02Icon className="w-5.5 h-5.5" />
                          </button>
                          <ArrowRight01Icon className="w-6 h-6 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all duration-500" />
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
              <h2 className="text-2xl font-bold tracking-tight">{isEditing ? 'Edit User' : 'New User'}</h2>
              <p className="text-xs font-bold text-foreground/70 uppercase tracking-wider mt-1">
                {isEditing ? `Editing user ${formData.fullName}` : 'Create a new user account'}
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
                      Full Name <span className="text-status-error">*</span>
                    </label>
                    <div className="relative group">
                      <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        placeholder="ENTER FULL NAME"
                        value={formData.fullName}
                        onChange={(e) => updateField("fullName", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2">Email Address <span className="text-status-error">*</span></label>
                    <div className="relative group">
                      <Mail01Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        type="email"
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        placeholder="EMAIL@EXAMPLE.COM"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2">Password {!isEditing && <span className="text-status-error">*</span>}</label>
                    <div className="relative group">
                      <LockPasswordIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        type="password"
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        placeholder={isEditing ? "LEAVE BLANK TO RETAIN" : "CREATE PASSWORD"}
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                      />
                    </div>
                  </div>

                  {formData.role !== Role.ADMIN && formData.role !== Role.OFFICER ? (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2">Location Access</label>
                      <div className="relative group">
                        <Building05Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                        <select
                          className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-12 text-[10px] font-black uppercase tracking-wider focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer transition-all"
                          value={formData.department}
                          onChange={(e) => updateField("department", e.target.value)}
                        >
                          <option value="">NONE (GLOBAL ACCESS)</option>
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
                      <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2">Access Level</label>
                      <div className="h-14 w-full rounded-2xl border border-border/40 bg-muted/20 flex items-center px-6 gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Global Access</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2">Phone Number</label>
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
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2">User Role <span className="text-status-error">*</span></label>
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
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2">Status</label>
                    <button
                      type="button"
                      onClick={() => updateField("isActive", !formData.isActive)}
                      className={cn(
                        "h-14 w-full rounded-2xl border transition-all flex items-center justify-center gap-4 px-6",
                        formData.isActive
                          ? "bg-primary/10 border-primary/20 text-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                          : "bg-status-error/10 border-status-error/20 text-status-error shadow-status-error/10"
                      )}
                    >
                      {formData.isActive ? <ViewIcon className="w-4 h-4" /> : <ViewOffIcon className="w-4 h-4" />}
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        {formData.isActive ? 'ACTIVE' : 'INACTIVE'}
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
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-10 h-14 rounded-full bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-wider transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'SAVING...' : isEditing ? 'SAVE CHANGES' : 'CREATE USER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
