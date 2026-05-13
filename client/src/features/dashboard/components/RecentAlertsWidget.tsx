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
    <Card className="rounded-[2.5rem] border border-border/60 bg-rose-400/[0.02] backdrop-blur-xl shadow-sm overflow-hidden flex flex-col group">
      <CardHeader className="bg-muted/5 border-b border-border/10 p-4 md:p-5 pb-3 relative text-left">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/5 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:bg-rose-400/10 transition-colors" />
        <div className="flex items-center justify-between relative">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-400/5 text-rose-400/80 flex items-center justify-center border border-rose-400/10 group-hover:bg-rose-400 group-hover:text-white transition-all duration-500 shadow-inner shrink-0">
              <Alert02Icon className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-lg md:text-xl font-bold tracking-tight">System Alerts</CardTitle>
              <CardDescription className="text-[10px] font-black text-foreground/60 uppercase tracking-wide mt-0.5 text-left">Live Detection</CardDescription>
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
              <p className="font-black text-[8px] uppercase tracking-widest text-foreground/60">System Nominal</p>
            </div>
          ) : (
            alerts.slice(0, 6).map((alert) => (
              <div
                key={alert.alertId}
                className="group/row px-5 py-2 hover:bg-primary/[0.03] transition-all cursor-pointer flex items-center gap-3"
                onClick={() => handleRowClick(alert.alertId)}
              >
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0 shadow-sm",
                  alert.severity === AlertSeverity.CRITICAL ? "bg-rose-400" : "bg-amber-500"
                )} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-foreground/90 group-hover/row:text-primary transition-colors leading-tight truncate">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm border",
                      alert.severity === AlertSeverity.CRITICAL ? "bg-rose-400/10 text-rose-400 border-rose-400/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    )}>
                      {alert.severity}
                    </span>
                    <span className="text-[8px] font-black text-foreground/20 uppercase tracking-widest">{formatDate(alert.createdAt)}</span>
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
