import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { movementsApi } from '@/features/movements/api/movements.api';
import type { StockMovement } from '@/features/movements/types';
import { showToast } from '@/lib/toast';
import { MovementType } from '@/types/enums';
import {
  AlertCircleIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Clock01Icon,
  FilterIcon,
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
          String(m.productId).includes(q) || 
          String(m.warehouseId).includes(q);
      });
  }, [movements, typeFilter, query]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground text-foreground">Audit Trail & Movements</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Immutable history of all inventory changes across the enterprise.
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm border-none overflow-hidden">
        <CardContent className="p-6 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-12 pr-4 text-sm focus:border-primary outline-none transition-all"
              placeholder="Search by notes, product ID, or warehouse..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 text-muted-foreground">
              <FilterIcon className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">Type:</span>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="h-12 rounded-2xl border border-input/60 bg-background px-4 text-sm focus:border-primary outline-none"
            >
              <option value="ALL">All Movements</option>
              {Object.values(MovementType).map(t => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
            <Button variant="outline" size="icon" onClick={load} className="h-12 w-12 rounded-2xl">
               <Clock01Icon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-4xl border-transparent bg-card/80 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50 text-left">
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Timestamp</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Type</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Product</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Location</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Quantity</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Balance After</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground text-right whitespace-nowrap">Notes & Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">Retrieving audit logs...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="p-20 text-center opacity-30">
                    <AlertCircleIcon className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-medium text-lg">No movements found matching filters.</p>
                  </td></tr>
                ) : (
                  filtered.map((m) => (
                    <tr key={m.movementId} className="hover:bg-muted/10 transition-colors group">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <p className="font-medium">{new Date(m.movementDate).toLocaleDateString()}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(m.movementDate).toLocaleTimeString()}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${getMovementStyles(m.movementType)}`}>
                          {m.movementType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                           <PackageIcon className="w-4 h-4 text-primary/40" />
                           <span className="font-bold">Item #{m.productId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                           <WarehouseIcon className="w-4 h-4 text-emerald-600/40" />
                           <span className="font-medium">WH #{m.warehouseId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-1.5">
                            {m.quantity > 0 ? <ArrowUp01Icon className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown01Icon className="w-3.5 h-3.5 text-destructive" />}
                            <span className={`font-black text-base ${m.quantity > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                               {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                            </span>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                         <span className="font-bold text-foreground/80">{m.balanceAfter}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                         <div className="max-w-xs ml-auto">
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1 group-hover:line-clamp-none transition-all">
                               {m.notes || 'System generated movement'}
                            </p>
                            <p className="text-[9px] font-bold uppercase text-primary/60 mt-1">Ref: {m.referenceType} #{m.referenceId}</p>
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
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
