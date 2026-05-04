import { useEffect, useMemo, useState } from 'react';
import { 
  Delete02Icon, 
  Edit02Icon, 
  StarIcon, 
  Search01Icon, 
  UserGroupIcon,
  Mail01Icon,
  CallIcon,
  Location01Icon,
  TaskEdit01Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { showToast } from '@/lib/toast';
import { suppliersApi } from '@/features/suppliers/api';
import type { Supplier, SupplierRequest } from '@/features/suppliers/types';

const emptySupplier: SupplierRequest = {
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  taxId: '',
  paymentTerms: 'NET-30',
  leadTimeDays: 7,
};

export const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<SupplierRequest>(emptySupplier);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return suppliers;
    return suppliers.filter((s) =>
      [s.name, s.city, s.country, s.contactPerson, s.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [query, suppliers]);

  const load = async () => {
    setIsLoading(true);
    try {
      setSuppliers(await suppliersApi.getAll());
    } catch (error: any) {
      showToast.error('Unable to load suppliers.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const update = (field: keyof SupplierRequest, value: string | number) => {
    setForm((current) => ({
      ...current,
      [field]: field === 'leadTimeDays' ? Number(value) : value,
    }));
  };

  const reset = () => {
    setEditingId(null);
    setForm(emptySupplier);
  };

  const edit = (s: Supplier) => {
    setEditingId(s.supplierId);
    setForm({
      name: s.name,
      contactPerson: s.contactPerson ?? '',
      email: s.email ?? '',
      phone: s.phone ?? '',
      address: s.address ?? '',
      city: s.city ?? '',
      country: s.country ?? '',
      taxId: s.taxId ?? '',
      paymentTerms: s.paymentTerms ?? '',
      leadTimeDays: s.leadTimeDays,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.email) {
      showToast.error('Name and email are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await suppliersApi.update(editingId, form);
        showToast.success('Supplier updated.');
      } else {
        await suppliersApi.create(form);
        showToast.success('Supplier registered.');
      }
      reset();
      await load();
    } catch (error: any) {
      showToast.error('Failed to save supplier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rate = async (s: Supplier) => {
    const r = window.prompt('Rate performance (0.0 to 5.0)', String(s.rating ?? 0));
    if (r === null) return;
    const rating = parseFloat(r);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      showToast.error('Invalid rating. Use 0-5.');
      return;
    }
    try {
      await suppliersApi.updateRating(s.supplierId, rating);
      showToast.success('Rating updated.');
      await load();
    } catch (error) { showToast.error('Failed to update rating.'); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Suppliers & Partners</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Maintain your global supply chain and monitor partner performance.
          </p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[400px_1fr]">
        <div className="space-y-6">
          <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm overflow-hidden sticky top-24">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <TaskEdit01Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{editingId ? 'Edit Partner' : 'New Partner'}</CardTitle>
                  <CardDescription>Onboard a new supplier to StockPro.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={save} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground/60 px-1">Supplier Name</label>
                  <input className="h-11 w-full rounded-2xl border border-input/60 bg-background px-4 text-sm focus:border-primary outline-none" placeholder="Acme Corporation" value={form.name} onChange={(e) => update('name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground/60 px-1">Contact Person</label>
                  <input className="h-11 w-full rounded-2xl border border-input/60 bg-background px-4 text-sm focus:border-primary outline-none" placeholder="John Doe" value={form.contactPerson} onChange={(e) => update('contactPerson', e.target.value)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground/60 px-1">Email</label>
                    <input type="email" className="h-11 w-full rounded-2xl border border-input/60 bg-background px-4 text-sm focus:border-primary outline-none" placeholder="orders@acme.com" value={form.email} onChange={(e) => update('email', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground/60 px-1">Phone</label>
                    <input className="h-11 w-full rounded-2xl border border-input/60 bg-background px-4 text-sm focus:border-primary outline-none" placeholder="+1..." value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground/60 px-1">City</label>
                    <input className="h-11 w-full rounded-2xl border border-input/60 bg-background px-4 text-sm focus:border-primary outline-none" placeholder="Mumbai" value={form.city} onChange={(e) => update('city', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground/60 px-1">Country</label>
                    <input className="h-11 w-full rounded-2xl border border-input/60 bg-background px-4 text-sm focus:border-primary outline-none" placeholder="India" value={form.country} onChange={(e) => update('country', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground/60 px-1">Full Address</label>
                  <textarea className="min-h-20 w-full rounded-2xl border border-input/60 bg-background p-4 text-sm focus:border-primary outline-none" placeholder="Registered office address..." value={form.address} onChange={(e) => update('address', e.target.value)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground/60 px-1">Lead Time (Days)</label>
                    <input type="number" className="h-11 w-full rounded-2xl border border-input/60 bg-background px-4 text-sm focus:border-primary outline-none" value={form.leadTimeDays} onChange={(e) => update('leadTimeDays', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground/60 px-1">Payment Terms</label>
                    <select className="h-11 w-full rounded-2xl border border-input/60 bg-background px-4 text-sm focus:border-primary outline-none" value={form.paymentTerms} onChange={(e) => update('paymentTerms', e.target.value)}>
                      <option value="NET-30">NET-30</option>
                      <option value="NET-60">NET-60</option>
                      <option value="DUE-UPON-RECEIPT">Immediate</option>
                      <option value="ADVANCE">Advance</option>
                    </select>
                  </div>
                </div>
                
                <div className="pt-2 flex gap-3">
                  <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-2xl h-11">
                    {isSubmitting ? 'Saving...' : editingId ? 'Update Partner' : 'Register Partner'}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="ghost" onClick={reset} className="rounded-2xl h-11">Cancel</Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm border-none overflow-hidden">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="relative flex-1">
                <Search01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-12 pr-4 text-sm focus:border-primary outline-none transition-all"
                  placeholder="Filter by name, location, email or contact person..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {filtered.length === 0 ? (
              <div className="col-span-full py-20 text-center opacity-30">
                <UserGroupIcon className="w-16 h-16 mx-auto mb-4" />
                <p className="font-medium text-lg">No partners found matching your search.</p>
              </div>
            ) : (
              filtered.map((s) => (
                <Card key={s.supplierId} className="rounded-4xl border-transparent bg-card/80 hover:bg-card shadow-sm transition-all group overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-bold text-xl truncate">{s.name}</h4>
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 text-xs font-black">
                            <StarIcon className="w-3 h-3 fill-current" />
                            {s.rating?.toFixed(1) || '0.0'}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                            <Location01Icon className="w-4 h-4 text-primary" />
                            <span className="truncate">{s.city}, {s.country}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                            <Mail01Icon className="w-4 h-4 text-primary" />
                            <span className="truncate">{s.email}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                            <CallIcon className="w-4 h-4 text-primary" />
                            <span>{s.phone || 'No phone'}</span>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-primary/5 text-primary rounded-lg border border-primary/10">
                            {s.paymentTerms}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-muted text-muted-foreground rounded-lg">
                            Lead: {s.leadTimeDays}d
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                        <button onClick={() => edit(s)} className="p-3 rounded-2xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors bg-muted/30" title="Edit Profile">
                          <Edit02Icon className="w-5 h-5" />
                        </button>
                        <button onClick={() => rate(s)} className="p-3 rounded-2xl hover:bg-amber-500/10 text-muted-foreground hover:text-amber-600 transition-colors bg-muted/30" title="Rate Partner">
                          <StarIcon className="w-5 h-5" />
                        </button>
                        <button className="p-3 rounded-2xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors bg-muted/30" title="Deactivate Partner">
                          <Delete02Icon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
