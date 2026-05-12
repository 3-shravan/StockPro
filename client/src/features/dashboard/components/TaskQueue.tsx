import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Role, type Alert, type PurchaseOrder } from "@/types";
import { PurchaseOrderStatus } from "@/types/enums";
import { Alert02Icon, PackageReceiveIcon, ShoppingBasket01Icon } from "hugeicons-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

interface TaskQueueProps {
  orders: PurchaseOrder[];
  alerts: Alert[];
  userRole?: Role;
}

export const TaskQueue = ({ orders, alerts, userRole }: TaskQueueProps) => {
  const navigate = useNavigate();

  const tasks = useMemo(() => {
    if (!orders || !alerts) return [];
    
    const actionableTasks: any[] = [];

    // 1. Order-based tasks (Actionable)
    if (userRole === Role.STAFF || userRole === Role.ADMIN) {
      const toReceive = orders.filter(o => o && (o.status === PurchaseOrderStatus.APPROVED || o.status === PurchaseOrderStatus.PARTIALLY_RECEIVED));
      actionableTasks.push(...toReceive.map(o => ({
        id: `po-rec-${o.poId}`,
        title: `Receive Goods: PO #${o.poId}`,
        desc: o.supplierName || 'Unknown Supplier',
        type: 'RECEIPT',
        path: '/warehouse/receive'
      })));
    }

    if (userRole === Role.MANAGER || userRole === Role.ADMIN) {
      const toApprove = orders.filter(o => o && o.status === PurchaseOrderStatus.PENDING_APPROVAL);
      actionableTasks.push(...toApprove.map(o => ({
        id: `po-app-${o.poId}`,
        title: `Authorize PO #${o.poId}`,
        desc: `Awaiting Management Approval`,
        type: 'APPROVAL',
        path: userRole === Role.ADMIN ? '/manager/purchase-orders' : '/manager/purchase-orders'
      })));
    }

    // 2. Alert-based tasks (Informational)
    // Only show alerts that aren't already covered by actionable tasks
    const relevantAlerts = alerts.filter(a => a && !a.acknowledged && a.type !== 'PO_PENDING');
    actionableTasks.push(...relevantAlerts.map(a => ({
      id: `al-${a.alertId}`,
      title: a.title || 'System Alert',
      desc: a.message || 'Anomaly detected in registry.',
      type: 'ALERT',
      path: userRole === Role.STAFF ? '/warehouse/alerts' : 
            (userRole === Role.OFFICER ? '/purchase/alerts' : '/manager/alerts')
    })));

    return actionableTasks.slice(0, 5);
  }, [orders, alerts, userRole]);

  return (
    <Card className="rounded-[2.5rem] border border-primary/20 bg-card backdrop-blur-xl shadow-lg overflow-hidden group relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      <CardHeader className="bg-muted/5 border-b border-border/10 p-4 md:p-5 pb-3 relative text-left">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:bg-primary/10 transition-colors" />
        <div className="flex items-center gap-4 relative">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner shrink-0">
            <PackageReceiveIcon className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-lg md:text-xl font-bold tracking-tight">Priority Queue</CardTitle>
            <CardDescription className="text-[10px] font-black text-foreground/40 uppercase tracking-wide mt-0.5 text-left">Active Tasks</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/5">
          {tasks.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2">
               <div className="w-10 h-10 rounded-xl bg-muted/5 border border-dashed border-border/30 flex items-center justify-center text-muted-foreground/40">
                  <PackageReceiveIcon className="w-5 h-5" />
               </div>
               <p className="font-black text-[10px] uppercase tracking-[0.2em] text-foreground/40">Queue Synchronized</p>
            </div>
          ) : (
            tasks.map((t) => (
              <div
                key={t.id}
                className="group/row px-5 py-4 hover:bg-primary/[0.04] transition-all cursor-pointer flex items-center gap-5"
                onClick={() => navigate(t.path)}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 shrink-0",
                  t.type === 'RECEIPT' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                  t.type === 'APPROVAL' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                  "bg-primary/10 text-primary border-primary/20",
                  "group-hover/row:scale-110 shadow-inner"
                )}>
                  {t.type === 'RECEIPT' ? <PackageReceiveIcon className="w-5 h-5" /> : 
                   t.type === 'APPROVAL' ? <ShoppingBasket01Icon className="w-5 h-5" /> :
                   <Alert02Icon className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-foreground/90 leading-tight truncate group-hover/row:text-primary transition-colors">{t.title}</p>
                  <p className="text-[9px] font-black text-foreground/30 uppercase tracking-widest mt-1.5 truncate">{t.desc}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
