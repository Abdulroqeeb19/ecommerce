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
      // Skip the cloud pull when we synced recently. The 30s background sync
      // (see store/providers.tsx) already keeps the local catalog fresh, and
      // re-downloading every product on each mount is the main cause of slow
      // category/shop navigation.
      if (isOnline() && !cancelled) {
        const last = (await db.meta.get("catalogPullAt"))?.value;
        if (!last || Date.now() - new Date(last).getTime() > 30_000) {
          await pullCatalog();
          await db.meta.put({ key: "catalogPullAt", value: new Date().toISOString() });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { products: products || [], loading: false };
}
