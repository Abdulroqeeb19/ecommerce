"use client";

import Dexie, { type Table } from "dexie";
import type { CartItem, Order, Product, SyncQueueItem, User } from "./types";

export interface SyncedMeta {
  key: string;
  value: string;
}

export class GadgetHubDB extends Dexie {
  products!: Table<Product, string>;
  orders!: Table<Order, string>;
  cart!: Table<CartItem, string>;
  wishlist!: Table<{ id: string }, string>;
  syncQueue!: Table<SyncQueueItem, number>;
  meta!: Table<SyncedMeta, string>;
  deletedProducts!: Table<{ id: string; deletedAt: string }, string>;

  constructor() {
    super("gadget-hub");
    this.version(1).stores({
      products: "id, slug, category, title, price, stock",
      orders: "id, orderNumber, status, channel, createdAt",
      cart: "id",
      wishlist: "id",
      syncQueue: "++id, op, synced, createdAt",
      meta: "key"
    });
    this.version(2).stores({
      products: "id, slug, category, title, price, stock",
      orders: "id, orderNumber, status, channel, createdAt",
      cart: "id",
      wishlist: "id",
      syncQueue: "++id, op, synced, createdAt",
      meta: "key",
      deletedProducts: "id"
    });
  }
}

export const db = typeof window !== "undefined" ? new GadgetHubDB() : (null as unknown as GadgetHubDB);

export async function upsertProducts(products: Product[]) {
  await db.products.bulkPut(products);
}

export async function getLocalProducts(): Promise<Product[]> {
  return db.products.toArray();
}

export async function resetLocalCatalog() {
  await db.products.clear();
}

export async function getCart(): Promise<CartItem[]> {
  return db.cart.toArray();
}

export async function setCart(items: CartItem[]) {
  await db.cart.clear();
  if (items.length) await db.cart.bulkPut(items);
}

export async function getWishlist(): Promise<string[]> {
  const rows = await db.wishlist.toArray();
  return rows.map((r) => r.id);
}

export async function setWishlist(ids: string[]) {
  await db.wishlist.clear();
  if (ids.length) await db.wishlist.bulkPut(ids.map((id) => ({ id })));
}

export async function queueOperation(op: SyncQueueItem["op"], payload: Record<string, unknown>) {
  await db.syncQueue.add({ op, payload, synced: false, createdAt: new Date().toISOString() });
}

export async function getPendingOps() {
  return db.syncQueue.filter((op) => !op.synced).toArray();
}

export async function markSynced(id: number) {
  await db.syncQueue.update(id, { synced: true });
}

export async function saveOrder(order: Order) {
  await db.orders.put(order);
}

export async function getLocalOrders(): Promise<Order[]> {
  return db.orders.toArray();
}
