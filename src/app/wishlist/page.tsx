"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useProducts } from "@/lib/catalog";
import { useWishlist } from "@/store/wishlist";
import { ProductCard } from "@/components/ProductCard";

export default function WishlistPage() {
  const { ids, count } = useWishlist();
  const { products } = useProducts();
  const wishlist = products.filter((p) => ids.includes(p.id));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slateink dark:text-white flex items-center gap-3">
        <Heart className="h-7 w-7 text-red-500 fill-red-500" /> My Wishlist
      </h1>
      <div className="mt-2 h-1 w-14 rounded-full bg-primary-600" />
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{count} saved item{count !== 1 && "s"}</p>

      {wishlist.length === 0 ? (
        <div className="card p-16 mt-8 text-center">
          <Heart className="h-14 w-14 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="mt-4 font-semibold text-slateink dark:text-white">Your wishlist is empty</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tap the heart on any product to save it here.</p>
          <Link href="/shop" className="btn-primary mt-6">
            <ShoppingBag className="h-4 w-4" /> Explore Products
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {wishlist.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
