import { NextResponse } from "next/server";

const TELEGRAM_API = "https://api.telegram.org";

function getBaseUrl(req: Request): string {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  return host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_APP_URL || "";
}

function portalMessage(base: string, start?: string) {
  const appPath = start && start.trim() ? `/tg?start=${encodeURIComponent(start.trim())}` : "/tg";
  return {
    text: [
      "🏪 *AYINDEDUNNY ENTERPRISE — Mini-Store Portal*",
      "",
      "Tap the button below to open the admin portal right inside Telegram.",
      "",
      "_Commands:_ `/start` · `/menu` · `/help`"
    ].join("\n"),
    markup: {
      inline_keyboard: [[{ text: "🛒 Open Mini-Store Portal", web_app: { url: `${base}${appPath}` } }]]
    }
  };
}

async function sendMessage(token: string, chatId: number | string, text: string, replyMarkup?: Record<string, unknown>) {
  const payload: Record<string, unknown> = { chat_id: chatId, text, parse_mode: "Markdown" };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.ok;
}

interface TelegramUpdate {
  message?: {
    chat?: { id?: number | string };
    text?: string;
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

  const msg = update?.message;
  const chatId = msg?.chat?.id;
  if (chatId) {
    const text = (msg?.text || "").trim();
    const m = text.match(/^\/(?:start|menu|help)(?:\s+(.+))?$/i);
    if (!m) {
      return NextResponse.json({ ok: true });
    }
    const startParam = m[1];
    const base = getBaseUrl(req);
    if (base) {
      const reply = portalMessage(base, startParam);
      await sendMessage(token, chatId, reply.text, reply.markup);
    }
  }

  return NextResponse.json({ ok: true });
}