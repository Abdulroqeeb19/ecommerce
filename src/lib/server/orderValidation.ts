import type { OrderStatus } from "../types";

export const VALID_STATUS: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];

export function isValidOrderStatus(s: unknown): s is OrderStatus {
  return typeof s === "string" && (VALID_STATUS as string[]).includes(s);
}
