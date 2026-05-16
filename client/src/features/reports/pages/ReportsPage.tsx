import { useAuthStore } from "@/stores/auth.store";
import { Role } from "@/types";
import {
  PackageIcon,
  ShoppingBasket01Icon,
  Chart01Icon,
  ArrowReloadHorizontalIcon,
  Alert02Icon,
  Analytics01Icon,
  FilterIcon
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
import { useState, useMemo } from "react";
import { WarehouseDistributionWidget } from "@/features/dashboard/components/WarehouseDistributionWidget";

export function ReportsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = user?.role || Role.STAFF;

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);

  const {
    loading,
    totalValue,
    lowStock,
    valuationDetails,
    poSummary,
    warehouses,
    refresh
  } = useReportsData(selectedWarehouseId);

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

  const activeWarehouse = useMemo(() => {
    if (!selectedWarehouseId) return null;
    return warehouses.find(w => w.warehouseId === selectedWarehouseId);
  }, [selectedWarehouseId, warehouses]);

  const activeWarehouseName = activeWarehouse?.name || "Global Network";

  const PageHeader = () => (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between pt-4 mb-12">
      <div className="text-left">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">
            {selectedWarehouseId ? `Location: ${activeWarehouseName}` : "Report Center"}
          </p>
          {selectedWarehouseId && activeWarehouse && (
            <div className={cn(
              "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
              activeWarehouse.active ? "bg-primary/10 text-primary border-primary/20" : "bg-status-error/10 text-status-error border-status-error/20"
            )}>
              {activeWarehouse.active ? "Active" : "Suspended"}
            </div>
          )}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground text-left">
          {role === Role.ADMIN
            ? (selectedWarehouseId ? "Location Reports" : "System Overview")
            : role === Role.MANAGER ? "Operations" : "Purchasing"}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {(role === Role.ADMIN || (role === Role.MANAGER && warehouses.length > 1)) && (
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-foreground/40 group-hover:text-primary transition-colors">
              <FilterIcon className="w-4 h-4" />
            </div>
            <select
              value={selectedWarehouseId || ""}
              onChange={(e) => setSelectedWarehouseId(e.target.value ? Number(e.target.value) : null)}
              className="h-14 pl-12 pr-10 rounded-full bg-card/40 border border-border/60 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer hover:bg-card/60 min-w-[220px]"
            >
              <option value="">{role === Role.ADMIN ? "All Locations" : "All Managed Locations"}</option>
              {warehouses.map(w => (
                <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-foreground/20">
              <ArrowReloadHorizontalIcon className="w-3 h-3 rotate-90" />
            </div>
          </div>
        )}

        <button
          className="w-14 h-14 flex items-center justify-center bg-card/40 hover:bg-primary hover:text-white rounded-full border border-border/60 shadow-app-subtle transition-all active:scale-95 text-foreground/60 backdrop-blur-md"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportMetricCard
          label={selectedWarehouseId || role === Role.MANAGER ? "Stock Value" : "Total Stock Value"}
          value={totalValue !== null ? formatCurrency(totalValue) : '...'}
          hint={selectedWarehouseId ? "Inventory value for this location" : "Total inventory value"}
          icon={Chart01Icon}
          onClick={() => setShowValuationModal(true)}
          color="primary"
        />
        <ReportMetricCard
          label={selectedWarehouseId || role === Role.MANAGER ? "Low Stock" : "Low Stock Items"}
          value={String(lowStock.length)}
          hint={selectedWarehouseId ? "Items below reorder level here" : "Items below reorder level globally"}
          icon={Alert02Icon}
          color="destructive"
          onClick={() => navigate(getProductPath(), { state: { filter: 'LOW_STOCK' } })}
        />
        <ReportMetricCard
          label={selectedWarehouseId || role === Role.MANAGER ? "Purchasing" : "Total Purchasing"}
          value={poSummary && poSummary.totalAmount !== undefined ? formatCurrency(poSummary.totalAmount) : '₹0'}
          hint={selectedWarehouseId ? "Spend for this location" : "Total spend across system"}
          icon={ShoppingBasket01Icon}
          color="warning"
          onClick={() => setShowSpendModal(true)}
        />
        <ReportMetricCard
          label={selectedWarehouseId || role === Role.MANAGER ? "Purchase Orders" : "System Activity"}
          value={String(poSummary?.totalOrders || 0)}
          hint={selectedWarehouseId ? "Orders for this location" : "Total system orders"}
          icon={PackageIcon}
          color="primary"
          onClick={() => navigate(getRolePath('/purchase-orders'))}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* --- Main Analytics Column --- */}
        <div className="lg:col-span-7 space-y-8">
          <Card className="rounded-[2.5rem] border border-border/60 bg-status-error/[0.02] dark:bg-status-error/[0.05] backdrop-blur-xl shadow-app-card overflow-hidden flex flex-col group relative">
            <div className="absolute top-0 left-0 w-32 h-32 bg-status-error/10 blur-[60px] -ml-16 -mt-16 rounded-full pointer-events-none" />
            <CardHeader className="bg-muted/5 border-b border-border/10 p-5 pb-2 relative text-left">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:bg-primary/10 transition-colors" />
              <div className="flex items-center justify-between relative">
                <div>
                  <CardTitle className="text-lg md:text-2xl font-black tracking-tighter text-foreground">Inventory Status</CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-widest mt-1 text-left">
                    {selectedWarehouseId ? `Location Alerts` : `Inventory Alerts`}
                  </CardDescription>
                </div>
                <button
                  onClick={() => navigate(getProductPath(), { state: { filter: 'LOW_STOCK' } })}
                  className="hidden sm:block px-6 py-2.5 bg-muted/50 hover:bg-primary hover:text-primary-foreground rounded-full text-[10px] font-black uppercase tracking-widest border border-border transition-all"
                >
                  View All
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {lowStock.length > 0 ? (
                <div className="w-full overflow-hidden">
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b border-border/10 h-12">
                        <TableHead className="px-5 text-xs font-black uppercase tracking-widest text-foreground/40 h-12">Product Name</TableHead>
                        <TableHead className="px-5 text-center text-xs font-black uppercase tracking-widest text-foreground/40 h-12">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStock.slice(0, 6).map((entry) => (
                        <TableRow
                          key={entry.snapshotId || entry.productId}
                          className="hover:bg-muted/50 transition-all border-b border-border/10 h-16 group/row cursor-pointer"
                          onClick={() => navigate(`${getProductPath()}/${entry.productId}`)}
                        >
                          <TableCell className="px-5 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-status-error/10 flex items-center justify-center border border-status-error/20 shrink-0">
                                <PackageIcon className="w-5 h-5 text-status-error" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-base md:text-lg block leading-tight text-foreground group-hover/row:translate-x-1 transition-all truncate tracking-tight">{entry.productName || 'Unnamed SKU'}</span>
                                {entry.warehouseId !== 0 && (
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mt-1">
                                    {warehouses.find(w => w.warehouseId === entry.warehouseId)?.name || `Hub ${entry.warehouseId}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-center">
                            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-status-error/5 text-status-error border border-status-error/10 whitespace-nowrap">
                              {entry.quantity} Items Left
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-24 text-center flex flex-col items-center gap-8 px-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150 animate-pulse" />
                    <div className="relative w-20 h-20 bg-card rounded-3xl flex items-center justify-center text-muted-foreground/20 border border-border shadow-inner">
                      <PackageIcon className="w-10 h-10" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="font-black text-xs uppercase tracking-[0.2em] text-foreground">Inventory Normal</p>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-40 max-w-[200px] mx-auto leading-relaxed">
                      All items are above reorder levels.
                    </p>
                  </div>
                  <button
                    onClick={refresh}
                    disabled={loading}
                    className="px-8 py-3 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm active:scale-95"
                  >
                    {loading ? 'Refreshing...' : 'Refresh Data'}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {role === Role.ADMIN && !selectedWarehouseId && (
            <WarehouseDistributionWidget warehouses={warehouses} userRole={role} />
          )}
        </div>

        {/* --- Insights Column --- */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-[2.5rem] border border-border/90 bg-primary/[0.01] backdrop-blur-xl shadow-app-card overflow-hidden flex flex-col group">
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
                  const filteredWarehouses = selectedWarehouseId
                    ? warehouses.filter(w => w.warehouseId === selectedWarehouseId)
                    : warehouses;

                  const totalCap = filteredWarehouses.reduce((acc, w) => acc + w.capacity, 0);
                  const usedCap = filteredWarehouses.reduce((acc, w) => acc + w.usedCapacity, 0);
                  const utilPercent = totalCap > 0 ? Math.round((usedCap / totalCap) * 100) : 0;

                  return (
                    <div className="relative group/chart scale-110">
                      <svg className="w-64 h-64 transform -rotate-90">
                        <circle cx="128" cy="128" r="114" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-muted/10" />
                        <circle cx="128" cy="128" r="114" stroke="currentColor" strokeWidth="16" fill="transparent"
                          strokeDasharray={716} strokeDashoffset={716 - (716 * utilPercent) / 100}
                          strokeLinecap="round" className={cn(
                            "transition-all duration-1000",
                            utilPercent > 80
                              ? "text-status-error shadow-status-error/30"
                              : "text-primary shadow-[0_0_35px_rgba(var(--primary),0.4)]"
                          )} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xs font-black text-foreground/60 uppercase tracking-widest mb-3">
                          {selectedWarehouseId ? "Storage Used" : "Total Storage"}
                        </span>
                        <span className={cn("text-6xl font-black tabular-nums tracking-tighter", utilPercent > 80 ? "text-status-error" : "text-foreground")}>{utilPercent}%</span>
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
