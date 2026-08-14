"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Search, X, Sparkles } from "lucide-react";
import { useProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { VariantGroupCard } from "@/components/VariantGroupCard";
import { HoverSelect } from "@/components/HoverSelect";
import { Pagination } from "@/components/Pagination";
import { cx, formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

type SortKey = "featured" | "price-asc" | "price-desc" | "rating" | "newest";

const PAGE_SIZE = 9;

const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "rating", label: "Top Rated" }
];

const CATEGORY_FILTERS = ["All", "Babies Wears", "Electrical Materials and Fittings", "Kitchen Utensils"];

/** Display order for the main shop categories (Babies first, then Electrical, then Kitchen). */
const CATEGORY_ORDER: string[] = ["Babies Wears", "Electrical Materials and Fittings", "Kitchen Utensils"];

const RATING_FILTERS = [
  { value: 0, label: "Any rating" },
  { value: 3, label: "3+ stars" },
  { value: 4, label: "4+ stars" },
  { value: 4.5, label: "4.5+ stars" }
];

type CardItem =
  | { type: "group"; name: string; products: Product[] }
  | { type: "product"; product: Product };

function buildCards(products: Product[]): CardItem[] {
  const map = new Map<string, Product[]>();
  const standalone: Product[] = [];
  for (const p of products) {
    if (p.group) {
      const arr = map.get(p.group) || [];
      arr.push(p);
      map.set(p.group, arr);
    } else {
      standalone.push(p);
    }
  }
  const groups = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  return [
    ...groups.map(([name, prods]) => ({ type: "group" as const, name, products: prods })),
    ...standalone.map((product) => ({ type: "product" as const, product }))
  ];
}

function trackGlow(e: MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}

function CardGrid({ items, staggerKey }: { items: CardItem[]; staggerKey: string }) {
  if (items.length === 0) return null;
  return (
    <div key={staggerKey} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
      {items.map((it, i) => (
        <div
          key={it.type === "group" ? it.name : it.product.id}
          className="cinem-card-in cinem-card-glow"
          style={{ animationDelay: `${Math.min(i, 9) * 70}ms` }}
          onMouseMove={trackGlow}
        >
          {it.type === "group" ? (
            <VariantGroupCard key={it.name} groupName={it.name} products={it.products} />
          ) : (
            <ProductCard key={it.product.id} product={it.product} />
          )}
        </div>
      ))}
    </div>
  );
}

