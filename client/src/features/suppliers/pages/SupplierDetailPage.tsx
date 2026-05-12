import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft01Icon,
  StarIcon,
  Mail01Icon,
  CallIcon,
  Location01Icon,
  Settings02Icon,
  InvoiceIcon,
  CheckmarkCircle02Icon,
  Timer02Icon,
  CreditCardIcon
} from "hugeicons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { suppliersApi } from "@/features/suppliers/api";
import { purchasesApi } from "@/features/purchases/api";
import type { Supplier, SupplierRequest } from "@/features/suppliers/types";
import type { PurchaseOrder } from "@/features/purchases/types";
import { showToast } from "@/lib/toast";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { useAuthStore } from "@/stores/auth.store";
import { Role } from "@/types";
import { PurchaseOrderStatus } from "@/types/enums";

export const SupplierDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOfficerOrAdmin = user?.role === Role.OFFICER || user?.role === Role.ADMIN;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState<SupplierRequest>({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    taxId: "",
    paymentTerms: "",
    leadTimeDays: 0
  });

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [sData, oData] = await Promise.all([
        suppliersApi.getById(Number(id)),
        purchasesApi.getBySupplier(Number(id))
      ]);
      setSupplier(sData);
      setOrders(oData.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
      
      setEditForm({
        name: sData.name,
        contactPerson: sData.contactPerson ?? "",
        email: sData.email ?? "",
        phone: sData.phone ?? "",
        address: sData.address ?? "",
        city: sData.city ?? "",
        country: sData.country ?? "",
        taxId: sData.taxId ?? "",
        paymentTerms: sData.paymentTerms ?? "",
        leadTimeDays: sData.leadTimeDays
      });
    } catch (error: any) {
      showToast.error("Failed to load supplier details.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setIsUpdating(true);
      await suppliersApi.update(Number(id), editForm);
      showToast.success("Supplier updated successfully.");
      setIsEditModalOpen(false);
      await loadData();
    } catch (error: any) {
      showToast.error("Failed to update supplier.");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [id]);

  if (loading && !supplier) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium">Fetching partner profile...</p>
      </div>
    );
  }

  if (!supplier) return null;

  const totalSpent = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const fulfilledOrders = orders.filter(o => o.status === PurchaseOrderStatus.FULLY_RECEIVED).length;

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
            <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">Partner Profile</p>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                {supplier.name}
              </h1>
              <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 px-3 py-1.5 rounded-xl text-xs font-black border border-amber-500/20">
                <StarIcon className="w-3.5 h-3.5 fill-current" />
                {supplier.rating?.toFixed(1) || '0.0'}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className={cn("w-2 h-2 rounded-full animate-pulse shadow-sm", supplier.active ? "bg-emerald-500" : "bg-destructive")} />
              <p className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
                {supplier.active ? "Active Strategic Partner" : "Inactive Partner"} • ID #{supplier.supplierId}
              </p>
            </div>
          </div>
        </div>

        {isOfficerOrAdmin && (
          <div className="flex items-center gap-4 p-2 bg-card/30 rounded-full border border-border shadow-2xl backdrop-blur-md">
            <button 
              className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-primary/20"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Settings02Icon className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Fulfillment" 
          value={fulfilledOrders.toString()}
          unit="Orders"
          icon={<CheckmarkCircle02Icon className="w-6 h-6" />}
          description="Successfully delivered and received"
        />
        <StatCard 
          title="Lead Time Efficiency" 
          value={`${supplier.leadTimeDays}d`}
          unit="Avg"
          icon={<Timer02Icon className="w-6 h-6" />}
          description="Expected arrival after order placement"
        />
        <StatCard 
          title="Payment Terms" 
          value={supplier.paymentTerms || "N/A"}
          unit=""
          icon={<CreditCardIcon className="w-6 h-6" />}
          description="Standard financial agreement"
        />
        <StatCard 
          title="Total Volume" 
          value={formatCurrency(totalSpent)}
          unit=""
          icon={<InvoiceIcon className="w-6 h-6" />}
          description="Cumulative transaction value"
        />
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Contact Info & Details */}
        <Card className="rounded-[2.5rem] border border-border/40 bg-card shadow-2xl">
          <CardHeader className="p-6">
            <CardTitle className="text-lg">Partner Details</CardTitle>
            <CardDescription className="text-xs">Contact and administrative information.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-6">
            <div className="space-y-4">
              <DetailItem icon={<Mail01Icon className="w-4 h-4" />} label="Email" value={supplier.email} />
              <DetailItem icon={<CallIcon className="w-4 h-4" />} label="Phone" value={supplier.phone || "Not provided"} />
              <DetailItem icon={<Location01Icon className="w-4 h-4" />} label="Location" value={`${supplier.city}, ${supplier.country}`} />
              <DetailItem icon={<InvoiceIcon className="w-4 h-4" />} label="Tax ID" value={supplier.taxId || "N/A"} />
            </div>
            
            <div className="pt-5 border-t border-border/50">
              <p className="text-[10px] font-black uppercase text-muted-foreground/60 mb-2 tracking-wider">Registered Address</p>
              <p className="text-xs leading-relaxed text-foreground/80 bg-muted/30 p-4 rounded-2xl italic">
                {supplier.address || "No detailed address on file."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="lg:col-span-2 rounded-[2.5rem] border border-border/40 bg-card shadow-2xl overflow-hidden">
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Transaction History</CardTitle>
                <CardDescription className="text-xs">Recent procurement activity with this partner.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/40 h-16">
                  <TableHead className="px-8 font-black text-xs text-muted-foreground/80 uppercase tracking-widest">Order Reference</TableHead>
                  <TableHead className="px-8 font-black text-xs text-muted-foreground/80 uppercase tracking-widest">Timestamp</TableHead>
                  <TableHead className="px-8 font-black text-xs text-muted-foreground/80 uppercase tracking-widest">Fiscal Value</TableHead>
                  <TableHead className="px-8 font-black text-xs text-muted-foreground/80 uppercase tracking-widest text-right">Integrity Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="px-8 py-16 text-center text-muted-foreground italic text-sm border-none">No active transaction history found.</TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.poId} className="group hover:bg-muted/10 border-b border-border/40 transition-colors cursor-pointer last:border-0 h-24" onClick={() => navigate(isOfficerOrAdmin ? `/purchase/orders` : `/manager/purchase-orders`)}>
                      <TableCell className="px-8 whitespace-nowrap">
                        <span className="font-black text-xl text-foreground tracking-tighter">PO #{order.poId}</span>
                      </TableCell>
                      <TableCell className="px-8 text-muted-foreground text-sm whitespace-nowrap">
                        {formatDate(order.orderDate)}
                      </TableCell>
                      <TableCell className="px-8 font-black text-xl text-foreground whitespace-nowrap tracking-tighter">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell className="px-8 text-right whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest border",
                          order.status === PurchaseOrderStatus.FULLY_RECEIVED ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/10" : "bg-primary/10 text-primary border-primary/10"
                        )}>
                          {order.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Partner Profile"
      >
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-bold px-1">Company Name</label>
              <input 
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold px-1">Email</label>
              <input 
                type="email"
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                value={editForm.email}
                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold px-1">Phone</label>
              <input 
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                value={editForm.phone}
                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold px-1">City</label>
              <input 
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                value={editForm.city}
                onChange={e => setEditForm({ ...editForm, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold px-1">Country</label>
              <input 
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                value={editForm.country}
                onChange={e => setEditForm({ ...editForm, country: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1 h-12 rounded-2xl" disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save Profile"}
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

const StatCard = ({ title, value, unit, icon, description }: any) => (
  <Card className="rounded-[2.5rem] border-none bg-white/[0.05] shadow-2xl backdrop-blur-xl overflow-hidden group hover:bg-white/[0.05] transition-all">
    <CardContent className="p-8 text-center">
      <div className={cn(
        "mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white/5",
        "bg-primary/10 text-primary"
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

const DetailItem = ({ icon, label, value }: any) => (
  <div className="flex items-center gap-4">
    <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  </div>
);
