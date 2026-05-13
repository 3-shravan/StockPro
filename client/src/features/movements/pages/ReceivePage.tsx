// Card imports removed for high-density layout
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { purchasesApi } from '@/features/purchases/api';
import type { PurchaseOrder } from '@/features/purchases/types';
import { showToast } from '@/lib/toast';
import { PurchaseOrderStatus } from '@/types/enums';
import {
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  PackageReceiveIcon,
  ShoppingBasket01Icon,
  InformationCircleIcon,
  Building05Icon,
  PackageIcon,
  ArrowLeft01Icon
} from 'hugeicons-react';
import { useEffect, useState } from 'react';
import { formatDate, cn } from '@/lib/utils';

export const ReceivePage = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [receiveQtys, setReceiveQtys] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const [approved, partiallyReceived] = await Promise.all([
        purchasesApi.getByStatus(PurchaseOrderStatus.APPROVED),
        purchasesApi.getByStatus(PurchaseOrderStatus.PARTIALLY_RECEIVED)
      ]);
      setOrders([...approved, ...partiallyReceived]);
    } catch (error) {
      showToast.error('Failed to load pending purchase orders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const handleSelectOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    const initialQtys: Record<number, number> = {};
    order.lineItems.forEach(item => {
      initialQtys[item.productId] = item.quantity - (item.receivedQty || 0);
    });
    setReceiveQtys(initialQtys);
  };

  const handleQtyChange = (productId: number, qty: number) => {
    setReceiveQtys(prev => ({ ...prev, [productId]: qty }));
  };

  const handleSubmitReceipt = async () => {
    if (!selectedOrder) return;

    const items = Object.entries(receiveQtys)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({
        productId: Number(productId),
        quantity
      }));

    if (items.length === 0) {
      showToast.error('Please enter at least one quantity to receive.');
      return;
    }

    setIsSubmitting(true);
    try {
      await purchasesApi.receive(selectedOrder.poId, { items });
      showToast.success(`Receipt recorded for PO #${selectedOrder.poId}`);
      setSelectedOrder(null);
      setReceiveQtys({});
      await loadOrders();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to record receipt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-700 pb-20 px-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between pt-4">
        <div>
          <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">Inbound Logistics</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Receipt Protocol
          </h1>
        </div>

        {selectedOrder && (
          <button
            onClick={() => setSelectedOrder(null)}
            className="px-6 h-12 rounded-full border border-border bg-card hover:bg-muted text-foreground font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-3"
          >
            <ArrowLeft01Icon className="w-4 h-4" />
            Switch Manifest
          </button>
        )}
      </div>

      {!selectedOrder ? (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-6 px-2">
            <div className="h-2 w-12 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
            <h2 className="text-[10px] font-black uppercase tracking-wider text-foreground opacity-60 text-left">Pending Inbound Manifests</h2>
          </div>

          {isLoading ? (
            <div className="p-32 text-center flex flex-col items-center gap-6">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin" />
              <p className="text-muted-foreground font-black text-[10px] uppercase tracking-wider">Synchronizing Logistics Stream...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-32 text-center space-y-6 bg-card/5 rounded-[3rem] border border-dashed border-border/60">
              <div className="w-20 h-20 bg-emerald-500/5 rounded-full flex items-center justify-center mx-auto border border-emerald-500/10">
                <CheckmarkCircle02Icon className="w-10 h-10 text-emerald-500/40" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-black text-foreground/50 uppercase tracking-tight">Pipeline Clear</p>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">No pending arrivals detected in current cycle.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {orders.map((order) => (
                <button
                  key={order.poId}
                  onClick={() => handleSelectOrder(order)}
                  className="group relative flex flex-col p-8 bg-card border border-border hover:border-emerald-500/40 rounded-[2.5rem] transition-all duration-500 text-left shadow-sm hover:shadow-2xl hover:-translate-y-2 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] -mr-16 -mt-16 rounded-full group-hover:bg-emerald-500/10 transition-colors" />

                  <div className="flex items-center justify-between mb-10 relative">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/5 text-emerald-500 flex items-center justify-center border border-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                      <ShoppingBasket01Icon className="w-7 h-7" />
                    </div>
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                      order.status === PurchaseOrderStatus.PARTIALLY_RECEIVED
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    )}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-4 flex-1 relative">
                    <p className="text-[10px] font-black text-foreground/70 uppercase tracking-wider">{formatDate(order.orderDate)}</p>
                    <div>
                      <h4 className="font-black text-2xl tracking-tighter group-hover:text-emerald-500 transition-colors">PO #{order.poId}</h4>
                      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mt-2 truncate max-w-[200px]">{order.supplierName}</p>
                    </div>

                    <div className="flex flex-col gap-4 pt-8 mt-4 border-t border-border/10">
                      <div className="flex items-center gap-3 text-[10px] font-black text-foreground/70 uppercase tracking-wider">
                        <Building05Icon className="w-4 h-4 text-emerald-500/40 group-hover:text-emerald-500 transition-colors" />
                        {order.warehouseName} HUB
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-black text-foreground/70 uppercase tracking-wider">
                        <PackageIcon className="w-4 h-4 text-emerald-500/40 group-hover:text-emerald-500 transition-colors" />
                        {order.lineItems.length} RESOURCE SEGMENTS
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-500">
                    <ArrowRight01Icon className="w-7 h-7 text-emerald-500" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-12 lg:grid-cols-[1fr_450px] animate-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-10">
            <div className="flex items-center gap-6 px-2">
              <div className="h-2 w-12 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              <h2 className="text-[10px] font-black uppercase tracking-wider text-foreground opacity-60 text-left">Physical Verification protocol</h2>
            </div>

            <div className="bg-card/50 backdrop-blur-xl rounded-[3rem] border border-border shadow-2xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border h-20">
                    <TableHead className="px-10 font-black uppercase tracking-wider text-[10px] text-muted-foreground">Resource Designation</TableHead>
                    <TableHead className="px-10 font-black uppercase tracking-wider text-[10px] text-muted-foreground text-center">Protocol Metrics</TableHead>
                    <TableHead className="px-10 font-black uppercase tracking-wider text-[10px] text-muted-foreground text-right">Physical Input</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.lineItems.map((item) => {
                    const remaining = item.quantity - (item.receivedQty || 0);
                    const currentVal = receiveQtys[item.productId] || 0;
                    const isComplete = currentVal === remaining;

                    return (
                      <TableRow key={item.lineItemId} className="hover:bg-emerald-500/[0.02] transition-all border-b border-border/10 group h-28">
                        <TableCell className="px-10">
                          <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center text-muted-foreground group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-all shrink-0 border border-transparent group-hover:border-emerald-500/20">
                              <PackageIcon className="w-7 h-7" />
                            </div>
                            <div className="text-left">
                              <p className="font-black text-xl tracking-tight leading-tight group-hover:text-emerald-500 transition-colors">{item.productName}</p>
                              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mt-2">SKU: {item.productSku}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-10">
                          <div className="flex items-center justify-center gap-8">
                            <div className="text-center">
                              <p className="text-[9px] font-black text-foreground/70 uppercase tracking-wider opacity-40 mb-1">Target</p>
                              <p className="font-black text-lg tabular-nums">{item.quantity}</p>
                            </div>
                            <div className="w-px h-10 bg-border/20" />
                            <div className="text-center">
                              <p className="text-[9px] font-black text-foreground/70 uppercase tracking-wider opacity-40 mb-1">Logged</p>
                              <p className="font-black text-lg text-emerald-500 tabular-nums">{item.receivedQty || 0}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-10 text-right">
                          <div className="flex flex-col items-end gap-3">
                            <input
                              type="number"
                              min="0"
                              max={remaining}
                              value={currentVal}
                              onChange={(e) => handleQtyChange(item.productId, Number(e.target.value))}
                              className={cn(
                                "w-32 h-14 rounded-2xl border bg-white/[0.02] px-6 text-right text-xl font-black transition-all outline-none shadow-inner tracking-tighter",
                                isComplete
                                  ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/5 focus:ring-8 focus:ring-emerald-500/5"
                                  : "border-border focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5"
                              )}
                            />
                            <span className="text-[9px] font-black text-foreground/70 uppercase tracking-wider opacity-40">
                              {remaining} UNITS REMAINING
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-8">
            <div className="glass-card rounded-[3rem] sticky top-8 p-12 overflow-hidden border-emerald-500/10 shadow-2xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[80px] -mr-24 -mt-24 rounded-full" />

              <div className="space-y-3 pb-8 border-b border-border/10 text-left relative">
                <h3 className="font-black text-3xl tracking-tighter uppercase">Receipt Ledger</h3>
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500 opacity-60">INBOUND LOGISTICS SYNCHRONIZATION</p>
              </div>

              <div className="py-10 space-y-10 relative">
                <div className="space-y-6 p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 text-left">
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-foreground/70 uppercase tracking-wider opacity-40">Deployment Node Hub</span>
                    <p className="font-black text-xl flex items-center gap-4 tracking-tight">
                      <Building05Icon className="w-6 h-6 text-emerald-500" />
                      {selectedOrder.warehouseName}
                    </p>
                  </div>
                </div>

                <div className="space-y-6 px-4 text-left">
                  <div className="flex justify-between items-center group">
                    <span className="text-[10px] font-black text-foreground/70 uppercase tracking-wider opacity-40">Manifest Protocol</span>
                    <span className="text-base font-black tabular-nums tracking-tight">PO #{selectedOrder.poId}</span>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span className="text-[10px] font-black text-foreground/70 uppercase tracking-wider opacity-40">Origin Entity</span>
                    <span className="text-base font-black truncate max-w-[200px] tracking-tight">{selectedOrder.supplierName}</span>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span className="text-[10px] font-black text-foreground/70 uppercase tracking-wider opacity-40">Verified Units</span>
                    <span className="text-[10px] font-black text-emerald-500 px-5 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      {Object.values(receiveQtys).filter(q => q > 0).length} SEGMENTS
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-border/10 space-y-8 relative">
                <button
                  onClick={handleSubmitReceipt}
                  disabled={isSubmitting}
                  className="w-full h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center gap-4 text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(16,185,129,0.3)] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                      SYNCHRONIZING...
                    </>
                  ) : (
                    <>
                      <PackageReceiveIcon className="w-6 h-6" />
                      AUTHORIZE RECEIPT
                    </>
                  )}
                </button>

                <div className="flex items-start gap-4 p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 text-left">
                  <InformationCircleIcon className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-black text-amber-500/80 leading-relaxed uppercase tracking-wider">
                    AUTHORIZATION COMMITS UNITS TO THE IMMUTABLE LEDGER. VERIFY PHYSICAL PARITY BEFORE EXECUTION.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
