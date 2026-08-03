"use client";

import Link from "next/link";
import Image from "next/image";
import { X, GitCompareArrows } from "lucide-react";
import { useCompare } from "@/store/compare";
import { formatPrice } from "@/lib/utils";

export function CompareTray() {
  const { products, count, toggle, clear } = useCompare();
  if (count === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-8px_30px_rgba(15,23,42,0.12)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 flex-wrap">
        <span className="flex items-center gap-2 text-sm font-bold text-slateink dark:text-white">
          <GitCompareArrows className="h-5 w-5 text-skyline-500" /> Compare ({count})
        </span>
        <div className="flex items-center gap-2">
          {products.map((p) => (
            <div key={p.id} className="relative">
              <Image src={p.image} alt={p.title} width={44} height={44} className="rounded-lg w-11 h-11 object-cover border border-slate-200 dark:border-slate-700" />
              <button
                onClick={() => toggle(p)}
                className="absolute -top-1.5 -right-1.5 rounded-full bg-slateink text-white w-4 h-4 flex items-center justify-center"
                aria-label={`Remove ${p.title} from compare`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400 ml-1">
          {products.map((p) => p.title.split(" - ")[0]).join(" vs ")}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={clear} className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-500 px-3 py-2">
            Clear all
          </button>
          <Link
            href="/compare"
            className="rounded-lg bg-skyline-500 hover:bg-skyline-600 text-white text-sm font-bold px-5 py-2.5"
          >
            Compare Now
          </Link>
        </div>
      </div>
    </div>
  );
}
