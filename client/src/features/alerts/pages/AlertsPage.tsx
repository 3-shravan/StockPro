import { UserSelect } from "@/components/common/UserSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <section className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Alert Centre</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Monitor system notifications, stock alerts, and organizational broadcasts.
          </p>
        </div>

        <div className="flex p-1.5 bg-muted/40 backdrop-blur-md rounded-2xl w-fit border border-border/40 shadow-inner">
          <button
            onClick={() => setActiveTab('inbox')}
            className={cn(
              "flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
              activeTab === 'inbox' 
                ? "bg-background text-primary shadow-lg shadow-black/5 scale-[1.02] ring-1 ring-border/50" 
                : "text-muted-foreground/60 hover:text-foreground"
            )}
          >
            <Notification01Icon className="w-4 h-4" />
            Inbox {unreadCount > 0 && <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />}
          </button>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('broadcast')}
              className={cn(
                "flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                activeTab === 'broadcast' 
                  ? "bg-background text-primary shadow-lg shadow-black/5 scale-[1.02] ring-1 ring-border/50" 
                  : "text-muted-foreground/60 hover:text-foreground"
              )}
            >
              <SentIcon className="w-4 h-4" />
              Broadcast
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Critical Alerts" value={criticalCount} icon={<Alert01Icon className="text-destructive" />} trend="Requires Action" />
        <StatCard label="Unread" value={unreadCount} icon={<ViewOffIcon className="text-primary" />} trend="New Messages" />
        <StatCard label="Total Received" value={alerts.length} icon={<Notification02Icon className="text-muted-foreground" />} trend="Lifetime Log" />
      </div>

      {activeTab === 'inbox' && (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filters */}
          <div className="w-full lg:w-72 space-y-6">
            <Card className="rounded-3xl border-none bg-card/40 backdrop-blur-xl shadow-xl ring-1 ring-white/10 overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary/80">
                  <FilterIcon className="w-4 h-4" />
                  Management Tools
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Priority</label>
                    <select
                      className="w-full h-11 rounded-xl border border-border/40 bg-background/50 px-3 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value as any)}
                    >
                      <option value="ALL">All Levels</option>
                      {Object.values(AlertSeverity).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Status</label>
                    <select
                      className="w-full h-11 rounded-xl border border-border/40 bg-background/50 px-3 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                      <option value="ALL">Everything</option>
                      <option value="UNREAD">Unread Only</option>
                      <option value="UNACK">Pending Action</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/20 space-y-3">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start rounded-xl text-xs gap-2 hover:bg-destructive/5 hover:text-destructive transition-all"
                    onClick={() => { setSeverityFilter('ALL'); setStatusFilter('ALL'); }}
                  >
                    <Settings02Icon className="w-4 h-4" />
                    Reset Display
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Mini */}
            <div className="hidden lg:block space-y-4">
               <div className="p-5 rounded-[2rem] bg-destructive/10 border border-destructive/10 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-destructive/20 flex items-center justify-center">
                       <Notification01Icon className="w-4 h-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-destructive">{criticalCount}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-destructive/60">Critical Threats</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Right Main - Notification List */}
          <div className="flex-1 space-y-4">
            {loading ? (
              <div className="py-24 text-center">
                 <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                 <p className="text-sm font-bold text-muted-foreground/40 uppercase tracking-widest">Accessing Logs...</p>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="py-32 text-center bg-card/20 backdrop-blur-xl rounded-[3rem] border border-dashed border-border/40 shadow-inner">
                <Notification01Icon className="w-16 h-16 mx-auto mb-6 text-muted-foreground/10" />
                <h3 className="text-xl font-bold text-muted-foreground/60">No pending alerts</h3>
                <p className="text-sm text-muted-foreground/40 mt-2">Everything is operating within normal parameters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => {
                  const isExpanded = expandedAlertId === alert.alertId;
                  return (
                    <div 
                      key={alert.alertId}
                      onClick={() => toggleExpand(alert.alertId, alert.read)}
                      className={cn(
                        "group relative flex flex-col gap-4 p-5 rounded-[2.5rem] transition-all duration-500 cursor-pointer border border-transparent shadow-sm",
                        alert.read 
                          ? "bg-card/40 grayscale-[0.4] hover:grayscale-0 border-border/20 opacity-70 hover:opacity-100" 
                          : "bg-card shadow-xl shadow-primary/5 ring-1 ring-primary/20 scale-[1.01] hover:scale-[1.02]",
                        isExpanded && "scale-[1.03] ring-2 ring-primary/40 bg-card grayscale-0 opacity-100 z-20 shadow-2xl"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        {/* Severity Indicator Dot */}
                        <div className={cn(
                          "w-3 h-3 rounded-full shrink-0 shadow-lg",
                          !alert.read && "animate-pulse",
                          alert.severity === AlertSeverity.CRITICAL ? "bg-destructive shadow-destructive/40" :
                          alert.severity === AlertSeverity.WARNING ? "bg-amber-500 shadow-amber-500/40" :
                          "bg-primary shadow-primary/40"
                        )} />

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                              alert.severity === AlertSeverity.CRITICAL ? "bg-destructive/10 text-destructive" :
                              alert.severity === AlertSeverity.WARNING ? "bg-amber-500/10 text-amber-600" :
                              "bg-primary/10 text-primary"
                            )}>
                              {alert.severity}
                            </span>
                            {!alert.read && (
                               <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary text-white text-[8px] font-black uppercase tracking-tighter">
                                 <Notification02Icon className="w-2.5 h-2.5" /> New
                               </div>
                            )}
                            <span className="text-[10px] font-bold text-muted-foreground/40 tabular-nums">
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
                            "text-xs text-muted-foreground/70 leading-relaxed transition-all duration-500",
                            !isExpanded && "line-clamp-2"
                          )}>
                            {alert.message}
                          </p>

                          {isExpanded && (
                            <div className="pt-4 mt-4 border-t border-border/20 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                               {alert.relatedProductId && (
                                 <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Product Reference</p>
                                    <p className="text-xs font-semibold">SKU ID: #{alert.relatedProductId}</p>
                                 </div>
                               )}
                               {alert.relatedWarehouseId && (
                                 <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Warehouse Loc</p>
                                    <p className="text-xs font-semibold">Node ID: #{alert.relatedWarehouseId}</p>
                                 </div>
                               )}
                               <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Dispatched Via</p>
                                  <p className="text-xs font-semibold uppercase">{alert.channel}</p>
                               </div>
                               <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Timestamp</p>
                                  <p className="text-xs font-semibold">{formatDate(alert.createdAt)}</p>
                               </div>

                               {alert.acknowledged && (
                                 <div className="col-span-2 pt-3 mt-3 border-t border-border/10">
                                   <div className="flex items-center gap-2 text-emerald-600">
                                      <CheckmarkBadge01Icon className="w-3 h-3" />
                                      <p className="text-[10px] font-black uppercase tracking-widest">
                                        Verified by {alert.acknowledgedByName || (alert.acknowledgedBy ? `Staff ID #${alert.acknowledgedBy}` : "System Admin")} on {alert.acknowledgedAt ? formatDate(alert.acknowledgedAt) : formatDate(alert.createdAt)}
                                      </p>
                                   </div>
                                 </div>
                               )}
                            </div>
                          )}
                        </div>

                        {/* Action Panel */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                           {!alert.acknowledged ? (
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={(e) => { e.stopPropagation(); acknowledge(alert.alertId); }}
                               className="h-10 rounded-2xl bg-background shadow-lg shadow-black/5 gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all border-border/60"
                             >
                               <CheckmarkBadge01Icon className="w-4 h-4" />
                               Ack
                             </Button>
                           ) : (
                             <div className="flex items-center gap-2 px-4 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                               <CheckmarkBadge01Icon className="w-4 h-4" />
                               Done
                             </div>
                           )}

                           {user?.role === 'ADMIN' && (
                             <Button
                               size="icon"
                               variant="ghost"
                               onClick={(e) => { e.stopPropagation(); removeAlert(alert.alertId); }}
                               className="h-10 w-10 rounded-2xl hover:bg-destructive/10 hover:text-destructive transition-all"
                             >
                               <Delete02Icon className="w-4 h-4" />
                             </Button>
                           )}
                        </div>
                      </div>

                      {/* Unread Indicator Glow */}
                      {!alert.read && (
                         <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-12 bg-primary rounded-l-full shadow-[0_0_15px_rgba(var(--primary),0.8)]" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'broadcast' && (
        <Card className="max-w-2xl mx-auto rounded-[3rem] border-transparent bg-card/60 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden">
          <CardHeader className="bg-primary/5 pb-10 pt-10 px-12 border-b border-primary/10">
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-3xl bg-primary shadow-lg shadow-primary/20">
                <SentIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black tracking-tight">System Dispatch</CardTitle>
                <CardDescription className="text-sm font-medium opacity-60 uppercase tracking-widest mt-1">
                  Secure Broadcast Channel
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-12">
            <form onSubmit={send} className="space-y-10">
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1 flex items-center">
                    Recipient <span className="text-destructive ml-1">*</span>
                  </label>
                  <UserSelect 
                    value={form.recipientId} 
                    onChange={(id) => setForm({ ...form, recipientId: id })} 
                    placeholder="Search Users..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1 flex items-center">
                    Priority Level
                  </label>
                  <select
                    className="h-12 w-full rounded-2xl border border-border/60 bg-background/50 px-4 text-xs font-bold uppercase tracking-widest focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer"
                    value={form.severity}
                    onChange={(e) => update("severity", e.target.value)}
                  >
                    {Object.values(AlertSeverity).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div className="space-y-3 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1 flex items-center">
                    Subject Line <span className="text-destructive ml-1">*</span>
                  </label>
                  <div className="relative group">
                    <Sorting05Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <input
                      className="h-14 w-full rounded-2xl border border-border/60 bg-background/50 pl-12 pr-4 text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="e.g. Critical: Inventory Sync Failure"
                      value={form.title}
                      onChange={(e) => update("title", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1 flex items-center">
                    Communication Details <span className="text-destructive ml-1">*</span>
                  </label>
                  <textarea
                    className="min-h-40 w-full rounded-3xl border border-border/60 bg-background/50 p-6 text-sm font-medium leading-relaxed focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                    placeholder="Enter detailed instructions or system notification body..."
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button type="submit" disabled={isSubmitting} className="flex-[2] h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest shadow-xl shadow-primary/20 gap-3 text-xs transition-all active:scale-[0.98]">
                  <SentIcon className="w-4 h-4" />
                  {isSubmitting ? 'Processing Dispatch...' : 'Execute Broadcast'}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setActiveTab('inbox')}
                  className="flex-1 h-14 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-muted/50"
                >
                  Discard
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </section>
  );
};

const StatCard = ({ label, value, icon, trend }: { label: string; value: number; icon: React.ReactNode; trend: string }) => (
  <Card className="group rounded-[2rem] border-transparent bg-card/60 backdrop-blur-md shadow-sm border-none overflow-hidden transition-all hover:shadow-xl hover:bg-card/80">
    <CardContent className="p-8">
      <div className="flex items-center justify-between">
        <div className="p-3 rounded-2xl bg-muted/40 group-hover:bg-primary/10 transition-colors">{icon}</div>
        <div className="px-3 py-1 rounded-full bg-background/50 border border-border/50">
           <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground/80">{trend}</span>
        </div>
      </div>
      <div className="mt-6">
        <p className="text-4xl font-black tracking-tighter transition-all group-hover:translate-x-1">{value}</p>
        <p className="text-xs font-bold text-muted-foreground/60 mt-1 uppercase tracking-widest">{label}</p>
      </div>
    </CardContent>
  </Card>
);
