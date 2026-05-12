import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft01Icon,
  Settings02Icon,
  DatabaseIcon,
  Money01Icon,
  ChartBarLineIcon,
  Building05Icon,
  Clock01Icon,
  ArrowRight01Icon,
  Alert01Icon
} from "hugeicons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { productsApi } from "@/features/products/api";
import { warehousesApi } from "@/features/warehouses/api";
import { movementsApi } from "@/features/movements/api/movements.api";
import type { Product, ProductRequest } from "@/features/products/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import type { StockLevel, Warehouse } from "@/features/warehouses/types";
import type { StockMovement } from "@/types";
import { showToast } from "@/lib/toast";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { useAuthStore } from "@/stores/auth.store";
import { Role } from "@/types";

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isManagerOrAdmin = user?.role === Role.MANAGER || user?.role === Role.ADMIN;

  const [product, setProduct] = useState<Product | null>(null);
  const [stockBreakdown, setStockBreakdown] = useState<StockLevel[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState<ProductRequest>({
    name: "",
    sku: "",
    barcode: "",
    category: "",
    unitOfMeasure: "PCS",
    costPrice: 0,
    sellingPrice: 0,
    reorderLevel: 0,
    maxStockLevel: 1000,
    leadTimeDays: 0,
    currentQuantity: 0
  });

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [pData, sData, wData, mData] = await Promise.all([
        productsApi.getById(Number(id)),
        warehousesApi.getStockByProduct(Number(id)),
        warehousesApi.getAll(),
        movementsApi.getByProduct(Number(id))
      ]);
      setProduct(pData);
      setStockBreakdown(sData);
      setWarehouses(wData);
      setMovements(mData.slice(0, 10)); // Top 10 recent movements
      
      setEditForm({
        name: pData.name,
        sku: pData.sku,
        barcode: pData.barcode ?? "",
        category: pData.category,
        unitOfMeasure: pData.unitOfMeasure,
        costPrice: pData.costPrice,
        sellingPrice: pData.sellingPrice,
        reorderLevel: pData.reorderLevel,
        maxStockLevel: pData.maxStockLevel,
        leadTimeDays: pData.leadTimeDays,
        currentQuantity: pData.currentQuantity
      });
    } catch (error: any) {
      showToast.error("Failed to load product details.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setIsUpdating(true);
      await productsApi.update(Number(id), editForm);
      showToast.success("Product updated successfully.");
      setIsEditModalOpen(false);
      await loadData();
    } catch (error: any) {
      showToast.error("Failed to update product.");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [id]);

  if (loading && !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium">Analyzing product inventory...</p>
      </div>
    );
  }

  if (!product) return null;

  const getWarehouseName = (wid: number) => warehouses.find(w => w.warehouseId === wid)?.name || `Warehouse #${wid}`;

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between pt-4">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-card/60 backdrop-blur-sm shadow-sm w-12 h-12 border border-border/40 shrink-0"
          >
            <ArrowLeft01Icon className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">Asset Inventory</p>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                {product.name}
              </h1>
              <span className="bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest h-fit">
                SKU: {product.sku}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className={cn("w-2 h-2 rounded-full shadow-sm", product.currentQuantity > product.reorderLevel ? "bg-emerald-500 shadow-emerald-500/50" : "bg-destructive animate-pulse shadow-destructive-500/50")} />
              <p className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
                {product.category} • {product.currentQuantity > product.reorderLevel ? "Inventory Nominal" : "Critical Depletion"}
              </p>
            </div>
          </div>
        </div>

        {isManagerOrAdmin && (
          <div className="flex items-center gap-4 p-2 bg-card/30 rounded-full border border-border shadow-2xl backdrop-blur-md">
            <button 
              className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-primary/20"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Settings02Icon className="w-4 h-4" />
              Manage Configuration
            </button>
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Global Inventory" 
          value={product.currentQuantity.toLocaleString()}
          unit={product.unitOfMeasure}
          icon={<DatabaseIcon className="w-6 h-6" />}
          description="Consolidated physical stock"
        />
        <StatCard 
          title="Selling Price" 
          value={formatCurrency(product.sellingPrice)}
          unit="Current"
          icon={<Money01Icon className="w-6 h-6" />}
          description={`Net Cost: ${formatCurrency(product.costPrice)}`}
        />
        <StatCard 
          title="Reorder Point" 
          value={product.reorderLevel.toString()}
          unit="Threshold"
          icon={<Alert01Icon className="w-6 h-6" />}
          description="Automatic alert trigger"
          variant={product.currentQuantity <= product.reorderLevel ? "warning" : "default"}
        />
        <StatCard 
          title="Avg Lead Time" 
          value={`${product.leadTimeDays}d`}
          unit="ETA"
          icon={<Clock01Icon className="w-6 h-6" />}
          description="Procurement cycle window"
        />
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Stock Breakdown */}
        <Card className="lg:col-span-2 rounded-[2.5rem] border border-border/40 bg-card shadow-2xl overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">Inventory Distribution</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60 mt-1 uppercase tracking-wider">Real-time stock levels across node network</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/40 h-16">
                  <TableHead className="px-8 font-black text-xs text-muted-foreground/80 uppercase tracking-widest">Storage Node</TableHead>
                  <TableHead className="px-8 font-black text-xs text-muted-foreground/80 uppercase tracking-widest">Physical Qty</TableHead>
                  <TableHead className="px-8 font-black text-xs text-muted-foreground/80 uppercase tracking-widest">Reserved</TableHead>
                  <TableHead className="px-8 font-black text-xs text-muted-foreground/80 uppercase tracking-widest text-right">Availability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockBreakdown.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="px-8 py-16 text-center text-muted-foreground italic text-sm border-none">No active stock in distribution network.</TableCell>
                  </TableRow>
                ) : (
                  stockBreakdown.map((stock) => (
                    <TableRow key={stock.warehouseId} className="group hover:bg-muted/10 border-b border-border/40 transition-colors last:border-0 h-24">
                      <TableCell className="px-8">
                        <div className="flex items-center gap-6 whitespace-nowrap">
                          <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center text-base font-black text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <Building05Icon className="w-5 h-5" />
                          </div>
                          <span className="font-black text-xl text-foreground tracking-tighter">{getWarehouseName(stock.warehouseId)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 font-black text-xl text-foreground whitespace-nowrap tracking-tighter">
                        {stock.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="px-8 text-muted-foreground text-sm whitespace-nowrap">
                        {stock.reservedQuantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="px-8 text-right whitespace-nowrap">
                        <span className="inline-flex items-center px-5 py-2 rounded-full bg-emerald-500/10 text-emerald-500 text-[11px] font-black uppercase tracking-widest border border-emerald-500/10">
                          {(stock.quantity - stock.reservedQuantity).toLocaleString()} Units
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Audit Log / Movements */}
        <Card className="rounded-[2.5rem] border border-border/40 bg-card shadow-2xl flex flex-col">
          <CardHeader className="p-8">
            <div className="flex items-center justify-between">
               <div>
                 <CardTitle className="text-xl font-bold tracking-tight">Audit Trail</CardTitle>
                 <CardDescription className="text-xs font-medium text-muted-foreground/60 mt-1 uppercase tracking-wider">Asset trajectory log</CardDescription>
               </div>
               <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 border border-border/40 hover:bg-primary/5 hover:text-primary transition-all" onClick={() => navigate('/warehouse/movements')}>
                 <ArrowRight01Icon className="w-5 h-5" />
               </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0 flex-1">
            <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-border/50 before:via-border/20 before:to-transparent">
              {movements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                  <Clock01Icon className="w-10 h-10 text-muted-foreground/20" />
                  <p className="text-muted-foreground text-sm font-medium italic">Log entries pending...</p>
                </div>
              ) : (
                movements.map((m) => (
                  <div key={m.movementId} className="flex gap-6 relative group">
                    <div className={cn(
                      "w-10 h-10 rounded-xl z-10 flex items-center justify-center shrink-0 shadow-sm border border-white/5",
                      m.movementType === 'STOCK_IN' || m.movementType === 'TRANSFER_IN' ? "bg-emerald-500 text-white" : "bg-destructive text-white"
                    )}>
                      {m.movementType.includes('IN') ? <ChartBarLineIcon className="w-5 h-5" /> : <ChartBarLineIcon className="w-5 h-5 rotate-180" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black uppercase tracking-wider text-foreground">{m.movementType.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        <span className="font-bold text-foreground">{m.quantity} Units</span> {m.movementType.includes('IN') ? 'provisioned to' : 'allocated from'} <span className="text-foreground/80">{getWarehouseName(m.warehouseId)}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-2 uppercase font-black tracking-widest flex items-center gap-2">
                        <Clock01Icon className="w-3 h-3" />
                        {formatDate(m.movementDate)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Product Configuration"
      >
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-bold px-1">Product Name</label>
              <input 
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold px-1">Category</label>
              <input 
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                value={editForm.category}
                onChange={e => setEditForm({ ...editForm, category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold px-1">Selling Price</label>
              <input 
                type="number"
                step="0.01"
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                value={editForm.sellingPrice}
                onChange={e => setEditForm({ ...editForm, sellingPrice: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold px-1">Reorder Level</label>
              <input 
                type="number"
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                value={editForm.reorderLevel}
                onChange={e => setEditForm({ ...editForm, reorderLevel: Number(e.target.value) })}
              />
            </div>
             <div className="space-y-2">
              <label className="text-sm font-bold px-1">Lead Time (Days)</label>
              <input 
                type="number"
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                value={editForm.leadTimeDays}
                onChange={e => setEditForm({ ...editForm, leadTimeDays: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1 h-12 rounded-2xl" disabled={isUpdating}>
              {isUpdating ? "Applying Changes..." : "Save Configuration"}
            </Button>
            <Button type="button" variant="ghost" className="h-12 px-6 rounded-2xl" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const StatCard = ({ title, value, unit, icon, description, variant = 'default' }: any) => (
  <Card className="rounded-[2.5rem] border-none bg-white/[0.05] shadow-2xl backdrop-blur-xl overflow-hidden group hover:bg-white/[0.05] transition-all">
    <CardContent className="p-8 text-center">
      <div className={cn(
        "mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white/5",
        variant === 'warning' ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
      )}>
        {icon}
      </div>
      <div className="flex items-baseline justify-center gap-1.5">
        <span className="text-4xl font-bold tracking-tight text-foreground">{value}</span>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{unit}</span>
      </div>
      <p className="text-sm font-bold text-foreground/70 mt-3 uppercase tracking-widest">{title}</p>
      <div className="mt-4 pt-4 border-t border-border/10">
        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">{description}</p>
      </div>
    </CardContent>
  </Card>
);
