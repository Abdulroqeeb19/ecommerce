import { listOrders, listProducts, getManagerSchedule, managerForWeekday, updateOrderStatus, findUserById } from "./store";
import type { Order, Product } from "../types";

const TELEGRAM_API = "https://api.telegram.org";

export function allowedTelegramIds(): Set<number> {
  const out = new Set<number>();
  for (const raw of [process.env.TELEGRAM_ADMIN_IDS, process.env.TELEGRAM_MANAGER_IDS]) {
    for (const part of (raw || "").split(",")) {
      const n = Number(part.trim());
      if (Number.isInteger(n)) out.add(n);
    }
  }
  return out;
}

export function isAllowedTelegramUser(fromId?: number | string): boolean {
  if (fromId === undefined || fromId === null) return false;
  return allowedTelegramIds().has(Number(fromId));
}

export function escapeMarkdown(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1");
}

function orderBlock(o: Order): string {
  return [
    `🧾 *${o.orderNumber}* — ${o.status}`,
    `Customer: ${escapeMarkdown(o.customer.name || o.customer.email || "—")}${o.customer.grade ? ` (${escapeMarkdown(o.customer.grade)})` : ""}`,
    `Total: *$${o.total.toFixed(2)}*`,
    `Placed: ${new Date(o.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
  ].join("\n");
}

function todayKey(): string {
  return new Date().toDateString();
}

function weekdayName(day: number): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day] || "Unknown";
}

export async function ordersPendingText(): Promise<string> {
  const orders = await listOrders();
  const pending = orders.filter((o) => o.status === "pending");
  if (!pending.length) return "📭 *No pending orders right now.*";
  const total = pending.reduce((s, o) => s + o.total, 0);
  return [
    `🕐 *Pending orders: ${pending.length}*`,
    `Value at stake: **$${total.toFixed(2)}**`,
    "",
    ...pending.slice(0, 10).map((o, i) => `${i + 1}. ${orderBlock(o)}`),
    pending.length > 10 ? `...and ${pending.length - 10} more.` : ""
  ].join("\n");
}

export async function todaySummary(): Promise<string> {
  const orders = await listOrders();
  const todays = orders.filter((o) => new Date(o.createdAt).toDateString() === todayKey());
  const pending = todays.filter((o) => o.status === "pending");
  const schedule = await getManagerSchedule();
  const dutyId = managerForWeekday(schedule, new Date().getDay());
  let dutyLine = "";
  if (dutyId) {
    const u = await findUserById(dutyId);
    dutyLine = `Duty manager today: ${escapeMarkdown(u?.name || u?.email || "unknown")}`;
  }
  return [
    `📅 *Today — ${weekdayName(new Date().getDay())}*`,
    "",
    `Orders placed: **${todays.length}**`,
    `Pending still open: **${pending.length}**`,
    `Revenue placed today: *$${todays.reduce((s, o) => s + o.total, 0).toFixed(2)}*`,
    dutyLine ? dutyLine : null,
    "",
    ...pending.slice(0, 14).map((o) => `• ${o.orderNumber} · $${o.total.toFixed(2)}`)
  ]
    .filter((x) => x !== null && x !== undefined)
    .join("\n");
}

export function lowStockSummary(products: Product[]): string {
  const low = products.filter((p) => p.stock <= 5);
  if (!low.length) return "✅ *Stock is healthy* — nothing at ≤5 left.";
  return [
    `⚠️ *Low stock (≤5 units)*`,
    "",
    ...low.map((p) => `• ${escapeMarkdown(p.title)} — **${p.stock}** left`)
  ].join("\n");
}

export async function statusText(): Promise<string> {
  const orders = await listOrders();
  const products = await listProducts();
  const pending = orders.filter((o) => o.status === "pending");
  const todays = orders.filter((o) => new Date(o.createdAt).toDateString() === todayKey());
  const schedule = await getManagerSchedule();
  const rota = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(async (d, i) => {
    const id = managerForWeekday(schedule, i);
    if (!id) return `${d}: —`;
    const u = await findUserById(id);
    return `${d}: ${escapeMarkdown(u?.name || u?.email || "—")}`;
  });
  const rotaLines = await Promise.all(rota);
  return [
    `📊 *AYINDEDUNNY ENTERPRISE — Status*`,
    "",
    `Orders pending: **${pending.length}**`,
    `Orders today: **${todays.length}**`,
    lowStockSummary(products),
    "",
    "Duty rota:",
    ...rotaLines
  ].join("\n");
}

export async function dutyManagerToday(): Promise<string> {
  const schedule = await getManagerSchedule();
  const id = managerForWeekday(schedule, new Date().getDay());
  if (!id) return "No manager assigned to today.";
  const u = await findUserById(id);
  return `🛡️ Today's duty manager: **${escapeMarkdown(u?.name || u?.email || "unknown")}**`;
}

async function applyOrderStatus(orderId: string, status: Order["status"]): Promise<{ ok: boolean; message: string }> {
  const updated = await updateOrderStatus(orderId, status);
  if (!updated) return { ok: false, message: "Order not found." };
  return { ok: true, message: `✅ ${updated.orderNumber} → *${status}*` };
}

export async function completeOrderCallback(action: string, orderId: string): Promise<{ ok: boolean; message: string }> {
  const map: Record<string, Order["status"]> = {
    approve: "processing",
    deliver: "delivered",
    cancel: "cancelled"
  };
  if (!(action in map)) return { ok: false, message: "Unknown action." };
  return applyOrderStatus(orderId, map[action]);
}

export function orderActionKeyboard(orderId: string): { inline_keyboard: { text: string; callback_data: string }[][] } {
  return {
    inline_keyboard: [
      [
        { text: "✅ Approve", callback_data: `order:approve:${orderId}` },
        { text: "🚚 Deliver", callback_data: `order:deliver:${orderId}` },
        { text: "❌ Cancel", callback_data: `order:cancel:${orderId}` }
      ]
    ]
  };
}

export async function sendBotMessage(token: string, chatId: number | string, text: string, replyMarkup?: Record<string, unknown>): Promise<boolean> {
  const payload: Record<string, unknown> = { chat_id: chatId, text, parse_mode: "Markdown" };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function answerCallback(token: string, callbackId: string, text?: string): Promise<void> {
  await fetch(`${TELEGRAM_API}/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId, text })
  }).catch(() => {});
}