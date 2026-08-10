"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx } from "@/lib/utils";

function pageNumbers(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const nums = Array.from(new Set([1, pageCount, page - 1, page, page + 1]))
    .filter((n) => n >= 1 && n <= pageCount)
    .sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const n of nums) {
    if (n - prev > 1) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
}

interface PaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <nav className="mt-6 flex items-center justify-center gap-1.5 flex-wrap" aria-label="Pagination">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pageNumbers(page, pageCount).map((n, i) =>
        n === "…" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-slate-400 dark:text-slate-500">
            …
          </span>
        ) : (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={cx(
              "min-w-9 rounded-lg border px-3 py-1.5 text-sm font-bold transition-colors",
              n === page
                ? "bg-primary-600 border-primary-600 text-white"
                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
            aria-label={`Go to page ${n}`}
            aria-current={n === page ? "page" : undefined}
          >
            {n}
          </button>
        )
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
