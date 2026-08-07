"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Plus, Minus, Package, ShoppingCart, CheckCircle2, Unlock, Lock } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, queueOperation } from "@/lib/db";
import { api, isOnline } from "@/lib/api";
import { useToast } from "@/store/toast";
import { cx, formatDateTime, formatPrice } from "@/lib/utils";
import type { EmergencyOpenWindow } from "@/lib/utils";
import { useAuth } from "@/store/auth";
import type { Order, OrderStatus, Product } from "@/lib/types";

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
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [busy, setBusy] = useState(false);
  const [emergencyWindows, setEmergencyWindows] = useState<EmergencyOpenWindow[]>([]);
  const [emerGrade, setEmerGrade] = useState<string>("ALL");
  const [emerUntil, setEmerUntil] = useState<string>("");
  const [emerNote, setEmerNote] = useState<string>("");
  const [emerSaving, setEmerSaving] = useState(false);

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
      .get<EmergencyOpenWindow[]>("/settings/store-open")
      .then((list) => {
        if (Array.isArray(list)) setEmergencyWindows(list);
      })
      .catch(() => {});
  }, []);

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
  const emergencyOpen = emergencyWindows.length > 0;

  const openEmergency = async () => {
    if (!emerUntil) {
      toast("Please set the end date for the emergency window", "error");
      return;
    }
    setEmerSaving(true);
    try {
      const next = await api.put<EmergencyOpenWindow[]>("/settings/store-open", {
        grade: emerGrade,
        until: emerUntil,
        note: emerNote,
        openedBy: user?.name
      });
      if (Array.isArray(next)) setEmergencyWindows(next);
      toast("Store opened for emergency ordering");
      setEmerNote("");
    } catch {
      toast("Could not open the store right now. Please try again.", "error");
    } finally {
      setEmerSaving(false);
    }
  };

  const closeEmergency = async (grade: string) => {
    try {
      const next = await api.del<EmergencyOpenWindow[]>(`/settings/store-open?grade=${encodeURIComponent(grade)}`);
      if (Array.isArray(next)) setEmergencyWindows(next);
      toast("Store closed again");
    } catch {
      toast("Could not close the store right now.", "error");
    }
  };

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

      {/* Emergency opening */}
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="font-bold text-slateink dark:text-white flex items-center gap-2">
            {emergencyWindows.length ? <Unlock className="h-5 w-5 text-amber-600" /> : <Lock className="h-5 w-5 text-amber-600" />}
            Emergency Ordering Window
          </h3>
          <span className={cx("rounded-full px-3 py-1 text-xs font-bold uppercase", emergencyOpen ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300")}>
            {emergencyOpen ? `${emergencyWindows.length} active` : "Closed"}
          </span>
        </div>
        <p className="text-xs text-amber-700 dark:text-amber-300 text-sm mt-1">
          Open the mini-store on a day outside the usual schedule so students who missed their allotted ordering day
          — due to engagements, meetings, or parent, guardian or personnel visits — can still place their orders.
        </p>
        {emergencyWindows.map((w) => (
          <div key={w.grade} className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 p-3 text-sm">
            <div className="min-w-0">
              <p className="font-bold text-slateink dark:text-white">{w.grade === "ALL" ? "All grades" : w.grade}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Open until <span className="font-semibold">{formatDateTime(w.until)}</span>
                {w.note ? ` · ${w.note}` : ""}
              </p>
            </div>
            <button onClick={() => closeEmergency(w.grade)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/30">
              Close now
            </button>
          </div>
        ))}
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Grade</label>
            <select value={emerGrade} onChange={(e) => setEmerGrade(e.target.value)} className="input w-full py-2 text-sm">
              <option value="ALL">All grades</option>
              <option value="JSS1">JSS1</option>
              <option value="JSS2">JSS2</option>
              <option value="JSS3">JSS3</option>
            </select>
          </div>
          <div>
            <label className="label">Close on (date & time)</label>
            <input type="datetime-local" value={emerUntil} onChange={(e) => setEmerUntil(e.target.value)} className="input w-full py-2 text-sm" />
          </div>
          <div>
            <label className="label">Reason (optional)</label>
            <input value={emerNote} onChange={(e) => setEmerNote(e.target.value)} placeholder="e.g. Make-up day for missed orders" className="input w-full py-2 text-sm" />
          </div>
        </div>
        <button onClick={openEmergency} disabled={emerSaving} className="btn-primary mt-4 !py-2.5 text-sm">
          {emerSaving ? "Opening store..." : "Open store now"}
        </button>
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
                    <span className="font-display font-extrabold text-primary-700 dark:text-primary-400 text-sm">{formatPrice(o.total)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {o.items.map((i) => `${i.qty}× ${i.title.split(" - ")[0]}`).join(", ")}
                      </p>
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
          <h3 className="font-bold text-slateink dark:text-white flex items-center gap-2 mb-3">
            <Package className="h-5 w-5 text-primary-600" /> Mini-Store Stock ({products.length})
          </h3>
          {products.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">No mini-store products.</p>
          ) : (
            <div className="space-y-2.5 max-h-[28rem] overflow-y-auto pr-1">
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 dark:border-slate-800 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slateink dark:text-white truncate">{p.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{p.category} · {formatPrice(p.price)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => changeStock(p, -1)} className="rounded bg-slate-100 dark:bg-slate-800 p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Decrease stock">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className={cx("text-sm font-bold w-8 text-center", p.stock <= 5 ? "text-red-500" : "text-slateink dark:text-white")}>{p.stock}</span>
                    <button onClick={() => changeStock(p, 1)} className="rounded bg-primary-100 p-1 text-primary-700 hover:bg-primary-200" aria-label="Increase stock">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
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