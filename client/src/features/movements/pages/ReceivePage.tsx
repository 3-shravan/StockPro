import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { purchasesApi } from '@/features/purchases/api';
import type { PurchaseOrder } from '@/features/purchases/types';
import { showToast } from '@/lib/toast';
import { PurchaseOrderStatus } from '@/types/enums';
import {
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  PackageReceiveIcon,
  ShoppingBasket01Icon
} from 'hugeicons-react';
import { useEffect, useState } from 'react';

export const ReceivePage = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [receiveQtys, setReceiveQtys] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      // Industry practice: only show orders that are Approved or Partially Received
      const all = await purchasesApi.getAll();
      setOrders(all.filter(o => 
        o.status === PurchaseOrderStatus.APPROVED || 
        o.status === PurchaseOrderStatus.PARTIALLY_RECEIVED
      ));
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
      // Default to receiving the remaining quantity
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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">Stock Receipt (GRN)</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Record inbound goods against approved purchase orders.
          </p>
        </div>
        
        {selectedOrder && (
          <Button variant="ghost" onClick={() => setSelectedOrder(null)} className="rounded-xl">
            Change Order
          </Button>
        )}
      </div>

      {!selectedOrder ? (
        <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Clock01Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Select Pending Purchase Order</CardTitle>
                <CardDescription>Browse orders awaiting delivery.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground">Scanning for pending orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-20 text-center space-y-4">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                  <CheckmarkCircle02Icon className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">All purchase orders have been received.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {orders.map((order) => (
                  <button
                    key={order.poId}
                    onClick={() => handleSelectOrder(order)}
                    className="w-full flex items-center justify-between p-6 hover:bg-muted/30 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <ShoppingBasket01Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-base">PO #{order.poId} · {order.supplierName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {order.warehouseName} · {order.lineItems.length} items · Ordered {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.status === PurchaseOrderStatus.PARTIALLY_RECEIVED 
                        ? 'bg-amber-500/10 text-amber-600' 
                        : 'bg-primary/10 text-primary'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                      <ArrowRight01Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          <div className="space-y-6">
            <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm overflow-hidden">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle>Delivery Manifest</CardTitle>
                <CardDescription>Verify items and quantities delivered by {selectedOrder.supplierName}.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border/50">
                        <th className="px-6 py-4 text-left font-semibold">Product Details</th>
                        <th className="px-6 py-4 text-center font-semibold">Ordered</th>
                        <th className="px-6 py-4 text-center font-semibold">Previously Received</th>
                        <th className="px-6 py-4 text-right font-semibold w-40">Receiving Now</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {selectedOrder.lineItems.map((item) => (
                        <tr key={item.lineItemId} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-5">
                            <p className="font-bold">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">{item.productSku}</p>
                          </td>
                          <td className="px-6 py-5 text-center font-medium">{item.quantity}</td>
                          <td className="px-6 py-5 text-center">
                            <span className="text-muted-foreground">{item.receivedQty || 0}</span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <input
                              type="number"
                              min="0"
                              max={item.quantity - (item.receivedQty || 0)}
                              value={receiveQtys[item.productId] || 0}
                              onChange={(e) => handleQtyChange(item.productId, Number(e.target.value))}
                              className="w-24 h-10 rounded-xl border border-input/60 bg-background px-3 text-right font-bold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="font-bold text-lg">Receipt Summary</h3>
                  <p className="text-xs text-muted-foreground mt-1">Confirming delivery to {selectedOrder.warehouseName}.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Order ID</span>
                    <span className="font-bold">#{selectedOrder.poId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Supplier</span>
                    <span className="font-bold">{selectedOrder.supplierName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expected Date</span>
                    <span className="font-bold">{selectedOrder.expectedDate || 'Not specified'}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/50">
                  <Button 
                    onClick={handleSubmitReceipt} 
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    <PackageReceiveIcon className="w-5 h-5" />
                    {isSubmitting ? 'Processing Receipt...' : 'Confirm Goods Receipt'}
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground mt-3 px-4">
                    Recording this receipt will update stock levels and generate an immutable audit movement.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
