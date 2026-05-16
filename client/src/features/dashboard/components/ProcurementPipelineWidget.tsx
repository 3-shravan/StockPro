import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Role, type PurchaseOrder } from "@/types";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { ShoppingBasket01Icon } from "hugeicons-react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProcurementPipelineWidgetProps {
  orders: PurchaseOrder[];
  userRole?: Role;
}

export const ProcurementPipelineWidget = ({ orders, userRole }: ProcurementPipelineWidgetProps) => {
  const navigate = useNavigate();

  const getPath = (status?: string) => {
    const base = userRole === Role.OFFICER ? "/purchase/orders" : "/manager/purchase-orders";
    return status ? `${base}?status=${status}` : base;
  };

  const handleRowClick = (poId: number) => {
    navigate(`${getPath()}?selected=${poId}`);
  };

  return (
    <Card className="rounded-[2.5rem] border border-border/60 bg-card/60 backdrop-blur-xl shadow-lg overflow-hidden flex flex-col group">
      <CardHeader className="bg-muted/10 border-b border-border/20 p-4 md:p-5 pb-3 relative text-left">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:bg-primary/20 transition-colors" />
        <div className="flex items-center gap-4 relative">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner shrink-0">
            <ShoppingBasket01Icon className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-lg md:text-xl font-bold tracking-tight">Procurement Pipeline</CardTitle>
            <CardDescription className="text-[10px] font-black text-foreground/50 uppercase tracking-widest mt-0.5 text-left">Supplier Performance</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <div className="w-full overflow-hidden">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/40 h-16">
                <TableHead className="px-4 md:px-6 font-black text-xs text-foreground/90 uppercase tracking-widest w-[40%]">ID & Entity</TableHead>
                <TableHead className="px-4 md:px-6 font-black text-xs text-foreground/90 uppercase tracking-widest text-center hidden md:table-cell w-[32%]">Status</TableHead>
                <TableHead className="px-4 md:px-6 font-black text-xs text-foreground/90 uppercase tracking-widest text-right w-[28%]">Valuation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-40 px-6">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-muted/5 border border-dashed border-border/20 flex items-center justify-center text-muted-foreground/20">
                        <ShoppingBasket01Icon className="w-7 h-7" />
                      </div>
                      <div className="text-center">
                        <p className="font-black text-[11px] uppercase tracking-widest text-foreground/40">Pipeline Empty</p>
                        <p className="text-[10px] font-bold text-muted-foreground/30 uppercase mt-1">No active procurement streams</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.slice(0, 6).map((o) => (
                  <TableRow
                    key={o.poId}
                    className="cursor-pointer hover:bg-primary/[0.06] transition-all border-b border-border/20 h-24 group/row"
                    onClick={() => handleRowClick(o.poId)}
                  >
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-5 whitespace-nowrap">
                        <span className="font-black text-2xl text-primary tracking-tighter shrink-0">#{o.poId}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-lg md:text-xl text-foreground leading-none truncate mb-1.5">{o.supplierName}</p>
                          <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest leading-none">{formatDate(o.orderDate)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-center hidden md:table-cell">
                      <span className={cn(
                        "inline-flex items-center px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm transition-all",
                        o.status === 'FULLY_RECEIVED' ? "bg-primary/10 text-primary border-primary/20" :
                          o.status === 'PARTIALLY_RECEIVED' ? "bg-status-warning/10 text-status-warning border-status-warning/20" :
                            "bg-muted/40 text-foreground/60 border-border/40"
                      )}>
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
                      <p className="font-black text-xl md:text-2xl tabular-nums tracking-tighter leading-none text-foreground">{formatCurrency(o.totalAmount)}</p>
                      <p className="text-[10px] font-black text-foreground/30 uppercase tracking-widest mt-1.5">Value</p>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
