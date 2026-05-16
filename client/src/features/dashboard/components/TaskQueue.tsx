import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Role, type PurchaseOrder } from "@/types";
import { PurchaseOrderStatus } from "@/types/enums";
import { Alert02Icon, PackageReceiveIcon, ShoppingBasket01Icon } from "hugeicons-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

interface TaskQueueProps {
  orders: PurchaseOrder[];
  userRole?: Role;
}

export const TaskQueue = ({ orders, userRole }: TaskQueueProps) => {
  const navigate = useNavigate();

  const tasks = useMemo(() => {
    if (!orders) return [];

    const actionableTasks: any[] = [];

    // 1. Order-based tasks (Actionable)
    if (userRole === Role.STAFF || userRole === Role.ADMIN) {
      const toReceive = orders.filter(o => o && (o.status === PurchaseOrderStatus.APPROVED || o.status === PurchaseOrderStatus.PARTIALLY_RECEIVED));
      actionableTasks.push(...toReceive.map(o => ({
        id: `po-rec-${o.poId}`,
        title: `Receive Goods: PO #${o.poId}`,
        desc: o.supplierName || 'System Logistics',
        type: 'RECEIPT',
        path: '/warehouse/receive'
      })));
    }

    if (userRole === Role.MANAGER || userRole === Role.ADMIN) {
      const toApprove = orders.filter(o => o && o.status === PurchaseOrderStatus.PENDING_APPROVAL);
      actionableTasks.push(...toApprove.map(o => ({
        id: `po-app-${o.poId}`,
        title: `Authorize PO #${o.poId}`,
        desc: `Awaiting Management Authorization`,
        type: 'APPROVAL',
        path: userRole === Role.ADMIN ? '/admin/purchase-orders' : '/manager/purchase-orders'
      })));
    }

    return actionableTasks.slice(0, 5);
  }, [orders, userRole]);

  return (
    <Card className="rounded-[2.5rem] border border-border/40 bg-card shadow-sm overflow-hidden group">
      <CardHeader className="bg-muted/10 border-b border-border/40 p-5 text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-inner shrink-0">
            <PackageReceiveIcon className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold tracking-tight">Priority Queue</CardTitle>
            <CardDescription className="text-[10px] font-bold text-foreground/50 uppercase tracking-[0.2em] mt-0.5 text-left">Active Operational Tasks</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/40">
          {tasks.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground/30">
                <PackageReceiveIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground/50">Queue Synchronized</p>
                <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest mt-1">No pending actions required</p>
              </div>
            </div>
          ) : (
            tasks.map((t) => (
              <div
                key={t.id}
                className="group/row px-5 py-4 hover:bg-primary/[0.03] transition-all cursor-pointer flex items-center gap-4"
                onClick={() => navigate(t.path)}
              >
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center border border-border/40 transition-all duration-300 shrink-0 bg-muted/30 text-muted-foreground",
                  "group-hover/row:bg-primary group-hover/row:text-primary-foreground group-hover/row:border-primary group-hover/row:scale-105 shadow-sm"
                )}>
                  {t.type === 'RECEIPT' ? <PackageReceiveIcon className="w-5 h-5" /> :
                    t.type === 'APPROVAL' ? <ShoppingBasket01Icon className="w-5 h-5" /> :
                      <Alert02Icon className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground leading-tight truncate group-hover/row:text-primary transition-colors">{t.title}</p>
                  <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1.5 truncate leading-none">{t.desc}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
