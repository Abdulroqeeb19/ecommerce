"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useProducts } from "@/lib/catalog";
import { QUICK_FILTER_TABS } from "@/lib/data";
import { ProductCard } from "./ProductCard";
import { cx } from "@/lib/utils";

export function FeaturedProducts() {
  const { products } = useProducts();
  const [tab, setTab] = useState<(typeof QUICK_FILTER_TABS)[number]>("All");

  const featured = useMemo(
    () => products.filter((p) => p.featured || p.badge).slice(0, 12),
    [products]
  );

  const visible = useMemo(
    () =>
      tab === "All" ? featured : featured.filter((p) => (p.group ?? "") === tab).slice(0, 8),
    [featured, tab]
  );

  return (
    <section className="mt-14">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slateink dark:text-white">Featured Tech and Gadgets</h2>
          <div className="mt-2 h-1 w-16 rounded-full bg-primary-600" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {QUICK_FILTER_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cx(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                tab === t ? "bg-primary-600 text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary-300"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          No products found in this filter yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-lg border-2 border-primary-600 text-primary-700 dark:text-primary-400 font-bold px-8 py-3 text-sm hover:bg-primary-600 hover:text-white transition-colors"
        >
          View Full Catalogue <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
