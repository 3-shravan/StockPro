import { useAuthStore } from "@/stores/auth.store";
import { Role } from "@/types";
import {
  PackageIcon,
  ShoppingBasket01Icon,
  Chart01Icon,
  ArrowReloadHorizontalIcon,
  Alert02Icon,
  Analytics01Icon
} from "hugeicons-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { cn, formatCurrency } from "@/lib/utils";
import { useReportsData } from "../hooks/useReportsData";
import { ReportMetricCard } from "../components/ReportMetricCard";
import { 
  ValuationBreakdownModal, 
  SpendAnalysisModal, 
  RiskAnalysisModal 
} from "../components/BreakdownModals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { WarehouseDistributionWidget } from "@/features/dashboard/components/WarehouseDistributionWidget";
import { SupplierPerformanceWidget } from "@/features/dashboard/components/SupplierPerformanceWidget";
import { StockVelocityWidget } from "@/features/dashboard/components/StockVelocityWidget";

export function ReportsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = user?.role || Role.STAFF;
  
  const { 
    loading, 
    totalValue, 
    lowStock, 
    valuationDetails, 
    poSummary, 
    products, 
    warehouses,
    suppliers,
    movements,
    orders,
    refresh
  } = useReportsData();

  const [showValuationModal, setShowValuationModal] = useState(false);
  const [showSpendModal, setShowSpendModal] = useState(false);
  const [showLowStockModal, setShowLowStockModal] = useState(false);

  const getProductPath = () => {
    if (role === Role.STAFF) return '/warehouse/products';
    return '/manager/products';
  };

  const getRolePath = (suffix: string) => {
    const base = role === Role.ADMIN ? '/admin' :
      role === Role.MANAGER ? '/manager' :
        role === Role.OFFICER ? '/purchase' : '/warehouse';
    return `${base}${suffix}`;
  };

  const PageHeader = () => (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between pt-4 mb-12">
      <div>
        <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">Intelligence Hub</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground text-left">Inventory Analytics</h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          className="w-14 h-14 flex items-center justify-center bg-card/30 hover:bg-muted rounded-full border border-border shadow-xl transition-all active:scale-95 text-muted-foreground backdrop-blur-md"
          onClick={refresh}
          disabled={loading}
        >
          <ArrowReloadHorizontalIcon className={cn("w-6 h-6", loading && "animate-spin")} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-10 pb-20">
      <PageHeader />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportMetricCard
          label="Registry Valuation"
          value={totalValue !== null ? formatCurrency(totalValue) : '...'}
          hint="Global Asset Valuation"
          icon={Chart01Icon}
          onClick={() => setShowValuationModal(true)}
          color="primary"
        />
        <ReportMetricCard
          label="Risk Critical"
          value={String(lowStock.length)}
          hint="Density Risk Protocols"
          icon={Alert02Icon}
          color="destructive"
          onClick={() => navigate(getProductPath(), { state: { filter: 'LOW_STOCK' } })}
        />
        <ReportMetricCard
          label="Procurement Flux"
          value={poSummary && poSummary.totalAmount !== undefined ? formatCurrency(poSummary.totalAmount) : '₹0'}
          hint="Total Spend Evaluation"
          icon={ShoppingBasket01Icon}
          color="warning"
          onClick={() => setShowSpendModal(true)}
        />
        <ReportMetricCard
          label="Node Throughput"
          value={String(poSummary?.totalOrders || 0)}
          hint="Operational Cycles"
          icon={PackageIcon}
          color="primary"
          onClick={() => navigate(getRolePath('/purchase-orders'))}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* --- Main Analytics Column --- */}
        <div className="lg:col-span-7 space-y-8">
          <Card className="rounded-[2.5rem] border border-border/60 bg-rose-500/[0.02] dark:bg-rose-500/[0.05] backdrop-blur-xl shadow-sm overflow-hidden flex flex-col group relative">
            <div className="absolute top-0 left-0 w-32 h-32 bg-rose-500/10 blur-[60px] -ml-16 -mt-16 rounded-full pointer-events-none" />
            <CardHeader className="bg-muted/5 border-b border-border/10 p-5 pb-2 relative text-left">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:bg-primary/10 transition-colors" />
              <div className="flex items-center justify-between relative">
                <div>
                  <CardTitle className="text-xl md:text-3xl font-black tracking-tighter text-foreground">Inventory Watchlist</CardTitle>
                  <CardDescription className="text-[10px] font-black  uppercase tracking-widest mt-1 text-left">Stock Level Alerts</CardDescription>
                </div>
                <button 
                   onClick={() => navigate(getProductPath(), { state: { filter: 'LOW_STOCK' } })}
                   className="hidden sm:block px-6 py-2.5 bg-muted/50 hover:bg-primary hover:text-primary-foreground rounded-full text-[10px] font-black uppercase tracking-widest border border-border transition-all"
                >
                   Registry
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {lowStock.length > 0 ? (
                <div className="w-full overflow-hidden">
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b border-border/40 h-12">
                        <TableHead className="px-5 font-black text-sm text-foreground/80 uppercase tracking-widest w-[40%]">Product Name</TableHead>
                        <TableHead className="px-5 font-black text-sm text-foreground/80 uppercase tracking-widest text-center w-[25%]">Status</TableHead>
                        <TableHead className="px-5 font-black text-sm text-foreground/80 uppercase tracking-widest text-right w-[35%]">Valuation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStock.slice(0, 6).map((entry) => (
                        <TableRow
                          key={entry.snapshotId || entry.productId}
                          className="hover:bg-muted/50 transition-all border-b border-border/10 h-20 group/row cursor-pointer"
                          onClick={() => navigate(`${getProductPath()}/${entry.productId}`)}
                        >
                           <TableCell className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="min-w-0">
                                <span className="font-black text-xl md:text-2xl block leading-tight text-foreground group-hover/row:translate-x-1 transition-all truncate tracking-tighter">{entry.productName || 'Unnamed SKU'}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 md:px-6 py-4 text-center">
                            <span className="inline-flex items-center px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wide bg-rose-500/10 text-rose-600 dark:text-rose-500 border border-rose-500/20 shadow-sm whitespace-nowrap">
                              {entry.quantity} Items Left
                            </span>
                          </TableCell>
                          <TableCell className="px-5 py-3 text-right">
                             <p className="font-black text-2xl md:text-3xl tabular-nums tracking-tighter leading-none whitespace-nowrap text-foreground">{formatCurrency(entry.stockValue)}</p>
                             <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mt-1.5 truncate">Total Worth</p>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-24 text-center flex flex-col items-center gap-6 px-6">
                  <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center text-muted-foreground/20 border border-dashed border-border">
                    <PackageIcon className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-[11px] uppercase tracking-wider text-foreground">Inventory Secure</p>
                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-wider opacity-40">No Critical Level Violations Detected</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <WarehouseDistributionWidget warehouses={warehouses} userRole={role} />
          <SupplierPerformanceWidget suppliers={suppliers} orders={orders} />
        </div>

        {/* --- Insights Column --- */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-[2.5rem] border border-border/90 bg-primary/[0.01] backdrop-blur-xl shadow-sm overflow-hidden flex flex-col group">
            <CardHeader className="bg-muted/5 p-5 relative text-left">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:bg-primary/10 transition-colors" />
              <div className="flex items-center gap-5 relative">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner shrink-0">
                  <Analytics01Icon className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl md:text-2xl font-bold tracking-tight">Storage Usage</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative h-80 flex items-center justify-center overflow-hidden">
                {(() => {
                  const totalCap = warehouses.reduce((acc, w) => acc + w.capacity, 0);
                  const usedCap = warehouses.reduce((acc, w) => acc + w.usedCapacity, 0);
                  const utilPercent = totalCap > 0 ? Math.round((usedCap / totalCap) * 100) : 0;
                  
                  return (
                    <div className="relative group/chart scale-125">
                      <svg className="w-64 h-64 transform -rotate-90">
                        <circle cx="128" cy="128" r="114" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-muted/10" />
                        <circle cx="128" cy="128" r="114" stroke="currentColor" strokeWidth="16" fill="transparent" 
                          strokeDasharray={716} strokeDashoffset={716 - (716 * utilPercent) / 100} 
                          strokeLinecap="round" className={cn(
                            "transition-all duration-1000",
                            utilPercent > 80 
                              ? "text-rose-400 shadow-[0_0_40px_rgba(244,114,182,0.3)]" 
                              : "text-primary shadow-[0_0_35px_rgba(var(--primary),0.4)]"
                          )} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xs font-black text-foreground/60 uppercase tracking-widest mb-3">Warehouse Fill</span>
                        <span className={cn("text-7xl font-black tabular-nums tracking-tighter", utilPercent > 80 ? "text-rose-500" : "text-foreground")}>{utilPercent}%</span>
                        <div className="mt-6 px-5 py-2 rounded-full bg-muted/40 border border-border/60 shadow-inner">
                           <p className="text-[11px] font-black uppercase tracking-widest text-foreground/80">
                             {usedCap.toLocaleString()} / {totalCap.toLocaleString()} Units
                           </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          <StockVelocityWidget products={products} movements={movements} />
        </div>
      </div>

      <ValuationBreakdownModal 
        isOpen={showValuationModal} 
        onClose={() => setShowValuationModal(false)} 
        totalValue={totalValue || 0} 
        details={valuationDetails} 
      />

      <SpendAnalysisModal 
        isOpen={showSpendModal} 
        onClose={() => setShowSpendModal(false)} 
        summary={poSummary} 
      />

      <RiskAnalysisModal 
        isOpen={showLowStockModal} 
        onClose={() => setShowLowStockModal(false)} 
        lowStock={lowStock} 
      />
    </div>
  );
}
