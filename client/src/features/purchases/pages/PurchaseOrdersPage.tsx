import { useEffect, useMemo, useState } from 'react';
import {
  Search01Icon,
  ShoppingBasket01Icon,
  PlusSignIcon,
  Delete02Icon,
  FilterIcon,
  Calendar03Icon,
  DeliveryTruck01Icon,
  UserIcon,
  Money01Icon,
  Add01Icon,
  ArrowRight01Icon,
  Edit02Icon,
} from 'hugeicons-react';
import { showToast } from '@/lib/toast';
import { PurchaseOrderStatus } from '@/types/enums';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';
import { purchasesApi } from '@/features/purchases/api';
import type { PurchaseOrder, POLineItemRequest } from '@/features/purchases/types';
import { SupplierSelect } from '@/components/common/SupplierSelect';
import { WarehouseSelect } from '@/components/common/WarehouseSelect';
import { ProductSelect } from '@/components/common/ProductSelect';
import { useAuthStore } from '@/stores/auth.store';
import { Role } from '@/types';
import { cn, formatDate, formatCurrency } from "@/lib/utils";

import { useLocation } from 'react-router-dom';

type TabType = 'list' | 'create' | 'details';

const DetailItem = ({ label, value, icon: Icon }: { label: string, value: string, icon: any }) => (
  <div className="flex items-start gap-4">
    <div className="p-2 rounded-xl bg-muted/50 text-muted-foreground">
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">{label}</p>
      <p className="font-bold mt-0.5">{value}</p>
    </div>
  </div>
);

