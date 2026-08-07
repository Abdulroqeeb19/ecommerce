"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, X, ImageUp, Save, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/store/toast";
import { CATEGORY_CARD_ICONS, type CategoryCard } from "@/lib/types";
import { cx } from "@/lib/utils";

const EMPTY: Omit<CategoryCard, "id"> = {
  name: "",
  tagline: "",
  href: "",
  image: "",
  icon: "laptop",
  sortOrder: 0,
  active: true
};

export function CategoryCardsPanel() {
  const { toast } = useToast();
  const [cards, setCards] = useState<CategoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<CategoryCard> | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCards(await api.get<CategoryCard[]>("/category-cards"));
    } catch {
      toast("Could not load category cards", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async load on mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      if (url.length > 4 * 1024 * 1024) {
        toast("Image too large (max 4MB)", "error");
        return;
      }
      setForm((f) => (f ? { ...f, image: url } : f));
      toast("Image attached");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const set = (key: keyof CategoryCard, value: unknown) => setForm((f) => (f ? { ...f, [key]: value } : f));

  const save = async () => {
    if (!form) return;
    setBusy(true);
    try {
      if (form.id) {
        await api.put(`/category-cards/${form.id}`, form);
        toast("Category card updated");
      } else {
        await api.post("/category-cards", form);
        toast("Category card created");
      }
      setForm(null);
      await load();
    } catch (e) {
      toast((e as Error).message || "Could not save card", "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (card: CategoryCard) => {
    if (!confirm(`Delete "${card.name}"? This cannot be undone.`)) return;
    try {
      await api.del(`/category-cards/${card.id}`);
      toast("Category card deleted");
      await load();
    } catch (e) {
      toast((e as Error).message || "Could not delete card", "error");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slateink dark:text-white">Shop by Category Cards</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Edit the cards shown in the &quot;Shop by Category&quot; section on the home page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-outline text-xs">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={() => setForm({ ...EMPTY, sortOrder: cards.length + 1 })} className="btn-primary text-xs">
            <Plus className="h-4 w-4" /> Add Card
          </button>
        </div>
      </div>

      {form && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slateink dark:text-white">{form.id ? "Edit Card" : "New Card"}</h3>
            <button onClick={() => setForm(null)} aria-label="Close form" className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Card Name *</label>
              <input className="input" value={form.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="e.g. LAPTOPS" />
            </div>
            <div>
              <label className="label">Tagline</label>
              <input className="input" value={form.tagline || ""} onChange={(e) => set("tagline", e.target.value)} placeholder="e.g. Power for every workload" />
            </div>
            <div>
              <label className="label">Link (href)</label>
              <input className="input" value={form.href || ""} onChange={(e) => set("href", e.target.value)} placeholder="/shop?category=Laptops%20and%20Notebooks" />
            </div>
            <div>
              <label className="label">Icon</label>
              <select className="input" value={form.icon || "laptop"} onChange={(e) => set("icon", e.target.value)}>
                {CATEGORY_CARD_ICONS.map((ic) => (
                  <option key={ic} value={ic}>{ic}</option>
                ))}
              </select>
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
                  <Image src={form.image} alt="Card" width={64} height={64} className="rounded-lg h-16 w-16 object-cover bg-slate-100 dark:bg-slate-800" />
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
            <button onClick={save} disabled={busy || !form.name} className="btn-primary">
              <Save className="h-4 w-4" /> {busy ? "Saving..." : form.id ? "Save Changes" : "Create Card"}
            </button>
            <button onClick={() => setForm(null)} className="btn-outline">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading cards…</p>
      ) : cards.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No category cards yet. Add your first card above.</p>
      ) : (
        <div className="grid gap-3">
          {cards.map((card) => (
            <div key={card.id} className="card p-4 flex items-center gap-4">
              <Image src={card.image} alt={card.name} width={56} height={56} className="rounded-lg h-14 w-14 object-cover bg-slate-100 dark:bg-slate-800 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-slateink dark:text-white">{card.name}</p>
                  <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", card.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                    {card.active ? "Visible" : "Hidden"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{card.tagline}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate font-mono">{card.href}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setForm({ ...card })} aria-label="Edit" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove(card)} aria-label="Delete" className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500">
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