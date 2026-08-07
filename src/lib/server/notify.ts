import { getSettings } from "./store";
import type { NotificationSettings, Order } from "../types";

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
    order.channel === "school" ? "Channel: 🏫 Mini-Store for Schools" : "Channel: 🌐 Online"
  ]
    .filter(Boolean)
    .join("\n");
}

type Settings = NotificationSettings;

async function loadSettings(): Promise<Settings> {
  const stored = (await getSettings<NotificationSettings>("notifications")) || {};
  return {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? stored.telegramBotToken,
    telegramChatId: process.env.TELEGRAM_CHAT_ID ?? stored.telegramChatId,
    whatsappPhoneId: process.env.WHATSAPP_PHONE_ID ?? stored.whatsappPhoneId,
    whatsappToken: process.env.WHATSAPP_TOKEN ?? stored.whatsappToken,
    whatsappTo: process.env.WHATSAPP_TO ?? stored.whatsappTo,
    sendgridApiKey: process.env.SENDGRID_API_KEY ?? stored.sendgridApiKey,
    notifyEmailTo: process.env.NOTIFY_EMAIL_TO ?? stored.notifyEmailTo,
    notifyEmailFrom: process.env.NOTIFY_EMAIL_FROM ?? stored.notifyEmailFrom ?? "orders@gadgetstore.com",
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? stored.twilioAccountSid,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? stored.twilioAuthToken,
    twilioFrom: process.env.TWILIO_FROM ?? stored.twilioFrom,
    twilioTo: process.env.TWILIO_TO ?? stored.twilioTo
  };
}

async function sendTelegram(text: string, s: Settings): Promise<boolean> {
  if (!s.telegramBotToken || !s.telegramChatId) return false;
  const res = await fetch(`https://api.telegram.org/bot${s.telegramBotToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: s.telegramChatId, text, parse_mode: "Markdown" })
  });
  return res.ok;
}

async function sendWhatsApp(text: string, s: Settings): Promise<boolean> {
  if (!s.whatsappPhoneId || !s.whatsappToken || !s.whatsappTo) return false;
  const res = await fetch(`https://graph.facebook.com/v18.0/${s.whatsappPhoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${s.whatsappToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: s.whatsappTo,
      type: "text",
      text: { body: text.replace(/\*/g, "") }
    })
  });
  return res.ok;
}

async function sendEmail(order: Order, text: string, s: Settings): Promise<boolean> {
  if (!s.sendgridApiKey || !s.notifyEmailTo) return false;
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${s.sendgridApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: s.notifyEmailTo }] }],
      from: { email: s.notifyEmailFrom || "orders@gadgetstore.com" },
      subject: `New AYINDEDUNNY ENTERPRISE Order ${order.orderNumber} — $${order.total.toFixed(2)}`,
      content: [{ type: "text/plain", value: text }]
    })
  });
  return res.ok;
}

async function sendSms(text: string, s: Settings): Promise<boolean> {
  if (!s.twilioAccountSid || !s.twilioAuthToken || !s.twilioFrom || !s.twilioTo) return false;
  const body = new URLSearchParams({ From: s.twilioFrom, To: s.twilioTo, Body: text.replace(/\*/g, "") });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${s.twilioAccountSid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${s.twilioAccountSid}:${s.twilioAuthToken}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
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

export async function channelStatus(): Promise<ChannelStatus> {
  const s = await loadSettings();
  return {
    telegram: Boolean(s.telegramBotToken && s.telegramChatId),
    whatsapp: Boolean(s.whatsappPhoneId && s.whatsappToken && s.whatsappTo),
    email: Boolean(s.sendgridApiKey && s.notifyEmailTo),
    sms: Boolean(s.twilioAccountSid && s.twilioAuthToken && s.twilioFrom && s.twilioTo)
  };
}

export async function notifyOrderPlaced(order: Order): Promise<{ delivered: string[]; failed: string[] }> {
  const text = textFor(order);
  const s = await loadSettings();
  const delivered: string[] = [];
  const failed: string[] = [];

  const jobs: [string, () => Promise<boolean>][] = [
    ["telegram", () => sendTelegram(text, s)],
    ["whatsapp", () => sendWhatsApp(text, s)],
    ["email", () => sendEmail(order, text, s)],
    ["sms", () => sendSms(text, s)]
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
  const text = `🧪 *Test Notification* — AYINDEDUNNY ENTERPRISE notification channels are operational.\nTime: ${new Date().toLocaleString()}`;
  const s = await loadSettings();
  const map: Record<string, () => Promise<boolean>> = {
    telegram: () => sendTelegram(text, s),
    whatsapp: () => sendWhatsApp(text, s),
    email: () => sendEmail({} as Order, text.replace(/\*/g, ""), s),
    sms: () => sendSms(text, s)
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