"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Package, TrendingUp, DollarSign, ArrowRight, Receipt, ShoppingBag, Activity } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { api, isOnline } from "@/lib/api";
import { formatPrice, cx } from "@/lib/utils";
import { periodComparison, statusBreakdown, channelSplit, categoryBreakdown, productBreakdown, filterOrdersByDays, weekdayTrend } from "@/lib/analytics";
import { Donut, Legend, HBarRow, Pie, RevenueDayChart } from "./charts";
import type { Order, OrderStatus } from "@/lib/types";

type RangeKey = "7" | "30" | "90" | "all";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
  { key: "all", label: "All time" }
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  shipped: "#8b5cf6",
  delivered: "#10b981",
  cancelled: "#ef4444"
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

function Delta({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <span className={cx("inline-flex items-center gap-0.5 text-xs font-bold", up ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}

export function AdminDashboard() {
  const products = useLiveQuery(() => db.products.toArray(), [], []);
  const orders = useLiveQuery(() => db.orders.toArray(), [], []);
  const [range, setRange] = useState<RangeKey>("30");

  useEffect(() => {
    if (isOnline()) {
      api.get<Order[]>("/orders").then((r) => db.orders.bulkPut(r)).catch(() => {});
    }
  }, []);

  const filtered = useMemo(() => filterOrdersByDays(orders, range === "all" ? 0 : parseInt(range)), [orders, range]);
  const period = useMemo(() => periodComparison(orders, range === "all" ? 30 : parseInt(range)), [orders, range]);
  const statuses = useMemo(() => statusBreakdown(orders), [orders]);
  const channels = useMemo(() => channelSplit(filtered), [filtered]);
  const categories = useMemo(() => categoryBreakdown(filtered, products).slice(0, 6), [filtered, products]);
  const topProducts = useMemo(() => productBreakdown(filtered).slice(0, 5), [filtered]);
  const week = useMemo(() => weekdayTrend(orders), [orders]);

  const totalRevenue = filtered.reduce((s, o) => s + o.total, 0);
  const totalUnits = filtered.reduce((s, o) => s + o.items.reduce((x, i) => x + i.qty, 0), 0);
  const avgOrder = filtered.length ? totalRevenue / filtered.length : 0;

  const mix = useMemo(() => {
    const values = [
      { label: "Revenue", value: totalRevenue, color: "#22c55e" },
      { label: "Orders", value: filtered.length, color: "#3b82f6" },
      { label: "Units Sold", value: totalUnits, color: "#eab308" },
      { label: "Avg Order", value: avgOrder, color: "#ef4444" }
    ];
    const max = Math.max(1, ...values.map((v) => v.value));
    return values.map((v) => ({ ...v, share: v.value / max }));
  }, [filtered, totalRevenue, totalUnits, avgOrder]);

  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).sort((a, b) => a.stock - b.stock);
  const outOfStock = products.filter((p) => p.stock <= 0);

  const cards = [
    { icon: DollarSign, label: "Revenue", value: formatPrice(totalRevenue), delta: period.revenueDelta, accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40" },
    { icon: Receipt, label: "Orders", value: String(filtered.length), delta: period.ordersDelta, accent: "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/40" },
    { icon: ShoppingBag, label: "Units Sold", value: String(totalUnits), delta: period.unitsDelta, accent: "text-skyline-600 dark:text-skyline-400 bg-skyline-50 dark:bg-skyline-900/40" },
    { icon: Activity, label: "Avg. Order Value", value: formatPrice(avgOrder), delta: period.aovDelta, accent: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/40" }
  ];

  const maxCategory = categories[0]?.revenue || 1;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slateink dark:text-white">Sales Analytics</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Live insights from your local order cache — works fully offline</p>
        </div>
        <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cx("rounded-md px-3 py-1.5 text-xs font-bold transition-colors", range === r.key ? "bg-slateink text-white shadow" : "text-slate-500 dark:text-slate-400 hover:text-slateink dark:hover:text-white")}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ icon: Icon, label, value, delta, accent }) => (
          <div key={label} className="card p-5">
            <div className={`inline-flex rounded-lg p-2.5 ${accent}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 font-display text-2xl font-extrabold text-slateink dark:text-white">{value}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
              {range !== "all" && <Delta value={delta} />}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-slateink dark:text-white text-lg">Revenue by Day of Week (NGN)</h3>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
              <span className="h-0.5 w-4 bg-red-500 inline-block rounded-full" /> trend line
            </span>
          </div>
          <div className="mt-4">
            {week.every((p) => p.revenue === 0) ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <TrendingUp className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">No revenue in the last 7 days yet.</p>
              </div>
            ) : (
              <RevenueDayChart points={week.map((p) => ({ label: p.label, value: p.revenue }))} format={(n) => formatPrice(n)} />
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-slateink dark:text-white text-lg">Analytics Mix</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Each colour is one analytics metric</p>
          <div className="mt-4 flex justify-center">
            <Pie slices={mix.map((m) => ({ label: m.label, value: m.share, color: m.color }))} size={190} showLabels />
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-2">
            {mix.map((m) => (
              <li key={m.label} className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="h-3 w-3 rounded-sm shrink-0" style={{ background: m.color }} />
                {m.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="font-bold text-slateink dark:text-white text-lg">Orders by Status</h3>
          <div className="mt-4 flex items-center gap-6">
            <Donut
              slices={statuses.map((s) => ({ label: STATUS_LABELS[s.status], value: s.count, color: STATUS_COLORS[s.status] }))}
            />
            <div className="flex-1">
              <Legend
                items={statuses.map((s) => ({
                  label: STATUS_LABELS[s.status],
                  value: s.count,
                  color: STATUS_COLORS[s.status],
                  extra: s.status !== "cancelled" ? formatPrice(s.revenue) : undefined
                }))}
              />
            </div>
          </div>
          {statuses.length === 0 && (
            <p className="mt-4 text-sm text-slate-400 dark:text-slate-500 text-center">No orders yet.</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="font-bold text-slateink dark:text-white text-lg">Sales by Channel</h3>
          {channels.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">No sales in this period.</p>
          ) : (
            <div className="mt-4">
              <Donut
                size={160}
                thickness={24}
                slices={[
                  { label: "Online", value: channels.find((c) => c.channel === "online")?.revenue || 0, color: "#10b981" },
                  { label: "School", value: channels.find((c) => c.channel === "school")?.revenue || 0, color: "#6366f1" }
                ]}
              />
              <div className="mt-4">
                <Legend
                  items={[
                    { label: "Online store", value: channels.find((c) => c.channel === "online")?.count || 0, color: "#10b981", extra: formatPrice(channels.find((c) => c.channel === "online")?.revenue || 0) },
                    { label: "School / Mini-store", value: channels.find((c) => c.channel === "school")?.count || 0, color: "#6366f1", extra: formatPrice(channels.find((c) => c.channel === "school")?.revenue || 0) }
                  ]}
                />
              </div>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-slateink dark:text-white text-lg">Revenue by Category</h3>
          {categories.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">No category sales in this period.</p>
          ) : (
            <div className="mt-4 space-y-3.5">
              {categories.map((c) => (
                <HBarRow key={c.category} label={c.category} value={c.revenue} max={maxCategory} color="#8b5cf6" hint={formatPrice(c.revenue)} />
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-slateink dark:text-white text-lg">Top Products</h3>
          {topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">No products sold in this period.</p>
          ) : (
            <div className="mt-4 space-y-3.5">
              {topProducts.map((p, i) => (
                <HBarRow
                  key={p.id}
                  label={`${i + 1}. ${p.title.split(" - ")[0]}`}
                  value={p.revenue}
                  max={topProducts[0].revenue}
                  color="#f59e0b"
                  hint={`${p.units} units · ${formatPrice(p.revenue)}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slateink dark:text-white text-lg">Low-Stock Restock Alerts</h3>
            <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold px-3 py-1">
              {lowStock.length + outOfStock.length} needs restock
            </span>
          </div>
          {lowStock.length === 0 && outOfStock.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-4">All products are well stocked.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {[...outOfStock, ...lowStock].slice(0, 8).map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slateink dark:text-white">{p.title.split(" - ")[0]}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{p.category}</p>
                  </div>
                  <span
                    className={
                      p.stock <= 0
                        ? "rounded-full bg-red-100 text-red-600 text-xs font-bold px-3 py-1"
                        : "rounded-full bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1"
                    }
                  >
                    {p.stock <= 0 ? "OUT OF STOCK" : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin?tab=products" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
            Manage inventory <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-slateink dark:text-white text-lg">Recent Orders</h3>
          {orders.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-4">No orders yet. They will appear here and work offline.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {[...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6).map((o) => (
                <li key={o.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slateink dark:text-white">{o.orderNumber}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {o.customer.name || o.customer.email} · {o.customer.grade || o.channel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slateink dark:text-white">{formatPrice(o.total)}</p>
                    <p className="text-xs capitalize text-slate-400 dark:text-slate-500">{o.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin?tab=orders" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
            View all orders <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="card p-6 mt-6 bg-gradient-to-r from-slateink to-primary-900 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-skyline-400" /> Offline-First Admin Mode
            </h3>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Products, stock and orders are written to the local IndexedDB instantly. Pending changes sync automatically
              to the central cloud backend when connectivity returns.
            </p>
          </div>
          <Link href="/admin?tab=reports" className="rounded-lg bg-white text-primary-700 font-bold px-5 py-2.5 text-sm hover:bg-slate-100">
            Generate Sales Reports
          </Link>
        </div>
      </div>
    </div>
  );
}
