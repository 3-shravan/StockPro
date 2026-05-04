import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showToast } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth.store";
import { AlertChannel, AlertSeverity, AlertType } from "@/types/enums";
import { alertsApi } from "@/features/alerts/api/alerts.api";
import type { Alert, AlertRequest } from "@/features/alerts/types";

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
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [severityFilter, setSeverityFilter] = useState<"ALL" | AlertSeverity>(
    "ALL",
  );
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "READ" | "UNREAD" | "ACK" | "UNACK"
  >("ALL");
  const [form, setForm] = useState<AlertRequest>(emptyAlert);

  const load = async () => {
    if (!user) return;
    try {
      setAlerts(
        user.role === "ADMIN"
          ? await alertsApi.getAll()
          : await alertsApi.getByUser(user.userId),
      );
    } catch (error: any) {
      showToast.error(
        error.response?.data?.message || "Unable to load alerts.",
      );
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
    try {
      await alertsApi.send(form);
      showToast.success("Alert sent.");
      setForm(emptyAlert);
      await load();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Unable to send alert.");
    }
  };

  const acknowledge = async (alert: Alert) => {
    try {
      await alertsApi.acknowledge(alert.alertId);
      showToast.success("Alert acknowledged.");
      await load();
    } catch (error: any) {
      showToast.error(
        error.response?.data?.message || "Unable to acknowledge alert.",
      );
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (severityFilter !== "ALL" && alert.severity !== severityFilter)
      return false;

    if (statusFilter === "READ" && !alert.read) return false;
    if (statusFilter === "UNREAD" && alert.read) return false;
    if (statusFilter === "ACK" && !alert.acknowledged) return false;
    if (statusFilter === "UNACK" && alert.acknowledged) return false;

    return true;
  });

  const criticalCount = alerts.filter(
    (alert) => alert.severity === AlertSeverity.CRITICAL,
  ).length;
  const unreadCount = alerts.filter((alert) => !alert.read).length;
  const unackCount = alerts.filter((alert) => !alert.acknowledged).length;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Alert Centre</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          In-app alerts for low stock, overstock, PO approvals, overdue
          receipts, and broadcasts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AlertStat label="Total Alerts" value={String(alerts.length)} />
        <AlertStat label="Critical" value={String(criticalCount)} />
        <AlertStat label="Unread" value={String(unreadCount)} />
        <AlertStat label="Unacknowledged" value={String(unackCount)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm">
          <CardHeader>
            <CardTitle>Send Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={send} className="space-y-3">
              <input
                type="number"
                className="h-11 w-full rounded-2xl border border-input/60 bg-background px-3 text-sm"
                placeholder="Recipient ID"
                value={form.recipientId}
                onChange={(e) => update("recipientId", e.target.value)}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  className="h-11 rounded-2xl border border-input/60 bg-background px-3 text-sm"
                  value={form.type}
                  onChange={(e) => update("type", e.target.value)}
                >
                  {Object.values(AlertType).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                <select
                  className="h-11 rounded-2xl border border-input/60 bg-background px-3 text-sm"
                  value={form.severity}
                  onChange={(e) => update("severity", e.target.value)}
                >
                  {Object.values(AlertSeverity).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <input
                className="h-11 w-full rounded-2xl border border-input/60 bg-background px-3 text-sm"
                placeholder="Title"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
              <textarea
                className="min-h-24 w-full rounded-2xl border border-input/60 bg-background px-3 py-2 text-sm"
                placeholder="Message"
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
              />
              <Button>Send Alert</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Alerts</CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  className="h-10 rounded-2xl border border-input/60 bg-background px-3 text-sm"
                  value={severityFilter}
                  onChange={(e) =>
                    setSeverityFilter(e.target.value as "ALL" | AlertSeverity)
                  }
                >
                  <option value="ALL">All severities</option>
                  {Object.values(AlertSeverity).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                <select
                  className="h-10 rounded-2xl border border-input/60 bg-background px-3 text-sm"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as
                        | "ALL"
                        | "READ"
                        | "UNREAD"
                        | "ACK"
                        | "UNACK",
                    )
                  }
                >
                  <option value="ALL">All status</option>
                  <option value="UNREAD">Unread</option>
                  <option value="READ">Read</option>
                  <option value="UNACK">Unacknowledged</option>
                  <option value="ACK">Acknowledged</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.alertId}
                  className="rounded-2xl bg-background/70 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.type} · {alert.severity} · {alert.createdAt}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => void acknowledge(alert)}
                    >
                      {alert.acknowledged ? "Acknowledged" : "Acknowledge"}
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {alert.message}
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {alert.read ? "Read" : "Unread"} ·{" "}
                    {alert.acknowledged ? "Acknowledged" : "Unacknowledged"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

const AlertStat = ({ label, value }: { label: string; value: string }) => (
  <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm">
    <CardContent className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </CardContent>
  </Card>
);
