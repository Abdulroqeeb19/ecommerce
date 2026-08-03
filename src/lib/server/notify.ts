import type { Order } from "../types";

function fmtItems(order: Order): string {
  return order.items.map((i) => `${i.qty}× ${i.title}`).join(", ");
}

function textFor(order: Order): string {
  return [
    `🛒 *GADGET HUB - New Order*`,
    `Order #: ${order.orderNumber}`,
    `Customer: ${order.customer.name || order.customer.email}`,
    order.customer.grade ? `Grade: ${order.customer.grade}` : "",
    order.customer.school ? `School: ${order.customer.school}` : "",
    `Items: ${fmtItems(order)}`,
    `Total: $${order.total.toFixed(2)}`,
    order.customer.note ? `Note: ${order.customer.note}` : "",
    order.channel === "school" ? "Channel: 🏫 School Mini-Store" : "Channel: 🌐 Online"
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" })
  });
  return res.ok;
}

async function sendWhatsApp(text: string): Promise<boolean> {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_TOKEN;
  const to = process.env.WHATSAPP_TO;
  if (!phoneId || !token || !to) return false;
  const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text.replace(/\*/g, "") }
    })
  });
  return res.ok;
}

async function sendEmail(order: Order, text: string): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const to = process.env.NOTIFY_EMAIL_TO;
  const from = process.env.NOTIFY_EMAIL_FROM || "orders@gadgetstore.com";
  if (!apiKey || !to) return false;
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject: `New Gadget Hub Order ${order.orderNumber} — $${order.total.toFixed(2)}`,
      content: [{ type: "text/plain", value: text }]
    })
  });
  return res.ok;
}

async function sendSms(text: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  const to = process.env.TWILIO_TO;
  if (!sid || !token || !from || !to) return false;
  const body = new URLSearchParams({ From: from, To: to, Body: text.replace(/\*/g, "") });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  return res.ok;
}

export interface ChannelStatus {
  telegram: boolean;
  whatsapp: boolean;
  email: boolean;
  sms: boolean;
}

export function channelStatus(): ChannelStatus {
  return {
    telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    whatsapp: Boolean(process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_TOKEN),
    email: Boolean(process.env.SENDGRID_API_KEY && process.env.NOTIFY_EMAIL_TO),
    sms: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM && process.env.TWILIO_TO)
  };
}

export async function notifyOrderPlaced(order: Order): Promise<{ delivered: string[]; failed: string[] }> {
  const text = textFor(order);
  const delivered: string[] = [];
  const failed: string[] = [];

  const jobs: [string, () => Promise<boolean>][] = [
    ["telegram", () => sendTelegram(text)],
    ["whatsapp", () => sendWhatsApp(text)],
    ["email", () => sendEmail(order, text)],
    ["sms", () => sendSms(text)]
  ];

  for (const [name, fn] of jobs) {
    try {
      if (await fn()) delivered.push(name);
      else failed.push(name);
    } catch {
      failed.push(name);
    }
  }

  return { delivered, failed };
}

export async function sendTestNotification(channel?: string): Promise<{ delivered: string[]; failed: string[] }> {
  const text = `🧪 *Test Notification* — Gadget Hub notification channels are operational.\nTime: ${new Date().toLocaleString()}`;
  const map: Record<string, () => Promise<boolean>> = {
    telegram: () => sendTelegram(text),
    whatsapp: () => sendWhatsApp(text),
    email: () => sendEmail({} as Order, text.replace(/\*/g, "")),
    sms: () => sendSms(text)
  };

  const keys = channel && channel !== "all" ? [channel] : Object.keys(map);
  const delivered: string[] = [];
  const failed: string[] = [];

  for (const key of keys) {
    try {
      if (await map[key]()) delivered.push(key);
      else failed.push(key);
    } catch {
      failed.push(key);
    }
  }
  return { delivered, failed };
}
