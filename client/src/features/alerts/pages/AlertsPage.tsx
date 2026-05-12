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
          <p className="text-sm font-black text-white/40 uppercase tracking-[0.2em] mb-3">System Monitoring</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
            Operations Pulse
          </h1>
        </div>

        <div className="flex p-2 bg-white/[0.05] backdrop-blur-md rounded-full border border-border/40 shadow-2xl">
          <button
            onClick={() => setActiveTab('inbox')}
            className={cn(
              "flex items-center gap-3 px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300",
              activeTab === 'inbox' 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "text-white/40 hover:text-white"
            )}
          >
            <Notification01Icon className="w-5 h-5" />
            Inbox {unreadCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]" />}
          </button>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('broadcast')}
              className={cn(
                "flex items-center gap-3 px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                activeTab === 'broadcast' 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-white/40 hover:text-white"
              )}
            >
              <SentIcon className="w-5 h-5" />
              Broadcast
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 px-2">
        <StatCard label="Critical Alerts" value={criticalCount} icon={<Alert01Icon className="text-rose-500 w-8 h-8" />} trend="Requires Action" variant="destructive" />
        <StatCard label="Unread" value={unreadCount} icon={<ViewOffIcon className="text-primary w-8 h-8" />} trend="New Messages" variant="primary" />
        <StatCard label="Total Received" value={alerts.length} icon={<Notification02Icon className="text-white/60 w-8 h-8" />} trend="Lifetime Log" variant="default" />
      </div>

      {activeTab === 'inbox' && (
        <div className="space-y-10 animate-in fade-in duration-500 px-2">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center justify-between">
            <div className="flex flex-wrap p-2 bg-white/[0.05] backdrop-blur-md rounded-full border border-border/40 shadow-2xl gap-2">
              <div className="flex items-center gap-3 px-6 text-[10px] font-black uppercase tracking-widest text-white/40 border-r border-white/10">
                <FilterIcon className="w-4 h-4" />
                Priority
              </div>
              <div className="flex items-center gap-1">
                {["ALL", ...Object.values(AlertSeverity)].map(v => (
                  <button
                    key={v}
                    onClick={() => setSeverityFilter(v as any)}
                    className={cn(
                      "px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                      severityFilter === v ? "bg-primary text-primary-foreground shadow-lg" : "text-white/40 hover:text-white"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap p-2 bg-white/[0.05] backdrop-blur-md rounded-full border border-border/40 shadow-2xl gap-2">
              <div className="flex items-center gap-3 px-6 text-[10px] font-black uppercase tracking-widest text-white/40 border-r border-white/10">
                <Notification01Icon className="w-4 h-4" />
                Status
              </div>
              <div className="flex items-center gap-1">
                {[
                  { id: "ALL", label: "Everything" },
                  { id: "UNREAD", label: "Unread" },
                  { id: "UNACK", label: "Pending" }
                ].map(v => (
                  <button
                    key={v.id}
                    onClick={() => setStatusFilter(v.id as any)}
                    className={cn(
                      "px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                      statusFilter === v.id ? "bg-primary text-primary-foreground shadow-lg" : "text-white/40 hover:text-white"
                    )}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <Button 
              variant="outline" 
              className="h-14 rounded-full px-10 text-[10px] font-black uppercase tracking-widest gap-4 border-border/40 bg-white/[0.05] backdrop-blur-md hover:bg-white/10"
              onClick={() => { setSeverityFilter('ALL'); setStatusFilter('ALL'); }}
            >
              <Settings02Icon className="w-4 h-4" /> Reset
            </Button>
          </div>

          <div className="flex-1 space-y-4">
            {loading ? (
              <div className="py-32 text-center bg-white/[0.05] rounded-[2.5rem] border border-border/40 backdrop-blur-xl">
                 <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-6" />
                 <p className="text-xs font-black text-white/40 uppercase tracking-widest">Accessing Logs...</p>
              </div>
            ) : (
              <div className="p-10 rounded-[2.5rem] border border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl">
                {filteredAlerts.length === 0 ? (
                  <div className="py-32 text-center">
                    <Notification01Icon className="w-16 h-16 mx-auto mb-8 text-white/20" />
                    <h3 className="text-2xl font-black text-white/60 tracking-tight">No pending alerts</h3>
                    <p className="text-xs font-black text-white/30 mt-3 uppercase tracking-widest">Everything is operating within normal parameters.</p>
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
                            "group relative flex flex-col gap-5 p-8 rounded-[2rem] transition-all duration-500 cursor-pointer border",
                            alert.read 
                              ? "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10 opacity-70 hover:opacity-100" 
                              : "bg-white/[0.05] border-primary/30 shadow-lg shadow-primary/5 hover:bg-white/[0.08] hover:border-primary/50",
                            isExpanded && "border-primary/50 bg-white/[0.08] opacity-100 shadow-2xl scale-[1.01]"
                          )}
                        >
                          <div className="flex items-center gap-6">
                            {/* Severity Indicator Dot */}
                            <div className={cn(
                              "w-4 h-4 rounded-full shrink-0 shadow-lg",
                              !alert.read && "animate-pulse",
                              alert.severity === AlertSeverity.CRITICAL ? "bg-rose-500 shadow-rose-500/40" :
                              alert.severity === AlertSeverity.WARNING ? "bg-amber-500 shadow-amber-500/40" :
                              "bg-primary shadow-primary/40"
                            )} />

                            {/* Content */}
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-center gap-4">
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border",
                                  alert.severity === AlertSeverity.CRITICAL ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                  alert.severity === AlertSeverity.WARNING ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                  "bg-primary/10 text-primary border-primary/20"
                                )}>
                                  {alert.severity}
                                </span>
                                {!alert.read && (
                                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                                    <Notification02Icon className="w-3 h-3" /> New
                                  </div>
                                )}
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/30 tabular-nums">
                                   {formatRelativeTime(alert.createdAt)}
                                </span>
                              </div>
                              
                              <h4 className={cn(
                                "font-black text-xl tracking-tight truncate",
                                !alert.read ? "text-white" : "text-white/60"
                              )}>
                                {alert.title}
                              </h4>
                              <p className={cn(
                                "text-sm text-white/50 leading-relaxed transition-all duration-500",
                                !isExpanded && "line-clamp-2"
                              )}>
                                {alert.message}
                              </p>

                              {isExpanded && (
                                <div className="pt-6 mt-6 border-t border-white/10 grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-500">
                                   {alert.relatedProductId && (
                                     <div className="space-y-1.5">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Product Reference</p>
                                        <p className="text-sm font-black text-white">SKU ID: #{alert.relatedProductId}</p>
                                     </div>
                                   )}
                                   {alert.relatedWarehouseId && (
                                     <div className="space-y-1.5">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Warehouse Loc</p>
                                        <p className="text-sm font-black text-white">Node ID: #{alert.relatedWarehouseId}</p>
                                     </div>
                                   )}
                                   <div className="space-y-1.5">
                                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Dispatched Via</p>
                                      <p className="text-sm font-black text-white uppercase">{alert.channel}</p>
                                   </div>
                                   <div className="space-y-1.5">
                                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Timestamp</p>
                                      <p className="text-sm font-black text-white">{formatDate(alert.createdAt)}</p>
                                   </div>

                                   {alert.acknowledged && (
                                     <div className="col-span-2 pt-5 mt-5 border-t border-white/5">
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
                            <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                               {!alert.acknowledged ? (
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={(e) => { e.stopPropagation(); acknowledge(alert.alertId); }}
                                   className="h-16 px-10 rounded-full bg-white text-black shadow-xl gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all border-none"
                                 >
                                   <CheckmarkBadge01Icon className="w-5 h-5" />
                                   Ack
                                 </Button>
                               ) : (
                                 <div className="flex items-center gap-3 px-8 h-16 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-lg">
                                   <CheckmarkBadge01Icon className="w-5 h-5" />
                                   Done
                                 </div>
                               )}

                               {user?.role === 'ADMIN' && (
                                 <Button
                                   size="icon"
                                   variant="ghost"
                                   onClick={(e) => { e.stopPropagation(); removeAlert(alert.alertId); }}
                                   className="h-16 w-16 rounded-full border border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-xl"
                                 >
                                   <Delete02Icon className="w-5 h-5" />
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
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-2 text-white/40">
                Secure Broadcast Channel
              </p>
            </div>
          </div>

          <div className="py-6 px-2">
            <form onSubmit={send} className="space-y-10">
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2 flex items-center">
                    Recipient <span className="text-rose-500 ml-2">*</span>
                  </label>
                  <UserSelect 
                    value={form.recipientId} 
                    onChange={(id) => setForm({ ...form, recipientId: id })} 
                    placeholder="Search Users..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2 flex items-center">
                    Priority Level
                  </label>
                  <div className="relative group">
                    <select
                      className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 pl-5 pr-10 text-[10px] focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer uppercase tracking-widest shadow-xl font-black text-white"
                      value={form.severity}
                      onChange={(e) => update("severity", e.target.value)}
                    >
                      {Object.values(AlertSeverity).map(v => <option key={v} value={v} className="bg-[#0A0A0A]">{v}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-3 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2 flex items-center">
                    Subject Line <span className="text-rose-500 ml-2">*</span>
                  </label>
                  <div className="relative group">
                    <Sorting05Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                    <input
                      className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 pl-16 pr-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-xl font-black text-white placeholder:text-white/20"
                      placeholder="e.g. Critical: Inventory Sync Failure"
                      value={form.title}
                      onChange={(e) => update("title", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2 flex items-center">
                    Communication Details <span className="text-rose-500 ml-2">*</span>
                  </label>
                  <textarea
                    className="min-h-48 w-full rounded-[2rem] border border-white/10 bg-white/5 p-8 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none shadow-xl font-black text-white placeholder:text-white/20 leading-relaxed"
                    placeholder="Enter detailed instructions or system notification body..."
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 pt-12 border-t border-white/10">
                <button type="submit" disabled={isSubmitting} className="flex-1 h-14 rounded-full bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-2xl flex items-center justify-center gap-3">
                  <SentIcon className="w-5 h-5" />
                  {isSubmitting ? 'Processing Dispatch...' : 'Execute Broadcast'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setActiveTab('inbox')}
                  className="px-10 h-14 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-xl"
                >
                  Discard
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
  <Card className="group rounded-[2.5rem] border-none bg-white/[0.05] shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-500 hover:bg-white/[0.08]">
    <CardContent className="p-10">
      <div className="flex items-center justify-between">
        <div className={cn(
          "w-20 h-20 rounded-[1.5rem] flex items-center justify-center border shadow-inner transition-all duration-500 group-hover:scale-110",
          variant === 'destructive' ? "bg-rose-500/10 border-rose-500/20 shadow-rose-500/10" :
          variant === 'primary' ? "bg-primary/10 border-primary/20 shadow-primary/10" :
          "bg-white/5 border-white/10 shadow-white/5"
        )}>
          {icon}
        </div>
        <div className="px-5 py-2 rounded-full bg-white/5 border border-white/10 shadow-sm">
           <span className="text-[11px] font-black uppercase tracking-widest text-white/60">{trend}</span>
        </div>
      </div>
      <div className="mt-8">
        <p className="text-5xl font-black tracking-tighter text-white">{value}</p>
        <p className="text-[12px] font-black text-white/40 mt-3 uppercase tracking-[0.2em]">{label}</p>
      </div>
    </CardContent>
  </Card>
);