export const PurchaseOrdersPage = () => {
  const { user } = useAuthStore();
  const role = user?.role || Role.STAFF;
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [query, setQuery] = useState('');
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
    <section className="w-full space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between pt-4">
        <div>
          <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">
            {role === Role.MANAGER ? "Hub Authorization" : "Procurement Flux"}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {role === Role.ADMIN ? "Global Procurement" : role === Role.MANAGER ? "Hub Purchase Orders" : "Procurement Desk"}
          </h1>
        </div>

        <div className="flex p-2 bg-card rounded-full border border-border/40 shadow-app-subtle">
          <button
            onClick={() => setActiveTab('list')}
            className={cn(
              "flex items-center gap-3 px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
              activeTab === 'list' ? "bg-primary text-primary-foreground shadow-app-subtle" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShoppingBasket01Icon className="w-5 h-5" />
            {role === Role.MANAGER ? 'Approval Queue' : 'Order History'}
          </button>
          {(role === Role.OFFICER || role === Role.ADMIN) && (
            <button
              onClick={() => { setActiveTab('create'); reset(); }}
              className={cn(
                "flex items-center gap-3 px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
                activeTab === 'create' ? "bg-primary text-primary-foreground shadow-app-subtle" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <PlusSignIcon className="w-5 h-5" />
              {editingId ? 'Edit Draft' : 'Issue Order'}
            </button>
          )}
        </div>
      </div>

      {activeTab === 'create' ? (
        <div className="max-w-5xl space-y-10 animate-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center gap-4 px-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <ShoppingBasket01Icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{editingId ? 'Edit Purchase Order' : 'Create Purchase Order'}</h2>
              <p className="text-xs font-bold text-foreground/70 uppercase tracking-wider mt-1">
                {editingId ? `Editing draft #${editingId}` : 'Specify supplier, warehouse, and items for procurement.'}
              </p>
            </div>
          </div>

          <div className="px-2">
            <form onSubmit={handleCreate} className="space-y-10">
              <div className="grid gap-8 md:grid-cols-3">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider px-2">Supplier <span className="text-rose-400">*</span></label>
                  <SupplierSelect value={supplierId} onChange={setSupplierId} />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider px-2">Warehouse <span className="text-rose-400">*</span></label>
                  <WarehouseSelect value={warehouseId} onChange={setWarehouseId} />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider px-2">Expected Date</label>
                  <div className="relative group">
                    <input
                      type="date"
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-border bg-muted/5 pl-5 pr-12 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-app-subtle uppercase tracking-wider font-bold"
                    />
                    <Calendar03Icon className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between px-1 border-border/40">
                  <h3 className="text-xl font-bold tracking-tight text-foreground">Procurement Items</h3>
                  <button type="button" onClick={addLine} className="h-10 px-6 rounded-full border border-border bg-card hover:bg-muted text-foreground text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-app-subtle">
                    <Add01Icon className="w-4 h-4" /> Add Item
                  </button>
                </div>

                <div className="space-y-2 ">
                  {lineItems.map((item, index) => (
                    <div key={index} className="grid gap-6 bg-white/[0.05] md:grid-cols-[1fr_150px_150px_auto] items-end bg-card p-6 rounded-3xl border border-border/40 shadow-app-subtle">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider px-2">Resource Entity</label>
                        <ProductSelect
                          value={item.productId}
                          onChange={(id, product) => updateLine(index, 'productId', id, product)}
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider px-2">Units</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLine(index, 'quantity', Number(e.target.value))}
                          className="h-12 w-full rounded-2xl border border-border bg-muted/5 px-5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider px-2">Evaluation Cost</label>
                        <input
                          type="number"
                          value={item.unitCost}
                          onChange={(e) => updateLine(index, 'unitCost', Number(e.target.value))}
                          className="h-12 w-full rounded-2xl border border-border bg-muted/5 px-5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-primary"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        disabled={lineItems.length === 1}
                        className="h-12 w-12 rounded-2xl flex items-center justify-center text-muted-foreground hover:text-white hover:bg-rose-400 bg-muted/20 border border-border/20 transition-all disabled:opacity-20 shadow-app-subtle"
                      >
                        <Delete02Icon className="w-6 h-6" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-[1fr_320px]  border-border/40">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider px-2">Order Instructions & Remarks</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-32 w-full rounded-3xl border border-border bg-card p-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none shadow-app-subtle"
                    placeholder="Enter any additional instructions or comments..."
                  />
                </div>
                <div className="bg-white/[0.05] rounded-3xl p-8 space-y-6 border-transparent border-border/40 shadow-app-subtle flex flex-col">
                  <h4 className="font-bold text-xl text-foreground tracking-tight">Ledger Summary</h4>
                  <div className="space-y-4 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Base Line</span>
                      <span className="text-sm font-bold tabular-nums">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Duties/Taxes</span>
                      <span className="text-sm font-bold tabular-nums text-muted-foreground/50">₹0.00</span>
                    </div>
                    <div className="pt-6 border-t border-border/20 flex flex-col gap-1 mt-4">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Gross Total</span>
                      <span className="text-4xl font-bold text-primary tracking-tighter tabular-nums">{formatCurrency(subtotal)}</span>
                    </div>
                  </div>
                  <div className="pt-4 space-y-3 border-t border-border/10">
                    <button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-wider transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-app-subtle">
                      {isSubmitting ? 'Processing...' : editingId ? 'Commit Changes' : 'Execute Order'}
                    </button>
                    {editingId && (
                      <button type="button" onClick={reset} className="w-full h-12 rounded-full border border-border bg-background text-foreground text-[10px] font-bold uppercase tracking-wider hover:bg-muted/10 transition-all shadow-app-subtle">
                        Abort Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : activeTab === 'details' && selectedOrder ? (
        <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 px-2">
          <button
            onClick={() => setActiveTab('list')}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-all group"
          >
            <ArrowRight01Icon className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Back to Orders
          </button>

          <div className="bg-card border border-border/40 rounded-2xl shadow-app-card overflow-hidden">
            <div className="p-8 border-b border-border/10 bg-muted/10">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-background flex items-center justify-center border border-border/40">
                    <ShoppingBasket01Icon className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-bold">Order #{selectedOrder.poId}</h2>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                        selectedOrder.status === PurchaseOrderStatus.DRAFT ? "bg-muted text-muted-foreground border-border/40" :
                          selectedOrder.status === PurchaseOrderStatus.PENDING_APPROVAL ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                            selectedOrder.status === PurchaseOrderStatus.APPROVED ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                              selectedOrder.status === PurchaseOrderStatus.PARTIALLY_RECEIVED ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" :
                                selectedOrder.status === PurchaseOrderStatus.FULLY_RECEIVED ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                  selectedOrder.status === PurchaseOrderStatus.CANCELLED ? "bg-destructive/10 text-destructive border-destructive/20" :
                                    "bg-muted text-muted-foreground"
                      )}>
                        {selectedOrder.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created on {formatDate(selectedOrder.orderDate)} • By User #{selectedOrder.createdById}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {selectedOrder.status === PurchaseOrderStatus.PENDING_APPROVAL && (user?.role === Role.ADMIN || user?.role === Role.MANAGER) && (
                    <button onClick={() => approve(selectedOrder.poId)} className="h-10 px-6 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all">
                      Approve Order
                    </button>
                  )}
                  {(selectedOrder.status === PurchaseOrderStatus.DRAFT || selectedOrder.status === PurchaseOrderStatus.PENDING_APPROVAL) && (user?.role === Role.OFFICER || user?.role === Role.ADMIN) && (
                    <button onClick={() => edit(selectedOrder)} className="h-10 px-6 rounded-lg border border-primary/20 bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition-all">
                      Edit Draft
                    </button>
                  )}
                  {(selectedOrder.status === PurchaseOrderStatus.DRAFT || selectedOrder.status === PurchaseOrderStatus.PENDING_APPROVAL) && (user?.role === Role.OFFICER || user?.role === Role.ADMIN || user?.role === Role.MANAGER) && (
                    <button onClick={() => cancel(selectedOrder.poId)} className="h-10 px-6 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive font-bold text-xs hover:bg-destructive/20 transition-all">
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-3 gap-8 pb-8 border-b border-border/10">
                <DetailItem label="Supplier" value={selectedOrder.supplierName || 'N/A'} icon={UserIcon} />
                <DetailItem label="Warehouse" value={selectedOrder.warehouseName || 'N/A'} icon={DeliveryTruck01Icon} />
                <DetailItem label="Expected Date" value={selectedOrder.expectedDate ? formatDate(selectedOrder.expectedDate) : 'Not Specified'} icon={Calendar03Icon} />
              </div>

              <div className="mt-8 space-y-4">
                <h3 className="text-sm font-bold text-foreground">Items Manifest</h3>
                <div className="rounded-xl border border-border/40 overflow-hidden bg-muted/5">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/10 border-b border-border/40">
                        <TableHead className="px-6 font-semibold text-xs text-muted-foreground h-10">Product</TableHead>
                        <TableHead className="px-6 font-semibold text-xs text-muted-foreground h-10">SKU</TableHead>
                        <TableHead className="px-6 text-center font-semibold text-xs text-muted-foreground h-10">Ordered</TableHead>
                        <TableHead className="px-6 text-center font-semibold text-xs text-muted-foreground h-10">Received</TableHead>
                        <TableHead className="px-6 text-right font-semibold text-xs text-muted-foreground h-10">Unit Cost</TableHead>
                        <TableHead className="px-6 text-right font-semibold text-xs text-muted-foreground h-10">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.lineItems.map((item, i) => (
                        <TableRow key={i} className="hover:bg-muted/30 border-b border-border/10 transition-colors">
                          <TableCell className="px-6 py-4 font-bold text-sm">{item.productName || `ID: ${item.productId}`}</TableCell>
                          <TableCell className="px-6 py-4 text-xs font-mono text-muted-foreground">{item.productSku || 'N/A'}</TableCell>
                          <TableCell className="px-6 py-4 text-center text-sm font-bold">{item.quantity}</TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold",
                              item.receivedQty === 0 ? "bg-muted text-muted-foreground" :
                                item.receivedQty < item.quantity ? "bg-amber-500/10 text-amber-600" :
                                  "bg-emerald-500/10 text-emerald-600"
                            )}>
                              {item.receivedQty} / {item.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right text-sm">{formatCurrency(item.unitCost)}</TableCell>
                          <TableCell className="px-6 py-4 text-right text-sm font-bold text-primary">{formatCurrency(item.quantity * item.unitCost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter className="bg-muted/10 border-t border-border/40">
                      <TableRow>
                        <TableCell colSpan={5} className="px-6 py-4 text-right font-bold text-xs text-foreground/70 uppercase">Order Total</TableCell>
                        <TableCell className="px-6 py-4 text-right text-lg font-bold text-primary">{formatCurrency(selectedOrder.totalAmount)}</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="mt-8 p-6 rounded-xl bg-muted/5 border border-border/20 italic">
                  <h4 className="text-[10px] font-bold text-foreground/70 uppercase mb-2">Internal Notes</h4>
                  <p className="text-sm text-muted-foreground">"{selectedOrder.notes}"</p>
                </div>
              )}

              {(selectedOrder.status === PurchaseOrderStatus.APPROVED || selectedOrder.status === PurchaseOrderStatus.PARTIALLY_RECEIVED) && (
                <div className="mt-12 p-8 rounded-2xl bg-primary/5 border border-primary/10 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-1 w-8 bg-primary rounded-full" />
                    <h3 className="text-sm font-bold text-foreground">Receive Goods</h3>
                  </div>

                  <div className="space-y-4">
                    {selectedOrder.lineItems.map((item, i) => (
                      <div key={i} className="grid md:grid-cols-[1fr_200px] items-center gap-6 p-4 rounded-xl bg-background border border-border/20">
                        <div>
                          <p className="font-bold text-sm">{item.productName || `Product ${item.productId}`}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">Pending receipt: {item.quantity - item.receivedQty} units</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              min="0"
                              max={item.quantity - item.receivedQty}
                              value={receivingItems.find(ri => ri.productId === item.productId)?.quantity || 0}
                              onChange={(e) => {
                                const val = Math.min(Number(e.target.value), item.quantity - item.receivedQty);
                                setReceivingItems(prev => prev.map(ri => ri.productId === item.productId ? { ...ri, quantity: val } : ri));
                              }}
                              className="h-10 w-full rounded-lg border border-border/40 bg-muted/10 px-3 text-right text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                              placeholder="0"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/50 uppercase">Qty</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={() => handleReceive(selectedOrder.poId)}
                      disabled={isSubmitting || !receivingItems.some(ri => ri.quantity > 0)}
                      className="h-11 px-8 rounded-xl bg-primary text-primary-foreground font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isSubmitting ? 'Processing...' : 'Confirm Receipt'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500 px-2">
          {/* Main Action Bar */}
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center gap-4 w-full">
              <div className="relative group flex-1">
                <Search01Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  className="h-16 w-full rounded-2xl border border-border bg-card/50 pl-16 pr-6 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/30 shadow-inner"
                  placeholder="Search orders by entity, hub, or SKU..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 px-6 h-16 rounded-2xl bg-card/40 border border-border backdrop-blur-md shrink-0">
                <FilterIcon className="w-4 h-4 text-primary" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground/50 leading-none mb-1">Status Filter</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.1em] text-foreground">
                    {statusFilter === 'ALL' ? 'Showing All' : statusFilter.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Quick Filters */}
            <div className="flex items-center justify-between gap-4 w-full">
              <div className="flex p-1 bg-card/40 backdrop-blur-md rounded-xl border border-border shadow-inner overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300",
                      statusFilter === 'ALL'
                        ? "bg-primary text-primary-foreground shadow-app-subtle shadow-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    All Protocols
                  </button>
                  {Object.values(PurchaseOrderStatus).map(s => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300",
                        statusFilter === s
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      )}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{filteredOrders.length} Records Found</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-2">
            {isLoading ? (
              <div className="py-24 text-center space-y-4">
                <div className="w-10 h-10 rounded-full border-2 border-primary/10 border-t-primary animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-24 text-center space-y-4 bg-muted/10 rounded-3xl border border-dashed border-border/40">
                <ShoppingBasket01Icon className="w-12 h-12 text-muted-foreground/20 mx-auto" />
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-foreground">No orders found</p>
                  <p className="text-sm text-muted-foreground">There are no purchase orders matching your filters.</p>
                </div>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.poId}
                  className="group relative bg-card border border-border/40 rounded-3xl p-8 hover:border-primary/20 transition-all duration-500 shadow-app-card hover:shadow-app-hover hover:shadow-primary/5 cursor-pointer overflow-hidden"
                  onClick={() => viewDetails(order.poId)}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center border border-border/10 shadow-inner group-hover:bg-primary/5 transition-colors">
                        <ShoppingBasket01Icon className="w-7 h-7 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-primary/60">Log #{order.poId}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border",
                            order.status === PurchaseOrderStatus.DRAFT ? "bg-muted text-muted-foreground border-border/40" :
                              order.status === PurchaseOrderStatus.PENDING_APPROVAL ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                order.status === PurchaseOrderStatus.APPROVED ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                  order.status === PurchaseOrderStatus.PARTIALLY_RECEIVED ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" :
                                    order.status === PurchaseOrderStatus.FULLY_RECEIVED ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                      order.status === PurchaseOrderStatus.CANCELLED ? "bg-destructive/10 text-destructive border-destructive/20" :
                                        "bg-muted text-muted-foreground"
                          )}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors flex items-center gap-3">
                          {order.lineItems?.[0]?.productName || 'Direct Procurement'}
                          {order.lineItems && order.lineItems.length > 1 && (
                            <span className="px-2 py-0.5 rounded-md bg-muted/50 text-[10px] text-muted-foreground font-black uppercase tracking-tighter">+{order.lineItems.length - 1} Units</span>
                          )}
                        </h3>
                        <div className="flex items-center gap-4 mt-1.5">
                          <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-wider flex items-center gap-2">
                            <UserIcon className="w-3 h-3 text-primary/40" /> {order.supplierName || 'Unknown Supplier'}
                          </p>
                          <div className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                          <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-wider flex items-center gap-2">
                            <DeliveryTruck01Icon className="w-3 h-3 text-primary/40" /> {order.warehouseName || 'General Hub'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 mr-4" onClick={(e) => e.stopPropagation()}>
                        {order.status === PurchaseOrderStatus.DRAFT && (user?.role === Role.OFFICER || user?.role === Role.ADMIN) && (
                          <button
                            onClick={() => submitForApproval(order.poId)}
                            className="h-10 px-4 rounded-xl bg-primary/10 text-primary font-bold text-[9px] uppercase tracking-wider hover:bg-primary transition-all hover:text-primary-foreground shadow-app-subtle"
                          >
                            Submit
                          </button>
                        )}
                        {order.status === PurchaseOrderStatus.PENDING_APPROVAL && (user?.role === Role.ADMIN || user?.role === Role.MANAGER) && (
                          <button
                            onClick={() => approve(order.poId)}
                            className="h-10 px-4 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-[9px] uppercase tracking-wider hover:bg-emerald-600 transition-all hover:text-white shadow-app-subtle"
                          >
                            Approve
                          </button>
                        )}
                        {(order.status === PurchaseOrderStatus.DRAFT || order.status === PurchaseOrderStatus.PENDING_APPROVAL) && (user?.role === Role.OFFICER || user?.role === Role.ADMIN) && (
                          <button
                            onClick={() => { setActiveTab('create'); setEditingId(order.poId); }}
                            className="w-10 h-10 flex items-center justify-center text-primary/60 hover:text-primary transition-all duration-300"
                          >
                            <Edit02Icon className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      <div className="px-6 py-4 rounded-2xl bg-muted/20 border border-border/5 flex flex-col items-end">
                        <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Money01Icon className="w-2.5 h-2.5 text-primary/40" /> Total Valuation
                        </span>
                        <span className="text-xl font-bold tabular-nums tracking-tighter text-foreground/90">{formatCurrency(order.totalAmount)}</span>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); viewDetails(order.poId); }}
                        className="h-16 px-8 rounded-full border border-border/40 bg-background text-muted-foreground font-bold text-[10px] uppercase tracking-wider hover:bg-muted/50 transition-all flex items-center gap-3 shadow-app-subtle group-hover:border-primary/20"
                      >
                        Inspect Ledger <ArrowRight01Icon className="w-4 h-4 group-hover:text-primary transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
};
