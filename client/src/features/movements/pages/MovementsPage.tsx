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
import { cn, formatDate } from '@/lib/utils';
import { MovementType } from '@/types/enums';
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  PackageIcon,
  Search01Icon,
  ArrowReloadHorizontalIcon,
  Building05Icon,
  Activity01Icon
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
      const data = await movementsApi.getAll();
      setMovements(data);
    } catch (error: any) {
      console.error("[MovementsPage] Failed to load movements:", error);
      showToast.error('Unable to access ledger data.');
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
        const q = query.toLowerCase().trim();
        return !q ||
          m.notes?.toLowerCase().includes(q) ||
          m.productName?.toLowerCase().includes(q) ||
          m.warehouseName?.toLowerCase().includes(q) ||
          String(m.productId).includes(q);
      });
  }, [movements, typeFilter, query]);

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between pt-4">
        <div>
          <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">Audit Ledger</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground text-left">
            Asset Trajectory
          </h1>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col items-center justify-center gap-6 w-full py-4">
        <div className="flex items-center gap-4 w-full max-w-4xl">
          <div className="relative group flex-1">
            <Search01Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              className="h-16 w-full rounded-2xl border border-border bg-card/50 pl-16 pr-6 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/30 shadow-inner"
              placeholder="Search by product, warehouse, or reference..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="relative group shrink-0">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="h-16 w-64 rounded-2xl border border-border bg-card/50 px-8 text-[10px] font-black uppercase tracking-wider focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer hover:bg-muted/50 transition-all pr-12 shadow-app-subtle"
            >
              <option value="ALL">ALL ACTIVITY</option>
              {Object.values(MovementType).map(t => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
            <ArrowDown01Icon className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none opacity-40" />
          </div>

          <button
            onClick={() => void load()}
            disabled={isLoading}
            className="h-16 px-8 rounded-2xl border border-border bg-card/50 hover:bg-muted/50 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 shadow-app-subtle shrink-0"
          >
            <ArrowReloadHorizontalIcon className={cn("w-5 h-5 text-primary", isLoading && "animate-spin")} />
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Sync</span>
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-card border border-border/40 rounded-3xl shadow-app-card overflow-hidden px-2">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/40 h-14">
              <TableHead className="px-8 font-bold text-[10px] text-foreground/70 uppercase tracking-wider">Protocol Date</TableHead>
              <TableHead className="px-8 font-bold text-[10px] text-foreground/70 uppercase tracking-wider">Operation Type</TableHead>
              <TableHead className="px-8 font-bold text-[10px] text-foreground/70 uppercase tracking-wider">Resource Node</TableHead>
              <TableHead className="px-8 font-bold text-[10px] text-foreground/70 uppercase tracking-wider text-center">Unit Δ</TableHead>
              <TableHead className="px-8 font-bold text-[10px] text-foreground/70 uppercase tracking-wider text-center">Density Post</TableHead>
              <TableHead className="px-8 font-bold text-[10px] text-foreground/70 uppercase tracking-wider text-right">System Logs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/40">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider">Loading Ledger Protocols...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto shadow-app-subtle border border-border/40">
                      <Activity01Icon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider">No activity identified in current audit</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => (
                <TableRow key={m.movementId} className="group hover:bg-muted/20 border-b border-border/40 transition-all cursor-pointer h-20">
                  <TableCell className="px-8">
                    <div className="flex flex-col text-left">
                      <p className="font-bold text-sm text-foreground tracking-tight whitespace-nowrap">
                        {new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(m.movementDate))}
                      </p>
                      <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider tabular-nums mt-0.5">
                        {new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(m.movementDate))}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="px-8">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit flex items-center gap-2 border whitespace-nowrap shadow-app-subtle",
                      getMovementStyles(m.movementType)
                    )}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current shadow-app-subtle" />
                      {m.movementType.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 border border-border/40 group-hover:border-primary/20 transition-all shadow-app-subtle">
                        <PackageIcon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors tracking-tight">{m.productName || `Protocol #${m.productId}`}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-foreground/70 uppercase tracking-wider whitespace-nowrap">
                          <Building05Icon className="w-3.5 h-3.5" />
                          {m.warehouseName || `Hub #${m.warehouseId}`}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 text-center">
                    <div className={cn(
                      "inline-flex items-center gap-2 font-bold",
                      m.quantity >= 0 ? "text-emerald-500" : "text-rose-400"
                    )}>
                      <span className="text-sm tracking-tight tabular-nums">
                        {m.quantity >= 0 ? '+' : ''}{m.quantity}
                      </span>
                      {m.quantity >= 0 ? <ArrowUp01Icon className="w-4 h-4" /> : <ArrowDown01Icon className="w-4 h-4" />}
                    </div>
                  </TableCell>
                  <TableCell className="px-8 text-center">
                    <span className="text-base font-bold text-muted-foreground tracking-tight tabular-nums">{m.balanceAfter || 0}</span>
                  </TableCell>
                  <TableCell className="px-8 text-right">
                    <p className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider leading-relaxed max-w-[200px] ml-auto truncate">
                      {m.notes || 'System Protocol Handshake Successful'}
                    </p>
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
    case MovementType.STOCK_IN: return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case MovementType.STOCK_OUT: return 'bg-rose-400/10 text-rose-600 border-rose-400/20';
    case MovementType.TRANSFER_IN:
    case MovementType.TRANSFER_OUT: return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
    case MovementType.ADJUSTMENT: return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    case MovementType.WRITE_OFF: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    case MovementType.RETURN: return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    default: return 'bg-muted/10 text-muted-foreground border-border/40';
  }
};
