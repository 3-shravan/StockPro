import { useEffect, useState } from "react";
import { 
  ArrowReloadHorizontalIcon,
  Chart01Icon,
  Alert02Icon,
  ShoppingBasket01Icon,
  PackageIcon,
  Analytics01Icon,
  Download01Icon
} from "hugeicons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import { reportsApi } from "@/features/reports/api/reports.api";
import type { InventorySnapshot, POSummary } from "@/features/reports/types";

export function ReportsPage() {
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [lowStock, setLowStock] = useState<InventorySnapshot[]>([]);
  const [topMoving, setTopMoving] = useState<number[]>([]);
  const [slowMoving, setSlowMoving] = useState<number[]>([]);
  const [deadStock, setDeadStock] = useState<number[]>([]);
  const [poSummary, setPoSummary] = useState<POSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    try {
      const results = await Promise.allSettled([
        reportsApi.getTotalValue().then(setTotalValue),
        reportsApi.getLowStockReport().then(setLowStock),
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Intelligence & Analytics</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Monitor inventory velocity, valuation, and procurement performance.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl h-10 px-4" onClick={load} disabled={loading}>
            <ArrowReloadHorizontalIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="rounded-xl h-10 px-4">
            <Download01Icon className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricSummary 
          label="Total Valuation" 
          value={totalValue ? `₹${(totalValue/1000000).toFixed(2)}M` : '...'} 
          hint="Sum of all warehouses" 
          icon={Chart01Icon} 
        />
        <MetricSummary 
          label="Risk Coverage" 
          value={String(lowStock.length)} 
          hint="Items below reorder level" 
          icon={Alert02Icon} 
          color="destructive"
        />
        <MetricSummary 
          label="Monthly Spend" 
          value={poSummary ? `₹${(poSummary.totalAmount/1000).toFixed(1)}K` : '...'} 
          hint="Past 30 days" 
          icon={ShoppingBasket01Icon} 
        />
        <MetricSummary 
          label="Procurement" 
          value={String(poSummary?.totalOrders || 0)} 
          hint="Total POs issued" 
          icon={PackageIcon} 
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <CardTitle>Low Stock Inventory Watchlist</CardTitle>
              <CardDescription>Critical stock-outs across all locations.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {lowStock.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/20 border-b border-border/50 text-left">
                        <th className="px-6 py-4 font-semibold">Product ID</th>
                        <th className="px-6 py-4 font-semibold">Warehouse</th>
                        <th className="px-6 py-4 text-center font-semibold">Quantity</th>
                        <th className="px-6 py-4 text-right font-semibold">Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {lowStock.map((entry) => (
                        <tr key={entry.snapshotId} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4 font-bold text-primary">#{entry.productId}</td>
                          <td className="px-6 py-4 text-muted-foreground">WH #{entry.warehouseId}</td>
                          <td className="px-6 py-4 text-center font-black">{entry.quantity}</td>
                          <td className="px-6 py-4 text-right font-bold">₹{entry.stockValue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-20 text-center opacity-30">
                   <PackageIcon className="w-12 h-12 mx-auto mb-2" />
                   <p className="font-medium">No low-stock alerts detected.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                 <Chart01Icon className="w-5 h-5 text-emerald-600" />
                 <CardTitle className="text-lg">Velocity Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <VelocityList label="Top-Moving SKUs" ids={topMoving} color="primary" />
              <VelocityList label="Slow-Moving SKUs" ids={slowMoving} color="warning" />
              <VelocityList label="Dead Stock (90d+)" ids={deadStock} color="destructive" />
            </CardContent>
          </Card>

          <div className="p-8 rounded-3xl bg-primary shadow-lg shadow-primary/20 text-primary-foreground relative overflow-hidden">
             <Analytics01Icon className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
             <h3 className="font-bold text-lg mb-2">Need Custom Data?</h3>
             <p className="text-sm text-white/70 mb-6">Our analytics engine can generate specialized reports for tax compliance and audit cycles.</p>
             <Button variant="outline" className="w-full bg-white/10 border-white/20 hover:bg-white/20 text-white rounded-xl">
                Contact Data Science
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const MetricSummary = ({ label, value, hint, icon: Icon, color = 'primary' }: any) => {
  const colors = {
    primary: 'text-primary bg-primary/10',
    destructive: 'text-destructive bg-destructive/10',
    warning: 'text-amber-600 bg-amber-500/10'
  };
  return (
    <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</p>
           <div className={`p-2 rounded-xl ${colors[color as keyof typeof colors]}`}>
              <Icon className="w-5 h-5" />
           </div>
        </div>
        <p className="text-3xl font-black tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-1 font-medium">{hint}</p>
      </CardContent>
    </Card>
  );
};

const VelocityList = ({ label, ids, color }: { label: string, ids: number[], color: string }) => {
  const badgeColors = {
    primary: 'bg-primary/10 text-primary',
    warning: 'bg-amber-500/10 text-amber-600',
    destructive: 'bg-destructive/10 text-destructive'
  };
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {ids.length > 0 ? ids.map(id => (
          <span key={id} className={`px-2 py-1 rounded-lg text-xs font-bold border border-transparent hover:border-current transition-all cursor-default ${badgeColors[color as keyof typeof badgeColors]}`}>
            #{id}
          </span>
        )) : (
          <span className="text-xs text-muted-foreground italic px-1">None detected</span>
        )}
      </div>
    </div>
  );
};
