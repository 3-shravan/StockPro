import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Role, type PurchaseOrder } from "@/types";
import { PurchaseOrderStatus } from "@/types/enums";
import { formatDate, formatCurrency } from "@/lib/utils";
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

interface ApprovalQueuePreviewProps {
  orders: PurchaseOrder[];
  userRole?: Role;
}

export const ApprovalQueuePreview = ({ orders, userRole }: ApprovalQueuePreviewProps) => {
  const navigate = useNavigate();
  const pending = orders.filter(o => o.status === PurchaseOrderStatus.PENDING_APPROVAL);

  const handleRowClick = () => {
    const path = userRole === Role.OFFICER ? "/purchase/orders" : "/manager/purchase-orders";
    navigate(path, { state: { filter: PurchaseOrderStatus.PENDING_APPROVAL } });
  };

  return (
    <Card className="rounded-[2.5rem] border border-border/60 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col group">
      <CardHeader className="bg-muted/5 border-b border-border/10 p-6 md:p-8 pb-4 md:pb-6 relative text-left">
        <div className="absolute top-0 right-0 w-32 h-32 bg-status-warning/5 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:bg-status-warning/10 transition-colors" />
        <div className="flex items-center justify-between relative">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-status-warning/5 text-status-warning flex items-center justify-center border border-status-warning/10 group-hover:bg-status-warning group-hover:text-white transition-all duration-500 shadow-inner shrink-0">
              <ShoppingBasket01Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg md:text-xl font-bold tracking-tight">Approval Queue</CardTitle>
              <CardDescription className="text-[9px] font-black text-foreground/70 uppercase tracking-wider mt-1 text-left">Pending Authorization Stream</CardDescription>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-status-warning text-white text-[8px] font-black uppercase tracking-wider shadow-lg shadow-status-warning/20 shrink-0">
            {pending.length} STREAMS
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <div className="w-full overflow-hidden">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/40 h-14">
                <TableHead className="px-4 md:px-6 font-black text-[9px] text-foreground/70 uppercase tracking-wider w-[60%]">Reference</TableHead>
                <TableHead className="px-4 md:px-6 font-black text-[9px] text-foreground/70 uppercase tracking-wider text-right w-[40%]">Valuation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center text-[9px] font-black uppercase tracking-wider text-muted-foreground/30 italic px-6">
                    Registry Clear: No pending authorizations.
                  </TableCell>
                </TableRow>
              ) : (
                pending.slice(0, 4).map((o) => (
                  <TableRow
                    key={o.poId}
                    className="cursor-pointer hover:bg-primary/[0.03] transition-all border-b border-border/10 h-20 group/row"
                    onClick={handleRowClick}
                  >
                    <TableCell className="px-4 md:px-6 py-3">
                      <p className="text-sm md:text-base font-bold text-foreground group-hover/row:text-status-warning transition-colors leading-none truncate">#{o.poId} · {o.supplierName}</p>
                      <p className="text-[9px] font-black text-foreground/70 uppercase tracking-wider mt-1.5 opacity-60 truncate">Cycle: {formatDate(o.orderDate)}</p>
                    </TableCell>
                    <TableCell className="px-4 md:px-6 py-3 text-right">
                      <p className="font-black text-base md:text-lg tabular-nums tracking-tighter leading-none">{formatCurrency(o.totalAmount)}</p>
                      <p className="text-[9px] font-black text-foreground/70 uppercase tracking-wider mt-1.5 opacity-30">Total</p>
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
