import { useEffect, useState } from 'react';
import { 
  Delete02Icon, 
  Edit02Icon, 
  LockPasswordIcon, 
  Mail01Icon, 
  UserIcon, 
  Search01Icon, 
  UserAdd01Icon,
  UserGroupIcon,
  FilterIcon,
  SmartPhone01Icon,
  Building05Icon,
  Settings01Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { authApi } from '@/features/auth/api/auth.api';
import { showToast } from '@/lib/toast';
import { Role, type Role as RoleType, type User } from '@/types';
import { InfoTooltip } from "@/components/ui/info-tooltip";
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
  const [activeTab, setActiveTab] = useState<'manage' | 'create'>('manage');
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | RoleType>('ALL');
  const [formData, setFormData] = useState<UserFormState>(emptyForm);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = editingUserId !== null;

  const filteredUsers = users.filter((user) => {
    if (roleFilter !== 'ALL' && user.role !== roleFilter) return false;
    if (!query.trim()) return false; 

    const q = query.toLowerCase();
    return [user.fullName, user.email, user.department, user.phone]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

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

  useEffect(() => {
    void loadUsers();
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Access Control</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage organizational roles, user accounts, and security permissions.
          </p>
        </div>
        
        <div className="flex p-1 bg-muted/50 rounded-2xl w-fit border border-border/50">
          <button
            onClick={() => { setActiveTab('manage'); setEditingUserId(null); setFormData(emptyForm); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
              activeTab === 'manage' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserGroupIcon className="w-4 h-4" />
            Directory
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
              activeTab === 'create' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserAdd01Icon className="w-4 h-4" />
            {isEditing ? 'Edit Profile' : 'New Account'}
          </button>
        </div>
      </div>

      {activeTab === 'manage' ? (
        <div className="space-y-6">
          <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm border-none overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium px-1">Find Users</label>
                  <div className="relative group">
                    <Search01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-12 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="Search by name, email, department..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="w-full md:w-56 space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center gap-2 text-muted-foreground">
                    <FilterIcon className="w-3.5 h-3.5" />
                    Role Filter
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="h-12 w-full rounded-2xl border border-input/60 bg-background px-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  >
                    <option value="ALL">All Roles</option>
                    {assignableRoles.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="min-h-[300px]">
            {!query.trim() ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                <Search01Icon className="w-12 h-12 mb-4" />
                <h3 className="font-heading font-bold text-lg">Search first</h3>
                <p className="text-sm max-w-xs mx-auto mt-2">
                  Start typing to see matching user profiles from the central directory.
                </p>
              </div>
            ) : isLoading ? (
              <p className="text-center py-20 text-muted-foreground">Loading directory...</p>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-muted-foreground">No matches found.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.map((user) => {
                  const isActive = user.isActive ?? (user as any).active ?? true;
                  return (
                    <Card key={user.userId} className="rounded-3xl border-transparent bg-card/80 hover:bg-card shadow-sm transition-all group overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-base truncate">{user.fullName}</h4>
                              {!isActive && (
                                <span className="bg-destructive/10 text-destructive text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase">Inactive</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                              <Mail01Icon className="w-3.5 h-3.5" />
                              {user.email}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-primary/10 text-primary rounded-lg border border-primary/10">
                                {user.role}
                              </span>
                              {user.department && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-muted text-muted-foreground rounded-lg">
                                  {user.department}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => editUser(user)}
                              className="p-2 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                              title="Edit User"
                            >
                              <Edit02Icon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => deleteUser(user)}
                              className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title="Remove User"
                            >
                              <Delete02Icon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <Card className="rounded-4xl border-transparent bg-card/80 shadow-sm border-none overflow-hidden max-w-4xl mx-auto">
          <CardHeader className="bg-muted/30 pb-8 pt-8 px-10 border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10">
                {isEditing ? <Edit02Icon className="w-6 h-6 text-primary" /> : <UserAdd01Icon className="w-6 h-6 text-primary" />}
              </div>
              <div>
                <CardTitle className="text-xl">{isEditing ? 'Modify Account Details' : 'Onboard New Staff Member'}</CardTitle>
                <CardDescription>
                  {isEditing ? `Update security and profile info for ${formData.fullName}` : 'Grant access to the StockPro workspace.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Full Legal Name <span className="text-destructive ml-1">*</span>
                    <InfoTooltip content="Used for audit logs and organizational directory." />
                  </label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      value={formData.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="Jane Smith"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Email Address <span className="text-destructive ml-1">*</span>
                    <InfoTooltip content="Primary login identity and notification destination." />
                  </label>
                  <div className="relative group">
                    <Mail01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="jane@company.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Workspace Role <span className="text-destructive ml-1">*</span>
                    <InfoTooltip content="Determines access levels and allowed operations across all modules." />
                  </label>
                  <div className="relative group">
                    <Settings01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <select
                      value={formData.role}
                      onChange={(e) => updateField('role', e.target.value as any)}
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none"
                    >
                      {assignableRoles.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Department
                    <InfoTooltip content="Organizational unit (e.g. Logistics, HR, Operations)." />
                  </label>
                  <div className="relative group">
                    <Building05Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      value={formData.department}
                      onChange={(e) => updateField('department', e.target.value)}
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="e.g. Logistics"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Contact Phone
                    <InfoTooltip content="Mobile or desk number for internal communication." />
                  </label>
                  <div className="relative group">
                    <SmartPhone01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Account Access
                    <InfoTooltip content="Inactive users cannot log in or perform any actions." />
                  </label>
                  <select
                    value={String(formData.isActive)}
                    onChange={(e) => updateField('isActive', e.target.value === 'true')}
                    className="h-12 w-full rounded-2xl border border-input/60 bg-background px-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  >
                    <option value="true">Authorized (Active)</option>
                    <option value="false">Revoked (Inactive)</option>
                  </select>
                </div>

                {!isEditing && (
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium px-1 flex items-center">
                      Temporary Password <span className="text-destructive ml-1">*</span>
                      <InfoTooltip content="Set an initial password. The user should be advised to change it immediately." />
                    </label>
                    <div className="relative group">
                      <LockPasswordIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 rounded-2xl shadow-lg shadow-primary/20">
                  {isSubmitting ? 'Processing...' : isEditing ? 'Commit Profile Changes' : 'Authorize Account'}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={resetForm}
                  className="h-12 px-8 rounded-2xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
