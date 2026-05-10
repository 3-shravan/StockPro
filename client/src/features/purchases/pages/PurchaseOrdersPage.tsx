import { useEffect, useMemo, useState } from 'react';
import { 
  Cancel01Icon, 
  CheckmarkCircle02Icon, 
  ShoppingBasket01Icon,
  PlusSignIcon,
  Delete02Icon,
  FilterIcon,
  Note01Icon,
  Calendar03Icon,
  DeliveryTruck01Icon,
  UserIcon,
  Money01Icon,
  Add01Icon,
  ArrowRight01Icon,
  Edit02Icon
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
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn, formatDate } from "@/lib/utils";

import { useLocation } from 'react-router-dom';

type TabType = 'list' | 'create' | 'details';

export const PurchaseOrdersPage = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | PurchaseOrderStatus>(
    (location.state as any)?.filter || 'ALL'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New/Edit PO State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [supplierId, setSupplierId] = useState(0);
  const [warehouseId, setWarehouseId] = useState(0);
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<POLineItemRequest[]>([{ productId: 0, quantity: 1, unitCost: 0 }]);
  const [receivingItems, setReceivingItems] = useState<{ productId: number, quantity: number }[]>([]);

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
  
  const updateLine = (index: number, field: keyof POLineItemRequest, value: number, product?: any) => {
    const next = [...lineItems];
    if (field === 'productId' && product) {
      next[index] = { ...next[index], productId: value, unitCost: product.costPrice || 0 };
    } else {
      next[index] = { ...next[index], [field]: value };
    }
    setLineItems(next);
  };

  const reset = () => {
    setEditingId(null);
    setSupplierId(0);
    setWarehouseId(0);
    setNotes('');
    setExpectedDate('');
    setLineItems([{ productId: 0, quantity: 1, unitCost: 0 }]);
  };

  const edit = (order: PurchaseOrder) => {
    setEditingId(order.poId);
    setSupplierId(order.supplierId);
    setWarehouseId(order.warehouseId);
    setNotes(order.notes ?? '');
    setExpectedDate(order.expectedDate?.split('T')[0] ?? '');
    setLineItems(order.lineItems.map(i => ({
      productId: i.productId,
      quantity: i.quantity,
      unitCost: i.unitCost
    })));
    setActiveTab('create');
  };

  const viewDetails = async (id: number) => {
    try {
      const order = await purchasesApi.getById(id);
      setSelectedOrder(order);
      setReceivingItems(order.lineItems.map(i => ({ productId: i.productId, quantity: 0 })));
      setActiveTab('details');
    } catch (error) {
      showToast.error('Unable to fetch order details.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !warehouseId || lineItems.some(i => !i.productId)) {
      showToast.error('Please complete all order details.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        supplierId,
        warehouseId,
        expectedDate,
        notes,
        lineItems
      };

      if (editingId) {
        await purchasesApi.update(editingId, payload);
        showToast.success('Purchase Order updated successfully.');
      } else {
        await purchasesApi.create(payload);
        showToast.success('Purchase Order created successfully.');
      }
      reset();
      setActiveTab('list');
      await load();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to save PO.');
    } finally {
      setIsSubmitting(false);
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
      if (selectedOrder?.poId === id) {
        setSelectedOrder(await purchasesApi.getById(id));
      }
    } catch (error) { showToast.error('Cancellation failed.'); }
  };

  const submitForApproval = async (id: number) => {
    try {
      await purchasesApi.submit(id);
      showToast.success('PO submitted for approval.');
      await load();
      if (selectedOrder?.poId === id) {
        setSelectedOrder(await purchasesApi.getById(id));
      }
    } catch (error) { showToast.error('Submission failed.'); }
  };

  const handleReceive = async (id: number) => {
    const itemsToReceive = receivingItems.filter(i => i.quantity > 0);
    if (itemsToReceive.length === 0) {
      showToast.error('Please enter quantities to receive.');
      return;
    }

    setIsSubmitting(true);
    try {
      await purchasesApi.receive(id, { items: itemsToReceive });
      showToast.success('Goods received successfully.');
      setReceivingItems([]);
      const updated = await purchasesApi.getById(id);
      setSelectedOrder(updated);
      await load();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to receive goods.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = useMemo(() => 
    statusFilter === 'ALL' ? orders : orders.filter(o => o.status === statusFilter)
  , [orders, statusFilter]);

  return (
    <section className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Procurement & POs</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage the full purchase order lifecycle from draft to fulfillment.
          </p>
        </div>
        
        <div className="flex p-1 bg-muted/50 rounded-2xl w-fit border border-border/50">
          <button
            onClick={() => setActiveTab('list')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
              activeTab === 'list' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShoppingBasket01Icon className="w-4 h-4" />
            Order List
          </button>
          {(user?.role === Role.OFFICER || user?.role === Role.ADMIN) && (
            <button
              onClick={() => { setActiveTab('create'); reset(); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                activeTab === 'create' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <PlusSignIcon className="w-4 h-4" />
              {editingId ? 'Edit Draft' : 'Draft New PO'}
            </button>
          )}
        </div>
      </div>

      {activeTab === 'create' ? (
        <Card className="rounded-4xl border-transparent bg-card/80 shadow-sm border-none overflow-hidden">
          <CardHeader className="bg-muted/30 pb-8 pt-8 px-10 border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10">
                <ShoppingBasket01Icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{editingId ? 'Modify Draft PO' : 'Draft Purchase Order'}</CardTitle>
                <CardDescription>
                  {editingId ? `Editing PO #${editingId}` : 'Specify vendor, destination, and product requirements.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleCreate} className="space-y-10">
              <div className="grid gap-8 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Source Supplier <span className="text-destructive ml-1">*</span>
                    <InfoTooltip content="The vendor providing the goods." />
                  </label>
                  <SupplierSelect value={supplierId} onChange={setSupplierId} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Destination Warehouse <span className="text-destructive ml-1">*</span>
                    <InfoTooltip content="The storage location where goods will be received." />
                  </label>
                  <WarehouseSelect value={warehouseId} onChange={setWarehouseId} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Expected Arrival
                    <InfoTooltip content="Planned delivery date for logistics planning." />
                  </label>
                  <div className="relative group">
                    <Calendar03Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      type="date"
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                      className="h-11 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    Line Items
                    <InfoTooltip content="List of products and quantities required from the supplier." />
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={addLine} className="rounded-xl h-9 border-primary/20 text-primary hover:bg-primary/5">
                    <Add01Icon className="w-4 h-4 mr-1" /> Add Product
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {lineItems.map((item, index) => (
                    <div key={index} className="grid gap-4 md:grid-cols-[1fr_150px_180px_auto] items-end bg-muted/20 p-5 rounded-3xl border border-border/40 transition-all hover:border-primary/20">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground/60 px-1 tracking-wider">Product Selection</label>
                        <ProductSelect 
                          value={item.productId} 
                          onChange={(id, product) => updateLine(index, 'productId', id, product)} 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground/60 px-1 tracking-wider">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLine(index, 'quantity', Number(e.target.value))}
                          className="h-11 w-full rounded-2xl border border-input/60 bg-background px-4 text-sm focus:border-primary outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground/60 px-1 tracking-wider">Unit Cost (INR)</label>
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

              <div className="grid gap-8 md:grid-cols-[1fr_320px]">
                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Purchase Notes
                    <InfoTooltip content="Internal instructions or reference numbers for this order." />
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-32 w-full rounded-3xl border border-input/60 bg-background p-5 text-sm focus:border-primary outline-none"
                    placeholder="Enter any special instructions..."
                  />
                </div>
                <div className="bg-primary/5 rounded-4xl p-8 space-y-6 border border-primary/10">
                  <h4 className="font-black text-[10px] uppercase tracking-widest text-primary">Financial Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Subtotal</span>
                      <span className="font-bold">₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Est. Tax</span>
                      <span className="font-bold">₹0</span>
                    </div>
                    <div className="pt-4 border-t border-primary/10 flex justify-between items-baseline">
                      <span className="font-bold text-sm">Total Amount</span>
                      <span className="font-black text-2xl text-primary">₹{subtotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-2xl shadow-lg shadow-primary/20 mt-2">
                    {isSubmitting ? 'Processing...' : editingId ? 'Update Order' : 'Create Purchase Order'}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="ghost" onClick={reset} className="w-full h-10 mt-2 rounded-xl">
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : activeTab === 'details' && selectedOrder ? (
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => setActiveTab('list')} className="rounded-xl">
            <ArrowRight01Icon className="w-4 h-4 mr-2 rotate-180" /> Back to List
          </Button>
          
          <Card className="rounded-4xl border-transparent bg-card/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-white shadow-sm border border-primary/10">
                    <ShoppingBasket01Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-2xl font-black tracking-tight">PO #{selectedOrder.poId}</CardTitle>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        selectedOrder.status === PurchaseOrderStatus.DRAFT ? "bg-muted text-muted-foreground" :
                        selectedOrder.status === PurchaseOrderStatus.PENDING_APPROVAL ? "bg-amber-500/10 text-amber-600" :
                        selectedOrder.status === PurchaseOrderStatus.APPROVED ? "bg-blue-500/10 text-blue-600" :
                        selectedOrder.status === PurchaseOrderStatus.PARTIALLY_RECEIVED ? "bg-indigo-500/10 text-indigo-600" :
                        selectedOrder.status === PurchaseOrderStatus.FULLY_RECEIVED ? "bg-emerald-500/10 text-emerald-600" :
                        selectedOrder.status === PurchaseOrderStatus.CANCELLED ? "bg-destructive/10 text-destructive" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {selectedOrder.status.replace('_', ' ')}
                      </span>
                    </div>
                    <CardDescription className="font-medium mt-1">
                      Ordered on {formatDate(selectedOrder.orderDate)} · Created by ID: {selectedOrder.createdById}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Submit button removed - POs are auto-submitted on creation */}
                   {selectedOrder.status === PurchaseOrderStatus.PENDING_APPROVAL && (user?.role === Role.ADMIN || user?.role === Role.MANAGER) && (
                      <Button onClick={() => approve(selectedOrder.poId)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                        Approve Order
                      </Button>
                   )}
                   {(selectedOrder.status === PurchaseOrderStatus.DRAFT || selectedOrder.status === PurchaseOrderStatus.PENDING_APPROVAL) && (user?.role === Role.OFFICER || user?.role === Role.ADMIN) && (
                      <Button variant="outline" onClick={() => edit(selectedOrder)} className="rounded-xl border-primary/20 text-primary">
                        Edit Draft
                      </Button>
                   )}
                   {(selectedOrder.status === PurchaseOrderStatus.DRAFT || selectedOrder.status === PurchaseOrderStatus.PENDING_APPROVAL) && (user?.role === Role.OFFICER || user?.role === Role.ADMIN || user?.role === Role.MANAGER) && (
                      <Button variant="ghost" onClick={() => cancel(selectedOrder.poId)} className="rounded-xl text-destructive hover:bg-destructive/10">
                        Reject / Cancel
                      </Button>
                   )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-8 pb-8 border-b border-border/50">
                <DetailItem label="Supplier" value={selectedOrder.supplierName || 'N/A'} icon={UserIcon} />
                <DetailItem label="Warehouse" value={selectedOrder.warehouseName || 'N/A'} icon={DeliveryTruck01Icon} />
                <DetailItem label="Expected Date" value={selectedOrder.expectedDate ? formatDate(selectedOrder.expectedDate) : 'N/A'} icon={Calendar03Icon} />
              </div>
              
              <div className="mt-8">
                <h3 className="font-bold text-lg mb-4">Line Items</h3>
                <div className="rounded-3xl border border-border/50 overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/30 text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Product</th>
                        <th className="px-6 py-4">SKU</th>
                        <th className="px-6 py-4 text-center">Ordered</th>
                        <th className="px-6 py-4 text-center">Received</th>
                        <th className="px-6 py-4 text-right">Unit Cost</th>
                        <th className="px-6 py-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {selectedOrder.lineItems.map((item, i) => (
                        <tr key={i} className="hover:bg-muted/10">
                          <td className="px-6 py-4 font-bold">{item.productName || `ID: ${item.productId}`}</td>
                          <td className="px-6 py-4 text-muted-foreground font-mono">{item.productSku || 'N/A'}</td>
                          <td className="px-6 py-4 text-center font-semibold">{item.quantity}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded-md text-[10px] font-black",
                              item.receivedQty === 0 ? "bg-muted text-muted-foreground" :
                              item.receivedQty < item.quantity ? "bg-amber-500/10 text-amber-600" :
                              "bg-emerald-500/10 text-emerald-600"
                            )}>
                              {item.receivedQty} / {item.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">₹{item.unitCost.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-bold text-primary">₹{(item.quantity * item.unitCost).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-primary/5">
                      <tr>
                        <td colSpan={4} className="px-6 py-6 text-right font-bold">Total Amount</td>
                        <td className="px-6 py-6 text-right text-xl font-black text-primary">₹{selectedOrder.totalAmount.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="mt-8 p-6 rounded-3xl bg-muted/20 border border-border/30">
                  <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">Internal Notes</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">"{selectedOrder.notes}"</p>
                </div>
              )}

              {(selectedOrder.status === PurchaseOrderStatus.APPROVED || selectedOrder.status === PurchaseOrderStatus.PARTIALLY_RECEIVED) && (
                <div className="mt-12 p-8 rounded-4xl bg-primary/5 border border-primary/10 animate-in slide-in-from-bottom duration-500">
                  <div className="flex items-center gap-3 mb-6">
                    <DeliveryTruck01Icon className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-lg">Receive Goods Entry</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {selectedOrder.lineItems.map((item, i) => (
                      <div key={i} className="grid md:grid-cols-[1fr_200px] items-center gap-6 p-4 rounded-2xl bg-background/50 border border-border/40">
                        <div>
                          <p className="font-bold text-sm">{item.productName || `Product ${item.productId}`}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Remaining: {item.quantity - item.receivedQty} units</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <input 
                            type="number"
                            min="0"
                            max={item.quantity - item.receivedQty}
                            value={receivingItems.find(ri => ri.productId === item.productId)?.quantity || 0}
                            onChange={(e) => {
                              const val = Math.min(Number(e.target.value), item.quantity - item.receivedQty);
                              setReceivingItems(prev => prev.map(ri => ri.productId === item.productId ? { ...ri, quantity: val } : ri));
                            }}
                            className="h-10 w-full rounded-xl border border-input bg-background px-4 text-sm focus:border-primary outline-none"
                            placeholder="0"
                          />
                          <span className="text-xs font-bold text-muted-foreground w-20">units</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex justify-end">
                    <Button 
                      onClick={() => handleReceive(selectedOrder.poId)} 
                      disabled={isSubmitting || !receivingItems.some(ri => ri.quantity > 0)}
                      className="rounded-xl shadow-lg shadow-primary/20 h-11 px-8"
                    >
                      {isSubmitting ? 'Updating Inventory...' : 'Confirm Receipt of Goods'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-xl border border-border/50">
                  <FilterIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</span>
                </div>
                
                <div className="flex p-1 bg-muted/30 rounded-xl border border-border/30">
                  <button 
                    onClick={() => setStatusFilter('ALL')}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                      statusFilter === 'ALL' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    All
                  </button>
                  {Object.values(PurchaseOrderStatus).map(s => (
                    <button 
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                        statusFilter === s ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {isLoading ? (
              <p className="py-20 text-center text-muted-foreground">Loading procurement log...</p>
            ) : filteredOrders.length === 0 ? (
              <div className="py-20 text-center bg-muted/10 rounded-4xl border border-dashed border-border/50">
                <ShoppingBasket01Icon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">No purchase orders matching criteria.</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <Card 
                  key={order.poId} 
                  className="rounded-3xl border-transparent bg-card/80 hover:bg-card shadow-sm transition-all group overflow-hidden cursor-pointer active:scale-[0.98]"
                  onClick={() => viewDetails(order.poId)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <ShoppingBasket01Icon className="w-7 h-7" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-bold text-lg">PO #{order.poId}</h4>
                            <span className={cn(
                               "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                               order.status === PurchaseOrderStatus.DRAFT ? "bg-muted text-muted-foreground" :
                               order.status === PurchaseOrderStatus.PENDING_APPROVAL ? "bg-amber-500/10 text-amber-600" :
                               order.status === PurchaseOrderStatus.APPROVED ? "bg-blue-500/10 text-blue-600" :
                               order.status === PurchaseOrderStatus.PARTIALLY_RECEIVED ? "bg-indigo-500/10 text-indigo-600" :
                               order.status === PurchaseOrderStatus.FULLY_RECEIVED ? "bg-emerald-500/10 text-emerald-600" :
                               order.status === PurchaseOrderStatus.CANCELLED ? "bg-destructive/10 text-destructive" :
                               "bg-muted text-muted-foreground"
                            )}>
                              {order.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-y-1 gap-x-4">
                            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                              <UserIcon className="w-3.5 h-3.5" /> {order.supplierName}
                            </p>
                            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                              <DeliveryTruck01Icon className="w-3.5 h-3.5" /> {order.warehouseName}
                            </p>
                            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                              <Money01Icon className="w-3.5 h-3.5" /> ₹{order.totalAmount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                         {order.status === PurchaseOrderStatus.DRAFT && (user?.role === Role.OFFICER || user?.role === Role.ADMIN) && (
                          <Button 
                            onClick={() => submitForApproval(order.poId)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-10 px-4"
                          >
                            <ArrowRight01Icon className="w-4 h-4 mr-1.5" /> Submit
                          </Button>
                        )}

                        {order.status === PurchaseOrderStatus.PENDING_APPROVAL && (user?.role === Role.ADMIN || user?.role === Role.MANAGER) && (
                          <Button 
                            onClick={() => approve(order.poId)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-4 shadow-md shadow-emerald-600/10"
                          >
                            <CheckmarkCircle02Icon className="w-4 h-4 mr-1.5" /> Approve
                          </Button>
                        )}

                        {(order.status === PurchaseOrderStatus.DRAFT || order.status === PurchaseOrderStatus.PENDING_APPROVAL) && (user?.role === Role.OFFICER || user?.role === Role.ADMIN) && (
                          <Button 
                            variant="ghost" 
                            onClick={() => edit(order)}
                            className="text-primary hover:bg-primary/10 rounded-xl h-10"
                          >
                            <Edit02Icon className="w-4 h-4 mr-1.5" /> Edit
                          </Button>
                        )}

                        {(order.status === PurchaseOrderStatus.DRAFT || order.status === PurchaseOrderStatus.PENDING_APPROVAL) && (user?.role === Role.OFFICER || user?.role === Role.ADMIN || user?.role === Role.MANAGER) && (
                          <Button 
                            variant="ghost" 
                            onClick={() => cancel(order.poId)}
                            className="text-destructive hover:bg-destructive/10 rounded-xl h-10"
                          >
                            <Cancel01Icon className="w-4 h-4 mr-1.5" /> {user?.role === Role.MANAGER ? 'Reject' : 'Cancel'}
                          </Button>
                        )}

                        <Button 
                          variant="outline" 
                          onClick={() => viewDetails(order.poId)}
                          className="rounded-xl h-10 border-border/60 hover:bg-muted/50"
                        >
                          View Details <Note01Icon className="w-4 h-4 ml-1.5 opacity-60" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
};

const DetailItem = ({ label, value, icon: Icon }: { label: string, value: string, icon: any }) => (
  <div className="flex items-start gap-4">
    <div className="p-2 rounded-xl bg-muted/50 text-muted-foreground">
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</p>
      <p className="font-bold mt-0.5">{value}</p>
    </div>
  </div>
);
