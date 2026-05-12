import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type Product, type StockMovement } from "@/types";
import { useMemo } from "react";
import { Analytics01Icon } from "hugeicons-react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StockVelocityWidgetProps {
  products: Product[];
  movements: StockMovement[];
}

export const StockVelocityWidget = ({ products, movements }: StockVelocityWidgetProps) => {
  const navigate = useNavigate();

  const velocityData = useMemo(() => {
    // Calculate velocity based on movement count in the dataset
    const maxMovements = Math.max(...products.map(p => 
      movements.filter(m => m.productId === p.productId).length
    ), 1);

    return products
      .map(p => {
        const count = movements.filter(m => m.productId === p.productId).length;
        const score = Math.round((count / maxMovements) * 100);
        return {
          ...p,
          movements: count,
          score
        };
      })
      .sort((a, b) => b.movements - a.movements)
      .slice(0, 5);
  }, [products, movements]);

  const handleRowClick = (productId: number) => {
    navigate(`/manager/products/${productId}`);
  };

  return (
    <Card className="rounded-[2.5rem] border-none bg-white/[0.05] backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col group relative">
      <CardHeader className="bg-transparent border-b border-white/10 p-5 pb-2 relative text-left">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:bg-primary/10 transition-colors" />
        <div className="flex items-center gap-6 relative">
          <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner shrink-0">
            <Analytics01Icon className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-xl md:text-3xl font-black tracking-tighter text-white">Stock Movement</CardTitle>
            <CardDescription className="text-[10px] font-black text-white/60 uppercase tracking-widest mt-1 text-left">Inventory Flow Rate</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <div className="w-full overflow-hidden">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-primary/10 dark:border-white/10 h-12">
                <TableHead className="px-5 font-black text-xs text-primary/60 dark:text-white/60 uppercase tracking-widest w-[50%]">Product SKU</TableHead>
                <TableHead className="px-5 font-black text-xs text-primary/60 dark:text-white/60 uppercase tracking-widest text-right w-[50%]">Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {velocityData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-[9px] font-black uppercase tracking-wider text-muted-foreground/30 italic px-6">
                    Quiescent Stream: No movement data.
                  </TableCell>
                </TableRow>
              ) : (
                velocityData.map((s) => (
                  <TableRow
                    key={s.productId}
                    className="cursor-pointer hover:bg-white/5 transition-all border-b border-white/5 h-20 group/row"
                    onClick={() => handleRowClick(s.productId)}
                  >
                    <TableCell className="px-5 py-3">
                      <p className="font-black text-xl md:text-2xl text-white group-hover/row:translate-x-1 transition-all leading-tight truncate tracking-tighter">{s.name}</p>
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1 truncate">SKU: {s.productId}</p>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-right">
                       <div className="flex flex-col items-end gap-2">
                          <p className="font-black text-2xl md:text-3xl tabular-nums tracking-tighter leading-none text-white">{s.movements} <span className="text-[9px] font-bold uppercase text-white/30 ml-1">Movements</span></p>
                          <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden border border-white/5 shadow-inner">
                             <div 
                              className="h-full bg-white transition-all duration-1000 shadow-[0_0_12px_rgba(255,255,255,0.3)]" 
                              style={{ width: `${s.score}%` }} 
                             />
                          </div>
                       </div>
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
