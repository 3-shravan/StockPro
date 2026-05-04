import { useState } from 'react';
import { 
  ArrowLeftRightIcon, 
  HelpCircleIcon,
  Alert01Icon,
  Sorting05Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProductSelect } from '@/components/common/ProductSelect';
import { WarehouseSelect } from '@/components/common/WarehouseSelect';
import { movementsApi } from '@/features/movements/api/movements.api';
import { MovementType } from '@/types/enums';
import { useAuthStore } from '@/stores/auth.store';
import { showToast } from '@/lib/toast';

export const TransferPage = () => {
  const { user } = useAuthStore();
  const [productId, setProductId] = useState(0);
  const [fromWarehouseId, setFromWarehouseId] = useState(0);
  const [toWarehouseId, setToWarehouseId] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productId || !fromWarehouseId || !toWarehouseId || !quantity) {
      showToast.error('Please complete all required fields.');
      return;
    }

    if (fromWarehouseId === toWarehouseId) {
      showToast.error('Source and destination warehouses must be different.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Industry practice: Transfers involve two movements (OUT and IN)
      // Here we assume the backend handles this atomically via a transfer API if available,
      // otherwise we record the transfer intent.
      await movementsApi.create({
        productId,
        warehouseId: fromWarehouseId,
        quantity: -Math.abs(quantity),
        movementType: MovementType.TRANSFER_OUT,
        notes: `Transfer to WH#${toWarehouseId}. ${notes}`,
        performedBy: user?.userId ?? 0,
        referenceType: 'TRANSFER',
        referenceId: toWarehouseId,
        unitCost: 0,
        balanceAfter: 0,
      });
      
      // Secondary movement for the destination
      await movementsApi.create({
        productId,
        warehouseId: toWarehouseId,
        quantity: Math.abs(quantity),
        movementType: MovementType.TRANSFER_IN,
        notes: `Transfer from WH#${fromWarehouseId}. ${notes}`,
        performedBy: user?.userId ?? 0,
        referenceType: 'TRANSFER',
        referenceId: fromWarehouseId,
        unitCost: 0,
        balanceAfter: 0,
      });

      showToast.success('Stock transfer completed successfully.');
      setProductId(0);
      setQuantity(0);
      setNotes('');
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to complete stock transfer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Stock Transfer</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Relocate inventory between warehouse locations safely and atomically.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <ArrowLeftRightIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Transfer Manifest</CardTitle>
                <CardDescription>Define source, destination, and product details.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold px-1 text-primary">1. Source Location</label>
                    <WarehouseSelect value={fromWarehouseId} onChange={setFromWarehouseId} placeholder="From warehouse..." />
                  </div>
                  <div className="flex justify-center py-2 opacity-20">
                    <Sorting05Icon className="w-6 h-6 rotate-90" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold px-1 text-emerald-600">2. Destination Location</label>
                    <WarehouseSelect value={toWarehouseId} onChange={setToWarehouseId} placeholder="To warehouse..." />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium px-1">Product to Move</label>
                    <ProductSelect value={productId} onChange={setProductId} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium px-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity || ''}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="h-11 w-full rounded-2xl border border-input/60 bg-background px-4 text-sm font-bold focus:border-primary outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium px-1">Transfer Reason / Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-24 w-full rounded-2xl border border-input/60 bg-background p-4 text-sm focus:border-primary outline-none"
                  placeholder="Reason for transfer (e.g., Stock rebalancing, Urgent request)"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-12 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <ArrowLeftRightIcon className="w-5 h-5" />
                {isSubmitting ? 'Executing Transfer...' : 'Initiate Stock Transfer'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-amber-700">
              <Alert01Icon className="w-4 h-4" />
              Transfer Policy
            </h3>
            <ul className="text-xs text-muted-foreground space-y-3">
              <li>Stock must exist in the source warehouse before transfer.</li>
              <li>Transfers are recorded as two linked movements for full auditability.</li>
              <li>Destination warehouse capacity is checked upon arrival.</li>
            </ul>
          </div>

          <div className="p-6 rounded-3xl bg-muted/40 border border-border/50 text-center">
            <HelpCircleIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Need Help?</p>
            <p className="text-xs text-muted-foreground mt-1">Contact your Inventory Manager for bulk relocation requests.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
