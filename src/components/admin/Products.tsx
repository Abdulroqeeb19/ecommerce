"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, ImageUp, X, RefreshCw, UploadCloud } from "lucide-react";
import { db, queueOperation, dropPendingProductOps } from "@/lib/db";
import { useToast } from "@/store/toast";
import { useProducts } from "@/lib/catalog";
import { CATEGORIES, MINI_STORE_CATEGORIES, SUPPLY_TYPE_BY_CATEGORY } from "@/lib/types";
import { cx, formatPrice, formatNaira, slugify, uid } from "@/lib/utils";
import { fileToCompressedDataUrl } from "@/lib/image";
import { syncAll, pullCatalog } from "@/lib/sync";
import type { Product, ProductSpec } from "@/lib/types";

interface FormState {
  id: string;
  title: string;
  category: string;
  brand: string;
  price: string;
  oldPrice: string;
  stock: string;
  badge: string;
  shortDescription: string;
  description: string;
  image: string;
  specs: ProductSpec[];
  miniStore: boolean;
  featured: boolean;
  supplyType: "supplies" | "grocery" | "";
  type: string;
  measure: string;
  costQty: string;
  costUnitPrice: string;
  sellPcs: string;
  sellUnitPrice: string;
}

const isMiniCategory = (c: string) => (MINI_STORE_CATEGORIES as readonly string[]).includes(c);

/** Display order for the main shop categories (Babies first, then Electrical, then Kitchen). */
const CATEGORY_ORDER: string[] = [
  "Babies Wears",
  "Electrical Materials and Fittings",
  "Kitchen Utensils"
];

const categoryRank = (c: string) => {
  const i = CATEGORY_ORDER.indexOf(c);
  return i >= 0 ? i : CATEGORY_ORDER.length;
};

const emptyForm: FormState = {
  id: "",
  title: "",
  category: CATEGORIES[0],
  brand: "",
  price: "",
  oldPrice: "",
  stock: "0",
  badge: "",
  shortDescription: "",
  description: "",
  image: "",
  specs: [{ label: "", value: "" }],
  miniStore: false,
  featured: false,
  supplyType: "",
  type: "",
  measure: "",
  costQty: "",
  costUnitPrice: "",
  sellPcs: "",
  sellUnitPrice: ""
};

