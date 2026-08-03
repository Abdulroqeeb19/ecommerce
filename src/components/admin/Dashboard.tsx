"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Package, TrendingUp, AlertTriangle, Boxes, DollarSign, ArrowRight } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

export function AdminDashboard() {
  const products = useLiveQuery(() => db.products.toArray(), [], []);
  const orders = useLiveQuery(() => db.orders.toArray(), [], []);

  const stats = useMemo(() => {
    const totalUnitsSold = orders.reduce((s, o) => s + o.items.reduce((x, i) => x + i.qty, 0), 0);
    const remainingStock = products.reduce((s, p) => s + p.stock, 0);
    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).sort((a, b) => a.stock - b.stock);
    const outOfStock = products.filter((p) => p.stock <= 0);
    return { totalUnitsSold, remainingStock, revenue, lowStock, outOfStock };
  }, [products, orders]);

  const cards = [
    { icon: TrendingUp, label: "Total Items Sold", value: String(stats.totalUnitsSold), accent: "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/40" },
    { icon: Boxes, label: "Remaining Stock", value: String(stats.remainingStock), accent: "text-skyline-600 dark:text-skyline-400 bg-skyline-50 dark:bg-skyline-900/40" },
    { icon: DollarSign, label: "Revenue", value: formatPrice(stats.revenue), accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40" },
    { icon: AlertTriangle, label: "Restock Alerts", value: String(stats.lowStock.length + stats.outOfStock.length), accent: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/40" }
  ];

  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ icon: Icon, label, value, accent }) => (
          <div key={label} className="card p-5">
            <div className={`inline-flex rounded-lg p-2.5 ${accent}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 font-display text-2xl font-extrabold text-slateink dark:text-white">{value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slateink dark:text-white text-lg">Low-Stock Restock Alerts</h3>
            <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold px-3 py-1">
              {stats.lowStock.length + stats.outOfStock.length} needs restock
            </span>
          </div>
          {stats.lowStock.length === 0 && stats.outOfStock.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-4">All products are well stocked.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {[...stats.outOfStock, ...stats.lowStock].slice(0, 8).map((p) => (
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
