import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  UserIcon, 
  Mail01Icon, 
  CallIcon, 
  Shield01Icon,
  Building05Icon,
  ArrowLeft01Icon,
  UserEdit01Icon,
  Clock01Icon
} from 'hugeicons-react';
import { authApi } from '@/features/auth/api/auth.api';
import { showToast } from '@/lib/toast';
import { formatDate, cn } from '@/lib/utils';
import type { User } from '@/types';

export const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        const data = await authApi.getProfile(parseInt(id));
        setUser(data);
      } catch (error) {
        showToast.error('Failed to load user identity');
        navigate('/admin/users');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="h-[60vh] flex-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="page-container">
      {/* Header Section */}
      <div className="page-header">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/admin/users')}
            className="w-12 h-12 rounded-full border border-border bg-card flex-center hover:bg-muted transition-all"
          >
            <ArrowLeft01Icon className="icon-lg" />
          </button>
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">User Profile</p>
            <h1 className="page-title">
              {user.fullName}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={cn(
            "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
            user.isActive ? "bg-primary/10 text-primary border-primary/20" : "bg-status-error/10 text-status-error border-status-error/20"
          )}>
            {user.isActive ? 'Account Active' : 'Account Disabled'}
          </span>
          <button 
            onClick={() => navigate('/admin/users', { state: { editUserId: user.userId } })}
            className="w-12 h-12 rounded-full border border-border bg-primary text-primary-foreground flex-center hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            title="Update Profile"
          >
            <UserEdit01Icon className="icon-md" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl space-y-10 px-2">
          {/* Identity Blueprint */}
          <div className="bg-card/30 border border-border/40 rounded-[2.5rem] p-10 backdrop-blur-md shadow-sm space-y-12">
            <div className="flex-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex-center text-primary shadow-inner">
                  <Shield01Icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-2xl tracking-tight text-foreground">Account Details</h3>

                </div>
              </div>

            </div>

            <div className="grid gap-12 sm:grid-cols-2">
              <DetailItem 
                label="Full Name" 
                value={user.fullName} 
                icon={<UserIcon className="w-5 h-5" />} 
              />
              <DetailItem 
                label="Email Address" 
                value={user.email} 
                icon={<Mail01Icon className="w-5 h-5" />} 
              />
              <DetailItem 
                label="Phone Number" 
                value={user.phone || 'N/A'} 
                icon={<CallIcon className="w-5 h-5" />} 
              />
              <DetailItem 
                label="Department" 
                value={user.department || 'GLOBAL HUB'} 
                icon={<Building05Icon className="w-5 h-5" />} 
              />
              <DetailItem 
                label="Join Date" 
                value={formatDate(user.createdAt)} 
                icon={<Clock01Icon className="w-5 h-5" />} 
              />
            </div>
          </div>



      </div>
    </div>
  );
};

const DetailItem = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (
  <div className="flex items-start gap-4">
    <div className="w-10 h-10 rounded-xl bg-muted/50 flex-center text-foreground/40 shrink-0">
      {icon}
    </div>
    <div className="space-y-1">
      <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">{label}</p>
      <p className="text-lg font-bold tracking-tight text-foreground/90">{value}</p>
    </div>
  </div>
);
