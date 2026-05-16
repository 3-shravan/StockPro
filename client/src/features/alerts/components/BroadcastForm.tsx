import React, { useState, useEffect } from 'react';
import { 
  Megaphone01Icon, 
  UserGroupIcon, 
  WarehouseIcon,
  SentIcon,
  ArrowLeft01Icon,
  ViewIcon
} from 'hugeicons-react';
import { alertsApi } from '../api/alerts.api';
import { warehousesApi } from '@/features/warehouses/api';
import type { Warehouse } from '@/features/warehouses/types';
import { showToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface BroadcastFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export const BroadcastForm: React.FC<BroadcastFormProps> = ({ onCancel, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [formData, setFormData] = useState({
    targetRole: 'MANAGER',
    targetWarehouseId: '',
    type: 'SYSTEM_MAINTENANCE',
    severity: 'WARNING',
    title: '',
    message: '',
    channel: 'BOTH'
  });

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const data = await warehousesApi.getAll();
        setWarehouses(data || []);
      } catch (error) {
        console.error("Failed to fetch warehouses", error);
      }
    };
    fetchWarehouses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await alertsApi.send({
        ...formData,
        targetWarehouseId: formData.targetWarehouseId ? parseInt(formData.targetWarehouseId) : undefined
      });
      showToast.success("Broadcast dispatched successfully");
      onSuccess();
    } catch (error) {
      showToast.error("Failed to dispatch broadcast");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8 px-4">
        <button 
          onClick={onCancel}
          className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft01Icon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Registry
        </button>
        
        <div className="flex items-center gap-4 text-right">
          <div>
            <h2 className="text-xl font-black tracking-tight">Broadcast Center</h2>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Multi-channel emergency outreach</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Megaphone01Icon className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-[2.5rem] shadow-app-subtle p-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section: Headline */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 flex items-center gap-2 px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]" />
              Message Headline <span className="text-primary">*</span>
            </label>
            <div className="relative group">
              <Megaphone01Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <input 
                type="text"
                required
                placeholder="FULL MESSAGE HEADLINE"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-muted/10 border border-border/40 rounded-full px-14 py-4 text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all outline-none placeholder:text-muted-foreground/40 text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
            {/* Identity Role */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 px-1">
                Identity Role <span className="text-primary">*</span>
              </label>
              <div className="relative group">
                <UserGroupIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <select 
                  value={formData.targetRole}
                  onChange={e => setFormData({...formData, targetRole: e.target.value})}
                  className="w-full bg-muted/10 border border-border/40 rounded-full px-14 py-4 text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all outline-none appearance-none cursor-pointer text-foreground"
                >
                  <option value="ADMIN">Administrators</option>
                  <option value="MANAGER">Warehouse Managers</option>
                  <option value="OFFICER">Procurement Officers</option>
                  <option value="STAFF">Warehouse Staff</option>
                </select>
              </div>
            </div>

            {/* Deployment Hub */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 px-1">
                Deployment Hub
              </label>
              <div className="relative group">
                <WarehouseIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <select 
                  value={formData.targetWarehouseId}
                  onChange={e => setFormData({...formData, targetWarehouseId: e.target.value})}
                  className="w-full bg-muted/10 border border-border/40 rounded-full px-14 py-4 text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all outline-none appearance-none cursor-pointer text-foreground"
                >
                  <option value="">GLOBAL HUB (UNASSIGNED)</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse.warehouseId} value={warehouse.warehouseId.toString()}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-2 h-2 border-r-2 border-b-2 border-muted-foreground/40 rotate-45" />
                </div>
              </div>
            </div>

            {/* Protocol Type */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 px-1">
                Protocol Type
              </label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 flex items-center justify-center font-black text-[10px]">#</div>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full bg-muted/10 border border-border/40 rounded-full px-14 py-4 text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all outline-none appearance-none cursor-pointer text-foreground"
                >
                  <option value="SYSTEM_MAINTENANCE">Maintenance</option>
                  <option value="SECURITY_ALERT">Security</option>
                  <option value="INVENTORY_COUNT">Stock Take</option>
                  <option value="GENERAL_NOTICE">Notice</option>
                </select>
              </div>
            </div>

            {/* Comms Protocol */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 px-1">
                Comms Protocol
              </label>
              <div className="relative group">
                <SentIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <select 
                  value={formData.channel}
                  onChange={e => setFormData({...formData, channel: e.target.value})}
                  className="w-full bg-muted/10 border border-border/40 rounded-full px-14 py-4 text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all outline-none appearance-none cursor-pointer text-foreground"
                >
                  <option value="IN_APP">In-App Only</option>
                  <option value="EMAIL">Email Only</option>
                  <option value="BOTH">All Channels</option>
                </select>
              </div>
            </div>
          </div>

          {/* Operational State (Severity) */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 px-1">
              Operational State
            </label>
            <div className="grid grid-cols-3 gap-4">
              {(['INFORMATION', 'WARNING', 'CRITICAL'] as const).map(sev => {
                const isActive = formData.severity === sev;
                return (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setFormData({...formData, severity: sev})}
                    className={cn(
                      "py-4 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2",
                      isActive
                        ? "bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]" 
                        : "bg-muted/5 border-border/60 text-muted-foreground hover:bg-muted/10 hover:border-border/80"
                    )}
                  >
                    {isActive ? (
                      <ViewIcon className="w-4 h-4 animate-pulse" />
                    ) : (
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        sev === 'CRITICAL' ? "bg-status-error/60" : 
                        sev === 'WARNING' ? "bg-amber-500/60" : "bg-blue-500/60"
                      )} />
                    )}
                    {isActive ? `ACTIVE ${sev} PROTOCOL` : sev}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Instructions */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 px-1">
              Detailed Instructions <span className="text-primary">*</span>
            </label>
            <textarea 
              required
              rows={4}
              placeholder="PROVIDE CONTEXT AND REQUIRED ACTIONS..."
              value={formData.message}
              onChange={e => setFormData({...formData, message: e.target.value})}
              className="w-full bg-muted/10 border border-border/40 rounded-[2rem] px-8 py-6 text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all outline-none resize-none placeholder:text-muted-foreground/40 text-foreground"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-4">
            <button 
              type="button" 
              onClick={onCancel}
              className="px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground hover:bg-muted/10 border border-transparent hover:border-border/40 transition-all"
            >
              Abort
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-10 py-4 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.15em] hover:shadow-xl hover:shadow-primary/20 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <SentIcon className="w-4 h-4" />
              )}
              Authorize Provisioning
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
