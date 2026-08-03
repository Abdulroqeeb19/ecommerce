"use client";

import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { SEED_PRODUCTS } from "@/lib/data";
import { pullCatalog } from "@/lib/sync";
import { isOnline } from "@/lib/api";
import type { Product } from "@/lib/types";

export function useProducts(): { products: Product[]; loading: boolean } {
  const products = useLiveQuery(() => db.products.toArray(), [], []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const deleted = new Set((await db.deletedProducts.toArray()).map((d) => d.id));
      const seed = SEED_PRODUCTS.filter((p) => !deleted.has(p.id));
      const count = await db.products.count();
      if (count === 0) {
        await db.products.bulkPut(seed);
      } else {
        const existing = new Set((await db.products.toArray()).map((p) => p.id));
        const missing = seed.filter((p) => !existing.has(p.id));
        if (missing.length) await db.products.bulkPut(missing);
      }
      if (isOnline() && !cancelled) {
        await pullCatalog();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { products: products || [], loading: false };
}
