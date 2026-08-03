"use client";

import { useEffect, useMemo, useState } from "react";
import { FileSpreadsheet, FileText, FileDown, BarChart3 } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { api, isOnline } from "@/lib/api";
import { useToast } from "@/store/toast";
import { cx, formatPrice } from "@/lib/utils";
import { buildReportRows, exportToDocx, exportToExcel, exportToPdf } from "@/lib/reportExport";
import type { Order, ReportGranularity } from "@/lib/types";

type RangeKey = "all" | "7d" | "30d" | "90d";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" }
];

export function AdminReports() {
  const orders = useLiveQuery(() => db.orders.toArray(), [], []);
  const { toast } = useToast();
  const [granularity, setGranularity] = useState<ReportGranularity>("monthly");
  const [range, setRange] = useState<RangeKey>("all");
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | "docx" | null>(null);

  useEffect(() => {
    if (isOnline()) {
      api.get<Order[]>("/orders").then((r) => db.orders.bulkPut(r)).catch(() => {});
    }
  }, []);

  const filtered = useMemo(() => {
    let list = [...(orders || [])].filter((o) => o.status !== "cancelled");
    if (range !== "all") {
      const cutoff = Date.now() - parseInt(range) * 86400000;
      list = list.filter((o) => new Date(o.createdAt).getTime() >= cutoff);
    }
    return list;
  }, [orders, range]);

  const rows = useMemo(() => buildReportRows(filtered, granularity), [filtered, granularity]);

  const totals = useMemo(
    () => ({
      orders: rows.reduce((s, r) => s + r.orders, 0),
      units: rows.reduce((s, r) => s + r.unitsSold, 0),
      revenue: rows.reduce((s, r) => s + r.revenue, 0)
    }),
    [rows]
  );

  const topProducts = useMemo(() => {
    const map = new Map<string, { title: string; units: number; revenue: number }>();
    for (const o of filtered) {
      for (const i of o.items) {
        const e = map.get(i.productId) || { title: i.title, units: 0, revenue: 0 };
        e.units += i.qty;
        e.revenue += i.price * i.qty;
        map.set(i.productId, e);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.units - a.units).slice(0, 5);
  }, [filtered]);

  const doExport = async (kind: "xlsx" | "pdf" | "docx") => {
    setExporting(kind);
    try {
      if (kind === "xlsx") exportToExcel(rows, granularity);
      if (kind === "pdf") exportToPdf(rows, granularity);
      if (kind === "docx") await exportToDocx(rows, granularity);
      toast("Report exported successfully");
    } catch (e) {
      toast(`Export failed: ${(e as Error).message}`, "error");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slateink dark:text-white">Sales Reporting</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Generated entirely offline from the local database cache</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => doExport("xlsx")} disabled={!!exporting} className="btn-outline text-xs !text-emerald-600 dark:!text-emerald-400 !border-emerald-200 dark:!border-emerald-900 hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => doExport("pdf")} disabled={!!exporting} className="btn-outline text-xs !text-red-500 dark:!text-red-400 !border-red-200 dark:!border-red-900 hover:!bg-red-50 dark:hover:!bg-red-900/30">
            <FileText className="h-4 w-4" /> PDF
          </button>
          <button onClick={() => doExport("docx")} disabled={!!exporting} className="btn-outline text-xs !text-primary-700 dark:!text-primary-400 !border-primary-200 dark:!border-primary-800 hover:!bg-primary-50 dark:hover:!bg-primary-900/30">
            <FileDown className="h-4 w-4" /> Word
          </button>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Granularity:</span>
            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
              {(["daily", "monthly", "quarterly", "yearly"] as ReportGranularity[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={cx("rounded-md px-3 py-1.5 text-xs font-bold capitalize transition-colors", granularity === g ? "bg-primary-600 text-white" : "text-slate-500 dark:text-slate-400 hover:text-slateink dark:hover:text-white")}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Range:</span>
            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  className={cx("rounded-md px-3 py-1.5 text-xs font-bold transition-colors", range === r.key ? "bg-slateink text-white" : "text-slate-500 dark:text-slate-400 hover:text-slateink dark:hover:text-white")}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Orders</p>
            <p className="font-display text-xl font-extrabold text-slateink dark:text-white">{totals.orders}</p>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Units Sold</p>
            <p className="font-display text-xl font-extrabold text-slateink dark:text-white">{totals.units}</p>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Revenue</p>
            <p className="font-display text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatPrice(totals.revenue)}</p>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[36rem]">
          <thead>
            <tr>
              <th className="table-th">Period</th>
              <th className="table-th">Orders</th>
              <th className="table-th">Units Sold</th>
              <th className="table-th">Revenue (USD)</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="table-td text-center text-slate-400 dark:text-slate-500 py-10">No sales data for this period.</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.period} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="table-td font-semibold text-slateink dark:text-white">{r.period}</td>
                  <td className="table-td">{r.orders}</td>
                  <td className="table-td">{r.unitsSold}</td>
                  <td className="table-td font-bold">{formatPrice(r.revenue)}</td>
                </tr>
              ))
            )}
            {rows.length > 0 && (
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <td className="table-td font-extrabold text-slateink dark:text-white">TOTAL</td>
                <td className="table-td font-extrabold">{totals.orders}</td>
                <td className="table-td font-extrabold">{totals.units}</td>
                <td className="table-td font-extrabold text-primary-700 dark:text-primary-400">{formatPrice(totals.revenue)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {topProducts.length > 0 && (
        <div className="card p-6 mt-6">
          <h3 className="font-bold text-slateink dark:text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary-600" /> Top Products by Units Sold
          </h3>
          <div className="mt-4 space-y-3">
            {topProducts.map((p, i) => {
              const max = topProducts[0].units;
              return (
                <div key={p.title}>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slateink dark:text-white truncate max-w-[24rem]">{i + 1}. {p.title.split(" - ")[0]}</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {p.units} sold · {formatPrice(p.revenue)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary-600 to-skyline-500" style={{ width: `${(p.units / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
