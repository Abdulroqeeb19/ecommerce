"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, setWishlist } from "@/lib/db";
import { api, isOnline } from "@/lib/api";
import { useAuth } from "@/store/auth";

interface WishlistContextValue {
  ids: string[];
  count: number;
  has: (id: string) => boolean;
  toggle: (id: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const ids = useLiveQuery(() => db.wishlist.toArray(), [], []);
  const { user } = useAuth();
  const lastUserId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!user) {
      lastUserId.current = undefined;
      return;
    }
    if (lastUserId.current === user.id) return;
    lastUserId.current = user.id;
    (async () => {
      try {
        const local = (await db.wishlist.toArray()).map((r) => r.id);
        const remote = isOnline() ? (await api.get<{ ids: string[] }>("/wishlist")).ids : [];
        const merged = Array.from(new Set([...local, ...remote]));
        await setWishlist(merged);
        if (isOnline()) {
          await api.put("/wishlist", { ids: merged });
        }
      } catch {
        // offline or auth issue — keep local wishlist as-is
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const toggle = useCallback(
    async (id: string) => {
      const rows = await db.wishlist.toArray();
      const current = rows.map((r) => r.id);
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      await setWishlist(next);
      if (user && isOnline()) {
        try {
          await api.put("/wishlist", { ids: next });
        } catch {
          // offline — will sync next time
        }
      }
    },
    [user]
  );

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
