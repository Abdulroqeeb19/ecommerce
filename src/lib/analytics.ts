import type { Order, OrderStatus, Product } from "./types";

export interface TrendPoint {
  key: string;
  label: string;
  revenue: number;
  orders: number;
  units: number;
}

export interface PeriodStats {
  revenue: number;
  orders: number;
  units: number;
  aov: number;
}

export interface PeriodComparison {
  current: PeriodStats;
  previous: PeriodStats;
  revenueDelta: number;
  ordersDelta: number;
  unitsDelta: number;
  aovDelta: number;
}

export interface StatusStat {
  status: OrderStatus;
  count: number;
  revenue: number;
}

export interface ChannelStat {
  channel: "online" | "school";
  count: number;
  revenue: number;
}

export interface CategoryStat {
  category: string;
  revenue: number;
  units: number;
}

export interface ProductStat {
  id: string;
  title: string;
  units: number;
  revenue: number;
  orders: number;
}

const DAY_MS = 86400000;

export function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function aov(revenue: number, orders: number): number {
  return orders > 0 ? revenue / orders : 0;
}

export function revenueTrend(orders: Order[], days: number, ref = new Date()): TrendPoint[] {
  const today = startOfDay(ref);
  const buckets = new Map<string, TrendPoint>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, {
      key,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: 0,
      orders: 0,
      units: 0
    });
  }
  const cutoff = today.getTime() - (days - 1) * DAY_MS;
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const t = new Date(o.createdAt).getTime();
    if (t < cutoff || t > today.getTime() + DAY_MS) continue;
    const key = new Date(t).toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.revenue += o.total;
    bucket.orders += 1;
    bucket.units += o.items.reduce((s, i) => s + i.qty, 0);
  }
  return Array.from(buckets.values());
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function weekdayTrend(orders: Order[], ref = new Date()): TrendPoint[] {
  return revenueTrend(orders, 7, ref).map((p) => ({
    ...p,
    label: WEEKDAYS[new Date(`${p.key}T00:00:00Z`).getUTCDay()]
  }));
}

export function periodStats(orders: Order[], from: number, to: number): PeriodStats {
  let revenue = 0;
  let count = 0;
  let units = 0;
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const t = new Date(o.createdAt).getTime();
    if (t < from || t >= to) continue;
    revenue += o.total;
    count += 1;
    units += o.items.reduce((s, i) => s + i.qty, 0);
  }
  return { revenue, orders: count, units, aov: aov(revenue, count) };
}

export function periodComparison(orders: Order[], days: number, ref = new Date()): PeriodComparison {
  const today = startOfDay(ref);
  const currentFrom = today.getTime() - days * DAY_MS;
  const current = periodStats(orders, currentFrom, today.getTime() + DAY_MS);
  const previous = periodStats(orders, currentFrom - days * DAY_MS, currentFrom);

  const pct = (cur: number, prev: number) => (prev === 0 ? (cur === 0 ? 0 : 100) : ((cur - prev) / prev) * 100);
  return {
    current,
    previous,
    revenueDelta: pct(current.revenue, previous.revenue),
    ordersDelta: pct(current.orders, previous.orders),
    unitsDelta: pct(current.units, previous.units),
    aovDelta: pct(current.aov, previous.aov)
  };
}

export function statusBreakdown(orders: Order[]): StatusStat[] {
  const statuses: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];
  const map = new Map<OrderStatus, StatusStat>();
  for (const s of statuses) map.set(s, { status: s, count: 0, revenue: 0 });
  for (const o of orders) {
    const entry = map.get(o.status);
    if (!entry) continue;
    entry.count += 1;
    if (o.status !== "cancelled") entry.revenue += o.total;
  }
  return statuses.map((s) => map.get(s)!).filter((s) => s.count > 0);
}

export function channelSplit(orders: Order[]): ChannelStat[] {
  const online: ChannelStat = { channel: "online", count: 0, revenue: 0 };
  const school: ChannelStat = { channel: "school", count: 0, revenue: 0 };
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const target = o.channel === "school" ? school : online;
    target.count += 1;
    target.revenue += o.total;
  }
  return [online, school].filter((s) => s.count > 0);
}

export function categoryBreakdown(orders: Order[], products: Product[]): CategoryStat[] {
  const catById = new Map(products.map((p) => [p.id, p.category || "Uncategorized"]));
  const map = new Map<string, CategoryStat>();
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    for (const item of o.items) {
      const category = catById.get(item.productId) || "Uncategorized";
      const entry = map.get(category) || { category, revenue: 0, units: 0 };
      entry.revenue += item.price * item.qty;
      entry.units += item.qty;
      map.set(category, entry);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
}

export function productBreakdown(orders: Order[]): ProductStat[] {
  const map = new Map<string, ProductStat>();
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    for (const item of o.items) {
      const entry = map.get(item.productId) || {
        id: item.productId,
        title: item.title,
        units: 0,
        revenue: 0,
        orders: 0
      };
      entry.units += item.qty;
      entry.revenue += item.price * item.qty;
      entry.orders += 1;
      map.set(item.productId, entry);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
}

export function filterOrdersByDays(orders: Order[], days: number, ref = new Date()): Order[] {
  if (!days) return orders;
  const cutoff = startOfDay(ref).getTime() - (days - 1) * DAY_MS;
  return orders.filter((o) => new Date(o.createdAt).getTime() >= cutoff);
}
