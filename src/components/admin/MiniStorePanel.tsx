"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Plus, Minus, Package, ShoppingCart, CheckCircle2, ShieldCheck } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, queueOperation } from "@/lib/db";
import { api, isOnline } from "@/lib/api";
import { useToast } from "@/store/toast";
import { cx, formatDateTime, formatNaira } from "@/lib/utils";
import type { Order, OrderStatus, Product, User } from "@/lib/types";
import { OrderingScheduleEditor } from "./OrderingScheduleEditor";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const STATUS_OPTIONS: OrderStatus[] = ["pending", "processing", "delivered", "cancelled"];

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  processing: "bg-skyline-50 dark:bg-skyline-900/40 text-skyline-600 dark:text-skyline-300",
  shipped: "bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300",
  delivered: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  cancelled: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300"
};

export function MiniStorePanel() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [busy, setBusy] = useState(false);
  const [managers, setManagers] = useState<User[]>([]);
  const [schedule, setSchedule] = useState<Record<string, string>>({});
  const [whatsapp, setWhatsapp] = useState<Record<string, string>>({});
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const localOrders = useLiveQuery(() => db.orders.toArray(), [], []);
  const mergedOrders = useMemo(() => {
    const map = new Map<string, Order>();
    for (const o of orders) map.set(o.id, o);
    for (const o of localOrders || []) if (!map.has(o.id)) map.set(o.id, o);
    return [...map.values()]
      .filter((o) => o.channel === "school")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [orders, localOrders]);

  const load = async () => {
    setBusy(true);
    try {
      if (isOnline()) {
        const [remoteOrders, remoteProducts] = await Promise.all([
          api.get<Order[]>("/orders"),
          api.get<Product[]>("/products")
        ]);
        const mini = remoteProducts.filter((p) => p.miniStore);
        setOrders(remoteOrders);
        setProducts(mini);
        await db.orders.bulkPut(remoteOrders);
        await db.products.bulkPut(mini).catch(() => {});
      }
      toast("Mini-store data refreshed");
    } catch {
      toast("Could not reach the server. Showing locally saved data.", "info");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async load on mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api
      .get<{ schedule: Record<string, string>; managers: User[]; whatsapp: Record<string, string> }>("/settings/manager-schedule")
      .then((res) => {
        if (res && typeof res.schedule === "object") setSchedule(res.schedule);
        if (Array.isArray(res.managers)) setManagers(res.managers);
        if (res && typeof res.whatsapp === "object") setWhatsapp(res.whatsapp);
      })
      .catch(() => {});
  }, []);

  const saveSchedule = async () => {
    setScheduleSaving(true);
    try {
      const res = await api.put<{ schedule: Record<string, string>; whatsapp: Record<string, string> }>("/settings/manager-schedule", {
        schedule,
        whatsapp
      });
      if (res && typeof res.schedule === "object") setSchedule(res.schedule);
      if (res && typeof res.whatsapp === "object") setWhatsapp(res.whatsapp);
      toast("Manager schedule saved");
    } catch {
      toast("Could not save the manager schedule.", "error");
    } finally {
      setScheduleSaving(false);
    }
  };

  const updateStatus = async (o: Order, status: OrderStatus) => {
    const updated: Order = { ...o, status, updatedAt: new Date().toISOString() };
    setOrders((prev) => prev.map((x) => (x.id === o.id ? updated : x)));
    await db.orders.put(updated).catch(() => {});
    if (isOnline()) {
      try {
        await api.put(`/orders/${o.id}`, { status });
        toast(`${o.orderNumber} → ${status}`);
      } catch {
        await queueOperation("update-order", { id: o.id, status });
      }
    } else {
      await queueOperation("update-order", { id: o.id, status });
      toast("Offline — status saved locally, will sync", "info");
    }
  };

  const changeStock = async (p: Product, delta: number) => {
    const next = Math.max(0, p.stock + delta);
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, stock: next } : x)));
    await db.products.put({ ...p, stock: next }).catch(() => {});
    if (isOnline()) {
      try {
        await api.put(`/products/${p.id}/stock`, { stock: next });
      } catch {
        await queueOperation("update-stock", { id: p.id, stock: next });
      }
    } else {
      await queueOperation("update-stock", { id: p.id, stock: next });
    }
  };

  const pendingCount = mergedOrders.filter((o) => o.status === "pending").length;
  const lowStock = products.filter((p) => p.stock <= 5);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slateink dark:text-white">Mini-Store Manager</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Fulfil school orders and manage stock for mini-store products.
          </p>
        </div>
        <button onClick={load} disabled={busy} className="btn-outline text-xs">
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Pending Orders</p>
          <p className="font-display text-2xl font-extrabold text-amber-500">{pendingCount}</p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Mini-Store Products</p>
          <p className="font-display text-2xl font-extrabold text-slateink dark:text-white">{products.length}</p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Low Stock (≤5)</p>
          <p className={cx("font-display text-2xl font-extrabold", lowStock.length ? "text-red-500" : "text-emerald-500")}>{lowStock.length}</p>
        </div>
      </div>

      {/* Ordering days per grade */}
      <OrderingScheduleEditor />

      {/* Manager duty schedule */}
      <div className="mb-6 rounded-2xl border border-skyline-200 bg-skyline-50 dark:bg-skyline-900/20 dark:border-skyline-800 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="font-bold text-slateink dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-skyline-600" /> Manager Duty Allotment
          </h3>
          <button onClick={saveSchedule} disabled={scheduleSaving} className="btn-outline !py-2 text-xs">
            {scheduleSaving ? "Saving..." : "Save schedule"}
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Assign a manager to each day of the week. Order notifications (including student notes) received on a day are
          routed to that day&apos;s allotted manager via WhatsApp, email and the other configured channels.
        </p>
        {managers.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 py-4">No manager accounts found. Create manager users to assign duty days.</p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {WEEKDAYS.map((day, idx) => {
                const key = String(idx);
                const current = schedule[key] || "";
                return (
                  <div key={day} className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                    <label className="label">{day}</label>
                    <select
                      value={current}
                      onChange={(e) => setSchedule((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="input w-full py-2 text-sm"
                    >
                      <option value="">Unassigned</option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Manager WhatsApp numbers (for order alerts)</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {managers.map((m) => (
                  <div key={m.id} className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                    <label className="label">{m.name}</label>
                    <input
                      className="input w-full py-2 text-sm"
                      value={whatsapp[m.id] || ""}
                      onChange={(e) => setWhatsapp((prev) => ({ ...prev, [m.id]: e.target.value }))}
                      placeholder="+2348012345678"
                      inputMode="tel"
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders */}
        <div className="card p-5">
          <h3 className="font-bold text-slateink dark:text-white flex items-center gap-2 mb-3">
            <ShoppingCart className="h-5 w-5 text-primary-600" /> School Orders ({mergedOrders.length})
          </h3>
          {mergedOrders.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">No school orders yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-[28rem] overflow-y-auto pr-1">
              {mergedOrders.map((o) => (
                <div key={o.id} className="rounded-lg border border-slate-100 dark:border-slate-800 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slateink dark:text-white">{o.orderNumber}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {o.customer.name} · {o.customer.grade || "—"} · {formatDateTime(o.createdAt)}
                      </p>
                    </div>
                    <span className="font-display font-extrabold text-primary-700 dark:text-primary-400 text-sm">{formatNaira(o.total)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {o.items.map((i) => `${i.qty}× ${i.title.split(" - ")[0]}`).join(", ")}
                      </p>
                      {o.customer.note && (
                        <p className="mt-1.5 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 px-2 py-1 text-xs text-amber-700 dark:text-amber-300">
                          📝 {o.customer.note}
                        </p>
                      )}
                    </div>
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o, e.target.value as OrderStatus)}
                      className={cx("rounded-full px-2.5 py-1 text-xs font-bold uppercase outline-none cursor-pointer border-0", STATUS_STYLES[o.status])}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock editor */}
        <div className="card p-5">
          <h3 className="font-bold text-slateink dark:text-white flex items-center gap-2 mb-1">
            <Package className="h-5 w-5 text-primary-600" /> Mini-Store Stock &amp; Pricing ({products.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Admin follow-up only: cost price, selling price and expected gain per item. Students only see the item name, type and selling unit price.
          </p>
          {products.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">No mini-store products.</p>
          ) : (
            <div className="overflow-x-auto max-h-[32rem] overflow-y-auto">
              <table className="w-full min-w-[46rem] text-xs">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                  <tr className="text-left text-slate-500 dark:text-slate-400 uppercase text-[10px]">
                    <th className="py-2 pr-3">Item</th>
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2 pr-3">Cost (Qty × Unit)</th>
                    <th className="py-2 pr-3">Selling (Pcs × Unit)</th>
                    <th className="py-2 pr-3">Expected Gain</th>
                    <th className="py-2 pr-3">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-3">
                        <p className="font-semibold text-slateink dark:text-white whitespace-nowrap">{p.title}</p>
                        <p className="text-slate-400 dark:text-slate-500">{[p.type, p.measure].filter(Boolean).join(" · ") || "—"}</p>
                      </td>
                      <td className="py-2 pr-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{p.category}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <span className="font-semibold text-slateink dark:text-white">{formatNaira(p.costAmount ?? 0)}</span>
                        <span className="text-slate-400 dark:text-slate-500"> ({p.costQty ?? 0} × {formatNaira(p.costUnitPrice ?? 0)})</span>
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatNaira(p.sellAmount ?? 0)}</span>
                        <span className="text-slate-400 dark:text-slate-500"> ({p.sellPcs ?? 0} × {formatNaira(p.sellUnitPrice ?? 0)})</span>
                      </td>
                      <td className={cx("py-2 pr-3 font-bold whitespace-nowrap", (p.profit ?? 0) > 0 ? "text-primary-700 dark:text-primary-400" : "text-red-500")}>
                        {formatNaira(p.profit ?? 0)}
                      </td>
                      <td className="py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => changeStock(p, -1)} className="rounded bg-slate-100 dark:bg-slate-800 p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Decrease stock">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className={cx("text-sm font-bold w-8 text-center", p.stock <= 5 ? "text-red-500" : "text-slateink dark:text-white")}>{p.stock}</span>
                          <button onClick={() => changeStock(p, 1)} className="rounded bg-primary-100 p-1 text-primary-700 hover:bg-primary-200" aria-label="Increase stock">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {!isOnline() && (
        <p className="mt-5 flex items-center gap-1.5 text-xs text-amber-600">
          <CheckCircle2 className="h-3.5 w-3.5" /> Offline — changes saved locally and will sync when reconnected.
        </p>
      )}
    </div>
  );
}