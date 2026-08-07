"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Heart, ShoppingCart, Truck, ShieldCheck, RefreshCcw, Minus, Plus, Check } from "lucide-react";
import { useProducts } from "@/lib/catalog";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useToast } from "@/store/toast";
import { formatPrice, cx, CURRENCY_RATES } from "@/lib/utils";
import { useCurrency } from "@/store/currency";
import { RatingStars } from "@/components/RatingStars";
import { ReviewSection } from "@/components/ReviewSection";
import { ProductCard } from "@/components/ProductCard";

const TABS = ["Description", "Specifications", "Reviews"] as const;

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { products } = useProducts();
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const { toast } = useToast();
  const { currency } = useCurrency();
  const freeThreshold = `${currency.symbol}${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(500 * (CURRENCY_RATES[currency.code] ?? 1)))}`;

  const product = products.find((p) => p.slug === slug);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Description");
  const [prevSlug, setPrevSlug] = useState(slug);

  if (prevSlug !== slug) {
    setPrevSlug(slug);
    setQty(1);
    setTab("Description");
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-extrabold text-slateink dark:text-white">Product not found</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">The product you are looking for may have been removed.</p>
        <button onClick={() => router.push("/shop")} className="btn-primary mt-6">
          Back to Shop
        </button>
      </div>
    );
  }

  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 10;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-6 flex-wrap">
        <Link href="/" className="hover:text-primary-600">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/shop" className="hover:text-primary-600">Shop</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-primary-600">
          {product.category}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slateink dark:text-white font-semibold truncate max-w-[200px]">{product.title}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        <div className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card">
          <Image src={product.image} alt={product.title} width={720} height={720} className="w-full h-auto" />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">{product.brand} · {product.category}</p>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-slateink dark:text-white leading-tight">{product.title}</h1>
          <div className="mt-3 flex items-center gap-3">
            <RatingStars rating={product.rating} reviews={product.reviews} size={16} />
            <span className="text-sm text-slate-400 dark:text-slate-500">|</span>
            <span className={cx("text-sm font-semibold", outOfStock ? "text-red-600" : lowStock ? "text-amber-500" : "text-emerald-600")}>
              {outOfStock ? "Sold Out" : `${product.stock} in stock`}
            </span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-3xl font-extrabold text-primary-700 dark:text-primary-400">{formatPrice(product.price)}</span>
            {product.oldPrice && (
              <>
                <span className="text-slate-400 dark:text-slate-500 line-through">{formatPrice(product.oldPrice)}</span>
                <span className="rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1">
                  Save {formatPrice(product.oldPrice - product.price)}
                </span>
              </>
            )}
          </div>

          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{product.description}</p>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={outOfStock} className="px-3.5 py-2.5 text-slate-500 dark:text-slate-300 hover:text-primary-600 disabled:opacity-40" aria-label="Decrease quantity">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-bold text-slateink dark:text-white">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} disabled={outOfStock} className="px-3.5 py-2.5 text-slate-500 dark:text-slate-300 hover:text-primary-600 disabled:opacity-40" aria-label="Increase quantity">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              disabled={outOfStock}
              onClick={() => {
                add(product, qty);
                toast("Added to cart");
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 text-sm disabled:opacity-50"
            >
              <ShoppingCart className="h-5 w-5" /> Add to Cart
            </button>
            <button
              onClick={() => {
                toggle(product.id);
                toast(has(product.id) ? "Removed from wishlist" : "Saved to wishlist");
              }}
              className={`p-3 rounded-lg border ${has(product.id) ? "border-red-200 bg-red-50 text-red-500" : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:text-red-500"}`}
              aria-label="Toggle wishlist"
            >
              <Heart className={`h-5 w-5 ${has(product.id) ? "fill-red-500 text-red-500" : ""}`} />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-center">
              <Truck className="h-5 w-5 mx-auto text-primary-600 mb-1" />
              <p className="font-semibold text-slateink dark:text-white">Fast Delivery</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">Free over {freeThreshold}</p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-center">
              <ShieldCheck className="h-5 w-5 mx-auto text-primary-600 mb-1" />
              <p className="font-semibold text-slateink dark:text-white">1-Year Warranty</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">Genuine gear</p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-center">
              <RefreshCcw className="h-5 w-5 mx-auto text-primary-600 mb-1" />
              <p className="font-semibold text-slateink dark:text-white">14-Day Returns</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">No hassle</p>
            </div>
          </div>

          {product.badge && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-50 text-primary-700 text-xs font-bold px-3 py-2">
              <Check className="h-4 w-4" /> {product.badge}
            </p>
          )}
        </div>
      </div>

      <div className="mt-12 card">
        <div className="flex border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cx(
                "px-6 py-3.5 text-sm font-bold transition-colors border-b-2 -mb-px",
                tab === t ? "border-primary-600 text-primary-700 dark:text-primary-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slateink dark:hover:text-white"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="p-6">
          {tab === "Description" && <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">{product.description}</p>}
          {tab === "Specifications" && (
            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-0 max-w-3xl">
              {product.specs.map((s) => (
                <div key={s.label} className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-3 text-sm">
                  <span className="text-slate-500 dark:text-slate-400">{s.label}</span>
                  <span className="font-semibold text-slateink dark:text-white">{s.value}</span>
                </div>
              ))}
            </div>
          )}
          {tab === "Reviews" && <ReviewSection productId={product.id} />}
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-xl font-extrabold text-slateink dark:text-white mb-5">You may also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
