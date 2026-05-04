import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert02Icon,
  ArrowLeftRightIcon,
  Chart01Icon,
  Clock01Icon,
  DeliveryBox01Icon,
  PackageIcon,
  Shield01Icon,
  ShoppingBasket01Icon,
  UserGroupIcon,
  WarehouseIcon,
  ArrowRight01Icon,
  PackageReceiveIcon,
  PackageMovingIcon,
  Task01Icon,
  StarsIcon,
  Add01Icon
} from "hugeicons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import { alertsApi } from "@/features/alerts/api/alerts.api";
import { authApi } from "@/features/auth/api/auth.api";
import { purchasesApi } from "@/features/purchases/api";
import { reportsApi } from "@/features/reports/api/reports.api";
import { warehousesApi } from "@/features/warehouses/api";
import { productsApi } from "@/features/products/api";
import { Role, type Role as RoleType } from "@/types";
import { AlertSeverity, PurchaseOrderStatus } from "@/types/enums";
import type { Alert, PurchaseOrder, User, Warehouse, Product } from "@/types";

export const DashboardPage = ({ role }: { role: RoleType }) => {
  const [loading, setLoading] = useState(false);
  
  // Shared Data
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  // Analytics Data
  const [totalValue, setTotalValue] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const [alertsRes, ordersRes, productsRes, warehousesRes, valueRes] = await Promise.allSettled([
        alertsApi.getAll(),
        purchasesApi.getAll(),
        productsApi.getAll(),
        warehousesApi.getAll(),
        reportsApi.getTotalValue()
      ]);

      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value);
      if (productsRes.status === 'fulfilled') setProducts(productsRes.value);
      if (warehousesRes.status === 'fulfilled') setWarehouses(warehousesRes.value);
      if (valueRes.status === 'fulfilled') setTotalValue(valueRes.value);

    } catch (error) {
      showToast.error('Failed to sync dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const metrics = useMemo(() => {
    const criticalAlerts = alerts.filter(a => a.severity === AlertSeverity.CRITICAL && !a.acknowledged).length;
    const pendingPOs = orders.filter(o => o.status === PurchaseOrderStatus.PENDING_APPROVAL).length;
    const lowStockItems = products.filter(p => p.currentQuantity <= p.reorderLevel).length;
    const activeOrders = orders.filter(o => o.status === PurchaseOrderStatus.APPROVED || o.status === PurchaseOrderStatus.PARTIALLY_RECEIVED).length;

    return { criticalAlerts, pendingPOs, lowStockItems, activeOrders };
  }, [alerts, orders, products]);

  // --- ROLE SPECIFIC VIEWS ---

  const AdminDashboard = () => (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="System Value" value={`₹${(totalValue/1000000).toFixed(2)}M`} hint="Across all warehouses" icon={Chart01Icon} />
        <MetricCard label="User Base" value={String(metrics.criticalAlerts)} hint="Critical alerts pending" icon={UserGroupIcon} color="destructive" />
        <MetricCard label="Global Stock" value={String(products.length)} hint="Total SKUs managed" icon={PackageIcon} />
        <MetricCard label="Warehouses" value={String(warehouses.length)} hint="Active storage sites" icon={WarehouseIcon} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <QuickActionCard 
          title="Administrative Controls" 
          description="Manage security, access, and system infrastructure."
          actions={[
            { label: 'User Directory', path: '/admin/users', icon: UserGroupIcon },
            { label: 'Warehouse Setup', path: '/admin/warehouses', icon: WarehouseIcon },
            { label: 'Audit Logs', path: '/admin/alerts', icon: Shield01Icon },
            { label: 'System Analytics', path: '/admin/analytics', icon: Chart01Icon },
          ]}
        />
        <RecentAlertsWidget alerts={alerts.slice(0, 5)} />
      </div>
    </div>
  );

  const StaffDashboard = () => (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="To Receive" value={String(metrics.activeOrders)} hint="Pending deliveries" icon={PackageReceiveIcon} color="primary" />
        <MetricCard label="Low Stock" value={String(metrics.lowStockItems)} hint="Action required" icon={Alert02Icon} color="warning" />
        <MetricCard label="Daily Tasks" value="12" hint="Assignments for today" icon={Task01Icon} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle>Inventory Operations</CardTitle>
              <CardDescription>Primary workflows for warehouse personnel.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <OperationTile 
                  to="/warehouse/receive" 
                  title="Receive Goods" 
                  desc="Log incoming shipments (GRN)" 
                  icon={PackageReceiveIcon} 
                />
                <OperationTile 
                  to="/warehouse/issue" 
                  title="Issue Stock" 
                  desc="Outbound sales or production" 
                  icon={PackageMovingIcon} 
                />
                <OperationTile 
                  to="/warehouse/transfer" 
                  title="Stock Transfer" 
                  desc="Move items between sites" 
                  icon={ArrowLeftRightIcon} 
                />
                <OperationTile 
                  to="/warehouse/products" 
                  title="Stock Lookup" 
                  desc="Check levels and locations" 
                  icon={PackageIcon} 
                />
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="rounded-3xl border-transparent bg-muted/40 shadow-none border-none">
          <CardHeader>
            <CardTitle className="text-sm">Assigned Warehouses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {warehouses.map(wh => (
              <div key={wh.warehouseId} className="p-4 rounded-2xl bg-background/60 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">{wh.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{wh.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-primary">{Math.round((wh.usedCapacity/wh.capacity)*100)}%</p>
                  <div className="w-16 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: `${(wh.usedCapacity/wh.capacity)*100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const OfficerDashboard = () => (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Pending Approval" value={String(metrics.pendingPOs)} hint="Awaiting manager sign-off" icon={Clock01Icon} color="warning" />
        <MetricCard label="Active POs" value={String(metrics.activeOrders)} hint="In-flight procurement" icon={ShoppingBasket01Icon} />
        <MetricCard label="Open Requirements" value={String(metrics.lowStockItems)} hint="Products below reorder" icon={Alert02Icon} />
        <MetricCard label="Suppliers" value="24" hint="Registered partners" icon={UserGroupIcon} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <CardTitle>Procurement Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {orders.slice(0, 5).map(o => (
                <div key={o.poId} className="p-5 flex items-center justify-between hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                      <ShoppingBasket01Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">PO #{o.poId} · {o.supplierName}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{new Date(o.orderDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-muted text-[10px] font-bold text-muted-foreground uppercase">{o.status}</span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-muted/20 text-center">
              <Link to="/purchase/orders" className="text-xs font-bold text-primary hover:underline">View All Purchase Orders</Link>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
           <OperationTile to="/purchase/orders" title="Create New PO" desc="Raise a new supply requirement" icon={Add01Icon} featured />
           <OperationTile to="/purchase/suppliers" title="Manage Suppliers" desc="Partner onboarding & performance" icon={StarsIcon} />
        </div>
      </div>
    </div>
  );

  const ManagerDashboard = () => (
    <div className="space-y-8">
       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Valuation" value={`₹${(totalValue/1000000).toFixed(2)}M`} hint="System-wide inventory" icon={Chart01Icon} />
        <MetricCard label="Approvals" value={String(metrics.pendingPOs)} hint="Pending PO approvals" icon={Task01Icon} color={metrics.pendingPOs > 0 ? 'warning' : 'primary'} />
        <MetricCard label="Stock Risk" value={String(metrics.lowStockItems)} hint="Items below reorder level" icon={Alert02Icon} color="destructive" />
        <MetricCard label="Active Items" value={String(products.length)} hint="Catalogue size" icon={PackageIcon} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm overflow-hidden">
           <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle>Governance & Analytics</CardTitle>
           </CardHeader>
           <CardContent className="p-8">
              <div className="grid gap-6 sm:grid-cols-2">
                 <OperationTile to="/manager/products" title="Product Catalogue" desc="Master data & pricing" icon={PackageIcon} />
                 <OperationTile to="/manager/reports" title="Executive Reports" desc="Valuation & movements" icon={Chart01Icon} />
                 <OperationTile to="/manager/stock" title="Warehouse Health" desc="Utilization & levels" icon={WarehouseIcon} />
                 <OperationTile to="/manager/alerts" title="Incident Center" desc="Exceptions & thresholds" icon={Alert02Icon} />
              </div>
           </CardContent>
        </Card>
        <RecentAlertsWidget alerts={alerts.slice(0, 8)} />
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight">
            {role === Role.ADMIN ? 'Command Center' : 
             role === Role.MANAGER ? 'Management Suite' : 
             role === Role.OFFICER ? 'Procurement Desk' : 'Operations Desk'}
          </h1>
          <p className="mt-2 text-muted-foreground font-medium">
            Welcome back. Here is what's happening in your workspace today.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={loadData} className="rounded-2xl h-12 w-12" disabled={loading}>
           <ArrowRight01Icon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {role === Role.ADMIN && <AdminDashboard />}
      {role === Role.MANAGER && <ManagerDashboard />}
      {role === Role.OFFICER && <OfficerDashboard />}
      {role === Role.STAFF && <StaffDashboard />}
    </div>
  );
};

// --- HELPER COMPONENTS ---

const MetricCard = ({ label, value, hint, icon: Icon, color = 'primary' }: { 
  label: string, value: string, hint: string, icon: any, color?: 'primary' | 'destructive' | 'warning' 
}) => {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    destructive: 'bg-destructive/10 text-destructive',
    warning: 'bg-amber-500/10 text-amber-600',
  };

  return (
    <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm border-none">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</p>
          <div className={`p-2 rounded-xl ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <p className="text-3xl font-black tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-1 font-medium">{hint}</p>
      </CardContent>
    </Card>
  );
};

const OperationTile = ({ to, title, desc, icon: Icon, featured = false }: { to: string, title: string, desc: string, icon: any, featured?: boolean }) => (
  <Link to={to} className="group block">
    <div className={`p-6 rounded-3xl transition-all duration-300 border border-transparent ${
      featured 
      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02]' 
      : 'bg-muted/40 hover:bg-card hover:shadow-md hover:border-border/50'
    }`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
        featured ? 'bg-white/20' : 'bg-primary/10 text-primary'
      }`}>
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="font-bold text-lg">{title}</h4>
      <p className={`text-xs mt-1 leading-relaxed ${featured ? 'text-white/70' : 'text-muted-foreground'}`}>{desc}</p>
    </div>
  </Link>
);

const QuickActionCard = ({ title, description, actions }: { title: string, description: string, actions: any[] }) => (
  <Card className="rounded-4xl border-transparent bg-card/80 shadow-sm overflow-hidden">
    <CardHeader className="bg-muted/30 border-b border-border/50 p-8">
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        {actions.map(a => (
          <Link key={a.path} to={a.path} className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 hover:bg-primary/5 hover:text-primary transition-all group font-bold text-sm">
            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <a.icon className="w-4 h-4" />
            </div>
            {a.label}
          </Link>
        ))}
      </div>
    </CardContent>
  </Card>
);

const RecentAlertsWidget = ({ alerts }: { alerts: Alert[] }) => (
  <Card className="rounded-4xl border-transparent bg-card/80 shadow-sm overflow-hidden">
    <CardHeader className="p-8 pb-4">
      <div className="flex items-center justify-between">
        <CardTitle>System Feed</CardTitle>
        <span className="text-[10px] font-bold uppercase bg-destructive/10 text-destructive px-2 py-0.5 rounded-md">Live</span>
      </div>
    </CardHeader>
    <CardContent className="p-0">
      <div className="max-h-[400px] overflow-y-auto">
        {alerts.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground italic">No system notifications at this time.</p>
        ) : (
          <div className="divide-y divide-border/30">
            {alerts.map(a => (
              <div key={a.alertId} className="p-6 hover:bg-muted/10 transition-colors">
                <div className="flex gap-4">
                  <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                    a.severity === AlertSeverity.CRITICAL ? 'bg-destructive' :
                    a.severity === AlertSeverity.WARNING ? 'bg-amber-500' : 'bg-primary'
                  }`} />
                  <div>
                    <p className="text-sm font-bold leading-tight">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.message}</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-2 font-bold uppercase">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

