import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type PurchaseOrder, type Supplier } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { UserGroupIcon } from "hugeicons-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

interface SupplierPerformanceWidgetProps {
  suppliers: Supplier[];
  orders: PurchaseOrder[];
}

export const SupplierPerformanceWidget = ({ suppliers, orders }: SupplierPerformanceWidgetProps) => {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    return suppliers.map(s => ({
      ...s,
      orderCount: orders.filter(o => o.supplierId === s.supplierId).length,
      totalSpent: orders.filter(o => o.supplierId === s.supplierId).reduce((acc, o) => acc + o.totalAmount, 0)
    }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 4);
  }, [suppliers, orders]);

  const handleRowClick = () => {
    navigate("/purchase/suppliers");
  };

  return (
    <Card className="rounded-[2.5rem] border border-border/60 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col group">
      <CardHeader className="bg-card/40 border-b border-border/10 p-5 pb-2 relative text-left">
        <div className="flex items-center gap-6 relative">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner shrink-0">
            <UserGroupIcon className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-xl md:text-3xl font-black tracking-tighter text-foreground">Active Partners</CardTitle>
            <CardDescription className="text-[10px] font-black text-foreground/50 uppercase tracking-widest mt-1 text-left">Supplier Performance Matrix</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 md:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.length === 0 ? (
             <div className="col-span-full py-12 text-center text-[9px] font-black uppercase tracking-wider text-muted-foreground/30 italic border border-dashed border-border rounded-3xl">
                Registry Empty: No active supplier activity.
             </div>
          ) : (
            stats.map((s) => (
              <div
                key={s.supplierId}
                className="group/box relative p-8 rounded-[2.5rem] border border-border/40 bg-muted/5 hover:bg-primary/[0.03] hover:border-primary/20 transition-all cursor-pointer overflow-hidden"
                onClick={handleRowClick}
              >
                <div className="absolute top-0 right-0 w-28 h-28 bg-primary/5 blur-3xl -mr-14 -mt-14 group-hover/box:bg-primary/10 transition-colors" />
                
                <div className="flex justify-between items-start mb-6">
                   <div className="min-w-0 flex-1">
                      <p className="font-black text-2xl text-foreground group-hover/box:translate-x-1 transition-all truncate tracking-tighter leading-tight">{s.name}</p>
                      <p className="text-[10px] font-black text-foreground/50 uppercase tracking-widest mt-2 truncate">{s.city || 'Global'}</p>
                   </div>
                   <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary text-base font-black shrink-0 shadow-inner">
                      {s.orderCount}
                   </div>
                </div>

                <div className="pt-6 border-t border-border/10 flex items-center justify-between">
                   <div>
                      <p className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Total Valuation</p>
                      <p className="font-black text-3xl md:text-4xl tabular-nums tracking-tighter text-foreground mt-2">{formatCurrency(s.totalSpent)}</p>
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
