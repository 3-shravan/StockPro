import { useState } from 'react';
import { 
  HelpCircleIcon,
  PackageIcon
} from 'hugeicons-react';
import { ProductSelect } from '@/components/common/ProductSelect';
import { WarehouseSelect } from '@/components/common/WarehouseSelect';
import { warehousesApi } from '@/features/warehouses/api';
import { useAuthStore } from '@/stores/auth.store';
import { showToast } from '@/lib/toast';

export const TransferPage = () => {
  const { user } = useAuthStore();
  const [fromWarehouseId, setFromWarehouseId] = useState(0);
  const [toWarehouseId, setToWarehouseId] = useState(0);
  const [productId, setProductId] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromWarehouseId || !toWarehouseId || !productId || !quantity) {
      showToast.error('Please complete all required fields.');
      return;
    }

    if (fromWarehouseId === toWarehouseId) {
      showToast.error('Source and target nodes must be different.');
      return;
    }

    setIsSubmitting(true);
    try {
      await warehousesApi.transferStock({
        fromWarehouseId,
        toWarehouseId,
        productId,
        quantity,
        managerId: user?.userId ?? 0,
      });
      showToast.success('Stock transfer authorized and logged.');
      setProductId(0);
      setQuantity(0);
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Transfer authorization failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-700 pb-20 px-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between pt-4">
        <div>
          <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">Logistics Cluster</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Node Rebalancing
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
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Origin Node <span className="text-rose-400">*</span>
                  </label>
                  <WarehouseSelect value={fromWarehouseId} onChange={setFromWarehouseId} placeholder="SOURCE HUB" />
                </div>

                <div className="space-y-3 text-left">
                  <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Target Node <span className="text-rose-400">*</span>
                  </label>
                  <WarehouseSelect value={toWarehouseId} onChange={setToWarehouseId} placeholder="DESTINATION HUB" />
                </div>

                <div className="space-y-3 text-left">
                  <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Asset Designation <span className="text-rose-400">*</span>
                  </label>
                  <ProductSelect value={productId} onChange={setProductId} warehouseId={fromWarehouseId} placeholder="SELECT SKU" />
                </div>

                <div className="space-y-3 text-left">
                  <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Verified Quantity <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative group">
                    <PackageIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-amber-500 transition-colors" />
                    <input
                      type="number"
                      min="1"
                      value={quantity || ''}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-amber-500/10 outline-none transition-all"
                      placeholder="UNIT COUNT"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-6 border-t border-border/40">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 h-14 rounded-full bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isSubmitting ? 'SYNCHRONIZING...' : 'AUTHORIZE TRANSFER'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-8">
          <div className="bg-card/40 backdrop-blur-xl p-10 rounded-[2.5rem] border border-border/40 space-y-8 text-left">
            <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-3">
              <HelpCircleIcon className="w-5 h-5" />
              Transfer Logistics
            </h3>
            <ul className="space-y-6">
              {[
                "Transfers are processed as atomic operations to ensure ledger integrity.",
                "Real-time density verification occurs at the origin hub before execution.",
                "Authorized movements are logged as immutable audit events."
              ].map((text, i) => (
                <li key={i} className="flex gap-4 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500/20 mt-1.5 shrink-0 group-hover:bg-amber-500 transition-colors" />
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider leading-relaxed">
                    {text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-10 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-xl text-left">
            <p className="text-[10px] font-black uppercase text-emerald-500/40 mb-3 tracking-wider">System Status</p>
            <p className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-wider leading-relaxed italic">
              Cluster nodes ready for asset rebalancing. Performance optimized for scale.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
