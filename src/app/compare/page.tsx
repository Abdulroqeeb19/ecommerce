"use client";

import Link from "next/link";
import { GitCompareArrows, Minus, Check } from "lucide-react";
import { useCompare } from "@/store/compare";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useToast } from "@/store/toast";
import { ProductImage } from "@/components/ProductImage";

export default function ComparePage() {
  const { products, clear } = useCompare();
  const { add } = useCart();
  const { toast } = useToast();

  if (products.length < 2) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <GitCompareArrows className="h-14 w-14 mx-auto text-slate-300 dark:text-slate-600" />
        <h1 className="mt-4 font-display text-2xl font-extrabold text-slateink dark:text-white">Compare Products</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Select at least 2 products to compare side by side.</p>
        <Link href="/shop" className="btn-primary mt-6">Browse Shop</Link>
      </div>
    );
  }

  const specKeys = Array.from(new Set(products.flatMap((p) => p.specs.map((s) => s.label)))).slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slateink dark:text-white flex items-center gap-3">
            <GitCompareArrows className="h-7 w-7 text-skyline-500" /> Compare Products
          </h1>
          <div className="mt-2 h-1 w-14 rounded-full bg-skyline-500" />
        </div>
        <button onClick={clear} className="text-sm font-semibold text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300">
          Clear all
        </button>
      </div>

      <div className="mt-8 overflow-x-auto card">
        <table className="w-full min-w-[40rem]">
          <thead>
            <tr>
              <th className="table-th w-40">Product</th>
              {products.map((p) => (
                <th key={p.id} className="table-th text-center">
                  <Link href={`/product/${p.slug}`} className="block">
                    <ProductImage src={p.image} alt={p.title} className="mx-auto rounded-lg w-28 h-28 object-cover" />
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="table-td font-bold text-slate-500 dark:text-slate-300">Title</td>
              {products.map((p) => (
                <td key={p.id} className="table-td text-center font-semibold text-slateink dark:text-white">
                  <Link href={`/product/${p.slug}`} className="hover:text-primary-600 dark:hover:text-primary-400">{p.title}</Link>
                </td>
              ))}
            </tr>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <td className="table-td font-bold text-slate-500 dark:text-slate-300">Category</td>
              {products.map((p) => (
                <td key={p.id} className="table-td text-center">{p.category}</td>
              ))}
            </tr>
            <tr>
              <td className="table-td font-bold text-slate-500 dark:text-slate-300">Price</td>
              {products.map((p) => (
                <td key={p.id} className="table-td text-center">
                  <span className="font-display font-extrabold text-primary-700 dark:text-primary-400">{formatPrice(p.price)}</span>
                  {p.oldPrice && <span className="block text-xs text-slate-400 dark:text-slate-500 line-through">{formatPrice(p.oldPrice)}</span>}
                </td>
              ))}
            </tr>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <td className="table-td font-bold text-slate-500 dark:text-slate-300">Rating</td>
              {products.map((p) => (
                <td key={p.id} className="table-td text-center">
                  <span className="font-bold text-slateink dark:text-white">{p.rating.toFixed(1)}</span>
                  <span className="text-slate-400 dark:text-slate-500"> / 5 · {p.reviews} reviews</span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="table-td font-bold text-slate-500 dark:text-slate-300">Availability</td>
              {products.map((p) => (
                <td key={p.id} className="table-td text-center">
                  <span className={`text-sm font-semibold ${p.stock <= 0 ? "text-red-600" : p.stock <= 10 ? "text-amber-500" : "text-emerald-600"}`}>
                    {p.stock <= 0 ? "Sold out" : p.stock <= 10 ? `Low (${p.stock} left)` : `In stock (${p.stock})`}
                  </span>
                </td>
              ))}
            </tr>
            {specKeys.map((key, idx) => (
              <tr key={key} className={idx % 2 === 0 ? "bg-slate-50 dark:bg-slate-800/50" : ""}>
                <td className="table-td font-bold text-slate-500 dark:text-slate-300">{key}</td>
                {products.map((p) => {
                  const spec = p.specs.find((s) => s.label === key);
                  return (
                    <td key={p.id} className="table-td text-center">
                      {spec ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Check className="h-4 w-4 text-emerald-500" /> {spec.value}
                        </span>
                      ) : (
                        <Minus className="h-4 w-4 mx-auto text-slate-300 dark:text-slate-600" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td className="table-td font-bold text-slate-500 dark:text-slate-300">Action</td>
              {products.map((p) => (
                <td key={p.id} className="table-td text-center">
                  <button
                    onClick={() => {
                      add(p, 1);
                      toast("Added to cart");
                    }}
                    className="btn-primary !py-2 text-xs"
                  >
                    Add to Cart
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
