"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Zap, ArrowRight, PackageCheck } from "lucide-react";
import { useProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";
import { ProductImage } from "./ProductImage";

export function InStockTicker() {
  const { products } = useProducts();

  const inStock = useMemo(() => products.filter((p) => p.stock > 0).slice(0, 10), [products]);

  if (inStock.length === 0) return null;

  const card = (p: (typeof inStock)[number]) => (
    <Link
      key={p.id}
      href={`/product/${p.slug}`}
      className="group w-60 shrink-0 flex items-center gap-3 rounded-xl bg-slatebg dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 transition-all hover:border-primary-400 hover:shadow-hover hover:-translate-y-0.5"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white dark:bg-slate-900">
        <ProductImage src={p.image} alt={p.title} className="h-full w-full transition-transform duration-500 group-hover:scale-110" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-slateink dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400">{p.title}</p>
        <p className="mt-0.5 font-display text-sm font-extrabold text-primary-700 dark:text-primary-400">{formatPrice(p.price)}</p>
        <span className={`mt-1 inline-flex items-center gap-1 text-[10px] font-bold ${p.stock <= 10 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${p.stock <= 10 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
          {p.stock <= 10 ? `${p.stock} left` : "In stock"}
        </span>
      </div>
    </Link>
  );

  return (
    <section className="mt-14">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slateink dark:text-white flex items-center gap-2">
            <Zap className="h-6 w-6 text-amber-500 animate-pulse" /> Hot Right Now <span className="text-primary-600">· In Stock</span>
          </h2>
          <div className="mt-2 h-1 w-16 rounded-full bg-primary-600" />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Ready-to-ship items streaming by — hover to pause, click to shop.</p>
        </div>
        <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 flex-shrink-0">
          View all in stock <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4">
        <div className="flex w-max animate-marquee [animation-duration:45s] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {[0, 1].map((i) => (
            <div key={i} className="flex shrink-0 gap-4 pr-4">
              {inStock.map(card)}
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-white dark:from-slate-900 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-white dark:from-slate-900 to-transparent" />
      </div>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <PackageCheck className="h-3.5 w-3.5" /> {inStock.length} products ready to ship now
      </p>
    </section>
  );
}
