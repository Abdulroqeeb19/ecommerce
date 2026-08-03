"use client";

import { useEffect, useState } from "react";
import { RefreshCw, CheckCircle2, WifiOff, Download } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, queueOperation } from "@/lib/db";
import { api, isOnline } from "@/lib/api";
import { useToast } from "@/store/toast";
import { cx, formatDateTime, formatPrice } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";

const STATUS_OPTIONS: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  processing: "bg-skyline-50 dark:bg-skyline-900/40 text-skyline-600 dark:text-skyline-300",
  shipped: "bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300",
  delivered: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  cancelled: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300"
};

export function AdminOrders() {
  const orders = useLiveQuery(() => db.orders.toArray(), [], []);
  const { toast } = useToast();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOnline()) {
      api
        .get<Order[]>("/orders")
        .then((remote) => db.orders.bulkPut(remote))
        .catch(() => {});
    }
  }, []);

  const sorted = [...(orders || [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const updateStatus = async (o: Order, status: OrderStatus) => {
    const updated: Order = { ...o, status, updatedAt: new Date().toISOString() };
    await db.orders.put(updated);
    toast("Status updated locally");
    if (isOnline()) {
      try {
        await api.put(`/orders/${o.id}`, { status });
        toast("Status synced to cloud");
      } catch {
        await queueOperation("update-order", { id: o.id, status });
      }
    } else {
      await queueOperation("update-order", { id: o.id, status });
    }
  };

  const pullOrders = async () => {
    setBusy(true);
    const remote = await api.get<Order[]>("/orders");
    await db.orders.bulkPut(remote);
    setBusy(false);
    toast(`Pulled ${remote.length} orders from cloud`);
  };

  const exportCsv = () => {
    const header = "Order #,Date,Customer,Grade,Items,Total,Status,Source\n";
    const rows = sorted
      .map((o) => {
        const items = o.items.map((i) => `${i.qty}x ${i.title}`).join(" | ");
        return [o.orderNumber, o.createdAt, o.customer.name || o.customer.email, o.customer.grade || "", `"${items}"`, o.total, o.status, o.source].join(",");
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gadget-hub-orders-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slateink dark:text-white">Orders and Sales</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{sorted.length} orders recorded</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={pullOrders} disabled={busy} className="btn-outline text-xs">
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Pull from Cloud
          </button>
          <button onClick={exportCsv} className="btn-primary text-xs">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="card p-16 text-center text-slate-500 dark:text-slate-400">No orders yet.</div>
      ) : (
        <div className="space-y-3">
          {sorted.map((o) => (
            <div key={o.id} className="card overflow-hidden">
              <div className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={cx("rounded-full px-2.5 py-0.5 text-xs font-bold uppercase", o.channel === "school" ? "bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300")}>
                      {o.channel}
                    </span>
                    <div>
                      <p className="font-bold text-slateink dark:text-white">{o.orderNumber}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(o.createdAt)} · {o.customer.name || o.customer.email}{o.customer.grade ? ` · ${o.customer.grade}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-extrabold text-primary-700 dark:text-primary-400">{formatPrice(o.total)}</span>
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o, e.target.value as OrderStatus)}
                      className={cx("rounded-full px-3 py-1.5 text-xs font-bold uppercase outline-none cursor-pointer border-0", STATUS_STYLES[o.status])}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <span className="flex items-center gap-1 text-[11px] font-semibold">
                      {o.synced === false ? (
                        <span className="text-amber-500 inline-flex items-center gap-1"><WifiOff className="h-3.5 w-3.5" /> Local</span>
                      ) : (
                        <span className="text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Cloud</span>
                      )}
                    </span>
                  </div>
                </div>
                <button onClick={() => setExpanded(expanded === o.id ? null : o.id)} className="mt-3 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                  {expanded === o.id ? "Hide details" : "View details"}
                </button>
                {expanded === o.id && (
                  <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-3 grid sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 mb-2">Items</p>
                      {o.items.map((i) => (
                        <p key={i.productId} className="text-sm text-slate-600 dark:text-slate-300 flex justify-between py-0.5">
                          <span>{i.qty} × {i.title}</span>
                          <span className="font-semibold">{formatPrice(i.price * i.qty)}</span>
                        </p>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 mb-2">Customer Info</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Name: {o.customer.name || "—"}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Email: {o.customer.email || "—"}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Phone: {o.customer.phone || "—"}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Address: {o.customer.address || o.customer.school || "—"}</p>
                      {o.customer.note && <p className="text-sm text-slate-600 dark:text-slate-300">Note: {o.customer.note}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
