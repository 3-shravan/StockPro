import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  UserIcon, 
  Mail01Icon, 
  CallIcon, 
  Shield01Icon,
  CheckmarkCircle02Icon,
  Building05Icon,
  ArrowLeft01Icon,
  UserEdit01Icon,
  Clock01Icon
} from 'hugeicons-react';
import { authApi } from '@/features/auth/api/auth.api';
import { showToast } from '@/lib/toast';
import { formatDate, cn } from '@/lib/utils';
import { Role, type User } from '@/types';

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
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between pt-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/admin/users')}
            className="w-12 h-12 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted transition-all"
          >
            <ArrowLeft01Icon className="w-6 h-6" />
          </button>
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Registry Profile</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              {user.fullName}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={cn(
            "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
            user.isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-400/10 text-rose-400 border-rose-400/20"
          )}>
            {user.isActive ? 'Active Protocol' : 'Locked Identity'}
          </span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_350px] px-2">
        <div className="space-y-10">
          {/* Identity Blueprint */}
          <div className="bg-card/30 border border-border/40 rounded-[2.5rem] p-10 backdrop-blur-md shadow-sm space-y-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <Shield01Icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-2xl tracking-tight text-foreground">Identity Blueprint</h3>
                  <p className="text-sm text-muted-foreground">Authorized system registry data.</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/admin/users')} // For now just go back, or we could pass state to open edit modal
                className="flex items-center gap-2 px-6 h-12 rounded-full bg-foreground text-background font-black text-[10px] uppercase tracking-wider transition-all hover:opacity-90"
              >
                <UserEdit01Icon className="w-4 h-4" />
                Modify Credentials
              </button>
            </div>

            <div className="grid gap-12 sm:grid-cols-2">
              <DetailItem 
                label="Legal Identity" 
                value={user.fullName} 
                icon={<UserIcon className="w-5 h-5" />} 
              />
              <DetailItem 
                label="Communication Vector" 
                value={user.email} 
                icon={<Mail01Icon className="w-5 h-5" />} 
              />
              <DetailItem 
                label="Mobile Terminal" 
                value={user.phone || 'N/A'} 
                icon={<CallIcon className="w-5 h-5" />} 
              />
              <DetailItem 
                label="Operational Node" 
                value={user.department || 'GLOBAL HUB'} 
                icon={<Building05Icon className="w-5 h-5" />} 
              />
            </div>
          </div>

          {/* Activity Feed / Placeholder */}
          <div className="bg-card/30 border border-border/40 rounded-[2.5rem] p-10 backdrop-blur-md shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-400/10 flex items-center justify-center text-violet-400 shadow-inner">
                <Clock01Icon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-2xl tracking-tight text-foreground">Operational History</h3>
                <p className="text-sm text-muted-foreground">Recent system interactions and access logs.</p>
              </div>
            </div>
            
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto opacity-20">
                <Shield01Icon className="w-8 h-8" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-foreground/20">Access Log Static</p>
            </div>
          </div>
        </div>

        {/* Sidebar Status Card */}
        <div className="space-y-8">
          <div className="bg-card/30 border border-border/40 rounded-[2.5rem] shadow-sm overflow-hidden p-10 text-center relative group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-30"></div>
            
            <div className="w-32 h-32 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border-2 border-border/50 relative group transition-all duration-500 hover:rotate-3">
              <UserIcon className="w-16 h-16 text-primary group-hover:scale-110 transition-transform" />
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-emerald-500 border-4 border-background flex items-center justify-center shadow-lg">
                 <CheckmarkCircle02Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <h3 className="font-black text-2xl tracking-tight mb-2 uppercase">{user.fullName}</h3>
            <span className={cn(
              "inline-block px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-inner",
              user.role === Role.ADMIN ? "bg-rose-400/10 text-rose-400 border-rose-400/20" :
              user.role === Role.MANAGER ? "bg-violet-400/10 text-violet-400 border-violet-400/20" :
              user.role === Role.OFFICER ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/20" :
              "bg-orange-400/10 text-orange-400 border-orange-400/20"
            )}>
              {user.role}
            </span>
            
            <div className="mt-12 pt-8 border-t border-border/10 space-y-6 text-left">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em]">Registry ID</p>
                <p className="text-sm font-mono font-bold text-foreground/80">USR-{user.userId.toString().padStart(6, '0')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em]">Deployment Rank</p>
                <p className="text-sm font-bold text-foreground/80 uppercase">{user.role}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em]">Initialization Date</p>
                <p className="text-sm font-bold text-foreground/80">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="bg-card/30 border border-border/40 rounded-[2.5rem] p-8 space-y-6">
            <h4 className="font-black text-xs uppercase tracking-widest text-foreground/60">Node Integrity</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Access Tier</span>
                <span className="text-xs font-black text-primary">LEVEL_{user.role === Role.ADMIN ? '01' : '02'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Session Key</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-2 py-1 rounded-md border border-emerald-500/10">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (
  <div className="flex items-start gap-4">
    <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-foreground/40 shrink-0">
      {icon}
    </div>
    <div className="space-y-1">
      <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">{label}</p>
      <p className="text-lg font-bold tracking-tight text-foreground/90">{value}</p>
    </div>
  </div>
);
