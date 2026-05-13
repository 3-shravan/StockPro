import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { suppliersApi } from '@/features/suppliers/api';
import type { Supplier, SupplierRequest } from '@/features/suppliers/types';
import { showToast } from '@/lib/toast';
import { cn } from "@/lib/utils";
import {
  CallIcon,
  Delete02Icon,
  Edit02Icon,
  Mail01Icon,
  PlusSignIcon,
  Search01Icon,
  StarIcon,
  UserGroupIcon,
  ViewIcon,
  ViewOffIcon,
  LayoutGridIcon,
  TableIcon,
  ArrowRight01Icon,
  Location01Icon,
  TaskEdit01Icon,
  InvoiceIcon,
  MapsIcon,
  InformationCircleIcon
} from 'hugeicons-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOfficerOrAdmin = user?.role === Role.OFFICER || user?.role === Role.ADMIN;
  
  const [activeTab, setActiveTab] = useState<TabType>('directory');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
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
      
      const matchesStatus = showInactive || s.active;
      
      return matchesSearch && matchesStatus;
    });
  }, [query, suppliers, showInactive]);

  const load = async () => {
    setIsLoading(true);
    try {
      setSuppliers(await suppliersApi.getAll(true));
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

  const deactivate = async (s: Supplier) => {
    if (!window.confirm(`Deactivate partner "${s.name}"?`)) return;
    try {
      await suppliersApi.deactivate(s.supplierId);
      showToast.success('Supplier deactivated.');
      await load();
    } catch (error) { showToast.error('Deactivation failed.'); }
  };

  const activate = async (s: Supplier) => {
    try {
      await suppliersApi.reactivate(s.supplierId);
      showToast.success('Supplier reactivated.');
      await load();
    } catch (error) { showToast.error('Reactivation failed.'); }
  };

  const remove = async (s: Supplier) => {
    if (!window.confirm(`Permanently delete partner "${s.name}"? This action cannot be undone.`)) return;
    try {
      await suppliersApi.delete(s.supplierId);
      showToast.success('Supplier deleted.');
      await load();
    } catch (error) { showToast.error('Deletion failed.'); }
  };

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between pt-4">
        <div>
          <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">Supplier Ecosystem</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Supply Nodes
          </h1>
        </div>

        <div className="flex p-2 bg-card rounded-full border border-border shadow-app-subtle">
          <button
            onClick={() => { setActiveTab('directory'); reset(); }}
            className={cn(
              "flex items-center gap-3 px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
              activeTab === 'directory' ? "bg-primary text-primary-foreground shadow-app-subtle" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserGroupIcon className="w-5 h-5" />
            Directory
          </button>
          {isOfficerOrAdmin && (
            <button
              onClick={() => setActiveTab('registration')}
              className={cn(
                "flex items-center gap-3 px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
                activeTab === 'registration' ? "bg-primary text-primary-foreground shadow-app-subtle" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <PlusSignIcon className="w-5 h-5" />
              {editingId ? 'Edit Profile' : 'Access Provision'}
            </button>
          )}
        </div>
      </div>

      {activeTab === 'directory' && (
        <div className="space-y-8 px-2">
          <div className="flex flex-col items-center justify-center gap-6 w-full py-4">
            <div className="flex items-center gap-4 w-full max-w-4xl">
              <div className="relative group flex-1">
                <Search01Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  className="h-16 w-full rounded-2xl border border-border bg-card/50 pl-16 pr-6 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/30 shadow-inner"
                  placeholder="Search global partners by name, city, or contact..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <button 
                onClick={() => setShowInactive(!showInactive)}
                className={cn(
                  "flex items-center gap-3 px-8 h-16 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 border shadow-app-subtle shrink-0",
                  showInactive 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {showInactive ? <ViewIcon className="w-5 h-5" /> : <ViewOffIcon className="w-5 h-5" />}
                {showInactive ? "All Nodes" : "Active Only"}
              </button>

              <div className="flex p-2 bg-card/50 rounded-2xl border border-border shadow-app-subtle shrink-0">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-3 rounded-xl transition-all duration-300",
                    viewMode === 'grid' ? "bg-primary text-primary-foreground shadow-app-subtle" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutGridIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-3 rounded-xl transition-all duration-300",
                    viewMode === 'list' ? "bg-primary text-primary-foreground shadow-app-subtle" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <TableIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
             <div className="p-24 text-center flex flex-col items-center gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-primary/10 border-t-primary animate-spin" />
                <p className="text-muted-foreground text-sm">Loading suppliers...</p>
             </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center space-y-4 bg-muted/10 rounded-3xl border border-dashed border-border">
                <UserGroupIcon className="w-12 h-12 text-muted-foreground/20 mx-auto" />
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-foreground">No suppliers found</p>
                  <p className="text-sm text-muted-foreground">Adjust your filters or register a new partner.</p>
                </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((s) => (
                <div 
                  key={s.supplierId} 
                  className={cn(
                    "group relative flex flex-col p-6 bg-card border border-border hover:border-primary/40 rounded-3xl transition-all duration-300 text-left shadow-app-card hover:shadow-app-hover hover:-translate-y-1 overflow-hidden cursor-pointer",
                    !s.active && "opacity-60 grayscale-[0.5] border-dashed"
                  )}
                  onClick={() => navigate(`/purchase/suppliers/${s.supplierId}`)}
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform border border-primary/20">
                        <UserGroupIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
                        <StarIcon className="w-3.5 h-3.5 fill-current" />
                        <span className="font-bold text-[10px] tracking-wider">{s.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {isOfficerOrAdmin && (
                        <button onClick={() => edit(s)} className="w-10 h-10 flex items-center justify-center text-primary/60 hover:text-primary transition-all duration-300">
                          <Edit02Icon className="w-5 h-5" />
                        </button>
                      )}
                      {isOfficerOrAdmin && (
                        s.active ? (
                          <button onClick={() => deactivate(s)} className="w-10 h-10 flex items-center justify-center text-rose-400/60 hover:text-rose-400 transition-all duration-300">
                            <Delete02Icon className="w-5 h-5" />
                          </button>
                        ) : (
                          <>
                            <button onClick={() => activate(s)} className="w-10 h-10 flex items-center justify-center text-emerald-500/60 hover:text-emerald-500 transition-all duration-300">
                              <PlusSignIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => remove(s)} className="w-10 h-10 flex items-center justify-center text-rose-400/60 hover:text-rose-400 transition-all duration-300">
                              <Delete02Icon className="w-5 h-5" />
                            </button>
                          </>
                        )
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    <h3 className="font-bold text-2xl leading-tight truncate tracking-tight group-hover:text-primary transition-colors">{s.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-bold px-3 py-1 bg-muted text-foreground/70 uppercase tracking-wider rounded-full border border-border">
                        {s.city}, {s.country}
                      </span>
                      <span className="text-[10px] font-bold px-3 py-1 bg-primary/10 text-primary uppercase tracking-wider rounded-full border border-primary/20">
                        {s.paymentTerms}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-border/10 space-y-3">
                    <div className="flex items-center gap-3 text-[10px] font-bold text-foreground/70 uppercase tracking-wider">
                      <Mail01Icon className="w-4 h-4" />
                      <span className="truncate">{s.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-foreground/70 uppercase tracking-wider">
                      <CallIcon className="w-4 h-4" />
                      <span>{s.phone}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
                     <ArrowRight01Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-app-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border/60 h-14">
                    <TableHead className="px-6 font-bold text-xs text-foreground/70 uppercase tracking-wider">Supplier</TableHead>
                    <TableHead className="px-6 font-bold text-xs text-foreground/70 uppercase tracking-wider">Contact Details</TableHead>
                    <TableHead className="px-6 font-bold text-xs text-foreground/70 uppercase tracking-wider">Performance</TableHead>
                    <TableHead className="px-6 font-bold text-xs text-foreground/70 uppercase tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow 
                      key={s.supplierId} 
                      className={cn(
                        "group hover:bg-muted/30 transition-all cursor-pointer border-b border-border/10 h-24",
                        !s.active && "opacity-50 grayscale"
                      )}
                      onClick={() => navigate(`/purchase/suppliers/${s.supplierId}`)}
                    >
                      <TableCell className="px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/10 group-hover:scale-105 transition-transform">
                            <UserGroupIcon className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xl block leading-tight tracking-tight group-hover:text-primary transition-colors truncate max-w-[300px]">{s.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn("w-1.5 h-1.5 rounded-full", s.active ? "bg-emerald-500" : "bg-muted")} />
                              <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider">{s.active ? 'Active Partner' : 'Inactive'}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                            <Mail01Icon className="w-4 h-4 text-primary/40" />
                            {s.email}
                          </div>
                          <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                            <CallIcon className="w-4 h-4 text-muted-foreground/50" />
                            {s.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6">
                         <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <StarIcon className="w-4 h-4 text-amber-500 fill-current" />
                              <span className="font-bold text-base">{s.rating?.toFixed(1) || '0.0'}</span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.leadTimeDays}d lead time</span>
                         </div>
                      </TableCell>
                      <TableCell className="px-6 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {isOfficerOrAdmin && (
                            <>
                              <button 
                                onClick={() => edit(s)} 
                                className="w-10 h-10 flex items-center justify-center text-primary/60 hover:text-primary transition-all duration-300"
                                title="Edit"
                              >
                                <Edit02Icon className="w-5 h-5" />
                              </button>
                              {s.active ? (
                                <button 
                                  onClick={() => deactivate(s)} 
                                  className="w-10 h-10 flex items-center justify-center text-rose-400/60 hover:text-rose-400 transition-all duration-300"
                                  title="Deactivate"
                                >
                                  <Delete02Icon className="w-5 h-5" />
                                </button>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => activate(s)} 
                                    className="w-10 h-10 flex items-center justify-center text-emerald-500/60 hover:text-emerald-500 transition-all duration-300"
                                    title="Activate"
                                  >
                                    <PlusSignIcon className="w-5 h-5" />
                                  </button>
                                  <button 
                                    onClick={() => remove(s)} 
                                    className="w-10 h-10 flex items-center justify-center text-rose-400/60 hover:text-rose-400 transition-all duration-300"
                                    title="Delete"
                                  >
                                    <Delete02Icon className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                            </>
                          )}
                          <div className="w-8 h-8 flex items-center justify-center text-muted-foreground/30 group-hover:text-primary transition-all group-hover:translate-x-1">
                            <ArrowRight01Icon className="w-5 h-5" />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'registration' && (
        <div className="max-w-4xl space-y-12 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-4 px-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              {editingId ? <Edit02Icon className="w-6 h-6" /> : <PlusSignIcon className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{editingId ? 'Modify Partner' : 'Register Partner'}</h2>
              <p className="text-xs font-bold text-foreground/70 uppercase tracking-wider mt-1">
                {editingId ? `UPDATING CONFIGURATION FOR ${form.name}` : 'ESTABLISHING NEW SUPPLY NODE IN THE GLOBAL GRID'}
              </p>
            </div>
          </div>

          <div className="px-2">
            <form onSubmit={save} className="space-y-10">
              <div className="bg-card/40 backdrop-blur-xl p-10 rounded-[2.5rem] border border-border/40 space-y-10">
                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="space-y-3 sm:col-span-2">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Legal Identity Designation <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative group">
                      <UserGroupIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-lg font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/20"
                        placeholder="LEGAL COMPANY NAME"
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2">Primary Liaison</label>
                      <div className="relative group">
                        <TaskEdit01Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                          className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          placeholder="PRIMARY CONTACT NAME"
                          value={form.contactPerson}
                          onChange={(e) => update("contactPerson", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2">Regulatory ID</label>
                      <div className="relative group">
                        <InvoiceIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                          className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          placeholder="TAX ID / VAT NUMBER"
                          value={form.taxId}
                          onChange={(e) => update("taxId", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center justify-between">
                        Direct Channel <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative group">
                        <Mail01Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                          type="email"
                          className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          placeholder="ORDERS@PARTNER.COM"
                          value={form.email}
                          onChange={(e) => update("email", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2">Secure Line</label>
                      <div className="relative group">
                        <CallIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                          className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          placeholder="+1 (000) 000-0000"
                          value={form.phone}
                          onChange={(e) => update("phone", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2">Geographical Node</label>
                    <div className="relative group">
                      <MapsIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        placeholder="CITY"
                        value={form.city}
                        onChange={(e) => update("city", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2">Global Region</label>
                    <div className="relative group">
                      <Location01Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        placeholder="COUNTRY"
                        value={form.country}
                        onChange={(e) => update("country", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2">Logistics Lead Time</label>
                    <div className="relative group">
                      <InformationCircleIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        type="number"
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        value={form.leadTimeDays}
                        onChange={(e) => update("leadTimeDays", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2">Fiscal Agreement</label>
                    <div className="relative group">
                      <select
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 px-6 text-[10px] font-black uppercase tracking-wider focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer transition-all"
                        value={form.paymentTerms}
                        onChange={(e) => update("paymentTerms", e.target.value)}
                      >
                        <option value="NET-30">NET-30 (30 DAYS)</option>
                        <option value="NET-60">NET-60 (60 DAYS)</option>
                        <option value="DUE-UPON-RECEIPT">DUE UPON RECEIPT</option>
                        <option value="ADVANCE">ADVANCE PAYMENT</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-6 border-t border-border/40">
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-1 h-14 rounded-full bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-wider transition-all hover:opacity-90 active:scale-[0.98] shadow-app-subtle shadow-primary/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'SYNCHRONIZING...' : editingId ? 'COMMIT CHANGES' : 'AUTHORIZE REGISTRATION'}
                </button>
                <button 
                  type="button" 
                  onClick={reset}
                  className="px-10 h-14 rounded-full border border-border bg-card hover:bg-muted text-foreground font-black text-[10px] uppercase tracking-wider transition-all"
                >
                  ABORT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
