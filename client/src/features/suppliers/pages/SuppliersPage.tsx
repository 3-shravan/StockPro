import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { suppliersApi } from '@/features/suppliers/api';
import type { Supplier, SupplierRequest } from '@/features/suppliers/types';
import { showToast } from '@/lib/toast';
import { cn } from "@/lib/utils";
import {
  ArrowRight01Icon,
  CallIcon,
  Delete02Icon,
  Edit02Icon,
  InformationCircleIcon,
  InvoiceIcon,
  Location01Icon,
  Mail01Icon,
  MapsIcon,
  PlusSignIcon,
  Search01Icon,
  StarIcon,
  TaskEdit01Icon,
  Tick02Icon,
  UserGroupIcon,
  ViewIcon,
  ViewOffIcon
} from 'hugeicons-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Role } from '@/types';

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

type TabType = 'directory' | 'registration';

export const SuppliersPage = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === Role.ADMIN;
  const isOfficerOrAdmin = user?.role === Role.OFFICER || user?.role === Role.ADMIN;
  
  const [activeTab, setActiveTab] = useState<TabType>('directory');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<SupplierRequest>(emptySupplier);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return suppliers.filter((s) => {
      const matchesSearch = !q || [s.name, s.city, s.country, s.contactPerson, s.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
      
      // If NOT showInactive, we only show active ones.
      // If showInactive, we show all.
      const matchesStatus = showInactive || s.active;
      
      return matchesSearch && matchesStatus;
    });
  }, [query, suppliers, showInactive]);

  const load = async () => {
    setIsLoading(true);
    try {
      setSuppliers(await suppliersApi.getAll(true)); // Always fetch all from backend, filter in frontend
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
    if (activeTab === 'registration') setActiveTab('directory');
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
    setActiveTab('registration');
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

  const deactivate = async (s: Supplier) => {
    if (!window.confirm(`Deactivate partner "${s.name}"?`)) return;
    try {
      await suppliersApi.deactivate(s.supplierId);
      showToast.success('Supplier deactivated.');
      await load();
    } catch (error) { showToast.error('Deactivation failed.'); }
  };

  const remove = async (s: Supplier) => {
    if (!window.confirm(`Permanently DELETE partner "${s.name}"? This cannot be undone.`)) return;
    try {
      await suppliersApi.delete(s.supplierId);
      showToast.success('Supplier deleted.');
      await load();
    } catch (error) { showToast.error('Delete failed. Ensure no pending POs exist.'); }
  };

  const reactivate = async (s: Supplier) => {
    if (!window.confirm(`Reactivate partner "${s.name}"?`)) return;
    try {
      await suppliersApi.reactivate(s.supplierId);
      showToast.success('Supplier reactivated.');
      await load();
    } catch (error) { showToast.error('Reactivation failed.'); }
  };

  return (
    <section className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Suppliers & Partners</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Maintain your global supply chain and monitor partner performance.
          </p>
        </div>

        <div className="flex p-1 bg-muted/50 rounded-2xl w-fit border border-border/50">
          <button
            onClick={() => { setActiveTab('directory'); reset(); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
              activeTab === 'directory' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserGroupIcon className="w-4 h-4" />
            Directory
          </button>
          {isOfficerOrAdmin && (
            <button
              onClick={() => setActiveTab('registration')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                activeTab === 'registration' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <PlusSignIcon className="w-4 h-4" />
              {editingId ? 'Edit Partner' : 'New Partner'}
            </button>
          )}
        </div>
      </div>

      {activeTab === 'directory' && (
        <div className="space-y-6">
          <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="relative group max-w-md">
                <Search01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-12 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  placeholder="Filter by name, location, or contact person..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowInactive(!showInactive)}
                  className={cn("rounded-xl font-bold text-[10px] uppercase tracking-wider", showInactive ? "bg-primary/10 text-primary" : "text-muted-foreground")}
                >
                  {showInactive ? <ViewIcon className="w-4 h-4 mr-2" /> : <ViewOffIcon className="w-4 h-4 mr-2" />}
                  {showInactive ? 'Showing All Partners' : 'Hide Inactive Partners'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <p className="col-span-full py-20 text-center text-muted-foreground">Refreshing partner list...</p>
            ) : filtered.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-muted/20 rounded-4xl border border-dashed border-border">
                <p className="text-muted-foreground">No partners found.</p>
              </div>
            ) : (
              filtered.map((s) => (
                <Card 
                  key={s.supplierId} 
                  className={cn(
                    "rounded-3xl border-transparent bg-card/80 hover:bg-card shadow-sm transition-all group overflow-hidden cursor-pointer active:scale-[0.98]",
                    !s.active && "opacity-60 grayscale-[0.5] border-dashed border-border"
                  )}
                  onClick={() => isOfficerOrAdmin && edit(s)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 text-xs font-black flex items-center gap-1">
                          <StarIcon className="w-3 h-3 fill-current" />
                          {s.rating?.toFixed(1) || '0.0'}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        {isOfficerOrAdmin && (
                          <button 
                            onClick={() => edit(s)}
                            className="p-2 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                            title="Edit Profile"
                          >
                            <Edit02Icon className="w-4 h-4" />
                          </button>
                        )}
                        {isOfficerOrAdmin && (
                          <button 
                            onClick={() => rate(s)}
                            className="p-2 rounded-xl hover:bg-amber-500/10 text-muted-foreground hover:text-amber-600 transition-colors"
                            title="Rate Partner"
                          >
                            <StarIcon className="w-4 h-4" />
                          </button>
                        )}
                        {isOfficerOrAdmin && s.active && (
                           <button 
                             onClick={() => deactivate(s)}
                             className="p-2 rounded-xl hover:bg-warning/10 text-muted-foreground hover:text-warning transition-colors"
                             title="Deactivate Partner"
                           >
                             <Delete02Icon className="w-4 h-4 text-amber-600" />
                           </button>
                        )}
                        {isAdmin && !s.active && (
                          <div className="flex gap-1">
                            <button 
                              onClick={() => reactivate(s)}
                              className="p-2 rounded-xl hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 transition-colors"
                              title="Reactivate Partner"
                            >
                              <ArrowRight01Icon className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => remove(s)}
                              className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title="Permanently Delete"
                            >
                              <Delete02Icon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {!s.active && (
                      <div className="mt-2">
                        <span className="text-[10px] font-black uppercase bg-destructive/10 text-destructive px-2 py-0.5 rounded-md">Inactive</span>
                      </div>
                    )}

                    <div className="mt-4">
                      <h3 className="font-bold text-lg truncate">{s.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Location01Icon className="w-3.5 h-3.5" />
                        {s.city}, {s.country}
                      </p>
                    </div>

                    <div className="mt-6 space-y-3 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Mail01Icon className="w-4 h-4" />
                        <span className="truncate">{s.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <CallIcon className="w-4 h-4" />
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
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'registration' && (
        <Card className="max-w-4xl mx-auto rounded-4xl border-transparent bg-card/80 shadow-sm border-none overflow-hidden">
          <CardHeader className="bg-muted/30 pb-8 pt-8 px-10 border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10">
                {editingId ? <Edit02Icon className="w-6 h-6 text-primary" /> : <PlusSignIcon className="w-6 h-6 text-primary" />}
              </div>
              <div>
                <CardTitle className="text-xl">{editingId ? 'Edit Partner Details' : 'Onboard New Partner'}</CardTitle>
                <CardDescription>
                  {editingId ? `Update profile for ${form.name}` : 'Register a new supplier to your procurement network.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={save} className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Company Name <span className="text-destructive ml-1">*</span>
                    <InfoTooltip content="Official legal name of the supplier entity." />
                  </label>
                  <div className="relative group">
                    <UserGroupIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="e.g. Global Tech Solutions Ltd."
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Contact Person
                    <InfoTooltip content="Primary point of contact for orders and inquiries." />
                  </label>
                  <div className="relative group">
                    <TaskEdit01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="Jane Doe"
                      value={form.contactPerson}
                      onChange={(e) => update("contactPerson", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Tax ID / VAT
                    <InfoTooltip content="Registered tax identification number for invoicing." />
                  </label>
                  <div className="relative group">
                    <InvoiceIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="TAX-12345678"
                      value={form.taxId}
                      onChange={(e) => update("taxId", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Email Address <span className="text-destructive ml-1">*</span>
                    <InfoTooltip content="Order confirmation and communication email." />
                  </label>
                  <div className="relative group">
                    <Mail01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      type="email"
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="orders@supplier.com"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Phone Number
                    <InfoTooltip content="Direct contact line for warehouse or sales." />
                  </label>
                  <div className="relative group">
                    <CallIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="+1 (555) 000-0000"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    City / Region
                    <InfoTooltip content="The city where the supplier is headquartered." />
                  </label>
                  <div className="relative group">
                    <MapsIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="Mumbai"
                      value={form.city}
                      onChange={(e) => update("city", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Country
                    <InfoTooltip content="The country of operation." />
                  </label>
                  <div className="relative group">
                    <Location01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="India"
                      value={form.country}
                      onChange={(e) => update("country", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Lead Time (Days)
                    <InfoTooltip content="Average time taken to fulfill an order after placement." />
                  </label>
                  <div className="relative group">
                    <InformationCircleIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      type="number"
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      value={form.leadTimeDays}
                      onChange={(e) => update("leadTimeDays", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Payment Terms
                    <InfoTooltip content="Standard payment agreement (e.g. NET-30 means payment due 30 days after invoice)." />
                  </label>
                  <select
                    className="h-12 w-full rounded-2xl border border-input/60 bg-background px-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    value={form.paymentTerms}
                    onChange={(e) => update("paymentTerms", e.target.value)}
                  >
                    <option value="NET-30">NET-30 (30 Days)</option>
                    <option value="NET-60">NET-60 (60 Days)</option>
                    <option value="DUE-UPON-RECEIPT">Due Upon Receipt</option>
                    <option value="ADVANCE">Advance Payment</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 rounded-2xl shadow-lg shadow-primary/20">
                  {isSubmitting ? 'Processing...' : editingId ? 'Update Partner' : 'Complete Onboarding'}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={reset}
                  className="h-12 px-8 rounded-2xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </section>
  );
};