export function ShopContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { products } = useProducts();

  // Category is driven by the URL (?category=) so it survives a refresh and is
  // shared with links from the header/footer/carousels. The page is
  // server-rendered per request (see shop/page.tsx dynamic config), so these
  // search params are populated even on a hard refresh.
  const category = params.get("category") || "All";

  const setCategoryFilter = (c: string) => {
    const sp = new URLSearchParams(params.toString());
    if (c === "All") sp.delete("category");
    else sp.set("category", c);
    const qs = sp.toString();
    router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
  };

  const [search, setSearch] = useState(params.get("q") || "");
  const [sort, setSort] = useState<SortKey>("featured");
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [brand, setBrand] = useState<string>("All");
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(1);

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
          p.group?.toLowerCase().includes(q) ||
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
        // Featured first, then grouped by category (Babies -> Electrical -> Kitchen)
        // and alphabetical by title within each group.
        list.sort((a, b) => {
          const aFeat = Number(b.featured || false) - Number(a.featured || false);
          if (aFeat !== 0) return aFeat;
          const catOrder = (x: string, y: string) => {
            const ix = CATEGORY_ORDER.indexOf(x);
            const iy = CATEGORY_ORDER.indexOf(y);
            return (ix < 0 ? CATEGORY_ORDER.length : ix) - (iy < 0 ? CATEGORY_ORDER.length : iy);
          };
          const byCat = catOrder(a.category, b.category);
          if (byCat !== 0) return byCat;
          return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: "base" });
        });
    }
    return list;
  }, [products, category, search, sort, maxPrice, brand, minRating, inStockOnly]);

  const cards = useMemo(() => buildCards(filtered), [filtered]);
  const pageCount = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));

  const filterKey = [search, category, sort, maxPrice, brand, minRating, inStockOnly].join("|");
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const [prevPageCount, setPrevPageCount] = useState(pageCount);
  if (pageCount !== prevPageCount) {
    setPrevPageCount(pageCount);
    if (page > pageCount) setPage(pageCount);
  }

  const paged = useMemo(() => cards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [cards, page]);
  const showingStart = cards.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingEnd = Math.min(page * PAGE_SIZE, cards.length);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Cinematic catalogue banner */}
      <div
        className="relative overflow-hidden rounded-2xl mb-8 px-7 py-9 sm:px-10 text-white"
        style={{ background: "radial-gradient(900px 380px at 15% -20%, rgba(212,175,55,0.22) 0%, transparent 55%), linear-gradient(135deg, #182230 0%, #0C121A 100%)" }}
      >
        <div className="cinem-beam left-[6%] rotate-[18deg]" aria-hidden="true" />
        <div className="cinem-beam right-[10%] -rotate-[15deg]" aria-hidden="true" />
        <div className="cinem-dust-field" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="cinem-dust"
              style={{
                left: `${(i * 8 + 4) % 96}%`,
                width: 2 + (i % 3),
                height: 2 + (i % 3),
                animationDuration: `${8 + (i % 6)}s`,
                animationDelay: `${(i * 0.6) % 8}s`
              }}
            />
          ))}
        </div>
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-gold-400/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-gold-300" /> Full Catalogue
          </span>
          <h1 className="mt-3 font-display text-2xl sm:text-4xl font-extrabold leading-tight">
            <span className="cinem-shimmer-text">AYINDEDUNNY ENTERPRISE</span> Collection
          </h1>
          <div className="mt-3 h-1 w-24 rounded-full" style={{ background: "var(--gold-gradient)" }} />
          <p className="mt-3 max-w-xl text-sm text-slate-300">
            {category === "All"
              ? "Browse every Kitchen Utensil, Babies Wear and Electrical Fitting — order directly on WhatsApp."
              : `Our ${category} range — order directly on WhatsApp.`}
          </p>
        </div>
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
                  onClick={() => setCategoryFilter(c)}
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
              <HoverSelect
                value={brand}
                onChange={setBrand}
                options={[{ value: "All", label: "All brands" }, ...brands.map((b) => ({ value: b, label: b }))]}
                ariaLabel="Select brand"
                className="w-full"
                triggerClassName="input w-full py-2 text-sm"
                listClassName="w-full"
              />
            </div>
            <div className="mt-4">
              <p className="label">Minimum rating</p>
              <HoverSelect
                value={minRating}
                onChange={setMinRating}
                options={RATING_FILTERS.map((r) => ({ value: r.value, label: r.label }))}
                ariaLabel="Select minimum rating"
                className="w-full"
                triggerClassName="input w-full py-2 text-sm"
                listClassName="w-full"
              />
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
            <button onClick={() => { setSearch(""); setCategoryFilter("All"); setSort("featured"); setMaxPrice(2000); setBrand("All"); setMinRating(0); setInStockOnly(false); }} className="mt-4 text-xs font-semibold text-primary-600 hover:text-primary-700">
              Reset all filters
            </button>
          </div>
        </aside>

        <div>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-bold text-slateink dark:text-white">{cards.length}</span>{" "}
              {cards.length === 1 ? "product type" : "product types"} found
              {cards.length > 0 && (
                <span className="text-slate-400 dark:text-slate-500">
                  {" "}· showing {showingStart}–{showingEnd}
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">Sort by:</span>
              <HoverSelect
                value={sort}
                onChange={setSort}
                options={SORTS.map((s) => ({ value: s.key, label: s.label }))}
                ariaLabel="Sort products"
                triggerClassName="input w-auto py-2 min-w-[9rem]"
                align="right"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="card p-16 text-center dark:text-slate-300">
              <p className="text-slate-500 dark:text-slate-400">No products match your filters.</p>
              <button
                onClick={() => { setSearch(""); setCategoryFilter("All"); setMaxPrice(2000); setBrand("All"); setMinRating(0); setInStockOnly(false); }}
                className="btn-primary mt-4"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <CardGrid items={paged} staggerKey={`${filterKey}|${page}`} />
              <Pagination page={page} pageCount={pageCount} onChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}