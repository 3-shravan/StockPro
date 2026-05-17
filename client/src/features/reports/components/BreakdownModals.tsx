import { Modal } from "@/components/ui/modal";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { InventorySnapshot, POSummary } from "@/features/reports/types";

// ─── Shared Sub-Components ──────────────────────────────────────────────────

const SummaryTile = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "primary" | "success" | "error" | "warning";
}) => {
  return (
    <div className="p-5 rounded-2xl bg-card/20 border border-border/30 flex flex-col gap-1 text-left">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/40">{label}</p>
      <p className="text-4xl font-bold tracking-tight tabular-nums leading-none text-foreground">{value}</p>
      {sub && <p className="text-[11px] font-bold text-foreground/20 uppercase tracking-wider mt-1">{sub}</p>}
    </div>
  );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-4 py-3">
    <p className="text-[11px] font-bold text-foreground/30 uppercase tracking-[0.25em] whitespace-nowrap">{children}</p>
    <div className="h-px flex-1 bg-border/20" />
  </div>
);

const SummationFooter = ({
  title,
  metrics,
  finalLabel,
  finalValue,
  finalSub,
}: {
  title: string;
  metrics: { label: string; value: string }[];
  finalLabel: string;
  finalValue: string;
  finalSub: string;
}) => (
  <div className="mt-4 pt-4">
    <div className="bg-foreground/[0.02] rounded-3xl p-6 border border-border/10 text-left">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[12px] font-bold uppercase tracking-[0.3em] text-foreground/30">{title}</h4>
        <span className="text-[11px] font-bold text-primary uppercase tracking-widest px-3 py-1 bg-primary/5 rounded-full border border-primary/10">Verified Data</span>
      </div>

      <div className="space-y-3">
        {metrics.map((m, i) => (
          <div key={i} className="flex justify-between items-center group">
            <span className="text-[12px] font-bold text-foreground/40 uppercase tracking-widest group-hover:text-foreground/60 transition-colors">{m.label}</span>
            <span className="text-xl font-bold tabular-nums text-foreground/80">{m.value}</span>
          </div>
        ))}
        <div className="pt-4 border-t border-border/10 flex justify-between items-end">
          <span className="text-[12px] font-bold text-primary uppercase tracking-[0.3em]">{finalLabel}</span>
          <div className="text-right">
            <p className="text-5xl font-black tracking-tighter tabular-nums text-foreground leading-none">{finalValue}</p>
            <p className="text-[11px] font-bold text-foreground/20 uppercase tracking-widest mt-2">{finalSub}</p>
          </div>
        </div>
      </div>
    </div>
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
  const avgValue = details.length ? totalValue / details.length : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Inventory Breakdown" className="max-w-4xl">
      <div className="space-y-1 p-1">

        {/* Summary row */}
        <div className="grid grid-cols-2 gap-4">
          <SummaryTile label="Total Stock Value" value={formatCurrency(totalValue)} />
          <SummaryTile label="Catalogued Products" value={`${details.length}`} sub="Unique items identified" />
        </div>

        {/* Product list */}
        <div className="mt-4">
          <SectionLabel>Inventory Records · {details.length} Items</SectionLabel>
          <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {details.length === 0 ? (
              <div className="py-16 text-center text-[12px] font-black uppercase tracking-widest text-muted-foreground/20 italic">
                Records Clear: No inventory activity detected.
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/10">
                    <th className="text-left py-3 text-[11px] font-black text-foreground/30 uppercase tracking-widest">ID</th>
                    <th className="text-left py-3 text-[11px] font-black text-foreground/30 uppercase tracking-widest">Description</th>
                    <th className="text-right py-3 text-[11px] font-black text-foreground/30 uppercase tracking-widest">Units</th>
                    <th className="text-right py-3 text-[11px] font-black text-foreground/30 uppercase tracking-widest">Unit Value</th>
                    <th className="text-right py-3 text-[11px] font-black text-foreground/30 uppercase tracking-widest">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/5">
                  {topByValue.map((entry, idx) => (
                    <tr key={`${entry.productId}-${idx}`} className="group hover:bg-foreground/[0.01] transition-colors">
                      <td className="py-3 text-[13px] font-black text-foreground/20 tabular-nums">{(idx + 1).toString().padStart(2, '0')}</td>
                      <td className="py-3">
                        <p className="text-[14px] font-black text-foreground/80 leading-none group-hover:text-primary transition-colors uppercase tracking-tight">
                          {entry.productName || "Undefined Item"}
                        </p>
                        <p className="text-[11px] font-black text-foreground/20 uppercase tracking-widest mt-1.5">SKU #{entry.productId}</p>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-[13px] font-black text-foreground/60 tabular-nums">{entry.quantity.toLocaleString()}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-[13px] font-black text-foreground/40 tabular-nums">₹{(entry.stockValue / (entry.quantity || 1)).toLocaleString("en-IN")}</span>
                      </td>
                      <td className="py-3 text-right">
                        <p className="text-[16px] font-black text-foreground group-hover:text-primary transition-colors tabular-nums">₹{entry.stockValue.toLocaleString("en-IN")}</p>
                        <p className="text-[10px] font-black text-foreground/20 uppercase tracking-widest mt-1">{((entry.stockValue / totalValue) * 100).toFixed(1)}% Weight</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Mathematical Summation Footer */}
        <SummationFooter
          title="Inventory Summary"
          metrics={[
            { label: "Total Physical Units", value: `${details.reduce((acc, curr) => acc + curr.quantity, 0).toLocaleString()} UNITS` },
            { label: "Average Unit Value", value: `${formatCurrency(avgValue)} / SKU` },
          ]}
          finalLabel="Final Calculated Value"
          finalValue={formatCurrency(totalValue)}
          finalSub="Total Verified Stock Value"
        />
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
  const grossSpend = orders.filter(o => o.status !== "CANCELLED").reduce((acc, o) => acc + o.totalAmount, 0);
  const settledAmount = orders.filter(o => o.status === "FULLY_RECEIVED").reduce((acc, o) => acc + o.totalAmount, 0);
  const pipelineAmount = orders.filter(o => o.status !== "FULLY_RECEIVED" && o.status !== "CANCELLED").reduce((acc, o) => acc + o.totalAmount, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Spending Analysis" className="max-w-4xl">
      <div className="space-y-1 p-1">

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4">
          <SummaryTile label="Total Expenditure" value={formatCurrency(grossSpend)} />
          <SummaryTile label="Received Value" value={formatCurrency(settledAmount)} />
          <SummaryTile label="Pending Value" value={formatCurrency(pipelineAmount)} />
        </div>

        {/* Status breakdown strip */}
        {orders.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-4 p-5 rounded-2xl bg-card/10 border border-border/20">
            {[
              { label: "Received", count: orders.filter(o => o.status === "FULLY_RECEIVED").length, color: "text-primary" },
              { label: "Partial", count: orders.filter(o => o.status === "PARTIALLY_RECEIVED").length, color: "text-status-warning" },
              { label: "Pending", count: orders.filter(o => o.status === "PENDING_APPROVAL" || o.status === "SUBMITTED").length, color: "text-primary/60" },
              { label: "Cancelled", count: orders.filter(o => o.status === "CANCELLED").length, color: "text-foreground/20" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black tabular-nums text-foreground leading-none">{s.count}</p>
                <p className={cn("text-[11px] font-black uppercase tracking-[0.2em] mt-2", s.color)}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Order list */}
        <div className="mt-4">
          <SectionLabel>Order Records · {orders.length} Purchase Orders</SectionLabel>
          <div className="max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
            {orders.length === 0 ? (
              <div className="py-16 text-center text-[12px] font-black uppercase tracking-widest text-muted-foreground/20 italic">
                No active orders found.
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/10">
                    <th className="text-left py-3 text-[11px] font-black text-foreground/30 uppercase tracking-widest">Order ID</th>
                    <th className="text-left py-3 text-[11px] font-black text-foreground/30 uppercase tracking-widest">Supplier</th>
                    <th className="text-left py-3 text-[11px] font-black text-foreground/30 uppercase tracking-widest">Status</th>
                    <th className="text-right py-3 text-[11px] font-black text-foreground/30 uppercase tracking-widest">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/5">
                  {orders.map((po, idx) => {
                    const sharePct = grossSpend > 0 ? ((po.totalAmount / grossSpend) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={`${po.orderId}-${idx}`} className="group hover:bg-foreground/[0.01] transition-colors">
                        <td className="py-3">
                          <p className="text-[13px] font-black text-foreground/80 tabular-nums">#{po.orderId}</p>
                          <p className="text-[10px] font-black text-foreground/20 uppercase tracking-widest mt-1">
                            {po.createdAt ? formatDate(po.createdAt) : "DATE UNKNOWN"}
                          </p>
                        </td>
                        <td className="py-3">
                          <p className="text-[14px] font-black text-foreground/80 group-hover:text-primary transition-colors uppercase tracking-tight">
                            {po.supplierName || `Vendor #${po.supplierId}`}
                          </p>
                        </td>
                        <td className="py-3 text-left">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full border",
                            po.status === "FULLY_RECEIVED" ? "bg-primary/10 text-primary border-primary/20" :
                              po.status === "CANCELLED" ? "bg-muted/30 text-muted-foreground/50 border-border/30" :
                                "bg-status-warning/10 text-status-warning border-status-warning/20"
                          )}>
                            {po.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <p className="text-[16px] font-black text-foreground group-hover:text-primary transition-colors tabular-nums">₹{po.totalAmount.toLocaleString("en-IN")}</p>
                          <p className="text-[10px] font-black text-foreground/20 uppercase tracking-widest mt-1">{sharePct}% Weight</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Mathematical Summation Footer */}
        <SummationFooter
          title="Spending Summary"
          metrics={[
            { label: "Received Orders Value", value: formatCurrency(settledAmount) },
            { label: "Pending Orders Value", value: formatCurrency(pipelineAmount) },
            { label: "Total PO Count", value: orders.length.toString() },
          ]}
          finalLabel="Total Portfolio Spend"
          finalValue={formatCurrency(grossSpend)}
          finalSub="Total Expenditure Verified"
        />
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
    <Modal isOpen={isOpen} onClose={onClose} title="Inventory Risk Analysis" className="max-w-4xl">
      <div className="space-y-1 p-1">

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4">
          <SummaryTile label="Critical Items" value={`${lowStock.length}`} sub="Total Risk Items" />
          <SummaryTile label="Out of Stock" value={`${criticalCount}`} sub="Requires Action" />
          <SummaryTile label="Low Stock" value={`${lowCount}`} sub="Monitor Level" />
        </div>

        {/* Risk list */}
        <div className="mt-4">
          <SectionLabel>Stock Alerts · {lowStock.length} Flagged Items</SectionLabel>
          <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {lowStock.length === 0 ? (
              <div className="py-16 text-center text-[12px] font-black uppercase tracking-widest text-muted-foreground/20 italic">
                No critical risks detected.
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/10">
                    <th className="text-left py-3 text-[11px] font-black text-foreground/30 uppercase tracking-widest">SKU</th>
                    <th className="text-left py-3 text-[11px] font-black text-foreground/30 uppercase tracking-widest">Product Description</th>
                    <th className="text-right py-3 text-[11px] font-black text-foreground/30 uppercase tracking-widest">Inventory</th>
                    <th className="text-right py-3 text-[11px] font-black text-foreground/30 uppercase tracking-widest">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/5">
                  {mostCritical.map((item, idx) => {
                    const isZero = item.quantity === 0;
                    return (
                      <tr key={`${item.productId}-${idx}`} className="group hover:bg-foreground/[0.01] transition-colors">
                        <td className="py-3 text-[13px] font-black text-foreground/20 tabular-nums">#{item.productId}</td>
                        <td className="py-3">
                          <p className={cn(
                            "text-[14px] font-black uppercase tracking-tight transition-colors",
                            isZero ? "text-status-error group-hover:text-status-error/80" : "text-foreground group-hover:text-primary"
                          )}>
                            {item.productName || "Unknown SKU"}
                          </p>
                          <p className="text-[11px] font-black text-foreground/20 uppercase tracking-widest mt-1.5 leading-none">System Record Match</p>
                        </td>
                        <td className="py-3 text-right">
                          <p className={cn("text-[15px] font-black tabular-nums", isZero ? "text-status-error" : "text-foreground/60")}>
                            {item.quantity.toLocaleString()} UNITS
                          </p>
                        </td>
                        <td className="py-3 text-right">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-[0.15em] px-4 py-1.5 rounded-full border shadow-sm",
                            isZero ? "bg-status-error text-white border-status-error" : "bg-status-warning/10 text-status-warning border-status-warning/20"
                          )}>
                            {isZero ? "CRITICAL" : "REORDER"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Summation Footer */}
        <SummationFooter
          title="Inventory Risk Summary"
          metrics={[
            { label: "Critical Stockouts", value: criticalCount.toString() },
            { label: "Low Stock Violations", value: lowCount.toString() },
          ]}
          finalLabel="Total Flagged Assets"
          finalValue={lowStock.length.toString()}
          finalSub="Verification Complete"
        />
      </div>
    </Modal>
  );
};
