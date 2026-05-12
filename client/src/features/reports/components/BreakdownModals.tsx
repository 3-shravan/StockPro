import { Modal } from "@/components/ui/modal";
import { cn, formatCurrency } from "@/lib/utils";
import type { InventorySnapshot, POSummary } from "@/features/reports/types";

interface ValuationBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalValue: number;
  details: InventorySnapshot[];
}

export const ValuationBreakdownModal = ({ isOpen, onClose, totalValue, details }: ValuationBreakdownModalProps) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Asset Breakdown Registry"
    className="max-w-3xl"
  >
    <div className="space-y-8 p-4">
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/10 shadow-inner">
          <p className="text-[10px] font-black uppercase tracking-wide text-primary mb-3">Registry Valuation</p>
          <p className="text-4xl font-black tracking-tighter tabular-nums">{formatCurrency(totalValue)}</p>
        </div>
        <div className="p-8 rounded-[2rem] bg-muted/5 border border-border/40 shadow-inner">
          <p className="text-[10px] font-black uppercase tracking-wide text-foreground/70 mb-3">Asset Density</p>
          <p className="text-4xl font-black tracking-tighter tabular-nums">{details.length} Unique SKUs</p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black text-foreground/70 uppercase tracking-wider ml-2">Internal Registry Stream</p>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {details.map(entry => (
            <div key={entry.productId} className="flex items-center justify-between p-6 rounded-3xl bg-card border border-border/60 hover:border-primary/40 transition-all cursor-default group hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center font-black text-[10px] text-primary border border-primary/10 shadow-inner group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                  #{entry.productId}
                </div>
                <div>
                  <p className="text-lg font-bold group-hover:text-primary transition-colors leading-none">{entry.productName || 'Direct Catalogue Item'}</p>
                  <p className="text-[10px] font-black text-foreground/70 uppercase tracking-wider mt-2 opacity-40">{entry.quantity} Units On-Hand</p>
                </div>
              </div>
              <p className="text-xl font-black tracking-tighter tabular-nums">₹{entry.stockValue.toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </Modal>
);

interface SpendAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: POSummary | null;
}

export const SpendAnalysisModal = ({ isOpen, onClose, summary }: SpendAnalysisModalProps) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Procurement Spend Matrix"
    className="max-w-3xl"
  >
    <div className="space-y-8 p-4">
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div className="p-8 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 shadow-inner">
          <p className="text-[10px] font-black uppercase tracking-wide text-emerald-600 mb-3">Verified Expenditure</p>
          <p className="text-4xl font-black tracking-tighter tabular-nums text-emerald-600">{formatCurrency(summary?.totalAmount || 0)}</p>
        </div>
        <div className="p-8 rounded-[2rem] bg-muted/5 border border-border/40 shadow-inner">
          <p className="text-[10px] font-black uppercase tracking-wide text-foreground/70 mb-3">Cycle Volume</p>
          <p className="text-4xl font-black tracking-tighter tabular-nums">{summary?.totalOrders || 0} Stream Units</p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black text-foreground/70 uppercase tracking-wider ml-2">Authorization Stream</p>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {summary?.orders && summary.orders.length > 0 ? summary.orders.map(po => (
            <div key={po.orderId} className="flex items-center justify-between p-6 rounded-3xl bg-card border border-border/60 hover:border-emerald-500/40 transition-all cursor-default group hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/5 flex items-center justify-center font-black text-[10px] text-emerald-600 border border-emerald-500/10 shadow-inner group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                  #{po.orderId}
                </div>
                <div>
                  <p className="text-lg font-bold group-hover:text-emerald-600 transition-colors leading-none">{po.supplierName || `Supplier #${po.supplierId}`}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={cn(
                      "text-[9px] font-black uppercase px-3 py-1 rounded-full border shadow-inner",
                      ["APPROVED", "FULLY_RECEIVED", "PARTIALLY_RECEIVED"].includes(po.status)
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    )}>
                      {po.status.replace('_', ' ')}
                    </span>
                    <span className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-wider">{new Date(po.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <p className="text-xl font-black tracking-tighter tabular-nums text-emerald-600">₹{po.totalAmount.toLocaleString('en-IN')}</p>
            </div>
          )) : (
            <div className="py-24 text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground opacity-30 italic">
              Static Stream: No cycles identified.
            </div>
          )}
        </div>
      </div>
    </div>
  </Modal>
);

interface RiskAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  lowStock: InventorySnapshot[];
}

export const RiskAnalysisModal = ({ isOpen, onClose, lowStock }: RiskAnalysisModalProps) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Risk Protocol Evaluation"
    className="max-w-3xl"
  >
    <div className="space-y-8 p-4">
      <div className="p-8 rounded-[2rem] bg-rose-500/5 border border-rose-500/10 shadow-inner mb-4">
        <p className="text-[10px] font-black uppercase tracking-wide text-rose-500 mb-3">Anomaly Intensity</p>
        <p className="text-4xl font-black tracking-tighter tabular-nums text-rose-500">{lowStock.length} Critical Deviations</p>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black text-foreground/70 uppercase tracking-wider ml-2">Violation Registry</p>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {lowStock.length > 0 ? lowStock.map(item => (
            <div key={item.productId} className="flex items-center justify-between p-6 rounded-3xl bg-card border border-border/60 hover:border-rose-500/40 transition-all cursor-default group hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/5 flex items-center justify-center font-black text-[10px] text-rose-500 border border-rose-500/10 shadow-inner group-hover:bg-rose-500 group-hover:text-white transition-all duration-500">
                  #{item.productId}
                </div>
                <div>
                  <p className="text-lg font-bold group-hover:text-rose-500 transition-colors leading-none">{item.productName || 'Direct Catalogue Item'}</p>
                  <p className="text-[10px] font-black text-foreground/70 uppercase tracking-wider mt-2 opacity-40">Current Density: {item.quantity} Units</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-lg shadow-rose-500/20 border border-rose-600">Action Required</span>
              </div>
            </div>
          )) : (
            <div className="py-24 text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground opacity-30 italic">
              Network Secure: No critical risks detected.
            </div>
          )}
        </div>
      </div>
    </div>
  </Modal>
);
