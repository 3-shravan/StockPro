import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type Alert, AlertSeverity, Role } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import { Alert02Icon } from "hugeicons-react";
import { useNavigate } from "react-router-dom";

interface RecentAlertsWidgetProps {
  alerts: Alert[];
  userRole?: Role;
}

export const RecentAlertsWidget = ({ alerts, userRole }: RecentAlertsWidgetProps) => {
  const navigate = useNavigate();

  const handleRowClick = (alertId: number) => {
    const path = userRole === Role.ADMIN ? "/admin/alerts" :
      userRole === Role.MANAGER ? "/manager/alerts" :
        userRole === Role.STAFF ? "/warehouse/alerts" : "/purchase/alerts";
    navigate(`${path}?id=${alertId}`);
  };

  return (
    <Card className="rounded-[2.5rem] border border-border/60 bg-status-error/[0.02] backdrop-blur-xl shadow-sm overflow-hidden flex flex-col group">
      <CardHeader className="bg-muted/5 border-b border-border/10 p-0 px-6 h-14 relative text-left">
        <div className="absolute top-0 right-0 w-32 h-32 bg-status-error/5 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:bg-status-error/10 transition-colors" />
        <div className="flex items-center justify-between relative h-full">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-status-error/5 text-status-error/80 flex items-center justify-center border border-status-error/20 group-hover:bg-status-error group-hover:text-white transition-all duration-500 shadow-inner shrink-0">
              <Alert02Icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold tracking-tight">System Alerts</CardTitle>
              <CardDescription className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest mt-1 text-left leading-none">Current Status</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/5">
          {alerts.length === 0 ? (
            <div className="py-6 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-muted/5 border border-dashed border-border/60 flex items-center justify-center text-muted-foreground/40">
                <Alert02Icon className="w-4 h-4" />
              </div>
              <p className="font-black text-[8px] uppercase tracking-widest text-foreground/60">No Alerts Found</p>
            </div>
          ) : (
            alerts.slice(0, 6).map((alert) => (
              <div
                key={alert.alertId}
                className="group/row px-6 py-3 hover:bg-muted/20 transition-all cursor-pointer flex items-center gap-4 border-b border-border/40 h-20"
                onClick={() => handleRowClick(alert.alertId)}
              >
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0 shadow-sm animate-pulse",
                  alert.severity === AlertSeverity.CRITICAL ? "bg-status-error shadow-status-error/40" : "bg-status-warning shadow-status-warning/40"
                )} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-foreground/90 group-hover/row:text-primary transition-colors leading-tight truncate tracking-tight">{alert.message}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={cn(
                      "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border shadow-app-subtle",
                      alert.severity === AlertSeverity.CRITICAL ? "bg-status-error/10 text-status-error border-status-error/20" : "bg-status-warning/10 text-status-warning border-status-warning/20"
                    )}>
                      {alert.severity}
                    </span>
                    <span className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest">{formatDate(alert.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
