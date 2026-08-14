"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronDown, Heart, ShoppingCart } from "lucide-react";
import type { Product } from "@/lib/types";
import { cx, formatPrice } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useToast } from "@/store/toast";

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

      <div onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
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
              <VariantRow key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VariantRow({ product }: { product: Product }) {
  const { items, add, remove } = useCart();
  const { has, toggle } = useWishlist();
  const { toast } = useToast();

  const inCart = items.some((i) => i.id === product.id);
  const outOfStock = product.stock <= 0;

  return (
    <div className="px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slateink dark:text-white truncate">{product.title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {outOfStock ? "Out of stock" : `${product.stock} available · ${formatPrice(product.price)}`}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => {
            toggle(product.id);
            toast(has(product.id) ? "Removed from wishlist" : "Saved to wishlist");
          }}
          title="Wishlist"
          aria-label={`Toggle ${product.title} in wishlist`}
          className={`flex items-center justify-center rounded-lg p-2 transition-colors ${
            has(product.id) ? "text-red-500 bg-red-50" : "text-slate-500 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <Heart className={`h-4 w-4 ${has(product.id) ? "fill-red-500" : ""}`} />
        </button>
        <button
          onClick={() => {
            if (outOfStock) return;
            if (inCart) {
              remove(product.id);
              toast("Removed from cart");
            } else {
              add(product, 1);
              toast("Added to cart");
            }
          }}
          title={inCart ? "Remove from Cart" : "Add to Cart"}
          aria-label={inCart ? "Remove from cart" : "Add to cart"}
          disabled={outOfStock}
          className={`flex items-center justify-center rounded-lg p-2 transition-colors disabled:opacity-40 ${
            inCart ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-primary-500 text-slateink hover:bg-primary-400"
          }`}
        >
          <ShoppingCart className={`h-4 w-4 ${inCart ? "fill-white" : ""}`} />
        </button>
      </div>
    </div>
  );
}
