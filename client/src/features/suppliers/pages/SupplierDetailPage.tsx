import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft01Icon,
  StarIcon,
  Mail01Icon,
  CallIcon,
  Location01Icon,
  InvoiceIcon,
  CheckmarkCircle02Icon,
  Timer02Icon,
  ArrowRight01Icon,
  UserEdit01Icon
} from "hugeicons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { suppliersApi } from "@/features/suppliers/api";
import { purchasesApi } from "@/features/purchases/api";
import type { Supplier } from "@/features/suppliers/types";
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
    } catch (error: any) {
      showToast.error("Failed to load supplier details.");
    } finally {
      setLoading(false);
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
              <div className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black border",
                getRatingStyles(supplier.rating)
              )}>
                <StarIcon className="w-3.5 h-3.5 fill-current" />
                {supplier.rating?.toFixed(1) || '0.0'}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className={cn("w-2 h-2 rounded-full animate-pulse shadow-sm", supplier.active ? "bg-primary" : "bg-status-error")} />
              <p className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
                {supplier.active ? "Active Strategic Partner" : "Inactive Partner"} • ID #{supplier.supplierId}
              </p>
              <span className={cn(
                "ml-3 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                supplier.active ? "bg-primary/10 text-primary border-primary/20" : "bg-status-error/10 text-status-error border-status-error/20"
              )}>
                {supplier.active ? "Operational" : "Suspended"}
              </span>
            </div>
          </div>
        </div>

        {isOfficerOrAdmin && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/purchase/suppliers', { state: { editSupplierId: Number(id) } })}
              className="w-12 h-12 rounded-full border border-border bg-primary text-primary-foreground flex-center hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              title="Edit Supplier"
            >
              <UserEdit01Icon className="icon-md" />
            </button>
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="w-full">
        {/* Integrated Partner Analytics Hub */}
        <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-1 shadow-app-card overflow-hidden w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border/20">

            {/* Procurement Efficiency Cluster */}
            <div className="p-10 space-y-6 text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <CheckmarkCircle02Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Fulfillment Stream</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tighter text-foreground">
                    {fulfilledOrders}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Orders</span>
                </div>
                <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest">Successfully Received</p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider border border-primary/20">
                  L/T: {supplier.leadTimeDays} Days
                </div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Avg Cycle</span>
              </div>
            </div>

            {/* Financial Engagement Cluster */}
            <div className="p-10 space-y-6 text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-status-info/10 text-status-info flex items-center justify-center">
                  <InvoiceIcon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Fiscal Volume</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tighter text-primary">
                    {formatCurrency(totalSpent)}
                  </span>
                </div>
                <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest">Total Procurement Value</p>
              </div>
              <div className="pt-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <span>Terms:</span>
                  <span className="text-foreground">{supplier.paymentTerms || "Standard"}</span>
                </div>
                <div className="w-full h-1 bg-muted/30 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-status-info w-[75%]" /> {/* Visual indicator of term stability */}
                </div>
              </div>
            </div>

            {/* Logistics Reliability Cluster */}
            <div className="p-10 space-y-6 text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-status-warning/10 text-status-warning flex items-center justify-center">
                  <Timer02Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Network Trust</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tighter text-foreground">
                    {supplier.rating?.toFixed(1) || '0.0'}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Score</span>
                </div>
                <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest">Global Integrity Index</p>
              </div>
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-medium pt-2">
                Performance metrics based on historical fulfillment latency and order accuracy.
              </p>
            </div>

            {/* Partner Action Hub */}
            <div className="p-10 flex flex-col justify-center bg-muted/5">
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-app-subtle">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Active Pipeline</p>
                  <p className="text-2xl font-black tracking-tighter text-foreground">
                    {orders.filter(o => o.status !== PurchaseOrderStatus.FULLY_RECEIVED).length} Pending
                  </p>
                </div>
                <button
                  onClick={() => navigate('/purchase/orders')}
                  className="w-full group h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-between px-6 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  Order Registry
                  <ArrowRight01Icon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Contact Info & Details */}
        <Card className="rounded-3xl border border-border/40 bg-card shadow-sm">
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
        <Card className="lg:col-span-2 rounded-3xl border border-border/40 bg-card shadow-sm overflow-hidden">
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
                          order.status === PurchaseOrderStatus.FULLY_RECEIVED ? "bg-primary/10 text-primary border-primary/10" : "bg-primary/10 text-primary border-primary/10"
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

    </div>
  );
};

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

const getRatingStyles = (rating: number = 0) => {
  if (rating >= 4.5) return 'bg-primary/10 text-primary border-primary/20';
  if (rating >= 3.5) return 'bg-status-info/10 text-status-info border-status-info/20';
  if (rating >= 2.5) return 'bg-status-warning/10 text-status-warning border-status-warning/20';
  return 'bg-status-error/10 text-status-error border-status-error/20';
};
