"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronDown, MessageCircle } from "lucide-react";
import type { Product } from "@/lib/types";
import { cx } from "@/lib/utils";
import { BRAND_NAME, whatsappLink } from "@/lib/brand";

export function VariantGroupCard({ groupName, products }: { groupName: string; products: Product[] }) {
  const [open, setOpen] = useState(false);
  const cover = useMemo(() => products[0], [products]);
  const totalQty = useMemo(() => products.reduce((n, p) => n + (p.stock || 0), 0), [products]);

  return (
    <div className="card group overflow-hidden text-center">
      <div className="relative aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <Image
          src={cover.image || "/images/catalog/kitchen-placeholder.svg"}
          alt={groupName}
          width={380}
          height={380}
          className="h-full w-full object-contain transition-transform group-hover:scale-105"
        />
        <span className="absolute top-3 right-3 rounded-full bg-navy-950/70 text-white text-[10px] font-bold px-2.5 py-1">
          {products.length} type{products.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="p-4">
        <p className="font-bold uppercase tracking-wide text-slateink dark:text-white">{groupName}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{cover.category}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {totalQty} in stock · {products.length} variant{products.length !== 1 ? "s" : ""}
        </p>

        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 btn-outline !py-2 text-sm"
          aria-expanded={open}
        >
          {open ? "Hide types" : "View types"}
          <ChevronDown className={cx("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 dark:border-navy-700 divide-y divide-slate-100 dark:divide-navy-700 text-left">
          {products.map((p) => (
            <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slateink dark:text-white truncate">{p.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {p.stock > 0 ? `${p.stock} available` : "Out of stock"}
                </p>
              </div>
              <OrderCardButton product={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrderCardButton({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [need, setNeed] = useState("");
  const [sending, setSending] = useState(false);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const line = `${product.title} (${product.category})`;
    const message = need.trim()
      ? `Hello ${BRAND_NAME},\n\nI am interested in: ${line}.\n\nWhat I need help with / problem to be solved:\n${need.trim()}\n\nPlease advise. Thank you.`
      : `Hello ${BRAND_NAME},\n\nI am interested in: ${line}.\n\nPlease help me with this product. Thank you.`;
    window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
    setSending(false);
    setOpen(false);
    setNeed("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold btn-primary !py-1.5 !px-2.5"
      >
        <MessageCircle className="h-3 w-3" /> Order
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-navy-800 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-extrabold text-lg text-slateink dark:text-white">Order on WhatsApp</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">The message opens in the owner&apos;s WhatsApp.</p>
            <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Item</p>
              <p className="font-bold text-slateink dark:text-white mt-0.5">{product.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {product.category} · {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
              </p>
            </div>
            <form onSubmit={send} className="mt-4 space-y-3">
              <textarea
                value={need}
                onChange={(e) => setNeed(e.target.value)}
                placeholder="Describe the problem or need the item must solve. Include quantity or size if you know it."
                rows={3}
                className="input w-full py-2 text-sm resize-none"
              />
              <button type="submit" disabled={sending} className="btn-primary w-full !py-2.5 text-sm">
                <MessageCircle className="h-4 w-4" /> {sending ? "Opening WhatsApp…" : "Order on WhatsApp"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}