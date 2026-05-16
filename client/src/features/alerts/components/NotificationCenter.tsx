import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  Notification01Icon, 
  Cancel01Icon, 
  CheckmarkCircle02Icon, 
  AlertCircleIcon,
  InformationCircleIcon,
} from 'hugeicons-react';
import { useAlertsStore } from '@/stores/alerts.store';
import { useAuthStore } from '@/stores/auth.store';
import { formatDistanceToNow } from '@/lib/time-utils';
import { AlertSeverity } from '@/types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const { alerts, loading, fetchAlerts, markAsRead, acknowledge, markAllAsRead } = useAlertsStore();

  useEffect(() => {
    if (isOpen && user) {
      void fetchAlerts(user.userId, user.role, (user as any).warehouseId);
    }
  }, [isOpen, user, fetchAlerts]);

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITICAL': return <AlertCircleIcon className="w-5 h-5 text-status-error" />;
      case 'WARNING': return <AlertCircleIcon className="w-5 h-5 text-amber-500" />;
      default: return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-background/60 z-[100] transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Slide Panel */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-[420px] bg-card border-l border-border z-[101] transition-transform duration-500 ease-out flex flex-col shadow-2xl",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="px-8 pt-10 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Notifications
          </h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                onClose();
                window.location.href = '/alerts';
              }}
              className="px-4 py-2 rounded-full bg-muted/20 hover:bg-muted/30 text-muted-foreground text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              View All
            </button>
            <button 
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted/20 transition-all"
            >
              <Cancel01Icon className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6 space-y-4">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Recent
              </span>
              <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">
                {alerts.length}
              </span>
            </div>
            {alerts.length > 0 && (
              <button 
                onClick={() => user && markAllAsRead(user.userId)}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {loading && alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 opacity-40">
              <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Loading...</span>
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 opacity-30">
              <Notification01Icon className="w-12 h-12 stroke-[1]" />
              <span className="text-[10px] font-bold uppercase tracking-widest">No notifications</span>
            </div>
          ) : (
            alerts.map((alert) => (
              <div 
                key={alert.alertId}
                className={cn(
                  "p-5 rounded-3xl border transition-all duration-300 group cursor-pointer relative",
                  alert.read 
                    ? "bg-transparent border-border/40" 
                    : "bg-muted/10 border-border"
                )}
                onClick={() => !alert.read && markAsRead(alert.alertId)}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                    alert.read ? "bg-muted/5 opacity-50" : "bg-card shadow-sm border border-border/40"
                  )}>
                    {getSeverityIcon(alert.severity)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        {alert.type.replace('_', ' ')}
                      </span>
                      <span className="text-[8px] font-medium text-muted-foreground/40">
                        {formatDistanceToNow(new Date(alert.createdAt))}
                      </span>
                    </div>
                    
                    <h4 className="font-bold text-sm text-foreground mb-1 tracking-tight">
                      {alert.title}
                    </h4>
                    
                    <p className="text-[12px] text-muted-foreground/70 leading-relaxed line-clamp-2 mb-4">
                      {alert.message}
                    </p>

                    <div className="flex items-center justify-between">
                      {!alert.acknowledged ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            user && acknowledge(alert.alertId, user.userId);
                          }}
                          className="px-4 py-2 rounded-lg bg-foreground text-background text-[9px] font-bold uppercase tracking-wider hover:opacity-90 transition-all"
                        >
                          Acknowledge
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-primary font-bold text-[8px] uppercase tracking-wider">
                          <CheckmarkCircle02Icon className="w-3 h-3" />
                          Acknowledged
                        </div>
                      )}
                      
                      {!alert.read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
