"use client";

import { clearSyncedOps, db, getPendingOps, markSynced, markOpError, markOpConflict, queueOperation, setSyncMeta, upsertProducts } from "./db";
import { api, isOnline, type SyncResult } from "./api";
import { compressDataUrl } from "./image";
import type { Order, Product, SyncQueueItem } from "./types";

let syncAllRunning = false;
let syncAllWaiters: Array<() => void> = [];

/**
 * Serializes syncAll runs so the 20s interval, the online handler and manual
 * "Sync Now" clicks never push the same queued operation twice concurrently.
 */
async function runExclusive(fn: () => Promise<void>): Promise<void> {
  if (syncAllRunning) {
    await new Promise<void>((resolve) => syncAllWaiters.push(resolve));
    return runExclusive(fn);
  }
  syncAllRunning = true;
  try {
    await fn();
  } finally {
    syncAllRunning = false;
    const waiters = syncAllWaiters;
    syncAllWaiters = [];
    for (const w of waiters) w();
  }
}

export async function pullCatalog(): Promise<number> {
  if (!isOnline()) return 0;
  try {
    const products = await api.get<Product[]>("/products");
    const deleted = new Set((await db.deletedProducts.toArray()).map((d) => d.id));
    const live = products.filter((p) => !deleted.has(p.id));
    // Never overwrite or delete local products whose edits have not finished
    // pushing, otherwise a failed sync (e.g. oversized image) would wipe the
    // local copy before it can be retried.
    const pendingOps = await db.syncQueue.filter((o) => !o.synced).toArray();
    const pendingIds = new Set(
      pendingOps.flatMap((o) =>
        o.op === "create-product" || o.op === "update-product"
          ? [String((o.payload as { id?: string } | undefined)?.id ?? "")]
          : []
      ).filter(Boolean)
    );
    // A conflicted product means the cloud copy is newer/authoritative. Resolve
    // it by mirroring the cloud state and dropping the stale op, so a conflict
    // is not stuck forever behind the pendingIds guard.
    const conflictedIds = new Set(
      pendingOps.filter((o) => o.conflicted).map((o) => String((o.payload as { id?: string } | undefined)?.id ?? ""))
    );
    const resolveIds = [...conflictedIds].filter(Boolean);
    const safe = live.filter((p) => !pendingIds.has(p.id) || resolveIds.includes(p.id));
    await upsertProducts(safe);
    if (resolveIds.length) {
      const toDrop = pendingOps.filter(
        (o) =>
          o.conflicted &&
          (o.op === "create-product" || o.op === "update-product") &&
          resolveIds.includes(String((o.payload as { id?: string } | undefined)?.id ?? ""))
      );
      const ids = toDrop.map((o) => o.id!).filter((id): id is number => typeof id === "number");
      if (ids.length) await db.syncQueue.bulkDelete(ids);
      // If the cloud no longer has a conflicted product, mirror the deletion.
      const removedLocally = resolveIds.filter((id) => !live.some((p) => p.id === id));
      if (removedLocally.length) await db.products.bulkDelete(removedLocally);
    }
    const stale = await db.products.toArray().then((rows) =>
      rows
        .filter(
          (r) => !pendingIds.has(r.id) && !live.some((p) => p.id === r.id) && !deleted.has(r.id)
        )
        .map((r) => r.id)
    );
    if (stale.length) await db.products.bulkDelete(stale);
    return live.length;
  } catch {
    return 0;
  }
}

function isConflictError(e: unknown): boolean {
  return (e as { message?: string })?.message?.toLowerCase().includes("conflict") ?? false;
}

function isNotFoundError(e: unknown): boolean {
  return (e as { status?: number })?.status === 404;
}

// Stop auto-retrying an op after this many failed attempts; it is left in the
// queue with its error visible for a manual Retry decision.
const MAX_AUTO_ATTEMPTS = 10;

export async function pushQueue(): Promise<{ pushed: number; failed: number; conflicts: number; errors: string[] }> {
  const pending = await getPendingOps();
  let pushed = 0;
  let failed = 0;
  let conflicts = 0;
  const errors: string[] = [];

  for (const op of pending) {
    // Conflicted ops need a human decision (pull cloud or edit again) — do not
    // re-push them on every auto-sync; that only re-conflicts and churns.
    if (op.conflicted) {
      conflicts++;
      continue;
    }
    // Permanently failing ops must not be re-pushed every 20s forever.
    if ((op.attempts || 0) >= MAX_AUTO_ATTEMPTS) {
      failed++;
      continue;
    }
    try {
      switch (op.op) {
        case "create-product":
        case "update-product": {
          const payload = { ...op.payload };
          const image = typeof payload.image === "string" ? payload.image : "";
          if (image.startsWith("data:image/") && image.length > 4 * 1024 * 1024) {
            try {
              payload.image = await compressDataUrl(image);
            } catch {
              // keep original if compression fails; push will surface the error
            }
          }
          await api.post("/products", payload);
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
      if (isConflictError(e)) {
        conflicts++;
        await markOpConflict(op.id!, (e as Error).message);
      } else if (isNotFoundError(e)) {
        // The target was already removed from the cloud (deleted elsewhere),
        // so the intent is already satisfied — drop the op instead of failing.
        await markSynced(op.id!);
        pushed++;
      } else {
        failed++;
        await markOpError(op.id!, (e as Error).message);
      }
      errors.push((e as Error).message);
    }
  }
  return { pushed, failed, conflicts, errors };
}

export async function syncAll(): Promise<SyncResult> {
  let push: Awaited<ReturnType<typeof pushQueue>> = { pushed: 0, failed: 0, conflicts: 0, errors: [] };
  let pulled = 0;
  await runExclusive(async () => {
    push = await pushQueue();
    pulled = await pullCatalog();
    await setSyncMeta(new Date().toISOString());
    await clearSyncedOps();
  });
  return {
    pushed: push.pushed,
    pulled,
    failed: push.failed,
    conflicts: push.conflicts,
    errors: push.errors
  };
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

export async function syncQueueSnapshot(): Promise<SyncQueueItem[]> {
  const rows = await db.syncQueue.toArray();
  return rows
    .filter((r) => !r.synced)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Number of queued ops that can still be auto-retried (below the attempt cap). */
export async function retryablePendingCount(): Promise<number> {
  const rows = await db.syncQueue.filter((o) => !o.synced).toArray();
  return rows.filter((o) => !o.conflicted && (o.attempts || 0) < MAX_AUTO_ATTEMPTS).length;
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
    couponCode: order.couponCode,
    discount: order.discount,
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
