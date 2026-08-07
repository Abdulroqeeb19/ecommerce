"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Search, X, MessageCircle, Send } from "lucide-react";
import { useProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { cx, formatPrice } from "@/lib/utils";
import { BRAND_NAME, CATALOG_ITEMS, whatsappLink } from "@/lib/brand";
import { CATALOG_CATEGORY_KEYS } from "@/lib/catalogCategories";
import { api } from "@/lib/api";
import type { CatalogItem } from "@/lib/types";

type SortKey = "featured" | "price-asc" | "price-desc" | "rating" | "newest";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "rating", label: "Top Rated" }
];

const CATEGORY_FILTERS = ["All", "Babies Wears", "Electrical Materials and Fittings", "Kitchen Utensils"];

const RATING_FILTERS = [
  { value: 0, label: "Any rating" },
  { value: 3, label: "3+ stars" },
  { value: 4, label: "4+ stars" },
  { value: 4.5, label: "4.5+ stars" }
];

function OrderOnWhatsApp({ item }: { item: CatalogItem }) {
  const [open, setOpen] = useState(false);
  const [need, setNeed] = useState("");

  const redirect = (e: React.FormEvent) => {
    e.preventDefault();
    const productLine = `${item.name} (${item.category})`;
    const message = need.trim()
      ? `Hello ${BRAND_NAME},\n\nI am interested in: ${productLine}.\n\nWhat I need help with / problem to be solved:\n${need.trim()}\n\nPlease advise. Thank you.`
      : `Hello ${BRAND_NAME},\n\nI am interested in: ${productLine}.\n\nPlease help me with this product. Thank you.`;
    window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
    setOpen(false);
    setNeed("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 btn-primary !py-2 text-sm"
      >
        <MessageCircle className="h-4 w-4" /> Order on WhatsApp
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-navy-800 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display font-extrabold text-lg text-slateink dark:text-white">Order on WhatsApp</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Tell us what you need — the message opens straight in the owner&apos;s WhatsApp so it is seen directly.
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slateink" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Item</p>
              <p className="font-bold text-slateink dark:text-white">{item.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.category}</p>
            </div>

            <form onSubmit={redirect} className="mt-4 space-y-3">
              <div>
                <label className="label">What problem do you need solved? (recommended)</label>
                <textarea
                  value={need}
                  onChange={(e) => setNeed(e.target.value)}
                  placeholder="Describe the problem or need the item must solve, so the owner sees it directly. Include quantity or size if you know it."
                  rows={3}
                  className="input w-full py-2 text-sm resize-none"
                />
              </div>
              <button type="submit" className="btn-primary w-full !py-2.5 text-sm">
                <Send className="h-4 w-4" /> Continue to WhatsApp
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function CatalogGrid({ category, items }: { category: string; items: CatalogItem[] }) {
  const keys = CATALOG_CATEGORY_KEYS[category] || [];
  const visible = items.filter((i) => i.active && keys.includes(i.category));
  if (visible.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
      {visible.map((item) => (
        <div key={item.id || item.name} className="card group overflow-hidden text-center">
          <div className="relative aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <Image
              src={item.image}
              alt={item.name}
              width={380}
              height={380}
              className="h-full w-full object-contain transition-transform group-hover:scale-105"
            />
          </div>
          <div className="p-4">
            <p className="font-bold uppercase tracking-wide text-slateink dark:text-white">{item.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.category}</p>
            <OrderOnWhatsApp item={item} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ShopContent() {
  const params = useSearchParams();
  const { products } = useProducts();

  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(CATALOG_ITEMS);

  useEffect(() => {
    let cancelled = false;
    api
      .get<CatalogItem[]>("/catalog-items")
      .then((items) => {
        if (!cancelled && Array.isArray(items) && items.length) setCatalogItems(items);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const [search, setSearch] = useState(params.get("q") || "");
  const [category, setCategory] = useState<string>(params.get("category") || "All");
  const [sort, setSort] = useState<SortKey>("featured");
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [brand, setBrand] = useState<string>("All");
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState(false);

  const brands = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (!p.miniStore && p.brand) set.add(p.brand);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => !p.miniStore);
    if (category !== "All") list = list.filter((p) => p.category === category);
    if (brand !== "All") list = list.filter((p) => p.brand === brand);
    if (minRating > 0) list = list.filter((p) => p.rating >= minRating);
    if (inStockOnly) list = list.filter((p) => p.stock > 0);
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
  }, [products, category, search, sort, maxPrice, brand, minRating, inStockOnly]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slateink dark:text-white">Shop AYINDEDUNNY ENTERPRISE</h1>
        <div className="mt-2 h-1 w-14 rounded-full" style={{ background: "var(--gold-gradient)" }} />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          {category === "All"
            ? "Browse the full AYINDEDUNNY ENTERPRISE catalogue."
            : CATALOG_CATEGORY_KEYS[category]
              ? `Our ${category} range — order directly on WhatsApp.`
              : `Showing products in ${category}.`}
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
              {CATEGORY_FILTERS.map((c) => (
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
            <div className="mt-4">
              <p className="label">Brand</p>
              <select value={brand} onChange={(e) => setBrand(e.target.value)} className="input w-full py-2 text-sm">
                <option value="All">All brands</option>
                {brands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="mt-4">
              <p className="label">Minimum rating</p>
              <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="input w-full py-2 text-sm">
                {RATING_FILTERS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-primary-600 h-4 w-4"
              />
              In stock only
            </label>
            <button onClick={() => { setSearch(""); setCategory("All"); setSort("featured"); setMaxPrice(2000); setBrand("All"); setMinRating(0); setInStockOnly(false); }} className="mt-4 text-xs font-semibold text-primary-600 hover:text-primary-700">
              Reset all filters
            </button>
          </div>
        </aside>

        <div>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {CATALOG_CATEGORY_KEYS[category] ? (
                <>
                  <span className="font-bold text-slateink dark:text-white">
                    {catalogItems.filter((i) => i.active && CATALOG_CATEGORY_KEYS[category].includes(i.category)).length}
                  </span>{" "}
                  items in stock
                </>
              ) : (
                <>
                  <span className="font-bold text-slateink dark:text-white">{filtered.length}</span> product
                  {filtered.length !== 1 && "s"} found
                </>
              )}
            </p>
            {!CATALOG_CATEGORY_KEYS[category] && (
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
            )}
          </div>

          {CATALOG_CATEGORY_KEYS[category] ? (
            <CatalogGrid category={category} items={catalogItems} />
          ) : filtered.length === 0 ? (
            <div className="card p-16 text-center dark:text-slate-300">
              <p className="text-slate-500 dark:text-slate-400">No products match your filters.</p>
              <button
                onClick={() => { setSearch(""); setCategory("All"); setMaxPrice(2000); setBrand("All"); setMinRating(0); setInStockOnly(false); }}
                className="btn-primary mt-4"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
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
