import { useState } from 'react';
import { 
  PackageMovingIcon, 
  DeliveryBox01Icon,
  HelpCircleIcon,
  Settings02Icon,
  ShoppingCart01Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
        quantity: -Math.abs(quantity), // Ensure negative for outbound
        movementType: reason,
        notes,
        performedBy: user?.userId ?? 0,
        referenceType: 'MANUAL',
        referenceId: 0,
        unitCost: 0,
        balanceAfter: 0, // Calculated by backend
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Stock Issue</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Record outbound stock for production, sales, or internal consumption.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <PackageMovingIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Issue Details</CardTitle>
                <CardDescription>Select product and source warehouse.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium px-1">Source Warehouse</label>
                    <WarehouseSelect value={warehouseId} onChange={setWarehouseId} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium px-1">Product</label>
                    <ProductSelect value={productId} onChange={setProductId} />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium px-1">Quantity to Issue</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity || ''}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="h-11 w-full rounded-2xl border border-input/60 bg-background px-4 text-sm focus:border-primary outline-none"
                      placeholder="Enter amount..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium px-1">Issue Reason</label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value as MovementType)}
                      className="h-11 w-full rounded-2xl border border-input/60 bg-background px-4 text-sm focus:border-primary outline-none"
                    >
                      {issueReasons.map((r) => (
                        <option key={r.label} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1">Notes / Reference</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-24 w-full rounded-2xl border border-input/60 bg-background p-4 text-sm focus:border-primary outline-none"
                    placeholder="Describe why this stock is being issued (e.g., Job Card #123)"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-12 rounded-2xl shadow-lg shadow-primary/20"
              >
                {isSubmitting ? 'Recording Issue...' : 'Confirm Stock Issue'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
              <HelpCircleIcon className="w-4 h-4 text-primary" />
              Guidelines
            </h3>
            <ul className="text-xs text-muted-foreground space-y-3">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                Ensure sufficient stock is available in the selected warehouse.
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                Issued quantities will be immediately deducted from inventory.
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                Use 'Write-off' only for damaged or expired goods.
              </li>
            </ul>
          </div>
          
          <div className="p-6 rounded-3xl bg-muted/40 border border-border/50">
            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Last Action</p>
            <p className="text-xs text-muted-foreground italic">No movements recorded in this session.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
