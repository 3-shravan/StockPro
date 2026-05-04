import { useEffect, useMemo, useState } from 'react';
import { 
  Cancel01Icon, 
  CheckmarkCircle02Icon, 
  ShoppingBasket01Icon,
  Add01Icon,
  Delete02Icon,
  FilterIcon,
  Note01Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { showToast } from '@/lib/toast';
import { PurchaseOrderStatus } from '@/types/enums';
import { purchasesApi } from '@/features/purchases/api';
import type { PurchaseOrder, POLineItemRequest } from '@/features/purchases/types';
import { SupplierSelect } from '@/components/common/SupplierSelect';
import { WarehouseSelect } from '@/components/common/WarehouseSelect';
import { ProductSelect } from '@/components/common/ProductSelect';
import { useAuthStore } from '@/stores/auth.store';
import { Role } from '@/types';

export const PurchaseOrdersPage = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | PurchaseOrderStatus>('ALL');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // New PO State
  const [supplierId, setSupplierId] = useState(0);
  const [warehouseId, setWarehouseId] = useState(0);
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<POLineItemRequest[]>([{ productId: 0, quantity: 1, unitCost: 0 }]);

  const subtotal = useMemo(() => 
    lineItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0),
  [lineItems]);

  const load = async () => {
    setIsLoading(true);
    try {
      setOrders(await purchasesApi.getAll());
    } catch (error: any) {
      showToast.error('Unable to load purchase orders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const addLine = () => setLineItems([...lineItems, { productId: 0, quantity: 1, unitCost: 0 }]);
  const removeLine = (index: number) => setLineItems(lineItems.filter((_, i) => i !== index));
  
  const updateLine = (index: number, field: keyof POLineItemRequest, value: number) => {
    const next = [...lineItems];
    next[index] = { ...next[index], [field]: value };
    setLineItems(next);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !warehouseId || lineItems.some(i => !i.productId)) {
      showToast.error('Please complete all order details.');
      return;
    }

    try {
      await purchasesApi.create({
        supplierId,
        warehouseId,
        expectedDate,
        notes,
        lineItems
      });
      showToast.success('Purchase Order created successfully.');
      setIsCreating(false);
      setLineItems([{ productId: 0, quantity: 1, unitCost: 0 }]);
      setSupplierId(0);
      setWarehouseId(0);
      await load();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to create PO.');
    }
  };

  const approve = async (id: number) => {
    try {
      await purchasesApi.approve(id);
      showToast.success('PO approved.');
      await load();
    } catch (error) { showToast.error('Approval failed.'); }
  };

  const cancel = async (id: number) => {
    if (!window.confirm('Cancel this PO?')) return;
    try {
      await purchasesApi.cancel(id);
      showToast.success('PO cancelled.');
      await load();
    } catch (error) { showToast.error('Cancellation failed.'); }
  };

  const filteredOrders = useMemo(() => 
    statusFilter === 'ALL' ? orders : orders.filter(o => o.status === statusFilter)
  , [orders, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Procurement & POs</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage the full purchase order lifecycle from draft to fulfillment.
          </p>
        </div>
        
        <Button onClick={() => setIsCreating(!isCreating)} className="rounded-2xl h-11 px-6 shadow-lg shadow-primary/20">
          {isCreating ? 'View All Orders' : 'Create New PO'}
        </Button>
      </div>

      {isCreating ? (
        <Card className="rounded-4xl border-transparent bg-card/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50 p-10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/10">
                <ShoppingBasket01Icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Draft Purchase Order</CardTitle>
                <CardDescription>Enter supplier details and item requirements.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleCreate} className="space-y-10">
              <div className="grid gap-8 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-semibold px-1">Supplier</label>
                  <SupplierSelect value={supplierId} onChange={setSupplierId} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold px-1">Deliver To</label>
                  <WarehouseSelect value={warehouseId} onChange={setWarehouseId} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold px-1">Expected Date</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-input/60 bg-background px-4 text-sm focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-bold text-base">Line Items</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addLine} className="rounded-xl h-9">
                    <Add01Icon className="w-4 h-4 mr-1" /> Add Product
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {lineItems.map((item, index) => (
                    <div key={index} className="grid gap-4 md:grid-cols-[1fr_150px_180px_auto] items-end bg-muted/20 p-4 rounded-3xl border border-border/40 animate-in slide-in-from-right-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground px-1">Product</label>
                        <ProductSelect 
                          value={item.productId} 
                          onChange={(id) => updateLine(index, 'productId', id)} 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground px-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLine(index, 'quantity', Number(e.target.value))}
                          className="h-11 w-full rounded-2xl border border-input/60 bg-background px-4 text-sm focus:border-primary outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground px-1">Unit Cost (INR)</label>
                        <input
                          type="number"
                          value={item.unitCost}
                          onChange={(e) => updateLine(index, 'unitCost', Number(e.target.value))}
                          className="h-11 w-full rounded-2xl border border-input/60 bg-background px-4 text-sm focus:border-primary outline-none"
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => removeLine(index)}
                        disabled={lineItems.length === 1}
                        className="h-11 w-11 rounded-2xl text-destructive hover:bg-destructive/10"
                      >
                        <Delete02Icon className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-8 md:grid-cols-[1fr_300px]">
                <div className="space-y-2">
                  <label className="text-sm font-semibold px-1">Additional Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-32 w-full rounded-3xl border border-input/60 bg-background p-5 text-sm focus:border-primary outline-none"
                    placeholder="Enter any special instructions or reference numbers..."
                  />
                </div>
                <div className="bg-primary/5 rounded-4xl p-8 space-y-4 border border-primary/10">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-primary">Order Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-bold">₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (Exempt)</span>
                      <span className="font-bold">₹0</span>
                    </div>
                    <div className="pt-3 border-t border-primary/10 flex justify-between items-baseline">
                      <span className="font-bold text-base">Total</span>
                      <span className="font-black text-2xl text-primary">₹{subtotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-2xl shadow-lg shadow-primary/20 mt-4">
                    Submit for Approval
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-2xl w-fit border border-border/40">
            <div className="flex items-center gap-2 px-3 text-muted-foreground">
              <FilterIcon className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">Status:</span>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => setStatusFilter('ALL')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${statusFilter === 'ALL' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                All
              </button>
              {Object.values(PurchaseOrderStatus).map(s => (
                <button 
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${statusFilter === s ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="grid gap-4">
            {filteredOrders.length === 0 ? (
              <div className="py-20 text-center opacity-40">
                <ShoppingBasket01Icon className="w-12 h-12 mx-auto mb-4" />
                <p className="font-medium">No purchase orders found.</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.poId} className="rounded-3xl border-transparent bg-card/80 hover:bg-card shadow-sm transition-all group overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <ShoppingBasket01Icon className="w-7 h-7" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-bold text-lg">PO #{order.poId}</h4>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              order.status === PurchaseOrderStatus.APPROVED ? 'bg-emerald-500/10 text-emerald-600' :
                              order.status === PurchaseOrderStatus.PENDING_APPROVAL ? 'bg-amber-500/10 text-amber-600' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {order.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground font-medium">
                            {order.supplierName} · {order.lineItems.length} items · Total ₹{order.totalAmount.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-[10px] font-bold uppercase text-muted-foreground/60 tracking-widest">
                            <span>Ordered: {new Date(order.orderDate).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>WH: {order.warehouseName}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {order.status === PurchaseOrderStatus.PENDING_APPROVAL && (user?.role === Role.ADMIN || user?.role === Role.MANAGER) && (
                          <Button 
                            onClick={() => approve(order.poId)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-4"
                          >
                            <CheckmarkCircle02Icon className="w-4 h-4 mr-1.5" /> Approve
                          </Button>
                        )}
                        
                        {(order.status === PurchaseOrderStatus.DRAFT || order.status === PurchaseOrderStatus.PENDING_APPROVAL) && (
                          <Button 
                            variant="ghost" 
                            onClick={() => cancel(order.poId)}
                            className="text-destructive hover:bg-destructive/10 rounded-xl h-10"
                          >
                            <Cancel01Icon className="w-4 h-4 mr-1.5" /> Cancel
                          </Button>
                        )}

                        <div className="pl-4 border-l border-border/50 ml-2">
                           <Button variant="outline" className="rounded-xl h-10">
                              Details <Note01Icon className="w-4 h-4 ml-1.5 opacity-60" />
                           </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
