"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Zap, ArrowRight, PackageCheck } from "lucide-react";
import { useProducts } from "@/lib/catalog";
import { SHOP_CATEGORIES } from "@/lib/catalogCategories";
import { CatalogImage } from "./CatalogImage";

const CATEGORY_ORDER: { label: string; href: string; badge: string }[] = SHOP_CATEGORIES.map((c) => ({
  label: c.name,
  href: c.href,
  badge: c.name
}));

const MAX_PER_CATEGORY = 8;

export function InStockTicker() {
  const { products } = useProducts();

  // Live data: the latest in-stock products per category, using the most
  // recently uploaded images. Auto-refreshes via the background catalog sync.
  const groups = useMemo(() => {
    return CATEGORY_ORDER.map((g) => ({
      label: g.label,
      href: g.href,
      badge: g.badge,
      items: (products || [])
        .filter((p) => !p.miniStore && p.category === g.label && p.stock > 0 && p.image)
        .slice(0, MAX_PER_CATEGORY)
    })).filter((g) => g.items.length > 0);
  }, [products]);

  const count = useMemo(() => groups.reduce((n, g) => n + g.items.length, 0), [groups]);

  if (count === 0) return null;

  return (
    <section className="mt-14">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slateink dark:text-white flex items-center gap-2">
            <Zap className="h-6 w-6 text-amber-500 animate-pulse" /> Hot Right Now <span className="text-primary-600">· In Stock</span>
          </h2>
          <div className="mt-2 h-1 w-16 rounded-full" style={{ background: "var(--gold-gradient)" }} />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Home Essentials, Babies Wears and Electrical Fittings streaming by — hover to pause, click to shop.</p>
        </div>
        <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 flex-shrink-0">
          View all in stock <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 py-4">
        <div className="flex w-max animate-marquee [animation-duration:45s] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {[0, 1].map((i) => (
            <div key={i} className="flex shrink-0 gap-4 pr-4">
              {groups.map((g) =>
                g.items.map((item) => (
                  <Link
                    key={`${i}-${item.id}`}
                    href={g.href}
                    className="group/card w-56 shrink-0 flex items-center gap-3 rounded-xl bg-slatebg dark:bg-slate-800 border border-slate-200 dark:border-navy-700 p-3 transition-all hover:border-primary-400 hover:shadow-hover hover:-translate-y-0.5"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white dark:bg-navy-900">
                      <CatalogImage src={item.image} alt={item.title} className="h-full w-full object-contain transition-transform duration-500 group-hover/card:scale-110" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slateink dark:text-white group-hover/card:text-primary-700 dark:group-hover/card:text-primary-400">{item.title}</p>
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-gold-50 dark:bg-gold-900/40 text-gold-700 dark:text-gold-300 px-2 py-0.5 text-[10px] font-bold">
                        {g.badge}
                      </span>
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-brand-green">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-green" /> In stock
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-white dark:from-navy-800 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-white dark:from-navy-800 to-transparent" />
      </div>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <PackageCheck className="h-3.5 w-3.5" /> {count} items ready to ship now
      </p>
    </section>
  );
}