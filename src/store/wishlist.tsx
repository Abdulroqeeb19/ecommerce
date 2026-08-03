"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, setWishlist } from "@/lib/db";

interface WishlistContextValue {
  ids: string[];
  count: number;
  has: (id: string) => boolean;
  toggle: (id: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const ids = useLiveQuery(() => db.wishlist.toArray(), [], []);

  const toggle = useCallback(async (id: string) => {
    const rows = await db.wishlist.toArray();
    const current = rows.map((r) => r.id);
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    await setWishlist(next);
  }, []);

  const value = useMemo<WishlistContextValue>(() => {
    const list = (ids || []).map((r) => r.id);
    return {
      ids: list,
      count: list.length,
      has: (id: string) => list.includes(id),
      toggle
    };
  }, [ids, toggle]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
