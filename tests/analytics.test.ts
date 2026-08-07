import { describe, it, expect } from "vitest";
import {
  revenueTrend,
  weekdayTrend,
  periodComparison,
  periodStats,
  statusBreakdown,
  channelSplit,
  categoryBreakdown,
  productBreakdown,
  filterOrdersByDays
} from "../src/lib/analytics";
import type { Order, Product } from "../src/lib/types";

function makeOrder(partial: Partial<Order>): Order {
  return {
    id: partial.id || "o1",
    orderNumber: partial.orderNumber || "GH-0001",
    items: partial.items || [],
    total: partial.total ?? 100,
    status: partial.status || "delivered",
    channel: partial.channel || "online",
    customer: partial.customer || { name: "Test" },
    createdAt: partial.createdAt || "2026-01-01T00:00:00.000Z",
    updatedAt: partial.updatedAt || "2026-01-01T00:00:00.000Z"
  };
}

const ref = new Date("2026-07-15T12:00:00.000Z");

describe("revenueTrend", () => {
  it("builds a zero-filled series of the requested length", () => {
    const orders = [makeOrder({ createdAt: "2026-07-14T10:00:00.000Z", total: 50 })];
    const points = revenueTrend(orders, 7, ref);
    expect(points).toHaveLength(7);
    const active = points.find((p) => p.revenue > 0)!;
    expect(active.revenue).toBe(50);
    expect(active.orders).toBe(1);
  });

  it("excludes cancelled orders", () => {
    const orders = [makeOrder({ createdAt: "2026-07-14T10:00:00.000Z", total: 50, status: "cancelled" })];
    const points = revenueTrend(orders, 3, ref);
    expect(points.every((p) => p.revenue === 0)).toBe(true);
  });

  it("sums units across items", () => {
    const orders = [
      makeOrder({
        createdAt: "2026-07-14T10:00:00.000Z",
        items: [
          { productId: "p1", title: "A", price: 10, qty: 2 },
          { productId: "p2", title: "B", price: 5, qty: 3 }
        ]
      })
    ];
    const points = revenueTrend(orders, 3, ref);
    const active = points.find((p) => p.units > 0)!;
    expect(active.units).toBe(5);
  });
});

describe("weekdayTrend", () => {
  it("returns 7 points with weekday labels", () => {
    const orders = [makeOrder({ createdAt: "2026-07-14T10:00:00.000Z", total: 50 })];
    const points = weekdayTrend(orders, ref);
    expect(points).toHaveLength(7);
    expect(points.every((p) => /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/.test(p.label))).toBe(true);
  });
});

describe("periodComparison", () => {
  it("computes revenue/order deltas between two windows", () => {
    // 15 days ago and 5 days ago (both within previous + current 10-day windows)
    const orders = [
      makeOrder({ createdAt: "2026-07-08T00:00:00.000Z", total: 100 }), // previous window (5..10 days ago)
      makeOrder({ createdAt: "2026-07-12T00:00:00.000Z", total: 300 }) // current window (0..5 days ago)
    ];
    const cmp = periodComparison(orders, 5, ref);
    expect(cmp.current.revenue).toBe(300);
    expect(cmp.previous.revenue).toBe(100);
    expect(cmp.revenueDelta).toBeCloseTo(200);
    expect(cmp.ordersDelta).toBeCloseTo(0);
    expect(cmp.current.aov).toBe(300);
  });

  it("returns 0 delta when both windows are empty", () => {
    const cmp = periodComparison([], 5, ref);
    expect(cmp.revenueDelta).toBe(0);
    expect(cmp.ordersDelta).toBe(0);
  });
});

