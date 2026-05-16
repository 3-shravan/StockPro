import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Notification01Icon,
  Search01Icon,
  CheckmarkCircle02Icon,
  Calendar01Icon,
  UserIcon,
  Megaphone01Icon
} from 'hugeicons-react';
import { useAlertsStore } from '@/stores/alerts.store';
import { useAuthStore } from '@/stores/auth.store';
import { format } from '@/lib/time-utils';
import { AlertSeverity } from '@/types';
import { BroadcastForm } from '../components/BroadcastForm';

export const AlertsPage = () => {
  const { user } = useAuthStore();
  const { alerts, loading, fetchAlerts, acknowledge } = useAlertsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'ALL'>('ALL');
  const [currentView, setCurrentView] = useState<'LIST' | 'BROADCAST'>('LIST');

  useEffect(() => {
    if (user) {
      void fetchAlerts(user.userId, user.role, (user as any).warehouseId);
    }
  }, [user, fetchAlerts]);

  const filteredAlerts = alerts.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'ALL' || a.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-3 py-1 rounded-full bg-status-error/10 text-status-error text-[10px] font-black uppercase tracking-widest border border-status-error/20">Critical</span>;
      case 'WARNING':
        return <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">Warning</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">Information</span>;
    }
  };

  return (
    <div className="w-full space-y-12 pb-20 text-left">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between pt-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {currentView === 'LIST' ? 'System Registry' : 'Broadcast Center'}
          </h1>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-primary inline-block animate-pulse" />
            {currentView === 'LIST' ? 'Historical Audit Trail · Operational Telemetry' : 'Protocol Dispatch · Emergency outreach'}
          </p>
        </div>

        {currentView === 'LIST' && (
          <div className="flex items-center gap-4">
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => setCurrentView('BROADCAST')}
                className="flex items-center gap-3 px-8 py-4 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:shadow-xl hover:shadow-primary/20 active:scale-95 transition-all"
              >
                <Megaphone01Icon className="w-6 h-6" />
                Initiate Broadcast
              </button>
            )}

            <div className="flex items-center gap-4 p-2 bg-card/30 rounded-full border border-border/40 shadow-app-card backdrop-blur-md">
              <div className="relative group px-4 flex items-center">
                <Search01Icon className="w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-xs font-bold uppercase tracking-wider py-3 pl-3 pr-4 w-48 placeholder:text-muted-foreground/40 text-foreground outline-none"
                />
              </div>
              <div className="w-px h-6 bg-border/40" />
              <div className="flex gap-2 pr-2">
                {(['ALL', 'CRITICAL', 'WARNING'] as const).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setFilterSeverity(sev)}
                    className={cn(
                      "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                      filterSeverity === sev ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted/10"
                    )}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {currentView === 'BROADCAST' ? (
        <BroadcastForm
          onCancel={() => setCurrentView('LIST')}
          onSuccess={() => {
            setCurrentView('LIST');
            fetchAlerts(user!.userId, user!.role, (user as any).warehouseId);
          }}
        />
      ) : (
        /* Main Table / List */
        <div className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-[2.5rem] shadow-app-subtle overflow-x-auto no-scrollbar animate-in fade-in slide-in-from-top-4 duration-700 px-2">
          <div className="w-full">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-border/10 bg-muted/5 h-16">
                  <th className="table-head-label px-8">Signal</th>
                  <th className="table-head-label px-6">Priority</th>
                  <th className="table-head-label px-6">Telemetry Message</th>
                  <th className="table-head-label px-6">Timestamp</th>
                  <th className="table-head-label px-8 text-right">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                        <span className="text-xs font-black uppercase tracking-widest opacity-40">Decrypting Audit Logs...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <Notification01Icon className="w-12 h-12" />
                        <span className="text-xs font-black uppercase tracking-widest">No matching signals found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alert) => (
                    <tr key={alert.alertId} className="group hover:bg-foreground/[0.02] transition-colors h-28 border-b border-border/5">
                      <td className="px-8 whitespace-nowrap">
                        <div className="flex items-center gap-6">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-all duration-500 shadow-inner",
                            alert.severity === 'CRITICAL' ? "bg-status-error/10 border-status-error/20 text-status-error" :
                              alert.severity === 'WARNING' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                                "bg-blue-500/10 border-blue-500/20 text-blue-500"
                          )}>
                            <Notification01Icon className="w-7 h-7" />
                          </div>
                          <div>
                            <p className="text-lg font-black tracking-tight group-hover:text-primary transition-colors">{alert.type.replace('_', ' ')}</p>
                            <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] mt-1.5">PROTOCOL ID #{alert.alertId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 whitespace-nowrap">
                        {getSeverityBadge(alert.severity)}
                      </td>
                      <td className="px-6 max-w-md">
                        <p className="text-sm font-black text-foreground mb-1 tracking-tight">{alert.title}</p>
                        <p className="text-xs font-bold text-foreground/40 leading-relaxed line-clamp-2 italic">"{alert.message}"</p>
                      </td>
                      <td className="px-6 whitespace-nowrap text-xs font-black tabular-nums">
                        <div className="flex flex-col gap-1.5">
                          <span className="flex items-center gap-2 text-foreground/60"><Calendar01Icon className="w-4 h-4 opacity-40" /> {format(new Date(alert.createdAt), 'MMM dd, yyyy')}</span>
                          <span className="text-[10px] text-foreground/20 uppercase tracking-widest ml-6">{format(new Date(alert.createdAt), 'HH:mm:ss')}</span>
                        </div>
                      </td>
                      <td className="px-8 whitespace-nowrap text-right">
                        {alert.acknowledged ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
                              <CheckmarkCircle02Icon className="w-4 h-4" />
                              Resolved
                            </div>
                            {alert.acknowledgedByName && (
                              <div className="flex items-center gap-2 text-[9px] text-foreground/30 font-black uppercase tracking-widest">
                                <UserIcon className="w-3 h-3" /> {alert.acknowledgedByName}
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => user && acknowledge(alert.alertId, user.userId)}
                            className="px-8 h-12 rounded-2xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-foreground/10"
                          >
                            Acknowledge
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
