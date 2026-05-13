import { Modal } from "@/components/ui/modal";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { InventorySnapshot, POSummary } from "@/features/reports/types";
import { Alert01Icon } from "hugeicons-react";

// ─── Shared Sub-Components ──────────────────────────────────────────────────

const SummaryTile = ({
  label,
  value,
  sub,
  accent = "primary",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "primary" | "emerald" | "rose" | "amber";
}) => {
  const colors = {
    primary: "bg-primary/5 border-primary/15 text-primary",
    emerald: "bg-emerald-500/5 border-emerald-500/15 text-emerald-600",
    rose: "bg-rose-400/5 border-rose-400/15 text-rose-400",
    amber: "bg-amber-500/5 border-amber-500/15 text-amber-600",
  };
  return (
    <div className={cn("p-5 rounded-2xl border shadow-inner flex flex-col gap-1.5", colors[accent])}>
      <p className={cn("text-[9px] font-black uppercase tracking-widest opacity-70")}>{label}</p>
      <p className="text-3xl font-black tracking-tighter tabular-nums leading-none">{value}</p>
      {sub && <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider mt-0.5">{sub}</p>}
    </div>
  );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-3">
    <div className="h-px flex-1 bg-border/40" />
    <p className="text-[9px] font-black text-foreground/40 uppercase tracking-[0.15em]">{children}</p>
    <div className="h-px flex-1 bg-border/40" />
  </div>
);

// ─── Valuation Breakdown Modal ───────────────────────────────────────────────

interface ValuationBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalValue: number;
  details: InventorySnapshot[];
}

