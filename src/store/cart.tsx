"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, setCart } from "@/lib/db";
import type { CartItem, Product } from "@/lib/types";

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (product: Product, qty?: number) => Promise<void>;
  updateQty: (productId: string, qty: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useLiveQuery(() => db.cart.toArray(), [], []);

  const add = useCallback(async (product: Product, qty = 1) => {
    if (product.stock <= 0) return;
    const current = await db.cart.toArray();
    const existing = current.find((c) => c.id === product.id);
    const maxQty = product.stock;
    if (existing) {
      const next = current.map((c) => (c.id === product.id ? { ...c, qty: Math.min(c.qty + qty, maxQty) } : c));
      await setCart(next);
    } else {
      await setCart([...current, { id: product.id, product, qty: Math.min(qty, maxQty) }]);
    }
  }, []);

  const updateQty = useCallback(async (productId: string, qty: number) => {
    const current = await db.cart.toArray();
    const next = current.map((c) => (c.id === productId ? { ...c, qty: Math.max(1, Math.min(qty, c.product.stock)) } : c));
    await setCart(next);
  }, []);

  const remove = useCallback(async (productId: string) => {
    await db.cart.delete(productId);
  }, []);

  const clear = useCallback(async () => {
    await db.cart.clear();
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const list = items || [];
    return {
      items: list,
      count: list.reduce((s, i) => s + i.qty, 0),
      subtotal: list.reduce((s, i) => s + i.qty * i.product.price, 0),
      add,
      updateQty,
      remove,
      clear
    };
  }, [items, add, updateQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
