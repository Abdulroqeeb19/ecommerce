"use client";

import { db, getPendingOps, markSynced, queueOperation, resetLocalCatalog, upsertProducts } from "./db";
import { api, isOnline, type SyncResult, type OrderPayload } from "./api";
import type { Order, Product } from "./types";

export async function pullCatalog(): Promise<number> {
  if (!isOnline()) return 0;
  try {
    const products = await api.get<Product[]>("/products");
    const deleted = new Set((await db.deletedProducts.toArray()).map((d) => d.id));
    await upsertProducts(products.filter((p) => !deleted.has(p.id)));
    return products.length;
  } catch {
    return 0;
  }
}

export async function pushQueue(): Promise<{ pushed: number; failed: number; errors: string[] }> {
  const pending = await getPendingOps();
  let pushed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const op of pending) {
    try {
      switch (op.op) {
        case "create-product":
        case "update-product": {
          await api.post("/products", op.payload);
          break;
        }
        case "update-stock": {
          await api.put(`/products/${op.payload.id}/stock`, { stock: op.payload.stock });
          break;
        }
        case "create-order": {
          const created = (await api.post("/orders", op.payload)) as Order;
          if (created?.id) await db.orders.update(created.id, { synced: true });
          break;
        }
        case "update-order": {
          await api.put(`/orders/${op.payload.id}`, { status: op.payload.status });
          break;
        }
        case "delete-product": {
          await api.del(`/products/${op.payload.id}`);
          break;
        }
        default:
          break;
      }
      await markSynced(op.id!);
      pushed++;
    } catch (e) {
      failed++;
      errors.push((e as Error).message);
    }
  }
  return { pushed, failed, errors };
}

export async function syncAll(): Promise<SyncResult> {
  const push = await pushQueue();
  const pulled = await pullCatalog();
  return { pushed: push.pushed, pulled, failed: push.failed, errors: push.errors };
}

export function registerSyncHooks(onSync?: (r: SyncResult) => void) {
  if (typeof window === "undefined") return () => {};

  const handler = async () => {
    if (navigator.onLine) {
      const result = await syncAll();
      onSync?.(result);
    }
  };

  window.addEventListener("online", handler);
  pullCatalog();
  return () => window.removeEventListener("online", handler);
}

export async function saveOrderOffline(order: Order) {
  await db.orders.put({ ...order, synced: false });
  await queueOperation("create-order", { ...order, synced: false });
}

async function decrementStock(items: Order["items"]) {
  for (const it of items) {
    const p = await db.products.get(it.productId);
    if (p) await db.products.put({ ...p, stock: Math.max(0, p.stock - it.qty) });
  }
}

export async function placeOrder(order: Order) {
  const payload = {
    id: order.id,
    orderNumber: order.orderNumber,
    items: order.items,
    total: order.total,
    customer: order.customer,
    channel: order.channel,
    source: order.source,
    status: order.status,
    createdAt: order.createdAt
  };

  if (isOnline()) {
    try {
      const created = await api.post<Order>("/orders", payload);
      await db.orders.put(created);
      await decrementStock(order.items);
      return { online: true, order: created };
    } catch {
      await saveOrderOffline(order);
      await decrementStock(order.items);
      return { online: false, order };
    }
  } else {
    await saveOrderOffline(order);
    await decrementStock(order.items);
    return { online: false, order };
  }
}
