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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOrders = async () => {
    try {
      const [approved, partiallyReceived] = await Promise.all([
        purchasesApi.getByStatus(PurchaseOrderStatus.APPROVED),
        purchasesApi.getByStatus(PurchaseOrderStatus.PARTIALLY_RECEIVED)
      ]);
      setOrders([...approved, ...partiallyReceived]);
    } catch (error) {
      showToast.error('Failed to load pending purchase orders.');
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-4">
        <div>
          <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] mb-2">Inventory Management</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
            Receive Goods
          </h1>
        </div>

        {selectedOrder && (
          <button
            onClick={() => setSelectedOrder(null)}
            className="px-6 h-10 rounded-full border border-border bg-card hover:bg-muted text-foreground font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-3 shadow-sm"
          >
            <ArrowLeft01Icon className="w-4 h-4" />
            Back to Manifests
          </button>
        )}
      </div>

      {!selectedOrder ? (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4 px-2">
            <div className="h-1.5 w-8 bg-primary rounded-full" />
            <h2 className="text-[10px] font-black uppercase tracking-wider text-foreground/40 text-left">Pending Manifests</h2>
          </div>

          <div className="bg-card/50 backdrop-blur-xl rounded-2xl border border-border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border h-14">
                  <TableHead className="px-8 font-black uppercase tracking-wider text-[11px] text-muted-foreground">PO ID</TableHead>
                  <TableHead className="px-8 font-black uppercase tracking-wider text-[11px] text-muted-foreground">Status</TableHead>
                  <TableHead className="px-8 font-black uppercase tracking-wider text-[11px] text-muted-foreground text-left">Supplier & Hub</TableHead>
                  <TableHead className="px-8 font-black uppercase tracking-wider text-[11px] text-muted-foreground text-center">Item Count</TableHead>
                  <TableHead className="px-8 font-black uppercase tracking-wider text-[11px] text-muted-foreground text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.poId}
                    className="hover:bg-primary/[0.01] transition-all border-b border-border/10 group h-20"
                  >
                    <TableCell className="px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/5 text-primary flex items-center justify-center border border-primary/10 transition-all duration-500">
                          <ShoppingBasket01Icon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-lg tracking-tight">PO #{order.poId}</p>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{formatDate(order.orderDate)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-8">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                        order.status === PurchaseOrderStatus.PARTIALLY_RECEIVED
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      )}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="px-8">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-foreground/70 uppercase tracking-tight">
                          <Building05Icon className="w-4 h-4 text-primary/40" />
                          {order.warehouseName}
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {order.supplierName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 text-center">
                      <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-foreground/70 uppercase tracking-tight">
                        <PackageIcon className="w-4 h-4 text-primary/40" />
                        {order.lineItems.length} ITEMS
                      </div>
                    </TableCell>
                    <TableCell className="px-8 text-right">
                      <button
                        onClick={() => handleSelectOrder(order)}
                        className="px-6 h-10 rounded-full bg-foreground text-background font-black text-[10px] uppercase tracking-widest transition-all hover:opacity-90 shadow-sm"
                      >
                        Record Receipt
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_400px] animate-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-8">
            <div className="flex items-center gap-4 px-2">
              <div className="h-1.5 w-8 bg-primary rounded-full" />
              <h2 className="text-[10px] font-black uppercase tracking-wider text-foreground/40">Item Verification</h2>
            </div>

            <div className="bg-card/50 backdrop-blur-xl rounded-3xl border border-border shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border h-14">
                    <TableHead className="px-8 font-black uppercase tracking-wider text-[11px] text-muted-foreground">Product Details</TableHead>
                    <TableHead className="px-8 font-black uppercase tracking-wider text-[11px] text-muted-foreground text-center">Quantities</TableHead>
                    <TableHead className="px-8 font-black uppercase tracking-wider text-[11px] text-muted-foreground text-right">Received Input</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.lineItems.map((item) => {
                    const remaining = item.quantity - (item.receivedQty || 0);
                    const currentVal = receiveQtys[item.productId] || 0;
                    const isComplete = currentVal === remaining;

                    return (
                      <TableRow key={item.lineItemId} className="hover:bg-primary/[0.01] transition-all border-b border-border/10 group h-24">
                        <TableCell className="px-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-muted/20 flex items-center justify-center text-muted-foreground transition-all shrink-0 border border-border/10">
                              <PackageIcon className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-lg tracking-tight leading-none">{item.productName}</p>
                              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mt-1.5">{item.productSku}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-8">
                          <div className="flex items-center justify-center gap-6">
                            <div className="text-center">
                              <p className="text-[8px] font-black text-foreground/30 uppercase tracking-widest mb-0.5">Total</p>
                              <p className="font-bold text-base tabular-nums">{item.quantity}</p>
                            </div>
                            <div className="w-px h-6 bg-border/20" />
                            <div className="text-center">
                              <p className="text-[8px] font-black text-foreground/30 uppercase tracking-widest mb-0.5">Received</p>
                              <p className="font-bold text-base text-primary tabular-nums">{item.receivedQty || 0}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 text-right">
                          <div className="flex flex-col items-end gap-2">
                            <input
                              type="number"
                              min="0"
                              max={remaining}
                              value={currentVal}
                              onChange={(e) => handleQtyChange(item.productId, Number(e.target.value))}
                              className={cn(
                                "w-24 h-10 rounded-xl border bg-background px-4 text-right text-lg font-black transition-all outline-none tracking-tighter",
                                isComplete
                                  ? "border-primary/40 text-primary bg-primary/5 focus:ring-4 focus:ring-primary/5"
                                  : "border-border focus:border-primary focus:ring-4 focus:ring-primary/5"
                              )}
                            />
                            <span className="text-[8px] font-black text-foreground/30 uppercase tracking-widest">
                              {remaining} LEFT
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

          <div className="space-y-6">
            <div className="bg-card/80 backdrop-blur-3xl rounded-3xl sticky top-8 p-10 overflow-hidden border border-border shadow-sm">
              <div className="space-y-2 pb-6 border-b border-border/10 text-left">
                <h3 className="font-black text-2xl tracking-tighter uppercase">Receipt Ledger</h3>
                <p className="text-[9px] font-black uppercase tracking-widest text-primary opacity-60">Logistics Data Sync</p>
              </div>

              <div className="py-8 space-y-8 text-left">
                <div className="space-y-2 p-6 rounded-2xl bg-muted/10 border border-border/10">
                  <p className="text-[9px] font-black text-foreground/40 uppercase tracking-widest">Hub Location</p>
                  <div className="flex items-center gap-3">
                    <Building05Icon className="w-5 h-5 text-primary" />
                    <p className="font-bold text-lg tracking-tight">{selectedOrder.warehouseName}</p>
                  </div>
                </div>

                <div className="space-y-4 px-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-foreground/40 uppercase tracking-wider">Manifest Reference</span>
                    <span className="text-sm font-bold tracking-tight">PO #{selectedOrder.poId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-foreground/40 uppercase tracking-wider">Origin Supplier</span>
                    <span className="text-sm font-bold truncate max-w-[150px] tracking-tight">{selectedOrder.supplierName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-foreground/40 uppercase tracking-wider">Verified Segments</span>
                    <span className="text-[9px] font-black text-primary px-4 py-1 bg-primary/10 rounded-full border border-primary/20">
                      {Object.values(receiveQtys).filter(q => q > 0).length} ITEMS
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-border/10 space-y-6">
                <button
                  onClick={handleSubmitReceipt}
                  disabled={isSubmitting}
                  className="w-full h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-wider transition-all hover:opacity-90 active:scale-[0.98] shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <PackageReceiveIcon className="w-5 h-5" />
                      Confirm Receipt
                    </>
                  )}
                </button>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-left">
                  <InformationCircleIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[8px] font-black text-amber-500/80 leading-relaxed uppercase tracking-widest">
                    Execution will commit these units to the permanent inventory ledger. Verify all counts before confirming.
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