describe("periodStats", () => {
  it("computes AOV and units", () => {
    const orders = [
      makeOrder({
        createdAt: "2026-07-14T00:00:00.000Z",
        total: 200,
        items: [{ productId: "p1", title: "A", price: 100, qty: 2 }]
      }),
      makeOrder({ createdAt: "2026-07-14T00:00:00.000Z", total: 100 })
    ];
    const stats = periodStats(orders, new Date("2026-07-14T00:00:00Z").getTime(), new Date("2026-07-15T00:00:00Z").getTime());
    expect(stats.orders).toBe(2);
    expect(stats.revenue).toBe(300);
    expect(stats.units).toBe(2);
    expect(stats.aov).toBe(150);
  });
});

describe("statusBreakdown", () => {
  it("groups and orders by status, excluding revenue of cancelled", () => {
    const orders = [
      makeOrder({ status: "delivered", total: 100 }),
      makeOrder({ status: "delivered", total: 200 }),
      makeOrder({ status: "pending", total: 50 }),
      makeOrder({ status: "cancelled", total: 999 })
    ];
    const rows = statusBreakdown(orders);
    const delivered = rows.find((r) => r.status === "delivered")!;
    const cancelled = rows.find((r) => r.status === "cancelled")!;
    expect(delivered.count).toBe(2);
    expect(delivered.revenue).toBe(300);
    expect(cancelled.revenue).toBe(0);
  });

  it("returns empty when there are no orders", () => {
    expect(statusBreakdown([])).toEqual([]);
  });
});

describe("channelSplit", () => {
  it("splits online vs school and ignores cancelled", () => {
    const orders = [
      makeOrder({ channel: "online", total: 100 }),
      makeOrder({ channel: "school", total: 50 }),
      makeOrder({ channel: "school", total: 25 }),
      makeOrder({ channel: "online", total: 999, status: "cancelled" })
    ];
    const rows = channelSplit(orders);
    const online = rows.find((r) => r.channel === "online")!;
    const school = rows.find((r) => r.channel === "school")!;
    expect(online.count).toBe(1);
    expect(online.revenue).toBe(100);
    expect(school.count).toBe(2);
    expect(school.revenue).toBe(75);
  });
});

describe("categoryBreakdown", () => {
  it("maps items to product categories and aggregates", () => {
    const products: Product[] = [
      { id: "p1", category: "Laptops and Notebooks" } as Product,
      { id: "p2", category: "Audio and Headphones" } as Product
    ];
    const orders = [
      makeOrder({
        items: [
          { productId: "p1", title: "Laptop", price: 900, qty: 1 },
          { productId: "p2", title: "Headphones", price: 100, qty: 2 }
        ]
      })
    ];
    const rows = categoryBreakdown(orders, products);
    expect(rows[0]).toMatchObject({ category: "Laptops and Notebooks", revenue: 900, units: 1 });
    expect(rows[1]).toMatchObject({ category: "Audio and Headphones", revenue: 200, units: 2 });
  });

  it("falls back to Uncategorized when product is missing", () => {
    const orders = [makeOrder({ items: [{ productId: "ghost", title: "X", price: 10, qty: 1 }] })];
    const rows = categoryBreakdown(orders, []);
    expect(rows[0].category).toBe("Uncategorized");
  });
});

describe("productBreakdown", () => {
  it("aggregates per-product units, revenue and order count", () => {
    const orders = [
      makeOrder({ items: [{ productId: "p1", title: "A", price: 10, qty: 2 }] }),
      makeOrder({ items: [{ productId: "p1", title: "A", price: 10, qty: 3 }] }),
      makeOrder({ items: [{ productId: "p2", title: "B", price: 20, qty: 1 }] })
    ];
    const rows = productBreakdown(orders);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ id: "p1", units: 5, revenue: 50, orders: 2 });
  });
});

describe("filterOrdersByDays", () => {
  it("keeps orders within the window and returns all for days=0", () => {
    const orders = [
      makeOrder({ createdAt: "2026-07-14T00:00:00.000Z" }),
      makeOrder({ createdAt: "2026-07-01T00:00:00.000Z" })
    ];
    expect(filterOrdersByDays(orders, 7, ref)).toHaveLength(1);
    expect(filterOrdersByDays(orders, 0, ref)).toHaveLength(2);
  });
});
