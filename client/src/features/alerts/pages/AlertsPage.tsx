import { UserSelect } from "@/components/common/UserSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { alertsApi } from "@/features/alerts/api/alerts.api";
import type { Alert, AlertRequest } from "@/features/alerts/types";
import { showToast } from "@/lib/toast";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { useAlertsStore } from "@/stores/alerts.store";
import { AlertChannel, AlertSeverity, AlertType } from "@/types/enums";
import {
  Alert01Icon,
  CheckmarkBadge01Icon,
  Delete02Icon,
  FilterIcon,
  Notification01Icon,
  Notification02Icon,
  SentIcon,
  Settings02Icon,
  Sorting05Icon,
  ViewOffIcon
} from "hugeicons-react";
import { useEffect, useState } from "react";

const emptyAlert: AlertRequest = {
  recipientId: 0,
  type: AlertType.SYSTEM,
  severity: AlertSeverity.INFO,
  title: "",
  message: "",
  channel: AlertChannel.IN_APP,
};

export const AlertsPage = () => {
  const user = useAuthStore((state) => state.user);
  const setUnreadCount = useAlertsStore((state) => state.setUnreadCount);
  const [activeTab, setActiveTab] = useState<'inbox' | 'broadcast'>('inbox');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [severityFilter, setSeverityFilter] = useState<"ALL" | AlertSeverity>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "READ" | "UNREAD" | "ACK" | "UNACK">("ALL");
  const [form, setForm] = useState<AlertRequest>(emptyAlert);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedAlertId, setExpandedAlertId] = useState<number | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const isManagement = user.role === "ADMIN" || user.role === "MANAGER";
      const data = isManagement
        ? await alertsApi.getAll()
        : await alertsApi.getByUser(user.userId);
      setAlerts(data);
      // Sync global store unread count
      setUnreadCount(data.filter(a => !a.read).length);
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Unable to load alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.userId, user?.role]);

  const update = (field: keyof AlertRequest, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: field === "recipientId" ? Number(value) : value,
    }));
  };

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.recipientId || !form.title || !form.message) {
      showToast.error("Please fill in required fields (*).");
      return;
    }

    setIsSubmitting(true);
    try {
      await alertsApi.send(form);
      showToast.success("Alert broadcasted successfully.");
      setForm(emptyAlert);
      setActiveTab('inbox');
      await load();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Unable to send alert.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const acknowledge = async (alertId: number) => {
    if (!user) return;
    try {
      await alertsApi.acknowledge(alertId, user.userId);
      showToast.success("Alert acknowledged.");
      await load();
    } catch (error: any) {
      showToast.error("Unable to acknowledge alert.");
    }
  };

  const toggleExpand = (alertId: number, isRead: boolean) => {
    setExpandedAlertId(expandedAlertId === alertId ? null : alertId);
    if (!isRead) {
      void markAsRead(alertId);
    }
  };

  const markAsRead = async (alertId: number) => {
    try {
      await alertsApi.markAsRead(alertId);
      await load();
    } catch (error: any) {
      // Fail silently for read markers
    }
  };

  const removeAlert = async (alertId: number) => {
    if (!window.confirm("Permanently delete this alert from the system?")) return;
    try {
      await alertsApi.delete(alertId);
      showToast.success("Alert removed.");
      await load();
    } catch (error: any) {
      showToast.error("Unable to delete alert.");
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (severityFilter !== "ALL" && alert.severity !== severityFilter) return false;
    if (statusFilter === "READ" && !alert.read) return false;
    if (statusFilter === "UNREAD" && alert.read) return false;
    if (statusFilter === "ACK" && !alert.acknowledged) return false;
    if (statusFilter === "UNACK" && alert.acknowledged) return false;
    return true;
  });

  const criticalCount = alerts.filter(a => a.severity === AlertSeverity.CRITICAL).length;
  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <section className="w-full space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between pt-4">
        <div>
          <p className="text-sm font-black text-foreground/40 uppercase tracking-[0.2em] mb-3">System Monitoring</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
            Operations Pulse
          </h1>
        </div>

        <div className="flex p-2 bg-card/60 backdrop-blur-md rounded-full border border-border/40 shadow-2xl">
          <button
            onClick={() => setActiveTab('inbox')}
            className={cn(
              "flex items-center gap-3 px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300",
              activeTab === 'inbox' 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "text-foreground/40 hover:text-foreground"
            )}
          >
            <Notification01Icon className="w-5 h-5" />
            Inbox {unreadCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.6)]" />}
          </button>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('broadcast')}
              className={cn(
                "flex items-center gap-3 px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                activeTab === 'broadcast' 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-foreground/40 hover:text-foreground"
              )}
            >
              <SentIcon className="w-5 h-5" />
              Broadcast
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 px-2">
        <StatCard label="Critical Alerts" value={criticalCount} icon={<Alert01Icon className="w-8 h-8" />} trend="Action Required" variant="destructive" />
        <StatCard label="Unread" value={unreadCount} icon={<ViewOffIcon className="w-8 h-8" />} trend="New Messages" variant="primary" />
        <StatCard label="Total Received" value={alerts.length} icon={<Notification02Icon className="w-8 h-8" />} trend="Log Capacity" variant="default" />
      </div>

      {activeTab === 'inbox' && (
        <div className="space-y-8 animate-in fade-in duration-500 px-2">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              {/* Priority Filter */}
              <div className="flex items-center p-1 bg-card/40 backdrop-blur-md rounded-2xl border border-border/40 overflow-x-auto no-scrollbar max-w-full">
                <div className="flex items-center gap-2 px-4 text-[10px] font-black uppercase tracking-widest text-foreground/40 border-r border-border/20 h-8 shrink-0">
                  <FilterIcon className="w-3.5 h-3.5" />
                  Priority
                </div>
                <div className="flex items-center gap-1 px-1">
                  {["ALL", ...Object.values(AlertSeverity)].map(v => {
                    const isActive = severityFilter === v;
                    return (
                      <button
                        key={v}
                        onClick={() => setSeverityFilter(v as any)}
                        className={cn(
                          "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap",
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "text-foreground/40 hover:text-foreground/70 hover:bg-muted/30"
                        )}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center p-1 bg-card/40 backdrop-blur-md rounded-2xl border border-border/40 overflow-x-auto no-scrollbar max-w-full">
                <div className="flex items-center gap-2 px-4 text-[10px] font-black uppercase tracking-widest text-foreground/40 border-r border-border/20 h-8 shrink-0">
                  <Notification01Icon className="w-3.5 h-3.5" />
                  Status
                </div>
                <div className="flex items-center gap-1 px-1">
                  {[
                    { id: "ALL", label: "Everything" },
                    { id: "UNREAD", label: "Unread" },
                    { id: "UNACK", label: "Pending" }
                  ].map(v => {
                    const isActive = statusFilter === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setStatusFilter(v.id as any)}
                        className={cn(
                          "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap",
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "text-foreground/40 hover:text-foreground/70 hover:bg-muted/30"
                        )}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <Button 
              variant="ghost" 
              className="h-12 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest gap-3 border border-border/40 bg-card/40 backdrop-blur-md hover:bg-muted/40 transition-all group"
              onClick={() => { setSeverityFilter('ALL'); setStatusFilter('ALL'); }}
            >
              <Settings02Icon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" /> Reset Filters
            </Button>
          </div>

          <div className="flex-1 space-y-4">
            {loading ? (
              <div className="py-32 text-center bg-card/60 rounded-[2.5rem] border border-border/40 backdrop-blur-xl">
                 <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-6" />
                 <p className="text-xs font-black text-foreground/40 uppercase tracking-widest">Accessing Logs...</p>
              </div>
            ) : (
              <div className="p-1 rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-app-card">
                {filteredAlerts.length === 0 ? (
                  <div className="py-24 text-center">
                    <Notification01Icon className="w-12 h-12 mx-auto mb-6 text-foreground/10" />
                    <h3 className="text-xl font-bold text-foreground/60 tracking-tight">No pending alerts</h3>
                    <p className="text-[10px] font-black text-foreground/20 mt-2 uppercase tracking-widest">Everything is operating within normal parameters.</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {filteredAlerts.map((alert) => {
                      const isExpanded = expandedAlertId === alert.alertId;
                      return (
                        <div 
                          key={alert.alertId}
                          onClick={() => toggleExpand(alert.alertId, alert.read)}
                          className={cn(
                            "group relative flex flex-col gap-4 p-6 rounded-2xl transition-all duration-300 cursor-pointer border",
                            alert.read 
                              ? "bg-muted/5 border-border/20 hover:bg-card/40 opacity-70" 
                              : "bg-card border-primary/20 shadow-app-subtle hover:border-primary/40",
                            isExpanded && "border-primary/40 bg-card/80 opacity-100 shadow-app-card"
                          )}
                        >
                          <div className="flex items-center gap-5">
                            {/* Severity Indicator */}
                            <div className={cn(
                              "w-1 h-8 rounded-full shrink-0 transition-all",
                              alert.severity === AlertSeverity.CRITICAL ? "bg-rose-400" :
                              alert.severity === AlertSeverity.WARNING ? "bg-amber-500" :
                              "bg-primary"
                            )} />

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <span className={cn(
                                  "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                                  alert.severity === AlertSeverity.CRITICAL ? "bg-rose-400/10 text-rose-400 border-rose-400/20" :
                                  alert.severity === AlertSeverity.WARNING ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                  "bg-primary/10 text-primary border-primary/20"
                                )}>
                                  {alert.severity}
                                </span>
                                <span className="text-[9px] font-bold text-foreground/30 uppercase tracking-wider tabular-nums">
                                   {formatRelativeTime(alert.createdAt)}
                                </span>
                              </div>
                              
                              <h4 className={cn(
                                "font-bold text-base tracking-tight truncate",
                                !alert.read ? "text-foreground" : "text-foreground/60"
                              )}>
                                {alert.title}
                              </h4>
                              <p className={cn(
                                "text-xs text-muted-foreground/80 mt-1 leading-relaxed",
                                !isExpanded && "line-clamp-1"
                              )}>
                                {alert.message}
                              </p>

                              {isExpanded && (
                                <div className="pt-6 mt-6 grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-500">
                                   {alert.relatedProductId && (
                                     <div className="space-y-1.5">
                                        <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Product Reference</p>
                                        <p className="text-sm font-black text-foreground">SKU ID: #{alert.relatedProductId}</p>
                                     </div>
                                   )}
                                   {alert.relatedWarehouseId && (
                                     <div className="space-y-1.5">
                                        <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Warehouse Loc</p>
                                        <p className="text-sm font-black text-foreground">Node ID: #{alert.relatedWarehouseId}</p>
                                     </div>
                                   )}
                                   <div className="space-y-1.5">
                                      <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Dispatched Via</p>
                                      <p className="text-sm font-black text-foreground uppercase">{alert.channel}</p>
                                   </div>
                                   <div className="space-y-1.5">
                                      <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Timestamp</p>
                                      <p className="text-sm font-black text-foreground">{formatDate(alert.createdAt)}</p>
                                   </div>

                                   {alert.acknowledged && (
                                     <div className="col-span-2 pt-5 mt-5 border-t border-border/20">
                                       <div className="flex items-center gap-3 text-emerald-500">
                                          <CheckmarkBadge01Icon className="w-4 h-4" />
                                          <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">
                                            Verified by {alert.acknowledgedByName || (alert.acknowledgedBy ? `Staff ID #${alert.acknowledgedBy}` : "System Admin")} on {alert.acknowledgedAt ? formatDate(alert.acknowledgedAt) : formatDate(alert.createdAt)}
                                          </p>
                                       </div>
                                     </div>
                                   )}
                                </div>
                              )}
                            </div>

                            {/* Action Panel */}
                            <div className="flex items-center gap-3">
                               {!alert.acknowledged ? (
                                 <Button
                                   size="sm"
                                   variant="ghost"
                                   onClick={(e) => { e.stopPropagation(); acknowledge(alert.alertId); }}
                                   className="h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all border border-border/40"
                                 >
                                   Acknowledge
                                 </Button>
                               ) : (
                                 <div className="flex items-center gap-2 px-4 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                   <CheckmarkBadge01Icon className="w-3.5 h-3.5" />
                                   Verified
                                 </div>
                               )}

                               {user?.role === 'ADMIN' && (
                                 <Button
                                   size="icon"
                                   variant="ghost"
                                   onClick={(e) => { e.stopPropagation(); removeAlert(alert.alertId); }}
                                   className="h-10 w-10 rounded-xl text-rose-400 hover:bg-rose-400 hover:text-white transition-all border border-rose-400/10"
                                 >
                                   <Delete02Icon className="w-4 h-4" />
                                 </Button>
                               )}
                            </div>
                          </div>

                          {/* Unread Indicator Glow */}
                          {!alert.read && (
                             <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-16 bg-primary rounded-l-full shadow-[0_0_20px_rgba(var(--primary),1)]" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'broadcast' && (
        <div className="max-w-2xl space-y-10 animate-in fade-in duration-500">
          <div className="flex items-center gap-6 px-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <SentIcon className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">System Dispatch</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-2 text-foreground/40">
                Secure Broadcast Channel
              </p>
            </div>
          </div>

          <div className="py-6 px-2">
            <form onSubmit={send} className="space-y-10">
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 px-2 flex items-center">
                    Recipient <span className="text-rose-400 ml-2">*</span>
                  </label>
                  <UserSelect 
                    value={form.recipientId} 
                    onChange={(id) => setForm({ ...form, recipientId: id })} 
                    placeholder="Search Users..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 px-2 flex items-center">
                    Priority Level
                  </label>
                  <div className="relative group">
                    <select
                      className="h-14 w-full rounded-2xl border border-border/40 bg-muted/30 pl-5 pr-10 text-[10px] focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer uppercase tracking-widest shadow-xl font-black text-foreground"
                      value={form.severity}
                      onChange={(e) => update("severity", e.target.value)}
                    >
                      {Object.values(AlertSeverity).map(v => <option key={v} value={v} className="bg-background">{v}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-3 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 px-2 flex items-center">
                    Subject Line <span className="text-rose-400 ml-2">*</span>
                  </label>
                  <div className="relative group">
                    <Sorting05Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20 group-focus-within:text-primary transition-colors" />
                    <input
                      className="h-14 w-full rounded-2xl border border-border/40 bg-muted/30 pl-16 pr-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-xl font-black text-foreground placeholder:text-muted-foreground/40"
                      placeholder="e.g. Critical: Inventory Sync Failure"
                      value={form.title}
                      onChange={(e) => update("title", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 px-2 flex items-center">
                    Communication Details <span className="text-rose-400 ml-2">*</span>
                  </label>
                  <textarea
                    className="min-h-48 w-full rounded-[2rem] border border-border/40 bg-muted/30 p-8 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none shadow-xl font-black text-foreground placeholder:text-muted-foreground/40 leading-relaxed"
                    placeholder="Enter detailed instructions or system notification body..."
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-6 pt-12">
                <button 
                  type="button" 
                  onClick={() => setActiveTab('inbox')}
                  className="px-10 h-14 rounded-full border border-border/40 bg-muted/30 hover:bg-muted/40 text-foreground font-black text-[10px] uppercase tracking-widest transition-all shadow-xl"
                >
                  Discard
                </button>
                <button type="submit" disabled={isSubmitting} className="px-10 h-14 rounded-full bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-2xl flex items-center justify-center gap-3">
                  <SentIcon className="w-5 h-5" />
                  {isSubmitting ? 'Processing Dispatch...' : 'Execute Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

const StatCard = ({ label, value, icon, trend, variant = 'default' }: { label: string; value: number; icon: React.ReactNode; trend: string; variant?: string }) => (
  <Card className={cn(
    "group rounded-[2.5rem] border-border/40 transition-all duration-500 overflow-hidden relative",
    "bg-card/60 backdrop-blur-3xl hover:border-primary/20 hover:shadow-2xl hover:-translate-y-1 shadow-app-card"
  )}>
    {/* Background Accent Glow */}
    <div className={cn(
      "absolute top-0 right-0 w-32 h-32 blur-[60px] -mr-16 -mt-16 rounded-full transition-opacity duration-500 opacity-20 group-hover:opacity-40",
      variant === 'destructive' ? "bg-rose-400" :
      variant === 'primary' ? "bg-primary" :
      "bg-foreground/20"
    )} />

    <CardContent className="p-10 relative">
      <div className="flex items-center justify-between">
        <div className={cn(
          "w-16 h-16 flex items-center justify-center transition-all duration-500 group-hover:scale-110",
          variant === 'destructive' ? "text-rose-400" :
          variant === 'primary' ? "text-primary" :
          "text-foreground/40"
        )}>
          {icon}
        </div>
        <div className={cn(
          "px-5 py-2 rounded-full border transition-all",
          variant === 'destructive' ? "bg-rose-400/10 border-rose-400/20 text-rose-400" :
          variant === 'primary' ? "bg-primary/10 border-primary/20 text-primary" :
          "bg-foreground/[0.03] border-border/20 text-foreground/40"
        )}>
           <span className="text-[10px] font-black uppercase tracking-[0.15em]">{trend}</span>
        </div>
      </div>
      <div className="mt-10">
        <p className="text-5xl font-black tracking-tighter text-foreground tabular-nums leading-none">{value.toLocaleString()}</p>
        <p className="text-[11px] font-black text-foreground/40 mt-4 uppercase tracking-[0.2em]">{label}</p>
      </div>
    </CardContent>
  </Card>
);
