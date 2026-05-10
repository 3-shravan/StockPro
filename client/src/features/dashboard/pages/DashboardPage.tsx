import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { alertsApi } from "@/features/alerts/api/alerts.api";
import { productsApi } from "@/features/products/api";
import { purchasesApi } from "@/features/purchases/api";
import { reportsApi } from "@/features/reports/api/reports.api";
import { suppliersApi } from "@/features/suppliers/api";
import { warehousesApi } from "@/features/warehouses/api";
import { showToast } from "@/lib/toast";
import { cn, formatDate } from "@/lib/utils";
import { Role, type Alert, type Product, type PurchaseOrder, type Role as RoleType, type Supplier, type Warehouse } from "@/types";
import { AlertSeverity, PurchaseOrderStatus } from "@/types/enums";
import {
  Add01Icon,
  Alert02Icon,
  ArrowRight01Icon,
  Chart01Icon,
  Clock01Icon,
  PackageIcon,
  PackageReceiveIcon,
  ShoppingBasket01Icon,
  Task01Icon,
  UserGroupIcon,
  WarehouseIcon
} from "hugeicons-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

export const DashboardPage = ({ role }: { role: RoleType }) => {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  
  // Shared Data
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // Analytics Data
  const [totalValue, setTotalValue] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const isStaff = role === Role.STAFF;
      const isOfficer = role === Role.OFFICER;
      const isAdminOrManager = role === Role.ADMIN || role === Role.MANAGER;

      const [alertsRes, ordersRes, productsRes, warehousesRes, suppliersRes, valueRes] = await Promise.allSettled([
        isAdminOrManager ? alertsApi.getAll() : alertsApi.getByUser(user?.userId || 0),
        isAdminOrManager || isOfficer ? purchasesApi.getAll() : purchasesApi.getByStatus(PurchaseOrderStatus.APPROVED),
        productsApi.getAll(),
        warehousesApi.getAll(),
        suppliersApi.getAll(),
        isAdminOrManager || isOfficer ? reportsApi.getTotalValue() : Promise.resolve(0)
      ]);

      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value);
      if (suppliersRes.status === 'fulfilled') setSuppliers(suppliersRes.value);
      if (ordersRes.status === 'fulfilled') {
        // If Staff, we might also want to fetch Partially Received orders
        if (isStaff) {
          const partiallyReceived = await purchasesApi.getByStatus(PurchaseOrderStatus.PARTIALLY_RECEIVED);
          setOrders([...ordersRes.value, ...partiallyReceived]);
        } else {
          setOrders(ordersRes.value);
        }
      }
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
        <MetricCard label="System Value" value={`₹${(totalValue/1000000).toFixed(2)}M`} hint="Across all warehouses" icon={Chart01Icon} to="/admin/analytics" />
        <MetricCard label="User Base" value={String(metrics.criticalAlerts)} hint="Critical alerts pending" icon={UserGroupIcon} color="destructive" to="/admin/alerts" />
        <MetricCard label="Global Stock" value={String(products.length)} hint="Total SKUs managed" icon={PackageIcon} to="/manager/products" />
        <MetricCard label="Warehouses" value={String(warehouses.length)} hint="Active storage sites" icon={WarehouseIcon} to="/admin/warehouses" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
           <WarehouseDistributionWidget warehouses={warehouses} userRole={role} />
           <ProcurementPipelineWidget orders={orders} userRole={role} />
        </div>
        <div className="space-y-6">
           <RecentAlertsWidget alerts={alerts.slice(0, 8)} userRole={role} />
           <SupplierPerformanceWidget suppliers={suppliers} orders={orders} />
        </div>
      </div>
    </div>
  );

  const StaffDashboard = () => (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="To Receive" value={String(metrics.activeOrders)} hint="Pending deliveries" icon={PackageReceiveIcon} color="primary" to="/warehouse/receive" />
        <MetricCard label="Low Stock" value={String(metrics.lowStockItems)} hint="Action required" icon={Alert02Icon} color="warning" to="/manager/products" state={{ filter: 'LOW_STOCK' }} />
        <MetricCard label="Daily Tasks" value={String(metrics.activeOrders + alerts.filter(a => !a.acknowledged).length)} hint="Assignments for today" icon={Task01Icon} to="/warehouse/alerts" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <TaskQueue orders={orders} alerts={alerts} userRole={role} />
        </div>
        <WarehouseDistributionWidget warehouses={warehouses} userRole={role} compact />
      </div>
    </div>
  );

  const OfficerDashboard = () => (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Pending Approval" value={String(metrics.pendingPOs)} hint="Awaiting manager sign-off" icon={Clock01Icon} color="warning" to="/purchase/orders" state={{ filter: PurchaseOrderStatus.PENDING_APPROVAL }} />
        <MetricCard label="Active POs" value={String(metrics.activeOrders)} hint="In-flight procurement" icon={ShoppingBasket01Icon} to="/purchase/orders" state={{ filter: PurchaseOrderStatus.APPROVED }} />
        <MetricCard label="Open Requirements" value={String(metrics.lowStockItems)} hint="Products below reorder" icon={Alert02Icon} to="/manager/products" state={{ filter: 'LOW_STOCK' }} />
        <MetricCard label="Suppliers" value={String(suppliers.length)} hint="Registered partners" icon={UserGroupIcon} to="/purchase/suppliers" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProcurementPipelineWidget orders={orders} userRole={role} />
        
        <div className="space-y-6">
           <OperationTile to="/purchase/orders" title="Create New PO" desc="Raise a new supply requirement" icon={Add01Icon} featured />
           <SupplierPerformanceWidget suppliers={suppliers} orders={orders} />
        </div>
      </div>
    </div>
  );

  const ManagerDashboard = () => (
    <div className="space-y-8">
       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Valuation" value={`₹${(totalValue/1000000).toFixed(2)}M`} hint="System-wide inventory" icon={Chart01Icon} to="/manager/reports" />
        <MetricCard label="Approvals" value={String(metrics.pendingPOs)} hint="Pending PO approvals" icon={Task01Icon} color={metrics.pendingPOs > 0 ? 'warning' : 'primary'} to="/manager/purchase-orders" state={{ filter: PurchaseOrderStatus.PENDING_APPROVAL }} />
        <MetricCard label="Stock Risk" value={String(metrics.lowStockItems)} hint="Items below reorder level" icon={Alert02Icon} color="destructive" to="/manager/products" state={{ filter: 'LOW_STOCK' }} />
        <MetricCard label="Active Items" value={String(products.length)} hint="Catalogue size" icon={PackageIcon} to="/manager/products" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
           <ApprovalQueuePreview orders={orders} userRole={role} />
           <WarehouseDistributionWidget warehouses={warehouses} userRole={role} />
        </div>
        <RecentAlertsWidget alerts={alerts.slice(0, 8)} userRole={role} />
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

const MetricCard = ({ label, value, hint, icon: Icon, color = 'primary', to, state }: { 
  label: string, value: string, hint: string, icon: any, color?: 'primary' | 'destructive' | 'warning', to?: string, state?: any
}) => {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    destructive: 'bg-destructive/10 text-destructive',
    warning: 'bg-amber-500/10 text-amber-600',
  };

  const content = (
    <Card className={cn(
      "rounded-3xl border-transparent bg-card/80 shadow-sm border-none transition-all",
      to && "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]"
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</p>
          <div className={`p-2 rounded-xl ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <p className="text-3xl font-black tracking-tight">{value}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground font-medium">{hint}</p>
          {to && <ArrowRight01Icon className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />}
        </div>
      </CardContent>
    </Card>
  );

  return to ? <Link to={to} state={state} className="group">{content}</Link> : content;
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

const RecentAlertsWidget = ({ alerts, userRole }: { alerts: Alert[], userRole?: Role }) => (
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
              <Link 
                key={a.alertId} 
                to={userRole === Role.ADMIN ? "/admin/alerts" : userRole === Role.MANAGER ? "/manager/alerts" : userRole === Role.STAFF ? "/warehouse/alerts" : "/purchase/alerts"}
                className="block p-6 hover:bg-muted/10 transition-colors"
              >
                <div className="flex gap-4">
                  <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                    a.severity === AlertSeverity.CRITICAL ? 'bg-destructive' :
                    a.severity === AlertSeverity.WARNING ? 'bg-amber-500' : 'bg-primary'
                  }`} />
                  <div>
                    <p className="text-sm font-bold leading-tight">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.message}</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-2 font-bold uppercase">{formatDate(a.createdAt)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const WarehouseDistributionWidget = ({ warehouses, userRole, compact = false }: { warehouses: Warehouse[], userRole?: Role, compact?: boolean }) => (
  <Card className={cn("rounded-3xl border-transparent bg-card/80 shadow-sm overflow-hidden", compact && "bg-transparent shadow-none border-none")}>
    <CardHeader className={cn("bg-muted/30 border-b border-border/50", compact && "bg-transparent border-none px-0")}>
      <CardTitle className={cn("text-lg", compact && "text-sm")}>Warehouse Utilization</CardTitle>
      {!compact && <CardDescription>Real-time storage distribution across active sites.</CardDescription>}
    </CardHeader>
    <CardContent className={cn("p-6 space-y-4", compact && "p-0 space-y-3")}>
      {warehouses.length === 0 ? (
        <p className="py-10 text-center text-xs text-muted-foreground italic">No warehouse data available.</p>
      ) : (
        warehouses.map(wh => {
          const percent = Math.round((wh.usedCapacity / wh.capacity) * 100);
          const detailPath = userRole === Role.ADMIN ? `/admin/warehouses/${wh.warehouseId}` : userRole === Role.MANAGER ? `/manager/stock/${wh.warehouseId}` : `/warehouse/stock/${wh.warehouseId}`;
          
          return (
            <Link key={wh.warehouseId} to={detailPath} className="block group/item space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <p className="font-bold text-sm group-hover/item:text-primary transition-colors">{wh.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{wh.location}</p>
                </div>
                <p className={cn("text-xs font-black", percent > 90 ? "text-destructive" : percent > 70 ? "text-amber-600" : "text-primary")}>
                  {percent}%
                </p>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-1000", percent > 90 ? "bg-destructive" : percent > 70 ? "bg-amber-500" : "bg-primary")} 
                  style={{ width: `${percent}%` }} 
                />
              </div>
            </Link>
          );
        })
      )}
    </CardContent>
  </Card>
);

const ApprovalQueuePreview = ({ orders, userRole }: { orders: PurchaseOrder[], userRole?: Role }) => {
  const pending = orders.filter(o => o.status === PurchaseOrderStatus.PENDING_APPROVAL);
  
  return (
    <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm overflow-hidden border-none">
      <CardHeader className="bg-amber-500/5 border-b border-amber-500/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Approval Queue</CardTitle>
          <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-[10px] font-black text-amber-700 uppercase tracking-tighter">
            {pending.length} Pending
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {pending.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBasket01Icon className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-xs text-muted-foreground font-medium">All purchase orders are processed.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {pending.slice(0, 3).map(o => (
              <div key={o.poId} className="p-5 flex items-center justify-between hover:bg-muted/10 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-background flex items-center justify-center border border-border/50 group-hover:border-amber-500/30 transition-colors">
                    <ShoppingBasket01Icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">PO #{o.poId} · {o.supplierName}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">₹{o.totalAmount.toLocaleString()} · {formatDate(o.orderDate)}</p>
                  </div>
                </div>
                <Link to={userRole === Role.OFFICER ? "/purchase/orders" : "/manager/purchase-orders"} state={{ filter: PurchaseOrderStatus.PENDING_APPROVAL }}>
                  <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[10px] font-black uppercase tracking-wider">Review</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const TaskQueue = ({ orders, alerts, userRole }: { orders: PurchaseOrder[], alerts: Alert[], userRole?: Role }) => {
  const tasks = useMemo(() => {
    const toReceive = orders.filter(o => o.status === PurchaseOrderStatus.APPROVED || o.status === PurchaseOrderStatus.PARTIALLY_RECEIVED);
    const unreadAlerts = alerts.filter(a => !a.acknowledged);
    
    return [
      ...toReceive.map(o => ({ 
        id: `po-${o.poId}`, 
        title: `Receive Goods: PO #${o.poId}`, 
        desc: o.supplierName, 
        type: 'RECEIPT', 
        path: userRole === Role.STAFF ? '/warehouse/receive' : (userRole === Role.OFFICER ? '/purchase/orders' : '/manager/purchase-orders')
      })),
      ...unreadAlerts.map(a => ({ 
        id: `al-${a.alertId}`, 
        title: a.title, 
        desc: a.message, 
        type: 'ALERT', 
        path: userRole === Role.STAFF ? '/warehouse/alerts' : (userRole === Role.OFFICER ? '/purchase/alerts' : '/manager/alerts')
      }))
    ].slice(0, 5);
  }, [orders, alerts]);

  return (
    <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <CardTitle>Daily Priority Queue</CardTitle>
        <CardDescription>Consolidated tasks and urgent notifications.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {tasks.length === 0 ? (
          <p className="p-12 text-center text-xs text-muted-foreground italic">No urgent tasks assigned.</p>
        ) : (
          <div className="divide-y divide-border/30">
            {tasks.map(t => (
              <div key={t.id} className="p-5 flex items-center justify-between hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center",
                    t.type === 'RECEIPT' ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"
                  )}>
                    {t.type === 'RECEIPT' ? <PackageReceiveIcon className="w-5 h-5" /> : <Alert02Icon className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t.title}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">{t.desc}</p>
                  </div>
                </div>
                <Link to={t.path}>
                  <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
                    <ArrowRight01Icon className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ProcurementPipelineWidget = ({ orders, userRole }: { orders: PurchaseOrder[], userRole?: Role }) => (
  <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm overflow-hidden">
    <CardHeader className="bg-muted/30 border-b border-border/50">
      <CardTitle>Procurement Pipeline</CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="divide-y divide-border/50">
        {orders.length === 0 ? (
          <p className="p-10 text-center text-xs text-muted-foreground italic">No recent purchase orders.</p>
        ) : (
          orders.slice(0, 5).map(o => (
            <Link 
              key={o.poId} 
              to={userRole === Role.OFFICER ? "/purchase/orders" : "/manager/purchase-orders"} 
              state={{ filter: o.status }}
              className="p-5 flex items-center justify-between hover:bg-muted/10 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <ShoppingBasket01Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold">PO #{o.poId} · {o.supplierName}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">{formatDate(o.orderDate)}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-muted text-[10px] font-bold text-muted-foreground uppercase group-hover:bg-primary/10 group-hover:text-primary transition-colors">{o.status}</span>
            </Link>
          ))
        )}
      </div>
      <div className="p-4 bg-muted/20 text-center border-t border-border/30">
        <Link to={userRole === Role.OFFICER ? "/purchase/orders" : "/manager/purchase-orders"} className="text-xs font-bold text-primary hover:underline">View All Purchase Orders</Link>
      </div>
    </CardContent>
  </Card>
);

const SupplierPerformanceWidget = ({ suppliers, orders }: { suppliers: Supplier[], orders: PurchaseOrder[] }) => {
  const stats = useMemo(() => {
    return suppliers.map(s => ({
      ...s,
      orderCount: orders.filter(o => o.supplierId === s.supplierId).length,
      totalSpent: orders.filter(o => o.supplierId === s.supplierId).reduce((acc, o) => acc + o.totalAmount, 0)
    }))
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 3);
  }, [suppliers, orders]);

  return (
    <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm">Active Partners</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {stats.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground italic">No active supplier activity.</p>
        ) : (
          stats.map(s => (
            <Link 
              key={s.supplierId} 
              to="/purchase/suppliers" 
              className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <UserGroupIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-xs font-bold">{s.name}</p>
                  <p className="text-[9px] text-muted-foreground uppercase">{s.orderCount} Orders Fulfilled</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-primary">₹{(s.totalSpent/1000).toFixed(1)}K</p>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
};
