import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft01Icon,
  DatabaseIcon,
  Money01Icon,
  ChartBarLineIcon,
  Building05Icon,
  Clock01Icon,
  ArrowRight01Icon,
  UserEdit01Icon
} from "hugeicons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { productsApi } from "@/features/products/api";
import { warehousesApi } from "@/features/warehouses/api";
import { movementsApi } from "@/features/movements/api/movements.api";
import type { Product } from "@/features/products/types";
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

import { useAuthStore } from "@/stores/auth.store";
import { Role } from "@/types";

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canEdit = user?.role === Role.MANAGER || user?.role === Role.ADMIN || user?.role === Role.OFFICER;

  const [product, setProduct] = useState<Product | null>(null);
  const [stockBreakdown, setStockBreakdown] = useState<StockLevel[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);


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
    } catch (error: any) {
      showToast.error("Failed to load product details.");
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    void loadData();
  }, [id]);

  if (loading && !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium">Loading product...</p>
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
            <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">Product Information</p>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                {product.name}
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className={cn("w-2 h-2 rounded-full shadow-sm", product.active ? (product.currentQuantity > product.reorderLevel ? "bg-primary shadow-primary/50" : "bg-status-error/80 animate-pulse shadow-status-error/50") : "bg-muted-foreground/40")} />
              <p className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
                {product.category} • {product.active ? (product.currentQuantity > product.reorderLevel ? "In Stock" : "Low Stock") : "Inactive"}
              </p>
              <span className={cn(
                "ml-3 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                product.active ? "bg-primary/10 text-primary border-primary/20" : "bg-muted/40 text-foreground/40 border-border/40"
              )}>
                {product.active ? "Active" : "Deactivated"}
              </span>
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/products', { state: { editProductId: Number(id) } })}
              className="w-12 h-12 rounded-full border border-border bg-primary text-primary-foreground flex-center hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              title="Edit Product"
            >
              <UserEdit01Icon className="icon-md" />
            </button>
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      {/* Key Metrics */}
      <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-1 shadow-app-card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border/20">

          {/* Stock Summary */}
          <div className="p-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <DatabaseIcon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Total Stock</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tighter text-foreground">
                  {product.currentQuantity.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-muted-foreground uppercase">{product.unitOfMeasure}</span>
              </div>
              <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest">Across All Locations</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <div className={cn(
                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border",
                product.currentQuantity <= product.reorderLevel ? "bg-status-error/10 text-status-error border-status-error/20" : "bg-muted/50 text-muted-foreground border-border/40"
              )}>
                RRP: {product.reorderLevel}
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border",
                product.currentQuantity >= product.maxStockLevel ? "bg-status-warning/10 text-status-warning border-status-warning/20" : "bg-muted/50 text-muted-foreground border-border/40"
              )}>
                CAP: {product.maxStockLevel}
              </div>
            </div>
          </div>

          {/* Pricing & Cost */}
          <div className="p-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-status-info/10 text-status-info flex items-center justify-center">
                <Money01Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Pricing</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tighter text-primary">
                  {formatCurrency(product.sellingPrice)}
                </span>
              </div>
              <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest">Current Unit Price</p>
            </div>
            <div className="pt-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <span>Net Cost:</span>
                <span className="text-foreground">{formatCurrency(product.costPrice)}</span>
              </div>
              <div className="w-full h-1 bg-muted/30 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.min((product.costPrice / product.sellingPrice) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="p-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-status-warning/10 text-status-warning flex items-center justify-center">
                <Clock01Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Delivery</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tighter text-foreground">
                  {product.leadTimeDays}d
                </span>
                <span className="text-xs font-bold text-muted-foreground uppercase">Lead Time</span>
              </div>
              <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest">Avg fulfillment window</p>
            </div>
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-medium pt-2">
              Optimized cycle based on recent historical fulfillment latency.
            </p>
          </div>

          {/* Quick Action / Summary */}
          <div className="p-10 flex flex-col justify-center bg-muted/5">
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-app-subtle">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Stock Value</p>
                <p className="text-2xl font-black tracking-tighter text-foreground">
                  {formatCurrency(product.currentQuantity * product.sellingPrice)}
                </p>
              </div>
              <button
                onClick={() => navigate(`/warehouse/movements?productId=${product.productId}`)}
                className="w-full group h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-between px-6 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                View History
                <ArrowRight01Icon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-3 items-start">
        {/* Stock Breakdown */}
        <Card className="lg:col-span-2 rounded-[2.5rem] border border-border/40 bg-card shadow-sm overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">Stock Distribution</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60 mt-1 uppercase tracking-wider">Current stock levels by warehouse</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/40 h-12">
                    <TableHead className="px-8 font-black text-xs text-foreground/40 uppercase tracking-widest">Warehouse</TableHead>
                    <TableHead className="px-8 font-black text-xs text-foreground/40 uppercase tracking-widest text-center">In Stock</TableHead>
                    <TableHead className="px-8 font-black text-xs text-foreground/40 uppercase tracking-widest text-center">Unit Price</TableHead>
                    <TableHead className="px-8 font-black text-xs text-foreground/40 uppercase tracking-widest text-right">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockBreakdown.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="px-8 py-16 text-center text-muted-foreground italic text-sm border-none">No active stock in any location.</TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {stockBreakdown.map((stock) => (
                        <TableRow key={stock.warehouseId} className="group hover:bg-muted/10 border-b border-border/40 transition-colors last:border-0 h-24">
                          <TableCell className="px-8">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center text-base font-black text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                                <Building05Icon className="w-5 h-5" />
                              </div>
                              <span className="font-black text-lg text-foreground tracking-tighter">{getWarehouseName(stock.warehouseId)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-8 text-center font-black text-xl text-foreground tracking-tighter">
                            {stock.quantity.toLocaleString()} <span className="text-[10px] opacity-30 uppercase">{product.unitOfMeasure}</span>
                          </TableCell>
                          <TableCell className="px-8 text-center">
                            <span className="text-sm font-bold text-muted-foreground/60">{formatCurrency(product.sellingPrice)}</span>
                          </TableCell>
                          <TableCell className="px-8 text-right">
                            <p className="font-black text-xl text-foreground tracking-tighter">{formatCurrency(stock.quantity * product.sellingPrice)}</p>
                            <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mt-1">Stock Value</p>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Total Row */}
                      <TableRow className="bg-primary/5 h-20 border-t-2 border-primary/20">
                        <TableCell className="px-8">
                          <span className="font-black text-sm uppercase tracking-[0.2em] text-primary">Totals</span>
                        </TableCell>
                        <TableCell className="px-8 text-center">
                          <p className="font-black text-2xl text-primary tracking-tighter">
                            {stockBreakdown.reduce((acc, s) => acc + s.quantity, 0).toLocaleString()}
                          </p>
                        </TableCell>
                        <TableCell className="px-8 text-center">
                          <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Average</span>
                        </TableCell>
                        <TableCell className="px-8 text-right">
                          <p className="font-black text-xl text-primary tracking-tighter">
                            {formatCurrency(stockBreakdown.reduce((acc, s) => acc + (s.quantity * product.sellingPrice), 0))}
                          </p>
                          <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mt-1">Total Stock Value</p>
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Movement History */}
        <Card className="rounded-[2.5rem] border border-border/40 bg-card shadow-sm flex flex-col">
          <CardHeader className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">Latest Movements</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60 mt-1 uppercase tracking-wider">Recent stock history</CardDescription>
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
                  <p className="text-muted-foreground text-sm font-medium italic">No recent movements recorded.</p>
                </div>
              ) : (
                movements.map((m) => (
                  <div key={m.movementId} className="flex gap-6 relative group">
                    <div className={cn(
                      "w-10 h-10 rounded-xl z-10 flex items-center justify-center shrink-0 shadow-sm border border-white/5",
                      m.movementType === 'STOCK_IN' || m.movementType === 'TRANSFER_IN' ? "bg-primary text-white" : "bg-status-error text-white"
                    )}>
                      {m.movementType.includes('IN') ? <ChartBarLineIcon className="w-5 h-5" /> : <ChartBarLineIcon className="w-5 h-5 rotate-180" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black uppercase tracking-wider text-foreground">{m.movementType.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        <span className="font-bold text-foreground">{m.quantity} Units</span> {m.movementType.includes('IN') ? 'added to' : 'removed from'} <span className="text-foreground/80">{getWarehouseName(m.warehouseId)}</span>
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


    </div>
  );
};
