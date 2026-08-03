"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, setWishlist } from "@/lib/db";
import type { Product } from "@/lib/types";

interface CompareContextValue {
  products: Product[];
  count: number;
  has: (id: string) => boolean;
  toggle: (product: Product) => void;
  clear: () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

const STORE_KEY = "gh-compare";

export function CompareProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const toggle = useCallback((product: Product) => {
    setProducts((prev) => {
      const next = prev.some((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product];
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setProducts([]);
    localStorage.removeItem(STORE_KEY);
  }, []);

  const value = useMemo<CompareContextValue>(
    () => ({
      products,
      count: products.length,
      has: (id: string) => products.some((p) => p.id === id),
      toggle,
      clear
    }),
    [products, toggle, clear]
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
