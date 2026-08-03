"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ShoppingCart, Heart, Minus, Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useToast } from "@/store/toast";
import { RatingStars } from "./RatingStars";

export function QuickViewModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const { toast } = useToast();
  const [qty, setQty] = useState(1);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slateink/60 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative z-10 w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl grid md:grid-cols-2 animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 rounded-full bg-white dark:bg-slate-800 shadow p-2 text-slate-600 dark:text-slate-300 hover:text-slateink dark:hover:text-white"
          aria-label="Close quick view"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="bg-slatebg dark:bg-slate-800 flex items-center justify-center p-8">
          <Image
            src={product.image}
            alt={product.title}
            width={420}
            height={420}
            className="rounded-xl"
          />
        </div>
        <div className="p-7">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">{product.category}</p>
          <h2 className="mt-1 font-display text-xl font-extrabold text-slateink dark:text-white">{product.title}</h2>
          <div className="mt-2">
            <RatingStars rating={product.rating} reviews={product.reviews} />
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-display text-2xl font-extrabold text-primary-700 dark:text-primary-400">{formatPrice(product.price)}</span>
            {product.oldPrice && <span className="text-slate-400 dark:text-slate-500 line-through text-sm">{formatPrice(product.oldPrice)}</span>}
          </div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{product.shortDescription}</p>
          <ul className="mt-4 space-y-1.5">
            {product.specs.slice(0, 4).map((s) => (
              <li key={s.label} className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">{s.label}</span>
                <span className="font-medium text-slateink dark:text-white">{s.value}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-slate-500 dark:text-slate-300 hover:text-primary-600" aria-label="Decrease">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-bold text-slateink dark:text-white">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="px-3 py-2 text-slate-500 dark:text-slate-300 hover:text-primary-600" aria-label="Increase">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => {
                add(product, qty);
                toast("Added to cart");
                onClose();
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2.5 text-sm"
            >
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </button>
            <button
              onClick={() => {
                toggle(product.id);
                toast(has(product.id) ? "Removed from wishlist" : "Saved to wishlist");
              }}
              className={`p-2.5 rounded-lg border ${has(product.id) ? "border-red-200 bg-red-50 text-red-500" : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:text-red-500"}`}
              aria-label="Toggle wishlist"
            >
              <Heart className={`h-5 w-5 ${has(product.id) ? "fill-red-500 text-red-500" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
