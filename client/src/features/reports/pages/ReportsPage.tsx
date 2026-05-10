import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { reportsApi } from "@/features/reports/api/reports.api";
import type { InventorySnapshot, POSummary } from "@/features/reports/types";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { Role } from "@/types";
import {
  Alert02Icon,
  Analytics01Icon,
  ArrowReloadHorizontalIcon,
  ArrowRight01Icon,
  Chart01Icon,
  PackageIcon,
  ShoppingBasket01Icon
} from "hugeicons-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function ReportsPage() {
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [lowStock, setLowStock] = useState<InventorySnapshot[]>([]);
  const [valuationDetails, setValuationDetails] = useState<InventorySnapshot[]>([]);
  const [topMoving, setTopMoving] = useState<number[]>([]);
  const [slowMoving, setSlowMoving] = useState<number[]>([]);
  const [deadStock, setDeadStock] = useState<number[]>([]);
  const [poSummary, setPoSummary] = useState<POSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showValuationModal, setShowValuationModal] = useState(false);
  const [showSpendModal, setShowSpendModal] = useState(false);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  
  const formatINR = (num: number) => {
    if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(2)} L`;
    return num.toLocaleString('en-IN');
  };

  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = user?.role || Role.STAFF;

  const getRolePath = (suffix: string) => {
    const base = role === Role.ADMIN ? '/admin' : 
                 role === Role.MANAGER ? '/manager' :
                 role === Role.OFFICER ? '/purchase' : '/warehouse';
    return `${base}${suffix}`;
  };

  const load = async (isManual = false) => {
    setLoading(true);
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    try {
      if (isManual) {
        await reportsApi.sync();
      }
      
      const results = await Promise.allSettled([
        reportsApi.getTotalValue().then(setTotalValue),
        reportsApi.getLowStockReport().then(setLowStock),
        reportsApi.getValuationDetails().then(setValuationDetails),
        reportsApi.getTopMoving(10).then(setTopMoving),
        reportsApi.getSlowMoving(10).then(setSlowMoving),
        reportsApi.getDeadStock().then(setDeadStock),
        reportsApi.getPOSummary(start, end).then(setPoSummary),
      ]);

      if (results.some((result) => result.status === "rejected")) {
        showToast.error("Some report widgets could not be loaded.");
      }
    } catch (e) {
      showToast.error("Analytics sync failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      {/* --- Header Section --- */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
            Intelligence & Analytics
          </h1>
          <p className="text-muted-foreground font-medium">
            Strategic insights for global inventory and procurement efficiency.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-2xl h-12 px-6 border-border/40 bg-card/50 hover:bg-card shadow-sm transition-all active:scale-95" 
            onClick={() => load(true)} 
            disabled={loading}
          >
            <ArrowReloadHorizontalIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync Real-time Data
          </Button>
        </div>
      </div>

      {/* --- Metric Overview --- */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          label="Total Valuation" 
          value={totalValue !== null ? `₹${formatINR(totalValue)}` : '...'} 
          hint="System-wide" 
          info="Current market value of all on-hand inventory across all global distribution centers."
          icon={Chart01Icon} 
          onClick={() => setShowValuationModal(true)}
          color="primary"
        />
        <MetricCard 
          label="Risk Coverage" 
          value={String(lowStock.length)} 
          hint="Restock Required" 
          info="Number of products whose current stock level is at or below their defined reorder point."
          icon={Alert02Icon} 
          color="destructive"
          onClick={() => navigate(getRolePath('/alerts'))}
        />
        <MetricCard 
          label="Monthly Spend" 
          value={poSummary && poSummary.totalAmount !== undefined ? `₹${formatINR(poSummary.totalAmount)}` : '₹0.00'} 
          hint="Past 30 Days" 
          info="Total value of all approved purchase orders issued in the last 30 days."
          icon={ShoppingBasket01Icon} 
          color="emerald"
          onClick={() => setShowSpendModal(true)}
        />
        <MetricCard 
          label="Procurement" 
          value={String(poSummary?.totalOrders || 0)} 
          hint="Orders Processed" 
          info="The count of purchase orders created within the selected period."
          icon={PackageIcon} 
          color="amber"
          onClick={() => navigate(getRolePath('/purchase-orders'))}
        />
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
        {/* --- Main Content Area --- */}
        <div className="space-y-12">
          <Card className="rounded-[2.5rem] border-transparent bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/5">
            <CardHeader className="p-10 border-b border-border/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black">Low Stock Watchlist</CardTitle>
                <CardDescription className="text-muted-foreground/80 mt-1">Critical items requiring immediate replenishment.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="rounded-2xl bg-muted/50" onClick={() => navigate(getRolePath('/alerts'))}>
                <ArrowRight01Icon className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {lowStock.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/10 border-b border-border/40 text-left">
                        <th className="px-10 py-5 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Product</th>
                        <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Location</th>
                        <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px] text-muted-foreground text-center">Status</th>
                        <th className="px-10 py-5 font-bold uppercase tracking-widest text-[10px] text-muted-foreground text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {lowStock.map((entry) => (
                        <tr 
                          key={entry.snapshotId || entry.productId} 
                          className="hover:bg-primary/5 transition-all cursor-pointer group"
                          onClick={() => navigate(getRolePath('/products'))}
                        >
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-black text-muted-foreground/30 tracking-tighter shrink-0">
                                #{entry.productId}
                              </span>
                              <span className="font-bold tracking-tight whitespace-nowrap truncate max-w-[200px]">{entry.productName || 'Catalogue Item'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-6 text-muted-foreground font-medium whitespace-nowrap">
                            {entry.warehouseId === 0 ? "All Distribution Centers" : `Warehouse #${entry.warehouseId}`}
                          </td>
                          <td className="px-6 py-6 text-center">
                            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-destructive/10 text-destructive border border-destructive/10 whitespace-nowrap">
                              {entry.quantity} units left
                            </span>
                          </td>
                          <td className="px-10 py-6 text-right font-black text-base">
                            ₹{entry.stockValue.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-24 text-center space-y-4 opacity-50">
                   <PackageIcon className="w-16 h-16 mx-auto text-muted-foreground/30" />
                   <p className="font-bold tracking-tight text-lg">No stock-outs detected.</p>
                   <p className="text-sm">All inventory levels are within safe operating limits.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* --- Side Panel --- */}
        <div className="space-y-8">
          <Card className="rounded-[2.5rem] border-transparent bg-card/40 backdrop-blur-xl shadow-lg ring-1 ring-white/5">
            <CardHeader className="p-8">
              <div className="flex items-center gap-3 mb-1">
                 <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                   <Analytics01Icon className="w-5 h-5" />
                 </div>
                 <CardTitle className="text-xl font-black">Performance</CardTitle>
              </div>
              <CardDescription>Real-time movement velocity.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-8">
              <VelocityGroup label="Top-Moving SKUs" ids={topMoving} variant="primary" />
              <VelocityGroup label="Slow-Moving" ids={slowMoving} variant="warning" />
              <VelocityGroup label="Dead Stock" ids={deadStock} variant="destructive" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- Detailed Breakdown Modals --- */}
      <Modal 
        isOpen={showValuationModal} 
        onClose={() => setShowValuationModal(false)} 
        title="Inventory Asset Breakdown"
        className="max-w-3xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Total Assets</p>
              <p className="text-3xl font-black tracking-tight">₹{totalValue?.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-6 rounded-3xl bg-muted/5 border border-border/40">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">SKU Count</p>
              <p className="text-3xl font-black tracking-tight">{valuationDetails.length} Unique IDs</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {valuationDetails.map(entry => (
              <div key={entry.productId} className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-border/30 hover:border-primary/30 transition-all cursor-default group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">#{entry.productId}</div>
                  <div>
                    <p className="font-bold group-hover:text-primary transition-colors">{entry.productName || 'Direct Catalogue Item'}</p>
                    <p className="text-xs text-muted-foreground font-medium">{entry.quantity} units currently on-hand</p>
                  </div>
                </div>
                <p className="text-lg font-black tracking-tighter">₹{entry.stockValue.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={showSpendModal} 
        onClose={() => setShowSpendModal(false)} 
        title="Procurement Spend Analysis"
        className="max-w-3xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Approved Spend</p>
              <p className="text-3xl font-black tracking-tight text-emerald-600">₹{(poSummary?.totalAmount || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="p-6 rounded-3xl bg-muted/5 border border-border/40">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Orders</p>
              <p className="text-3xl font-black tracking-tight">{poSummary?.totalOrders || 0}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {poSummary?.orders && poSummary.orders.length > 0 ? poSummary.orders.map(po => (
              <div key={po.orderId} className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-border/30 hover:border-emerald-500/30 transition-all cursor-default group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-600">#{po.orderId}</div>
                  <div>
                    <p className="font-bold group-hover:text-emerald-600 transition-colors">{po.supplierName || `Supplier #${po.supplierId}`}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
                        ["APPROVED", "FULLY_RECEIVED", "PARTIALLY_RECEIVED"].includes(po.status) 
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      )}>
                        {po.status.replace('_', ' ')}
                      </span>
                      <span className="text-[8px] text-muted-foreground font-bold">{new Date(po.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <p className="text-lg font-black tracking-tighter text-emerald-600">₹{po.totalAmount.toLocaleString('en-IN')}</p>
              </div>
            )) : (
              <div className="py-16 text-center text-muted-foreground opacity-50 italic">
                No orders identified for this period.
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={showLowStockModal} 
        onClose={() => setShowLowStockModal(false)} 
        title="Inventory Risk Analysis"
        className="max-w-3xl"
      >
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Critical Shortages</p>
            <p className="text-3xl font-black tracking-tight text-amber-600">{lowStock.length} Items Below Threshold</p>
          </div>
          
          <div className="space-y-3">
            {lowStock.length > 0 ? lowStock.map(item => (
              <div key={item.productId} className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-border/30 hover:border-amber-500/30 transition-all cursor-default group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center font-bold text-amber-600">#{item.productId}</div>
                  <div>
                    <p className="font-bold group-hover:text-amber-600 transition-colors">{item.productName || 'Direct Catalogue Item'}</p>
                    <p className="text-xs text-muted-foreground font-medium">Currently {item.quantity} units in stock</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20">Action Required</span>
                </div>
              </div>
            )) : (
              <div className="py-16 text-center text-muted-foreground opacity-50 italic">
                No critical stock risks detected. System is stable.
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

const MetricCard = ({ label, value, hint, info, icon: Icon, color = 'primary', onClick }: any) => {
  const colorVariants: any = {
    primary: 'text-primary bg-primary/10 border-primary/20 hover:shadow-primary/10 shadow-[0_0_40px_-15px_rgba(var(--primary-rgb),0.2)]',
    destructive: 'text-destructive bg-destructive/10 border-destructive/20 hover:shadow-destructive/10',
    emerald: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20 hover:shadow-emerald-500/10',
    amber: 'text-amber-600 bg-amber-500/10 border-amber-500/20 hover:shadow-amber-500/10'
  };

  return (
    <Card 
      className={`
        relative overflow-hidden group cursor-pointer transition-all duration-500
        rounded-[2.5rem] border border-border/40 bg-card/60 backdrop-blur-xl
        hover:-translate-y-2 hover:bg-card
        ${colorVariants[color]}
      `}
      onClick={onClick}
    >
      <CardContent className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="p-3.5 rounded-2xl bg-current/10 transition-transform duration-500 group-hover:scale-110">
            <Icon className="w-6 h-6" />
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">{label}</p>
             <p className="text-[10px] font-bold text-muted-foreground/40 mt-0.5">{hint}</p>
          </div>
        </div>
        
        <div className="space-y-2 flex-grow">
          <h3 className="text-4xl font-black tracking-tighter transition-all group-hover:tracking-normal">{value}</h3>
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed font-medium">
            {info}
          </p>
        </div>

        <div className="mt-6 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
          Analyze Details <ArrowRight01Icon className="w-3 h-3" />
        </div>
      </CardContent>
    </Card>
  );
};

const VelocityGroup = ({ label, ids, variant }: { label: string, ids: number[], variant: string }) => {
  const colors: any = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20'
  };

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {ids.length > 0 ? ids.map(id => (
          <span 
            key={id} 
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all hover:scale-105 cursor-default ${colors[variant]}`}
          >
            #{id}
          </span>
        )) : (
          <span className="text-xs text-muted-foreground italic pl-1">No activity detected</span>
        )}
      </div>
    </div>
  );
};
