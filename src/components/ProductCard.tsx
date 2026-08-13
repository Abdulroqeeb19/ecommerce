"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Eye, GitCompareArrows } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useCompare } from "@/store/compare";
import { useToast } from "@/store/toast";
import { RatingStars } from "./RatingStars";
import { ProductImage } from "./ProductImage";
import { QuickViewModal } from "./QuickViewModal";

export function ProductCard({ product }: { product: Product }) {
  const { items, add, remove } = useCart();
  const { has, toggle } = useWishlist();
  const { has: inCompare, toggle: toggleCompare } = useCompare();
  const { toast } = useToast();
  const [quickView, setQuickView] = useState(false);
  const [imageKey, setImageKey] = useState(0);

  const inCart = items.some((i) => i.id === product.id);
  const lowStock = product.stock > 0 && product.stock <= 10;
  const outOfStock = product.stock <= 0;

  return (
    <>
      <div className="group relative bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 shadow-card overflow-hidden hover:shadow-hover hover:-translate-y-0.5 hover:ring-1 hover:ring-gold-400/40 transition-all duration-300">
        <Link href={`/product/${product.slug}`} className="block">
          <div className="relative aspect-square overflow-hidden bg-slatebg dark:bg-slate-800 cinem-sheen-wrap">
            <ProductImage
              key={imageKey}
              src={product.image}
              alt={product.title}
              className="h-full w-full transition-transform duration-500 group-hover:scale-105"
            />
            {product.badge && (
              <span className="absolute top-3 left-3 rounded-md bg-slateink/90 text-white text-[10px] font-bold px-2 py-1">
                {product.badge}
              </span>
            )}
            {lowStock && (
              <span className="absolute top-3 right-3 rounded-md bg-amber-500 text-slateink text-[10px] font-bold px-2 py-1 animate-pulse">
                LOW STOCK
              </span>
            )}
            {outOfStock && (
              <span className="absolute top-3 right-3 rounded-md bg-red-600 text-white text-[10px] font-bold px-2 py-1">
                SOLD OUT
              </span>
            )}
            {product.oldPrice && (
              <span className="absolute bottom-3 left-3 rounded-md bg-emerald-500 text-white text-[10px] font-bold px-2 py-1">
                {Math.round((1 - product.price / product.oldPrice) * 100)}% OFF
              </span>
            )}
          </div>
          <div className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">{product.category}</p>
            <h3 className="mt-1 text-xs sm:text-sm font-bold text-slateink dark:text-white line-clamp-2 min-h-[2.1rem] sm:min-h-[2.5rem] group-hover:text-primary-700">              {product.title}
            </h3>
            <div className="mt-1.5 sm:mt-2 flex items-center justify-between gap-1">
              <div className="min-w-0"><RatingStars rating={product.rating} reviews={product.reviews} size={12} /></div>
              <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 shrink-0">{outOfStock ? "Sold out" : `${product.stock} left`}</span>
            </div>
            <div className="mt-1.5 sm:mt-2.5 flex items-baseline gap-1.5 sm:gap-2">
              <span className="font-display text-base sm:text-lg font-extrabold text-slateink dark:text-white">{formatPrice(product.price)}</span>
              {product.oldPrice && <span className="text-[10px] sm:text-xs text-slate-400 line-through">{formatPrice(product.oldPrice)}</span>}
            </div>
          </div>
        </Link>

        <div className="absolute inset-x-0 bottom-0 translate-y-0 lg:translate-y-full lg:group-hover:translate-y-0 transition-transform duration-300 bg-white/95 dark:bg-navy-800/95 backdrop-blur border-t border-slate-100 dark:border-navy-700 px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => {
                toggle(product.id);
                toast(has(product.id) ? "Removed from wishlist" : "Saved to wishlist");
              }}
              title="Wishlist"
              aria-label="Toggle wishlist"
              className={`flex items-center justify-center rounded-lg p-1.5 sm:p-2 transition-colors ${
                has(product.id) ? "text-red-500 bg-red-50" : "text-slate-500 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Heart className={`h-4 w-4 ${has(product.id) ? "fill-red-500" : ""}`} />
            </button>
            <button
              onClick={() => {
                toggleCompare(product);
                toast(inCompare(product.id) ? "Removed from compare" : "Added to compare");
              }}
              title="Compare"
              aria-label="Toggle compare"
              className={`flex items-center justify-center rounded-lg p-1.5 sm:p-2 transition-colors ${
                inCompare(product.id) ? "text-gold-500 bg-gold-50" : "text-slate-500 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <GitCompareArrows className="h-4 w-4" />
            </button>
            <button onClick={() => setQuickView(true)} title="Quick View" aria-label="Quick view" className="flex items-center justify-center rounded-lg p-1.5 sm:p-2 text-slate-500 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
              <Eye className="h-4 w-4" />
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
                setImageKey((k) => k + 1);
              }}
              title={inCart ? "Remove from Cart" : "Add to Cart"}
              aria-label={inCart ? "Remove from cart" : "Add to cart"}
              disabled={outOfStock}
              className={`flex items-center justify-center rounded-lg p-1.5 sm:p-2 transition-colors disabled:opacity-40 ${
                inCart ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-primary-500 text-slateink hover:bg-primary-400"
              }`}
            >
              <ShoppingCart className={`h-4 w-4 ${inCart ? "fill-white" : ""}`} />
            </button>
          </div>
        </div>
      </div>
      {quickView && <QuickViewModal product={product} onClose={() => setQuickView(false)} />}
    </>
  );
}
