import { useEffect, useState } from "react";
import {
  ArrowLeftRightIcon,
  Building05Icon,
  Edit02Icon,
} from "hugeicons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showToast } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth.store";
import { warehousesApi } from "@/features/warehouses/api";
import type { Warehouse, WarehouseRequest } from "@/features/warehouses/types";

const emptyWarehouse: WarehouseRequest = {
  name: "",
  location: "",
  address: "",
  managerId: 0,
  capacity: 0,
  phone: "",
};

export const WarehousesPage = () => {
  const user = useAuthStore((state) => state.user);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<WarehouseRequest>(emptyWarehouse);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [transfer, setTransfer] = useState({
    fromWarehouseId: 0,
    toWarehouseId: 0,
    productId: 0,
    quantity: 0,
  });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setWarehouses(await warehousesApi.getAll());
    } catch (error: any) {
      showToast.error(
        error.response?.data?.message || "Unable to load warehouses.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const update = (field: keyof WarehouseRequest, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: ["managerId", "capacity"].includes(field)
        ? Number(value)
        : value,
    }));
  };

  const edit = (warehouse: Warehouse) => {
    setEditingId(warehouse.warehouseId);
    setForm({
      name: warehouse.name,
      location: warehouse.location,
      address: warehouse.address,
      managerId: warehouse.managerId,
      capacity: warehouse.capacity,
      phone: warehouse.phone ?? "",
    });
  };

  const reset = () => {
    setEditingId(null);
    setForm(emptyWarehouse);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingId) {
        await warehousesApi.update(editingId, form);
        showToast.success("Warehouse updated.");
      } else {
        await warehousesApi.create(form);
        showToast.success("Warehouse created.");
      }
      reset();
      await load();
    } catch (error: any) {
      showToast.error(
        error.response?.data?.message || "Unable to save warehouse.",
      );
    }
  };

  const submitTransfer = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await warehousesApi.transferStock({
        ...transfer,
        managerId: user?.userId ?? 0,
      });
      showToast.success("Stock transfer recorded.");
      setTransfer({
        fromWarehouseId: 0,
        toWarehouseId: 0,
        productId: 0,
        quantity: 0,
      });
    } catch (error: any) {
      showToast.error(
        error.response?.data?.message || "Unable to transfer stock.",
      );
    }
  };

  const filteredWarehouses = warehouses.filter((warehouse) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [warehouse.name, warehouse.location, warehouse.address]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

  const averageUtilization = warehouses.length
    ? Math.round(
        warehouses.reduce((acc, warehouse) => {
          if (!warehouse.capacity) return acc;
          return acc + (warehouse.usedCapacity / warehouse.capacity) * 100;
        }, 0) / warehouses.length,
      )
    : 0;

  const highUtilization = warehouses.filter((warehouse) => {
    if (!warehouse.capacity) return false;
    return warehouse.usedCapacity / warehouse.capacity >= 0.8;
  }).length;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Warehouses & Stock</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Warehouse setup, utilisation, and inter-warehouse transfer workflow.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoTile label="Total Warehouses" value={String(warehouses.length)} />
        <InfoTile
          label="Average Utilization"
          value={`${averageUtilization}%`}
        />
        <InfoTile
          label="High Utilization (80%+)"
          value={String(highUtilization)}
        />
        <InfoTile
          label="Transfer Operator"
          value={user?.fullName || "Current user"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle>
                {editingId ? "Update Warehouse" : "Create Warehouse"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={save} className="space-y-3">
                <input
                  className="h-11 w-full rounded-2xl border border-input/60 bg-background px-3 text-sm"
                  placeholder="Warehouse name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                />
                <input
                  className="h-11 w-full rounded-2xl border border-input/60 bg-background px-3 text-sm"
                  placeholder="Location"
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                />
                <textarea
                  className="min-h-20 w-full rounded-2xl border border-input/60 bg-background px-3 py-2 text-sm"
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="number"
                    className="h-11 rounded-2xl border border-input/60 bg-background px-3 text-sm"
                    placeholder="Manager ID"
                    value={form.managerId}
                    onChange={(e) => update("managerId", e.target.value)}
                  />
                  <input
                    type="number"
                    className="h-11 rounded-2xl border border-input/60 bg-background px-3 text-sm"
                    placeholder="Capacity"
                    value={form.capacity}
                    onChange={(e) => update("capacity", e.target.value)}
                  />
                </div>
                <input
                  className="h-11 w-full rounded-2xl border border-input/60 bg-background px-3 text-sm"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
                <div className="flex gap-2">
                  <Button>{editingId ? "Update" : "Create"}</Button>
                  {editingId && (
                    <Button type="button" variant="ghost" onClick={reset}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle>Transfer Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitTransfer} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="number"
                    className="h-11 rounded-2xl border border-input/60 bg-background px-3 text-sm"
                    placeholder="From warehouse ID"
                    value={transfer.fromWarehouseId}
                    onChange={(e) =>
                      setTransfer((v) => ({
                        ...v,
                        fromWarehouseId: Number(e.target.value),
                      }))
                    }
                  />
                  <input
                    type="number"
                    className="h-11 rounded-2xl border border-input/60 bg-background px-3 text-sm"
                    placeholder="To warehouse ID"
                    value={transfer.toWarehouseId}
                    onChange={(e) =>
                      setTransfer((v) => ({
                        ...v,
                        toWarehouseId: Number(e.target.value),
                      }))
                    }
                  />
                  <input
                    type="number"
                    className="h-11 rounded-2xl border border-input/60 bg-background px-3 text-sm"
                    placeholder="Product ID"
                    value={transfer.productId}
                    onChange={(e) =>
                      setTransfer((v) => ({
                        ...v,
                        productId: Number(e.target.value),
                      }))
                    }
                  />
                  <input
                    type="number"
                    className="h-11 rounded-2xl border border-input/60 bg-background px-3 text-sm"
                    placeholder="Quantity"
                    value={transfer.quantity}
                    onChange={(e) =>
                      setTransfer((v) => ({
                        ...v,
                        quantity: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <Button>
                  <ArrowLeftRightIcon className="h-4 w-4" /> Transfer
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Warehouse List</CardTitle>
              <input
                className="h-10 rounded-2xl border border-input/60 bg-background px-3 text-sm sm:w-72"
                placeholder="Search warehouse or location..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading warehouses...
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredWarehouses.map((warehouse) => {
                  const usedPercent = warehouse.capacity
                    ? Math.min(
                        100,
                        Math.round(
                          (warehouse.usedCapacity / warehouse.capacity) * 100,
                        ),
                      )
                    : 0;
                  return (
                    <div
                      key={warehouse.warehouseId}
                      className="rounded-2xl bg-background/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Building05Icon className="mb-3 h-5 w-5 text-primary" />
                          <p className="font-semibold">{warehouse.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {warehouse.location}
                          </p>
                        </div>
                        <button
                          className="rounded-xl p-2 hover:bg-primary/10 hover:text-primary"
                          onClick={() => edit(warehouse)}
                        >
                          <Edit02Icon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-4 h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${usedPercent}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {warehouse.usedCapacity} / {warehouse.capacity} used ·
                        Manager #{warehouse.managerId}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

const InfoTile = ({ label, value }: { label: string; value: string }) => (
  <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm">
    <CardContent className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </CardContent>
  </Card>
);
