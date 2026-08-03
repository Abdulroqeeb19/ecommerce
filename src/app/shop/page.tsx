"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { useProducts } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { cx, formatPrice } from "@/lib/utils";

type SortKey = "featured" | "price-asc" | "price-desc" | "rating" | "newest";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "rating", label: "Top Rated" }
];

function ShopContent() {
  const params = useSearchParams();
  const { products } = useProducts();

  const [search, setSearch] = useState(params.get("q") || "");
  const [category, setCategory] = useState<string>(params.get("category") || "All");
  const [sort, setSort] = useState<SortKey>("featured");
  const [maxPrice, setMaxPrice] = useState<number>(2000);

  const filtered = useMemo(() => {
    let list = products.filter((p) => !p.miniStore);
    if (category !== "All") list = list.filter((p) => p.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.brand.toLowerCase().includes(q)
      );
    }
    list = list.filter((p) => p.price <= maxPrice);

    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        break;
      default:
        list.sort((a, b) => Number(b.featured || false) - Number(a.featured || false));
    }
    return list;
  }, [products, category, search, sort, maxPrice]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slateink dark:text-white">Shop All Electronics</h1>
        <div className="mt-2 h-1 w-14 rounded-full bg-primary-600" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          {category === "All" ? "Browse the full Gadget Hub catalogue." : `Showing products in ${category}.`}
        </p>
      </div>

      <div className="grid lg:grid-cols-[15rem_1fr] gap-8">
        <aside className="space-y-6">
          <div className="card p-5">
            <h3 className="flex items-center gap-2 font-bold text-sm text-slateink dark:text-white mb-3">
              <SlidersHorizontal className="h-4 w-4 text-primary-600" /> Filters
            </h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="input pl-9"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slateink" aria-label="Clear search">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="label">Category</p>
            <div className="space-y-1">
              {["All", ...CATEGORIES].map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cx(
                    "w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors",
                    category === c ? "bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 font-semibold" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <p className="label">Max price: {formatPrice(maxPrice)}</p>
              <input
                type="range"
                min={50}
                max={2000}
                step={50}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary-600"
              />
            </div>
            <button onClick={() => { setSearch(""); setCategory("All"); setSort("featured"); setMaxPrice(2000); }} className="mt-4 text-xs font-semibold text-primary-600 hover:text-primary-700">
              Reset all filters
            </button>
          </div>
        </aside>

        <div>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-bold text-slateink dark:text-white">{filtered.length}</span> product{filtered.length !== 1 && "s"} found
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">Sort by:</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="input w-auto py-2">
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="card p-16 text-center dark:text-slate-300">
              <p className="text-slate-500 dark:text-slate-400">No products match your filters.</p>
              <button
                onClick={() => { setSearch(""); setCategory("All"); setMaxPrice(2000); }}
                className="btn-primary mt-4"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-20 text-center text-slate-500">Loading shop…</div>}>
      <ShopContent />
    </Suspense>
  );
}
