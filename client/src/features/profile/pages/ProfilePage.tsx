import { useEffect, useState } from 'react';
import { 
  UserIcon, 
  Mail01Icon, 
  CallIcon, 
  Briefcase01Icon, 
  LockPasswordIcon, 
  Shield01Icon,
  CheckmarkCircle02Icon,
  Building05Icon
} from 'hugeicons-react';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { showToast } from '@/lib/toast';
import { formatDate, cn } from '@/lib/utils';
import { Role } from '@/types';

export const ProfilePage = () => {
  const { user, setAuth, token } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || '',
        department: user.department || '',
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const updatedUser = await authApi.updateProfile(user.userId, {
        fullName: profileData.fullName,
        phone: profileData.phone,
        department: profileData.department,
      });
      
      setAuth(updatedUser, token!);
      showToast.success('Profile updated successfully');
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast.error('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword(user.userId, passwordData.newPassword);
      showToast.success('Password changed successfully');
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between pt-4">
        <div>
          <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">Security Protocol</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Account Settings
          </h1>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px] px-2">
        <div className="space-y-10">
          {/* Profile Information */}
          <div className="bg-white/[0.05] border-none rounded-[2rem] p-8 backdrop-blur-md shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl tracking-tight text-foreground">Personal Information</h3>
                <p className="text-sm text-muted-foreground">Update your basic profile details.</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wider px-1">Full Name</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    className="h-14 w-full rounded-2xl border border-border/40 bg-background/50 pl-12 pr-4 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/30 shadow-inner"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wider px-1">Email Address</label>
                <div className="relative group opacity-60">
                  <Mail01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="h-14 w-full rounded-2xl border border-border/40 bg-muted/30 pl-12 pr-4 text-sm cursor-not-allowed shadow-inner"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground px-1 font-medium">System registry email (read-only)</p>
              </div>

              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wider px-1">Phone Number</label>
                <div className="relative group">
                  <CallIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="h-14 w-full rounded-2xl border border-border/40 bg-background/50 pl-12 pr-4 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {user?.role !== Role.ADMIN && user?.role !== Role.OFFICER && (
                <div className="space-y-2.5">
                  <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wider px-1">Assigned Operational Hub</label>
                  <div className={cn("relative group", (user?.role === Role.STAFF) && "opacity-60")}>
                    <Briefcase01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      value={profileData.department}
                      onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                      disabled={user?.role === Role.STAFF}
                      className={cn(
                        "h-14 w-full rounded-2xl border border-border/40 bg-background/50 pl-12 pr-4 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner",
                        (user?.role === Role.STAFF) && "cursor-not-allowed bg-muted/30"
                      )}
                      placeholder="Unassigned (Global Hub)"
                    />
                  </div>
                  {(user?.role === Role.STAFF) && (
                    <p className="text-[10px] text-muted-foreground px-1 font-medium italic">Contact Administrator to re-assign your hub.</p>
                  )}
                </div>
              )}

              <div className="sm:col-span-2 pt-2">
                <button type="submit" disabled={isSaving} className="h-12 px-10 rounded-2xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20">
                  {isSaving ? 'Syncing...' : 'Update Protocol'}
                </button>
              </div>
            </form>
          </div>

          {/* Security / Password */}
          <div className="bg-white/[0.05] border-none rounded-[2rem] p-8 backdrop-blur-md shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive shadow-inner">
                <Shield01Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl tracking-tight text-foreground">Security & Credentials</h3>
                <p className="text-sm text-muted-foreground">Modify your access authentication.</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-8">
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wider px-1">New Access Key</label>
                <div className="relative group">
                  <LockPasswordIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-destructive transition-colors" />
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="h-14 w-full rounded-2xl border border-border/40 bg-background/50 pl-12 pr-4 text-sm focus:ring-4 focus:ring-destructive/10 outline-none transition-all placeholder:text-muted-foreground/30 shadow-inner"
                    placeholder="Minimum 6 characters required"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wider px-1">Verify Access Key</label>
                <div className="relative group">
                  <LockPasswordIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-destructive transition-colors" />
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="h-14 w-full rounded-2xl border border-border/40 bg-background/50 pl-12 pr-4 text-sm focus:ring-4 focus:ring-destructive/10 outline-none transition-all placeholder:text-muted-foreground/30 shadow-inner"
                    placeholder="Re-enter for verification"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isChangingPassword} 
                className="h-12 px-10 rounded-2xl bg-destructive text-destructive-foreground font-bold text-xs uppercase tracking-widest transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-lg shadow-destructive/20"
              >
                {isChangingPassword ? 'Authorizing...' : 'Rotate Key'}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white/[0.05] border-none rounded-2xl shadow-sm overflow-hidden p-8 text-center">
            <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-background relative group">
              <UserIcon className="w-12 h-12 text-primary group-hover:scale-110 transition-transform" />
              <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                 <CheckmarkCircle02Icon className="w-3 h-3 text-white" />
              </div>
            </div>
            <h3 className="font-bold text-xl">{user?.fullName}</h3>
            <p className="text-[10px] font-bold uppercase text-primary tracking-wider mt-1 bg-primary/5 py-1 px-3 rounded-lg border border-primary/10 inline-block">{user?.role}</p>
            
            <div className="mt-8 pt-6 border-t border-border/10 space-y-4">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Mail01Icon className="w-4 h-4 text-primary/60" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Building05Icon className="w-4 h-4 text-primary/60" />
                <span className="font-bold text-primary/80 uppercase tracking-wider">
                  {user?.role === Role.ADMIN ? 'Global Surveillance' : (user?.department || 'GLOBAL HUB')}
                </span>
              </div>
              {user?.role === Role.ADMIN && (
                <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-1 pl-7">
                  All Facilities Active
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/[0.05] border-none rounded-2xl p-6 space-y-4">
            <h4 className="font-bold text-sm">System Status</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Registered</span>
                <span className="text-xs font-bold">{user?.createdAt ? formatDate(user.createdAt) : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Account Status</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10 uppercase">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
