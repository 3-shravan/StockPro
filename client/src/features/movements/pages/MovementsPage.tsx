import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { movementsApi } from '@/features/movements/api/movements.api';
import type { StockMovement } from '@/features/movements/types';
import { showToast } from '@/lib/toast';
import { formatDate } from '@/lib/utils';
import { MovementType } from '@/types/enums';
import {
  AlertCircleIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Clock01Icon,
  PackageIcon,
  Search01Icon,
  WarehouseIcon
} from 'hugeicons-react';
import { useEffect, useMemo, useState } from 'react';

export const MovementsPage = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [typeFilter, setTypeFilter] = useState<'ALL' | MovementType>('ALL');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      setMovements(await movementsApi.getAll());
    } catch (error: any) {
      showToast.error('Unable to load movements history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return movements
      .filter((m) => typeFilter === 'ALL' || m.movementType === typeFilter)
      .filter((m) => {
        const q = query.toLowerCase();
        return !q || 
          m.notes?.toLowerCase().includes(q) || 
          m.productName?.toLowerCase().includes(q) ||
          m.warehouseName?.toLowerCase().includes(q) ||
          String(m.productId).includes(q) || 
          String(m.warehouseId).includes(q);
      });
  }, [movements, typeFilter, query]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Audit Trail</h1>
          <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
            <Clock01Icon className="w-4 h-4" />
            Immutable history of all inventory changes across the enterprise.
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-none bg-card/40 backdrop-blur-md shadow-2xl overflow-hidden ring-1 ring-white/5">
        <CardContent className="p-6 flex flex-col gap-6 md:flex-row md:items-center">
          <div className="relative flex-1 group">
            <Search01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              className="h-14 w-full rounded-2xl border-none bg-background/50 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50"
              placeholder="Search by product, warehouse, or reference..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Movement Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="h-12 min-w-[180px] rounded-2xl border-none bg-background/50 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer hover:bg-background/80 transition-all"
              >
                <option value="ALL">All Activities</option>
                {Object.values(MovementType).map(t => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={load} 
              className="h-14 w-14 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary transition-all active:scale-95 mt-auto"
            >
               <Clock01Icon className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-3xl border border-white/5 bg-card/30 backdrop-blur-sm shadow-2xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-white/5 bg-muted/20">
              <TableHead className="px-8 h-16 font-black uppercase tracking-[0.2em] text-[10px]">Timestamp</TableHead>
              <TableHead className="h-16 font-black uppercase tracking-[0.2em] text-[10px]">Activity</TableHead>
              <TableHead className="h-16 font-black uppercase tracking-[0.2em] text-[10px]">Product</TableHead>
              <TableHead className="h-16 font-black uppercase tracking-[0.2em] text-[10px]">Warehouse</TableHead>
              <TableHead className="h-16 font-black uppercase tracking-[0.2em] text-[10px]">Quantity</TableHead>
              <TableHead className="h-16 font-black uppercase tracking-[0.2em] text-[10px]">Balance</TableHead>
              <TableHead className="h-16 font-black uppercase tracking-[0.2em] text-[10px] pl-8">Audit Information</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="h-64 text-center text-muted-foreground animate-pulse font-medium">Synchronizing audit data...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-96 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-20">
                    <AlertCircleIcon className="w-16 h-16" />
                    <p className="font-heading text-2xl font-bold">No Records Found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => (
                <TableRow key={m.movementId} className="hover:bg-primary/5 transition-all duration-300 border-white/5">
                  <TableCell className="px-8 py-6">
                    <p className="font-bold tracking-tight text-foreground/90">{formatDate(m.movementDate)}</p>
                  </TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ring-inset ${getMovementStyles(m.movementType)}`}>
                      {m.movementType.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <PackageIcon className="w-3.5 h-3.5 text-primary/60" />
                        <span className="font-bold text-sm">{m.productName || `Product #${m.productId}`}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 ml-5">SKU: {m.productId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <WarehouseIcon className="w-3.5 h-3.5 text-emerald-500/60" />
                       <span className="font-semibold text-sm text-foreground/80">{m.warehouseName || `Warehouse #${m.warehouseId}`}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                     <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${m.quantity > 0 ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
                          {m.quantity > 0 ? <ArrowUp01Icon className="w-3.5 h-3.5 text-emerald-500" /> : <ArrowDown01Icon className="w-3.5 h-3.5 text-destructive" />}
                        </div>
                        <span className={`font-black text-lg tabular-nums tracking-tighter ${m.quantity > 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                           {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                     </div>
                  </TableCell>
                  <TableCell>
                     <span className="font-black text-base tabular-nums text-foreground/50">{m.balanceAfter}</span>
                  </TableCell>
                  <TableCell className="pl-8 py-6">
                     <div className="flex flex-col gap-1.5 border-l border-white/5 pl-4">
                        <p className="text-xs font-medium text-foreground/80 leading-relaxed max-w-[250px]">
                           {m.notes || 'System generated movement'}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-black uppercase tracking-widest text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">Ref: {m.referenceType}</span>
                          <span className="text-[9px] font-bold text-muted-foreground/60">ID: #{m.referenceId}</span>
                        </div>
                     </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const getMovementStyles = (type: MovementType) => {
  switch (type) {
    case MovementType.STOCK_IN: return 'bg-emerald-500/10 text-emerald-600';
    case MovementType.STOCK_OUT: return 'bg-amber-500/10 text-amber-600';
    case MovementType.TRANSFER_IN:
    case MovementType.TRANSFER_OUT: return 'bg-blue-500/10 text-blue-600';
    case MovementType.ADJUSTMENT: return 'bg-purple-500/10 text-purple-600';
    case MovementType.WRITE_OFF: return 'bg-destructive/10 text-destructive';
    case MovementType.RETURN: return 'bg-slate-500/10 text-slate-600';
    default: return 'bg-muted text-muted-foreground';
  }
};
