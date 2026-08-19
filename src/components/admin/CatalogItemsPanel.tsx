"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, X, ImageUp, Save, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/store/toast";
import { SHOP_CATEGORY_NAMES } from "@/lib/catalogCategories";
import { CATALOG_ITEMS } from "@/lib/brand";
import { fileToCompressedDataUrl } from "@/lib/image";
import type { CatalogItem } from "@/lib/types";
import { cx } from "@/lib/utils";

const CATEGORIES = SHOP_CATEGORY_NAMES;

const EMPTY: Omit<CatalogItem, "id"> = {
  name: "",
  tag: "",
  category: CATEGORIES[0] || "",
  image: "",
  sortOrder: 0,
  active: true
};

export function CatalogItemsPanel() {
  const { toast } = useToast();
  const [items, setItems] = useState<CatalogItem[]>(CATALOG_ITEMS);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<CatalogItem> | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api.get<CatalogItem[]>("/catalog-items"));
    } catch {
      toast("Could not load catalog items", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async load on mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToCompressedDataUrl(file);
      setForm((f) => (f ? { ...f, image: url } : f));
      toast("Image attached (auto-compressed)");
    } catch {
      toast("Could not read that image", "error");
    }
    e.target.value = "";
  };

  const set = (key: keyof CatalogItem, value: unknown) => setForm((f) => (f ? { ...f, [key]: value } : f));

  const save = async () => {
    if (!form) return;
    setBusy(true);
    try {
      if (form.id) {
        await api.put(`/catalog-items/${form.id}`, form);
        toast("Catalog item updated");
      } else {
        await api.post("/catalog-items", form);
        toast("Catalog item created");
      }
      setForm(null);
      await load();
    } catch (e) {
      toast((e as Error).message || "Could not save item", "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: CatalogItem) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await api.del(`/catalog-items/${item.id}`);
      toast("Catalog item deleted");
      await load();
    } catch (e) {
      toast((e as Error).message || "Could not delete item", "error");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slateink dark:text-white">Catalogue Items</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage the items in stock shown on the shop category pages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-outline text-xs">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={() => setForm({ ...EMPTY, sortOrder: items.length + 1 })} className="btn-primary text-xs">
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>
      </div>

      {form && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slateink dark:text-white">{form.id ? "Edit Item" : "New Item"}</h3>
            <button onClick={() => setForm(null)} aria-label="Close form" className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Item Name *</label>
              <input className="input" value={form.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="e.g. POT" />
            </div>
            <div>
              <label className="label">Tag (short label)</label>
              <input className="input" value={form.tag || ""} onChange={(e) => set("tag", e.target.value)} placeholder="e.g. Pot" />
            </div>
            <div>
              <label className="label">Category *</label>
              <select className="input" value={form.category || ""} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Price (optional)</label>
              <input type="number" min={0} step="0.01" className="input" value={form.price ?? ""} onChange={(e) => set("price", e.target.value === "" ? undefined : Number(e.target.value))} placeholder="Leave empty to order on WhatsApp" />
            </div>
            <div>
              <label className="label">Sort Order</label>
              <input type="number" className="input" value={form.sortOrder ?? 0} onChange={(e) => set("sortOrder", Number(e.target.value))} />
            </div>
            <div className="flex items-end gap-3 pb-1">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                <input type="checkbox" checked={form.active !== false} onChange={(e) => set("active", e.target.checked)} className="accent-primary-600 h-4 w-4" />
                Visible on site
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="label">Image</label>
              <div className="flex items-center gap-3">
                {form.image ? (
                  <Image src={form.image} alt="Item" width={64} height={64} className="rounded-lg h-16 w-16 object-cover bg-slate-100 dark:bg-slate-800" />
                ) : (
                  <div className="rounded-lg h-16 w-16 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400">None</div>
                )}
                <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={onImageUpload} />
                <button onClick={() => fileRef.current?.click()} className="btn-outline text-xs">
                  <ImageUp className="h-4 w-4" /> Upload Image
                </button>
                <input
                  className="input flex-1"
                  value={form.image?.startsWith("data:") ? "" : form.image || ""}
                  onChange={(e) => set("image", e.target.value)}
                  placeholder="…or paste an image path/URL"
                />
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button onClick={save} disabled={busy || !form.name || !form.category} className="btn-primary">
              <Save className="h-4 w-4" /> {busy ? "Saving..." : form.id ? "Save Changes" : "Create Item"}
            </button>
            <button onClick={() => setForm(null)} className="btn-outline">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading items…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No catalogue items yet. Add your first item above.</p>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div key={item.id} className="card p-4 flex items-center gap-4">
              <Image src={item.image} alt={item.name} width={56} height={56} className="rounded-lg h-14 w-14 object-cover bg-slate-100 dark:bg-slate-800 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-slateink dark:text-white">{item.name}</p>
                  <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", item.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                    {item.active ? "Visible" : "Hidden"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.category}{item.price != null ? ` · ${item.price}` : ""}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setForm({ ...item })} aria-label="Edit" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove(item)} aria-label="Delete" className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}