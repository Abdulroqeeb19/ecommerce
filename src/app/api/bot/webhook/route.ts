import { NextResponse } from "next/server";
import {
  isAllowedTelegramUser,
  ordersPendingText,
  todaySummary,
  statusText,
  dutyManagerToday,
  lowStockSummary,
  completeOrderCallback,
  sendBotMessage,
  answerCallback
} from "@/lib/server/telegramBot";
import { listProducts } from "@/lib/server/store";

function getBaseUrl(req: Request): string {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  return host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_APP_URL || "";
}

function portalMessage(base: string) {
  return {
    text: [
      "🏪 *AYINDEDUNNY ENTERPRISE — Mini-Store Portal*",
      "",
      "Tap the button below to open the admin portal right inside Telegram.",
      "",
      "_Commands:_ /start · /menu · /help · /status · /today · /pending"
    ].join("\n"),
    markup: {
      inline_keyboard: [[{ text: "🛒 Open Mini-Store Portal", web_app: { url: `${base}/tg` } }]]
    }
  };
}

interface TelegramUpdate {
  message?: {
    chat?: { id?: number | string };
    from?: { id?: number };
    text?: string;
  };
  callback_query?: {
    id?: string;
    from?: { id?: number };
    message?: { chat?: { id?: number | string }; message_id?: number };
    data?: string;
  };
}

export async function POST(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ ok: false }, { status: 500 });

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const header = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret && header !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const base = getBaseUrl(req);

  const cb = update.callback_query;
  if (cb?.id && cb.data) {
    await handleCallback(token, cb);
    return NextResponse.json({ ok: true });
  }

  const msg = update.message;
  const chatId = msg?.chat?.id;
  const text = (msg?.text || "").trim();
  if (!chatId || !text) return NextResponse.json({ ok: true });

  if (!isAllowedTelegramUser(msg.from?.id)) {
    await sendBotMessage(token, chatId, "You are not authorized to use this bot's commands.\n\nPlease contact the store owner if you believe this is a mistake.");
    return NextResponse.json({ ok: true });
  }

  const m = text.match(/^\/([a-zA-Z_]+)(?:\s+(.+))?$/);
  if (!m) return NextResponse.json({ ok: true });
  const cmd = m[1].toLowerCase();

  switch (cmd) {
    case "start":
    case "menu":
    case "help": {
      const reply = portalMessage(base);
      await sendBotMessage(token, chatId, reply.text, reply.markup);
      break;
    }
    case "status":
      await sendBotMessage(token, chatId, await statusText());
      break;
    case "today":
      await sendBotMessage(token, chatId, `${await todaySummary()}\n\n${await dutyManagerToday()}`);
      break;
    case "pending":
      await sendBotMessage(token, chatId, await ordersPendingText());
      break;
    case "stock":
    case "lowstock":
      await sendBotMessage(token, chatId, lowStockSummary(await listProducts()));
      break;
    default:
      await sendBotMessage(token, chatId, `Unknown command /${cmd}.\n\nTry /start, /status, /today, /pending or /stock.`);
  }

  return NextResponse.json({ ok: true });
}

async function handleCallback(token: string, cb: NonNullable<TelegramUpdate["callback_query"]>) {
  const { id: callbackId, from, data, message } = cb;
  const chatId = message?.chat?.id;
  if (!callbackId || !data || !from?.id || !chatId) return;

  if (!isAllowedTelegramUser(from.id)) {
    await answerCallback(token, callbackId, "You are not authorized.");
    return;
  }

  const [kind, action, orderId] = data.split(":");
  if (kind !== "order" || !action || !orderId) {
    await answerCallback(token, callbackId, "Unknown action.");
    return;
  }

  const result = await completeOrderCallback(action, orderId);
  await answerCallback(token, callbackId, result.message);
  await sendBotMessage(token, chatId, `${result.message}\n\n_Updated from Telegram._`);
}