export function AdminProducts({ miniOnly = false }: { miniOnly?: boolean }) {
  const { products } = useProducts();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [miniFilter, setMiniFilter] = useState<string>("All");

  const visibleProducts = useMemo(() => (miniOnly ? products.filter((p) => p.miniStore) : products), [products, miniOnly]);
  const scopedProducts = useMemo(() => {
    let list = visibleProducts;
    if (miniOnly && miniFilter !== "All") {
      list = list.filter((p) => p.supplyType === (miniFilter === "Groceries" ? "grocery" : "supplies"));
    }
    // Group by category (Babies -> Electrical -> Kitchen first), alphabetical by title within.
    return [...list].sort((a, b) => {
      const byCat = categoryRank(a.category) - categoryRank(b.category);
      if (byCat !== 0) return byCat;
      return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: "base" });
    });
  }, [visibleProducts, miniFilter, miniOnly]);

  const openNew = () => {
    setIsNew(true);
    setForm(
      miniOnly
        ? { ...emptyForm, category: "Stationery", miniStore: true, supplyType: "supplies" }
        : emptyForm
    );
  };

  const openEdit = (p: Product) => {
    setIsNew(false);
    setForm({
      id: p.id,
      title: p.title,
      category: p.category,
      brand: p.brand,
      price: String(p.price),
      oldPrice: p.oldPrice ? String(p.oldPrice) : "",
      stock: String(p.stock),
      badge: p.badge || "",
      shortDescription: p.shortDescription,
      description: p.description,
      image: p.image,
      specs: p.specs.length ? p.specs : [{ label: "", value: "" }],
      miniStore: Boolean(p.miniStore),
      featured: Boolean(p.featured),
      supplyType: (p.supplyType as "supplies" | "grocery" | "") || "",
      type: p.type || "",
      measure: p.measure || "",
      costQty: p.costQty != null ? String(p.costQty) : "",
      costUnitPrice: p.costUnitPrice != null ? String(p.costUnitPrice) : "",
      sellPcs: p.sellPcs != null ? String(p.sellPcs) : "",
      sellUnitPrice: p.sellUnitPrice != null ? String(p.sellUnitPrice) : ""
    });
  };

  const onImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToCompressedDataUrl(file);
      setForm((f) => (f ? { ...f, image: url } : f));
      toast("Image attached (auto-compressed for reliable syncing)");
    } catch {
      toast("Could not read that image", "error");
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !form.title.trim() || !form.price) {
      toast("Title and price are required", "error");
      return;
    }
    const now = new Date().toISOString();
    const isMini = MINI_STORE_CATEGORIES.includes(form.category as (typeof MINI_STORE_CATEGORIES)[number]);
    const supplyType = isMini ? SUPPLY_TYPE_BY_CATEGORY[form.category] || "supplies" : undefined;
    const costQty = Number(form.costQty) || 0;
    const costUnitPrice = Number(form.costUnitPrice) || 0;
    const sellPcs = Number(form.sellPcs) || 0;
    const sellUnitPrice = Number(form.sellUnitPrice) || 0;
    const costAmount = costQty * costUnitPrice;
    const sellAmount = sellPcs * sellUnitPrice;
    const profit = sellAmount - costAmount;
    const product: Product = {
      id: form.id || uid("prd"),
      slug: slugify(form.title),
      title: form.title,
      category: form.category,
      brand: form.brand || "AYINDEDUNNY ENTERPRISE",
      price: isMini && sellUnitPrice > 0 ? sellUnitPrice : Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
      stock: Number(form.stock) || 0,
      rating: 4.5,
      reviews: 0,
      image: form.image || "/images/products/school-item-placeholder.svg",
      shortDescription: form.shortDescription || form.title,
      description: form.description || form.shortDescription || form.title,
      specs: form.specs.filter((s) => s.label && s.value),
      badge: form.badge || undefined,
      tags: [form.category.toLowerCase(), isMini ? "mini-store" : "admin"],
      featured: form.featured,
      miniStore: isMini || form.miniStore,
      supplyType,
      type: isMini ? form.type.trim() : undefined,
      measure: isMini ? form.measure.trim() : undefined,
      costQty: isMini ? costQty : undefined,
      costUnitPrice: isMini ? costUnitPrice : undefined,
      costAmount: isMini ? costAmount : undefined,
      sellPcs: isMini ? sellPcs : undefined,
      sellUnitPrice: isMini ? sellUnitPrice : undefined,
      sellAmount: isMini ? sellAmount : undefined,
      profit: isMini ? profit : undefined,
      createdAt: form.id ? new Date(now).toISOString() : now,
      updatedAt: now
    };

    await db.products.put(product);
    await dropPendingProductOps(product.id);
    await queueOperation(isNew ? "create-product" : "update-product", product as unknown as Record<string, unknown>);
    const r = await syncAll();
    if (r.conflicts) {
      toast(`Saved locally, but a conflict was detected — review it in the Sync tab.`, "error");
    } else if (r.failed) {
      toast(`Saved locally and queued — ${r.failed} change${r.failed !== 1 ? "s" : ""} could not sync yet.`, "error");
    } else {
      toast(
        `Saved locally${r.pushed ? ` and synced (${r.pushed})` : " — queued for sync"}`,
        r.failed ? "error" : "success"
      );
    }
    setForm(null);
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.title}"? This also removes local stock data.`)) return;
    await db.products.delete(p.id);
    await db.deletedProducts.put({ id: p.id, deletedAt: new Date().toISOString() });
    await queueOperation("delete-product", { id: p.id });
    toast("Product deleted (will sync to cloud)");
  };

  const pullFromCloud = async () => {
    const n = await pullCatalog();
    toast(`Pulled ${n} products from the central cloud backend`);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slateink dark:text-white">
            {miniOnly ? "Mini-Store Catalog" : "Product Management"}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {scopedProducts.length} {miniOnly ? "mini-store items" : "products"} · add, edit prices and stock fully offline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={pullFromCloud} className="btn-outline text-xs">
            <UploadCloud className="h-4 w-4" /> Pull from Cloud
          </button>
          <button onClick={openNew} className="btn-primary">
            <Plus className="h-4 w-4" /> {miniOnly ? "Add Mini-Store Item" : "Add Product"}
          </button>
        </div>
      </div>

      {miniOnly && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {["All", "School Supplies", "Groceries"].map((c) => (
            <button
              key={c}
              onClick={() => setMiniFilter(c)}
              className={cx(
                "rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
                miniFilter === c ? "bg-skyline-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              {c}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">Only school supplies and groceries appear here</span>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[52rem]">
          <thead>
            <tr>
              <th className="table-th">Product</th>
              <th className="table-th">Category</th>
              <th className="table-th">Price</th>
              <th className="table-th">Stock</th>
              <th className="table-th">Status</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {scopedProducts.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                <td className="table-td">
                  <div className="flex items-center gap-3">
                    <Image src={p.image} alt={p.title} width={48} height={48} className="rounded-lg w-12 h-12 object-cover" />
                    <div>
                      <p className="font-semibold text-slateink dark:text-white line-clamp-1 max-w-[16rem]">{p.title}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{p.brand}</p>
                    </div>
                  </div>
                </td>
                <td className="table-td">{p.category}</td>
                <td className="table-td font-bold">{formatPrice(p.price)}</td>
                <td className="table-td">
                  <span
                    className={cx(
                      "inline-block rounded-full px-2.5 py-0.5 text-xs font-bold",
                      p.stock <= 0 ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300" : p.stock <= 10 ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                    )}
                  >
                    {p.stock} units
                  </span>
                </td>
                <td className="table-td">
                  <div className="flex flex-wrap items-center gap-1">
                    {p.badge ? <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{p.badge}</span> : <span className="text-xs text-slate-400">—</span>}
                    {p.miniStore && (
                      <span className="rounded-full bg-skyline-100 dark:bg-skyline-900/40 text-skyline-700 dark:text-skyline-300 text-[10px] font-bold px-2 py-0.5 uppercase">Mini-Store</span>
                    )}
                  </div>
                </td>
                <td className="table-td text-right">
                  <div className="inline-flex items-center gap-1">
                    <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/40" aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(p)} className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {scopedProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="table-td text-center text-slate-400 dark:text-slate-500 py-12">
                  No items in this catalog yet. Click Add to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => setForm(null)}>
          <div className="absolute inset-0 bg-slateink/60 dark:bg-black/70 backdrop-blur-sm animate-fade-in" />
          <div
            className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="font-display font-extrabold text-lg text-slateink dark:text-white">
                {isNew ? (miniOnly ? "Add Mini-Store Item" : "Add New Product") : "Edit Product"}
              </h3>
              <button onClick={() => setForm(null)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slateink dark:hover:text-white" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div className="flex items-start gap-5">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="relative w-32 h-32 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800 hover:border-primary-400 dark:hover:border-primary-500"
                >
                  {form.image ? (
                    <Image src={form.image} alt="Product" fill className="object-cover" />
                  ) : (
                    <span className="text-center text-xs text-slate-400 dark:text-slate-500 flex flex-col items-center gap-1">
                      <ImageUp className="h-6 w-6" /> Upload image
                    </span>
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImageUpload} />
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="label">Product Title *</label>
                    <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. UltraBook X15 Business Laptop" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Brand</label>
                      <input className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Brand" />
                    </div>
                    <div>
                      <label className="label">Category</label>
                      <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                        {miniOnly ? (
                          <optgroup label="Mini-Store">
                            {MINI_STORE_CATEGORIES.map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </optgroup>
                        ) : (
                          <>
                            <optgroup label="Electronics">
                              {CATEGORIES.map((c) => (
                                <option key={c}>{c}</option>
                              ))}
                            </optgroup>
                            <optgroup label="Mini-Store">
                              {MINI_STORE_CATEGORIES.map((c) => (
                                <option key={c}>{c}</option>
                              ))}
                            </optgroup>
                          </>
                        )}
                      </select>
                      {isMiniCategory(form.category) && (
                        <div className="mt-2 rounded-lg bg-skyline-50 dark:bg-skyline-900/40 border border-skyline-100 dark:border-skyline-800 px-3 py-2 text-xs text-skyline-700 dark:text-skyline-300">
                          Mini-store item ·{" "}
                          <span className="font-bold">
                            {SUPPLY_TYPE_BY_CATEGORY[form.category] === "grocery" ? "Groceries" : "School Supplies"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Price (USD) *</label>
                  <input type="number" min="0" step="0.01" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="199.00" />
                </div>
                <div>
                  <label className="label">Old Price</label>
                  <input type="number" min="0" step="0.01" className="input" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} placeholder="Optional" />
                </div>
                <div>
                  <label className="label">Stock *</label>
                  <input type="number" min="0" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </div>
              </div>

              {isMiniCategory(form.category) && (
                <div className="rounded-xl border border-skyline-200 dark:border-skyline-800 bg-skyline-50 dark:bg-skyline-900/30 p-4 space-y-3">
                  <p className="text-xs font-bold text-skyline-700 dark:text-skyline-300 uppercase tracking-wide">
                    School Shop Pricing (Naira)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Type (as shown to students)</label>
                      <input className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. Bread" />
                    </div>
                    <div>
                      <label className="label">Measure</label>
                      <input className="input" value={form.measure} onChange={(e) => setForm({ ...form, measure: e.target.value })} placeholder="e.g. loaf" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="label">Cost Qty</label>
                      <input type="number" min="0" step="0.01" className="input" value={form.costQty} onChange={(e) => setForm({ ...form, costQty: e.target.value })} placeholder="0" />
                    </div>
                    <div>
                      <label className="label">Cost Unit Price (₦)</label>
                      <input type="number" min="0" step="0.01" className="input" value={form.costUnitPrice} onChange={(e) => setForm({ ...form, costUnitPrice: e.target.value })} placeholder="0" />
                    </div>
                    <div>
                      <label className="label">Cost Amount (₦)</label>
                      <input className="input bg-slate-100 dark:bg-slate-800 font-bold" value={formatNaira((Number(form.costQty) || 0) * (Number(form.costUnitPrice) || 0))} disabled />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="label">Sell Pcs</label>
                      <input type="number" min="0" step="0.01" className="input" value={form.sellPcs} onChange={(e) => setForm({ ...form, sellPcs: e.target.value })} placeholder="0" />
                    </div>
                    <div>
                      <label className="label">Selling Unit Price (₦) *</label>
                      <input type="number" min="0" step="0.01" className="input" value={form.sellUnitPrice} onChange={(e) => setForm({ ...form, sellUnitPrice: e.target.value })} placeholder="0" />
                    </div>
                    <div>
                      <label className="label">Sell Amount (₦)</label>
                      <input className="input bg-slate-100 dark:bg-slate-800 font-bold" value={formatNaira((Number(form.sellPcs) || 0) * (Number(form.sellUnitPrice) || 0))} disabled />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Expected Gain</span>
                    <span className={cx("font-display font-extrabold text-sm", (Number(form.sellPcs) || 0) * (Number(form.sellUnitPrice) || 0) - (Number(form.costQty) || 0) * (Number(form.costUnitPrice) || 0) > 0 ? "text-primary-700 dark:text-primary-400" : "text-red-500")}>
                      {formatNaira((Number(form.sellPcs) || 0) * (Number(form.sellUnitPrice) || 0) - (Number(form.costQty) || 0) * (Number(form.costUnitPrice) || 0))}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Students see the name, type, measure and selling unit price (₦) only. The price above is overridden by the selling unit price.
                  </p>
                </div>
              )}

              <div>
                <label className="label">Badge (e.g. LOW STOCK / 16GB RAM)</label>
                <input className="input" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
              </div>

              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="accent-primary-600 h-4 w-4"
                />
                Show in Featured Tech and Gadget (home page)
              </label>

              <div>
                <label className="label">Short Description</label>
                <input className="input" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
              </div>
              <div>
                <label className="label">Full Description</label>
                <textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div>
                <label className="label">Specifications</label>
                <div className="space-y-2">
                  {form.specs.map((s, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
                      <input
                        className="input"
                        placeholder="Label (e.g. Processor)"
                        value={s.label}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            specs: form.specs.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x))
                          })
                        }
                      />
                      <input
                        className="input"
                        placeholder="Value (e.g. Intel Core i7)"
                        value={s.value}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            specs: form.specs.map((x, xi) => (xi === i ? { ...x, value: e.target.value } : x))
                          })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, specs: form.specs.filter((_, xi) => xi !== i) })}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400"
                        aria-label="Remove spec"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, specs: [...form.specs, { label: "", value: "" }] })}
                    className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add specification
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setForm(null)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <RefreshCw className="h-4 w-4" /> Save and Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
