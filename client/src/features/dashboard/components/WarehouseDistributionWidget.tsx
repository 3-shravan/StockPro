import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type Warehouse, Role } from "@/types";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Activity01Icon } from "hugeicons-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface WarehouseDistributionWidgetProps {
  warehouses: Warehouse[];
  userRole?: Role;
}

export const WarehouseDistributionWidget = ({ warehouses, userRole }: WarehouseDistributionWidgetProps) => {
  const navigate = useNavigate();

  const handleRowClick = (whId: number) => {
    const path = userRole === Role.ADMIN ? `/admin/warehouses/${whId}` :
      userRole === Role.MANAGER ? `/manager/stock/${whId}` :
        `/warehouse/stock/${whId}`;
    navigate(path);
  };

  return (
    <Card className="rounded-[2.5rem] border border-border/60 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col group relative">
      <CardHeader className="bg-card/40 border-b border-border/10 p-5 pb-2 relative text-left">
        <div className="flex items-center gap-6 relative">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner shrink-0">
            <Activity01Icon className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg md:text-2xl font-black tracking-tighter text-foreground">Warehouse Capacity</CardTitle>
            <CardDescription className="text-[10px] font-black text-foreground/50 uppercase tracking-widest mt-1 text-left">Storage Load Overview</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <div className="w-full overflow-hidden">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/40 h-12">
                <TableHead className="px-5 font-black text-xs text-foreground/40 uppercase tracking-widest w-[40%]">Warehouse Name</TableHead>
                <TableHead className="px-5 font-black text-xs text-foreground/40 uppercase tracking-widest text-center w-[30%]">Storage Fill</TableHead>
                <TableHead className="px-5 font-black text-xs text-foreground/40 uppercase tracking-widest text-right hidden md:table-cell w-[30%]">Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-[9px] font-black uppercase tracking-wider text-muted-foreground/30 italic px-6">
                    Registry Offline: No active nodes detected.
                  </TableCell>
                </TableRow>
              ) : (
                warehouses.map((w) => {
                  const percent = Math.round((w.usedCapacity / w.capacity) * 100);
                  return (
                    <TableRow
                      key={w.warehouseId}
                      className="cursor-pointer hover:bg-card/50 transition-all border-b border-border/10 h-16 group/row"
                      onClick={() => handleRowClick(w.warehouseId)}
                    >
                      <TableCell className="px-5 py-4">
                        <p className="text-lg md:text-xl font-black text-foreground group-hover/row:translate-x-1 transition-all leading-tight truncate tracking-tighter">{w.name}</p>
                        <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mt-1.5 truncate">Loc: {w.location}</p>
                      </TableCell>
                      <TableCell className="px-4 md:px-6 py-4">
                        <div className="flex flex-col gap-3.5">
                          <div className="flex justify-between items-center text-xs font-black uppercase tracking-wide text-foreground/80">
                            <span className="tabular-nums">{w.usedCapacity.toLocaleString()} / {w.capacity.toLocaleString()}</span>
                            <span className={cn(percent > 80 ? "text-rose-400" : "text-emerald-500")}>{percent}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-foreground/10 dark:bg-white/10 rounded-full overflow-hidden border border-foreground/10 dark:border-white/10 shadow-inner">
                            <div
                              className={cn(
                                "h-full transition-all duration-1000 shadow-sm",
                                percent > 80
                                  ? "bg-gradient-to-r from-rose-400/80 to-rose-400/90 shadow-[0_0_10px_rgba(244,114,182,0.3)]"
                                  : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                              )}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 md:px-6 py-6 text-right hidden md:table-cell">
                        <p className="font-black text-2xl md:text-3xl tabular-nums tracking-tighter leading-none">{w.usedCapacity}</p>
                        <p className="text-[10px] font-black text-foreground/40 uppercase tracking-wide mt-2">Active Units</p>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
