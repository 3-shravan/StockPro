import { useState } from 'react';
import { 
  PackageMovingIcon, 
  DeliveryBox01Icon,
  HelpCircleIcon,
  Settings02Icon,
  ShoppingCart01Icon,
  PackageIcon,
  ArrowDown01Icon
} from 'hugeicons-react';
import { ProductSelect } from '@/components/common/ProductSelect';
import { WarehouseSelect } from '@/components/common/WarehouseSelect';
import { warehousesApi } from '@/features/warehouses/api';
import { MovementType } from '@/types/enums';
import { showToast } from '@/lib/toast';

const issueReasons = [
  { label: 'Customer Sale', value: MovementType.STOCK_OUT, icon: ShoppingCart01Icon },
  { label: 'Production / Consumption', value: MovementType.STOCK_OUT, icon: Settings02Icon },
  { label: 'Internal Use', value: MovementType.STOCK_OUT, icon: PackageMovingIcon },
  { label: 'Damaged / Write-off', value: MovementType.WRITE_OFF, icon: DeliveryBox01Icon },
];

export const IssuePage = () => {
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
      // Use warehousesApi.adjustStock to ensure both local and global stock are updated
      await warehousesApi.adjustStock({
        productId,
        warehouseId,
        quantity: -Math.abs(quantity), // Negative for dispatch
        notes,
        referenceType: 'MANUAL_ISSUE',
        referenceId: 0
      });
      
      showToast.success('Stock issue authorized and synchronized.');
      setProductId(0);
      setQuantity(0);
      setNotes('');
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Authorization failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container px-6">
      <div className="page-header">
        <div>
          <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">Inventory Management</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground text-left">
            Issue Stock
          </h1>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
        <div className="space-y-12">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="glass-panel space-y-10">
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-3 text-left">
                  <label className="text-micro text-foreground/70 flex items-center gap-2 px-2">
                    <div className="status-dot bg-status-error/40" />
                    Source Node Hub <span className="text-status-error/60">*</span>
                  </label>
                  <WarehouseSelect value={warehouseId} onChange={setWarehouseId} placeholder="SELECT ORIGIN HUB" restrictToAssigned />
                </div>

                <div className="space-y-3 text-left">
                  <label className="text-micro text-foreground/70 flex items-center gap-2 px-2">
                    <div className="status-dot bg-status-error/40" />
                    Resource Designation <span className="text-status-error/60">*</span>
                  </label>
                  <ProductSelect value={productId} onChange={setProductId} warehouseId={warehouseId} placeholder="SELECT SKU" />
                </div>

                <div className="space-y-3 text-left">
                  <label className="text-micro text-foreground/70 flex items-center gap-2 px-2">
                    <div className="status-dot bg-status-error/40" />
                    Verified Quantity <span className="text-status-error/60">*</span>
                  </label>
                  <div className="relative group">
                    <PackageIcon className="input-icon left-6 group-focus-within:text-status-error" />
                    <input
                      type="number"
                      min="1"
                      value={quantity || ''}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="input-field pl-14 pr-6 focus:ring-status-error/10"
                      placeholder="UNIT COUNT"
                    />
                  </div>
                </div>

                <div className="space-y-3 text-left">
                  <label className="text-micro text-foreground/70 flex items-center gap-2 px-2">
                    <div className="status-dot bg-status-error/40" />
                    Dispatch Rationale <span className="text-status-error/60">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value as MovementType)}
                      className="input-field px-6 text-micro focus:ring-status-error/10 appearance-none cursor-pointer"
                    >
                      {issueReasons.map((r) => (
                        <option key={r.label} value={r.value}>{r.label.toUpperCase()} SEGMENT</option>
                      ))}
                    </select>
                    <ArrowDown01Icon className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none opacity-40" />
                  </div>
                </div>

                <div className="space-y-3 sm:col-span-2 text-left">
                  <label className="text-micro text-foreground/70 flex items-center gap-2 px-2">
                    <div className="status-dot bg-status-error/40" />
                    Audit Reference / Strategic Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-field min-h-[120px] p-6 focus:ring-status-error/10 resize-none placeholder:text-muted-foreground/20"
                    placeholder="DESCRIBE DISPATCH CONTEXT..."
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-8">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-primary bg-status-error/80 hover:bg-status-error shadow-status-error/10 hover:shadow-status-error/30 flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    SYNCHRONIZING...
                  </>
                ) : (
                  <>
                    <PackageMovingIcon className="w-5 h-5" />
                    AUTHORIZE DISPATCH
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-8">
          <div className="glass-panel space-y-8">
            <h3 className="text-micro text-status-error/60 flex items-center gap-3">
              <HelpCircleIcon className="icon-md" />
              Operational Guidelines
            </h3>
            <ul className="space-y-6 text-left">
              {[
                "Hub capacity and real-time stock levels are verified upon authorization.",
                "Dispatched quantities are immediately deducted from the immutable ledger.",
                "Categorize as 'Write-off' only for verified damage or expiration events."
              ].map((text, i) => (
                <li key={i} className="flex gap-4 group">
                  <div className="status-dot bg-status-error/20 mt-1.5 shrink-0 group-hover:bg-status-error transition-colors" />
                  <p className="text-micro text-muted-foreground leading-relaxed">
                    {text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-10 rounded-[2.5rem] bg-primary/5 border border-primary/10 backdrop-blur-xl">
            <p className="text-micro text-primary/40 mb-3 text-left">Protocol Status</p>
            <p className="text-micro text-primary/60 leading-relaxed italic text-left">
              Awaiting dispatch authorization to commit records to the global registry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
