import { useState } from 'react';
import { 
  PackageMovingIcon, 
  DeliveryBox01Icon,
  HelpCircleIcon,
  Settings02Icon,
  ShoppingCart01Icon,
  PackageIcon
} from 'hugeicons-react';
import { ProductSelect } from '@/components/common/ProductSelect';
import { WarehouseSelect } from '@/components/common/WarehouseSelect';
import { movementsApi } from '@/features/movements/api/movements.api';
import { MovementType } from '@/types/enums';
import { useAuthStore } from '@/stores/auth.store';
import { showToast } from '@/lib/toast';

const issueReasons = [
  { label: 'Customer Sale', value: MovementType.STOCK_OUT, icon: ShoppingCart01Icon },
  { label: 'Production / Consumption', value: MovementType.STOCK_OUT, icon: Settings02Icon },
  { label: 'Internal Use', value: MovementType.STOCK_OUT, icon: PackageMovingIcon },
  { label: 'Damaged / Write-off', value: MovementType.WRITE_OFF, icon: DeliveryBox01Icon },
];

export const IssuePage = () => {
  const { user } = useAuthStore();
  const [productId, setProductId] = useState(0);
  const [warehouseId, setWarehouseId] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState<MovementType>(MovementType.STOCK_OUT);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productId || !warehouseId || !quantity) {
      showToast.error('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await movementsApi.create({
        productId,
        warehouseId,
        quantity: Math.abs(quantity),
        movementType: reason,
        notes,
        performedBy: user?.userId ?? 0,
        referenceType: 'MANUAL',
        referenceId: 0,
        unitCost: 0,
        balanceAfter: 0,
      });
      showToast.success('Stock issue recorded successfully.');
      setProductId(0);
      setQuantity(0);
      setNotes('');
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to record stock issue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-700 pb-20 px-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between pt-4">
        <div>
          <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">Resource Consumption</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Dispatch Protocol
          </h1>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
        <div className="space-y-12">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="bg-card/40 backdrop-blur-xl p-10 rounded-[2.5rem] border border-border/40 space-y-10">
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-3 text-left">
                  <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400/40" />
                    Source Node Hub <span className="text-rose-400/60">*</span>
                  </label>
                  <WarehouseSelect value={warehouseId} onChange={setWarehouseId} placeholder="SELECT ORIGIN HUB" />
                </div>

                <div className="space-y-3 text-left">
                  <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400/40" />
                    Resource Designation <span className="text-rose-400/60">*</span>
                  </label>
                  <ProductSelect value={productId} onChange={setProductId} warehouseId={warehouseId} placeholder="SELECT SKU" />
                </div>

                <div className="space-y-3 text-left">
                  <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400/40" />
                    Verified Quantity <span className="text-rose-400/60">*</span>
                  </label>
                  <div className="relative group">
                    <PackageIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-rose-400 transition-colors" />
                    <input
                      type="number"
                      min="1"
                      value={quantity || ''}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-rose-400/10 outline-none transition-all"
                      placeholder="UNIT COUNT"
                    />
                  </div>
                </div>

                <div className="space-y-3 text-left">
                  <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400/40" />
                    Dispatch Rationale <span className="text-rose-400/60">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value as MovementType)}
                      className="h-14 w-full rounded-2xl border border-border bg-muted/5 px-6 text-[10px] font-black uppercase tracking-wider focus:ring-4 focus:ring-rose-400/10 outline-none appearance-none cursor-pointer transition-all"
                    >
                      {issueReasons.map((r) => (
                        <option key={r.label} value={r.value}>{r.label.toUpperCase()} SEGMENT</option>
                      ))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none opacity-40 text-xs">
                      ▼
                    </div>
                  </div>
                </div>

                <div className="space-y-3 sm:col-span-2 text-left">
                  <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400/40" />
                    Audit Reference / Strategic Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[120px] w-full rounded-2xl border border-border bg-muted/5 p-6 text-sm font-bold focus:ring-4 focus:ring-rose-400/10 outline-none transition-all resize-none placeholder:text-muted-foreground/20"
                    placeholder="DESCRIBE DISPATCH CONTEXT..."
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-6 border-t border-border/40">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 h-14 rounded-full bg-rose-400/80 text-white font-black text-[10px] uppercase tracking-wider transition-all hover:bg-rose-400 hover:shadow-rose-400/30 active:scale-[0.98] shadow-lg shadow-rose-400/10 disabled:opacity-50"
              >
                {isSubmitting ? 'SYNCHRONIZING...' : 'AUTHORIZE DISPATCH'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-8">
          <div className="bg-card/40 backdrop-blur-xl p-10 rounded-[2.5rem] border border-border/40 space-y-8">
            <h3 className="text-[10px] font-black text-rose-400/60 uppercase tracking-wider flex items-center gap-3">
              <HelpCircleIcon className="w-5 h-5" />
              Operational Guidelines
            </h3>
            <ul className="space-y-6 text-left">
              {[
                "Hub capacity and real-time stock levels are verified upon authorization.",
                "Dispatched quantities are immediately deducted from the immutable ledger.",
                "Categorize as 'Write-off' only for verified damage or expiration events."
              ].map((text, i) => (
                <li key={i} className="flex gap-4 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400/20 mt-1.5 shrink-0 group-hover:bg-rose-400 transition-colors" />
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider leading-relaxed">
                    {text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-10 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-xl">
            <p className="text-[10px] font-black uppercase text-emerald-500/40 mb-3 tracking-wider text-left">Protocol Status</p>
            <p className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-wider leading-relaxed italic text-left">
              Awaiting dispatch authorization to commit records to the global registry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
