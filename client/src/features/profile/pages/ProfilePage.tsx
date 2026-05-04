import { useEffect, useState } from 'react';
import { 
  UserIcon, 
  Mail01Icon, 
  CallIcon, 
  Briefcase01Icon, 
  LockPasswordIcon, 
  Shield01Icon,
  CheckmarkCircle02Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { showToast } from '@/lib/toast';

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
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="font-heading text-3xl font-bold">Account Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your personal information and security preferences.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {/* Profile Information */}
          <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/30 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <UserIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your basic profile details.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleProfileSubmit} className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      className="h-11 w-full rounded-2xl border border-input/60 bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-ring/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <div className="relative group opacity-60">
                    <Mail01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="h-11 w-full rounded-2xl border border-input/60 bg-muted pl-9 pr-3 text-sm cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground px-1">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <div className="relative group">
                    <CallIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      type="text"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="h-11 w-full rounded-2xl border border-input/60 bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-ring/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <div className="relative group">
                    <Briefcase01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      type="text"
                      value={profileData.department}
                      onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                      className="h-11 w-full rounded-2xl border border-input/60 bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-ring/20"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 pt-2">
                  <Button type="submit" disabled={isSaving} className="rounded-2xl">
                    {isSaving ? 'Saving Changes...' : 'Update Profile'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security / Password */}
          <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/30 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-destructive/10">
                  <Shield01Icon className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <CardTitle>Security & Privacy</CardTitle>
                  <CardDescription>Change your account password.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <div className="relative group">
                    <LockPasswordIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="h-11 w-full rounded-2xl border border-input/60 bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-ring/20"
                      placeholder="At least 6 characters"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <div className="relative group">
                    <LockPasswordIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="h-11 w-full rounded-2xl border border-input/60 bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-ring/20"
                      placeholder="Repeat new password"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  variant="destructive" 
                  disabled={isChangingPassword} 
                  className="rounded-2xl"
                >
                  {isChangingPassword ? 'Updating Password...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="rounded-3xl border-transparent bg-primary/5 shadow-none border-none">
            <CardContent className="p-6 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-background">
                <UserIcon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-lg">{user?.fullName}</h3>
              <p className="text-xs uppercase font-semibold text-primary tracking-wider mt-1">{user?.role}</p>
              
              <div className="mt-6 pt-6 border-t border-primary/10 space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckmarkCircle02Icon className="w-4 h-4 text-primary" />
                  <span>Verified Account</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckmarkCircle02Icon className="w-4 h-4 text-primary" />
                  <span>{user?.department || 'No department'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-3xl bg-muted/40 p-6 space-y-4">
            <h4 className="font-heading font-bold text-sm">Account Status</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Joined</span>
                <span className="font-medium">{new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Status</span>
                <span className="text-primary font-bold">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