export const ValuationBreakdownModal = ({ isOpen, onClose, totalValue, details }: ValuationBreakdownModalProps) => {
  const topByValue = [...details].sort((a, b) => b.stockValue - a.stockValue);
  const maxValue = topByValue[0]?.stockValue || 1;
  const avgValue = details.length ? totalValue / details.length : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asset Breakdown Registry" className="max-w-3xl">
      <div className="space-y-6 p-1">

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryTile label="Total Portfolio Value" value={formatCurrency(totalValue)} accent="primary" />
          <SummaryTile label="Unique SKUs" value={`${details.length}`} sub="Catalogued products" accent="primary" />
          <SummaryTile label="Avg SKU Value" value={formatCurrency(avgValue)} sub="Per product" accent="primary" />
        </div>

        {/* Product list */}
        <div>
          <SectionLabel>Internal Registry Stream · {details.length} Records</SectionLabel>
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {details.length === 0 ? (
              <div className="py-16 text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground/30 italic">
                No inventory records found.
              </div>
            ) : topByValue.map((entry, idx) => {
              const pct = Math.round((entry.stockValue / maxValue) * 100);
              return (
                <div
                  key={`${entry.productId}-${idx}`}
                  className="p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all group hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Rank + icon */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center font-black text-[10px] text-primary border border-primary/10 shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-foreground leading-none truncate group-hover:text-primary transition-colors">
                            {entry.productName || `Product #${entry.productId}`}
                          </p>
                          <span className="shrink-0 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted/60 text-foreground/40 border border-border/40">
                            SKU #{entry.productId}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden border border-border/20">
                            <div
                              className="h-full bg-primary/60 rounded-full transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-black text-foreground/30 tabular-nums">{pct}%</span>
                        </div>
                        <p className="text-[9px] font-black text-foreground/30 uppercase tracking-wider mt-1">
                          {entry.quantity.toLocaleString()} units on-hand
                        </p>
                      </div>
                    </div>
                    {/* Value */}
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black tracking-tighter tabular-nums text-foreground">
                        ₹{entry.stockValue.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[9px] font-black text-foreground/30 uppercase tracking-wider mt-0.5">
                        {((entry.stockValue / totalValue) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ─── Spend Analysis Modal ────────────────────────────────────────────────────

interface SpendAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: POSummary | null;
}

export const SpendAnalysisModal = ({ isOpen, onClose, summary }: SpendAnalysisModalProps) => {
  const orders = summary?.orders ?? [];
  const totalAmount = summary?.totalAmount ?? 0;
  const totalOrders = summary?.totalOrders ?? 0;
  const avgOrder = totalOrders > 0 ? totalAmount / totalOrders : 0;

  const fullyReceived = orders.filter(o => o.status === "FULLY_RECEIVED").length;
  const pending = orders.filter(o => o.status === "PENDING_APPROVAL" || o.status === "SUBMITTED").length;

  const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
    FULLY_RECEIVED:     { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
    PARTIALLY_RECEIVED: { bg: "bg-amber-500/10",   text: "text-amber-600",   border: "border-amber-500/20" },
    PENDING_APPROVAL:   { bg: "bg-amber-500/10",   text: "text-amber-600",   border: "border-amber-500/20" },
    SUBMITTED:          { bg: "bg-primary/10",     text: "text-primary",     border: "border-primary/20" },
    APPROVED:           { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
    CANCELLED:          { bg: "bg-muted/40",       text: "text-foreground/40", border: "border-border/40" },
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Procurement Spend Matrix" className="max-w-3xl">
      <div className="space-y-6 p-1">

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryTile label="Total Expenditure" value={formatCurrency(totalAmount)} sub="Verified spend" accent="emerald" />
          <SummaryTile label="Total Orders" value={`${totalOrders}`} sub={`${fullyReceived} fulfilled · ${pending} pending`} accent="emerald" />
          <SummaryTile label="Avg Order Value" value={formatCurrency(avgOrder)} sub="Per PO cycle" accent="emerald" />
        </div>

        {/* Status breakdown strip */}
        {orders.length > 0 && (
          <div className="flex gap-2 p-3 rounded-2xl bg-muted/20 border border-border/30">
            {[
              { id: "received", label: "Received", count: fullyReceived, color: "bg-emerald-500" },
              { id: "partial", label: "Partial", count: orders.filter(o => o.status === "PARTIALLY_RECEIVED").length, color: "bg-amber-500" },
              { id: "pending", label: "Pending", count: pending, color: "bg-primary" },
              { id: "cancelled", label: "Cancelled", count: orders.filter(o => o.status === "CANCELLED").length, color: "bg-muted-foreground/30" },
            ].map(s => (
              <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                <div className={cn("w-2 h-2 rounded-full", s.color)} />
                <p className="text-lg font-black tabular-nums text-foreground leading-none">{s.count}</p>
                <p className="text-[8px] font-black uppercase tracking-wider text-foreground/40">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Order list */}
        <div>
          <SectionLabel>Authorization Stream · {orders.length} Purchase Orders</SectionLabel>
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {orders.length === 0 ? (
              <div className="py-16 text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground/30 italic">
                Static Stream: No cycles identified.
              </div>
            ) : orders.map((po, idx) => {
              const sc = statusConfig[po.status] ?? statusConfig.SUBMITTED;
              const sharePct = totalAmount > 0 ? ((po.totalAmount / totalAmount) * 100).toFixed(1) : "0.0";
              return (
                <div
                  key={`${po.orderId}-${idx}`}
                  className="p-4 rounded-2xl bg-card border border-border/50 hover:border-emerald-500/30 transition-all group hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    {/* PO number badge */}
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/5 flex items-center justify-center font-black text-[10px] text-emerald-600 border border-emerald-500/10 shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      #{po.orderId}
                    </div>

                    {/* Supplier + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-foreground leading-none group-hover:text-emerald-600 transition-colors">
                          {po.supplierName || `Supplier #${po.supplierId}`}
                        </p>
                        <span className={cn(
                          "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
                          sc.bg, sc.text, sc.border
                        )}>
                          {po.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] font-black text-foreground/30 uppercase tracking-wider">
                          {po.createdAt ? formatDate(po.createdAt) : "Date unavailable"}
                        </span>
                        <span className="text-[9px] font-black text-foreground/20">·</span>
                        <span className="text-[9px] font-black text-foreground/30 uppercase tracking-wider">
                          {sharePct}% of total spend
                        </span>
                        <span className="text-[9px] font-black text-foreground/20">·</span>
                        <span className="text-[9px] font-black text-foreground/30 uppercase tracking-wider">
                          PO #{idx + 1}
                        </span>
                      </div>
                      {/* Spend share bar */}
                      <div className="mt-2 h-1 w-full bg-muted/40 rounded-full overflow-hidden border border-border/20">
                        <div
                          className="h-full bg-emerald-500/50 rounded-full transition-all duration-700"
                          style={{ width: `${sharePct}%` }}
                        />
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black tracking-tighter tabular-nums text-emerald-600">
                        ₹{po.totalAmount.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[9px] font-black text-foreground/30 uppercase tracking-wider mt-0.5">
                        {sharePct}% of spend
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ─── Risk Analysis Modal ─────────────────────────────────────────────────────

interface RiskAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  lowStock: InventorySnapshot[];
}

export const RiskAnalysisModal = ({ isOpen, onClose, lowStock }: RiskAnalysisModalProps) => {
  const criticalCount = lowStock.filter(i => i.quantity === 0).length;
  const lowCount = lowStock.filter(i => i.quantity > 0).length;
  const mostCritical = [...lowStock].sort((a, b) => a.quantity - b.quantity);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Risk Protocol Evaluation" className="max-w-3xl">
      <div className="space-y-6 p-1">

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryTile label="Critical Deviations" value={`${lowStock.length}`} sub="SKUs below threshold" accent="rose" />
          <SummaryTile label="Zero Stock" value={`${criticalCount}`} sub="Immediate action required" accent="rose" />
          <SummaryTile label="Low Stock" value={`${lowCount}`} sub="Monitor & reorder" accent="amber" />
        </div>

        {/* Severity breakdown strip */}
        {lowStock.length > 0 && (
          <div className="p-3 rounded-2xl bg-rose-400/[0.03] border border-rose-400/10 flex items-center gap-4">
            <div className="w-8 h-8 rounded-xl bg-rose-400/10 flex items-center justify-center shrink-0">
              <Alert01Icon className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-foreground/80">
                {criticalCount > 0
                  ? `${criticalCount} product${criticalCount > 1 ? "s" : ""} are completely out of stock — immediate procurement required.`
                  : `All ${lowStock.length} flagged products have some remaining stock but are below safe thresholds.`}
              </p>
            </div>
          </div>
        )}

        {/* Risk list */}
        <div>
          <SectionLabel>Violation Registry · {lowStock.length} Flagged Items</SectionLabel>
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {lowStock.length === 0 ? (
              <div className="py-16 text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground/30 italic">
                Network Secure: No critical risks detected.
              </div>
            ) : mostCritical.map((item, idx) => {
              const isZero = item.quantity === 0;
              return (
                <div
                  key={`${item.productId}-${idx}`}
                  className={cn(
                    "p-4 rounded-2xl bg-card border transition-all group hover:shadow-md",
                    isZero
                      ? "border-rose-400/30 hover:border-rose-400/50"
                      : "border-amber-500/20 hover:border-amber-500/40"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* ID badge */}
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] border shrink-0 transition-all",
                      isZero
                        ? "bg-rose-400/5 text-rose-400 border-rose-400/10 group-hover:bg-rose-400 group-hover:text-white"
                        : "bg-amber-500/5 text-amber-600 border-amber-500/10 group-hover:bg-amber-500 group-hover:text-white"
                    )}>
                      #{item.productId}
                    </div>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-sm font-black leading-none truncate transition-colors",
                          isZero ? "text-foreground group-hover:text-rose-400" : "text-foreground group-hover:text-amber-600"
                        )}>
                          {item.productName || `Product #${item.productId}`}
                        </p>
                        <span className={cn(
                          "shrink-0 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
                          isZero
                            ? "bg-rose-400/10 text-rose-400 border-rose-400/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        )}>
                          {isZero ? "OUT OF STOCK" : "LOW STOCK"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] font-black text-foreground/30 uppercase tracking-wider">
                          Current: {item.quantity.toLocaleString()} units
                        </span>
                        <span className="text-[9px] text-foreground/20">·</span>
                        <span className="text-[9px] font-black text-foreground/30 uppercase tracking-wider">
                          SKU #{item.productId}
                        </span>
                      </div>
                      {/* Severity bar (inversely filled — low qty = full danger bar) */}
                      <div className="mt-2 h-1 w-full bg-muted/40 rounded-full overflow-hidden border border-border/20">
                        <div
                          className={cn("h-full rounded-full transition-all", isZero ? "bg-rose-400" : "bg-amber-500/60")}
                          style={{ width: isZero ? "100%" : "30%" }}
                        />
                      </div>
                    </div>

                    {/* Action tag */}
                    <div className="shrink-0">
                      <span className={cn(
                        "inline-flex items-center px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-wider border",
                        isZero
                          ? "bg-rose-400 text-white border-rose-600 shadow-md shadow-rose-400/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      )}>
                        {isZero ? "Restock Now" : "Monitor"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
