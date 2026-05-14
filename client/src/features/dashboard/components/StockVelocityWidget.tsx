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
    <Card className="rounded-[2.5rem] border border-border/60 bg-card/60 backdrop-blur-xl shadow-lg overflow-hidden flex flex-col group relative">
      <CardHeader className="bg-muted/10 border-b border-border/20 p-5 pb-3 relative text-left">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:bg-primary/10 transition-colors" />
        <div className="flex items-center gap-4 relative">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner shrink-0">
            <Analytics01Icon className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg md:text-xl font-black tracking-tighter text-foreground">Stock Movement</CardTitle>
            <CardDescription className="text-[10px] font-black text-foreground/50 uppercase tracking-widest mt-0.5 text-left">Inventory Flow Rate</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <div className="w-full overflow-hidden">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/40 h-12">
                <TableHead className="px-5 font-black text-xs text-foreground/60 uppercase tracking-widest w-[50%]">Product SKU</TableHead>
                <TableHead className="px-5 font-black text-xs text-foreground/60 uppercase tracking-widest text-right w-[50%]">Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {velocityData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-[9px] font-black uppercase tracking-wider text-muted-foreground/40 italic px-6">
                    Quiescent Stream: No movement data.
                  </TableCell>
                </TableRow>
              ) : (
                velocityData.map((s) => (
                  <TableRow
                    key={s.productId}
                    className="cursor-pointer hover:bg-primary/[0.04] transition-all border-b border-border/20 h-16 group/row"
                    onClick={() => handleRowClick(s.productId)}
                  >
                    <TableCell className="px-5 py-3">
                      <p className="font-black text-lg md:text-xl text-foreground group-hover/row:translate-x-1 transition-all leading-tight truncate tracking-tighter">{s.name}</p>
                      <p className="text-[10px] font-black text-foreground/30 uppercase tracking-widest mt-1 truncate">SKU: {s.productId}</p>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <p className="font-black text-xl md:text-2xl tabular-nums tracking-tighter leading-none text-foreground">
                          {s.movements} <span className="text-[9px] font-bold uppercase text-foreground/30 ml-1">Movements</span>
                        </p>
                        <div className="w-24 h-2 bg-muted/60 rounded-full overflow-hidden border border-border/30 shadow-inner">
                          <div
                            className="h-full bg-primary transition-all duration-1000"
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
