import { NextResponse } from "next/server";
import {
  ordersPendingText,
  todaySummary,
  dutyManagerToday,
  lowStockSummary,
  sendBotMessage
} from "@/lib/server/telegramBot";
import { listProducts } from "@/lib/server/store";

export async function GET(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ ok: false }, { status: 500 });

  const cronSecret = process.env.CRON_SECRET;
  const headerSecret = req.headers.get("x-vercel-cron");
  const qsSecret = new URL(req.url).searchParams.get("secret");
  const allowed = [cronSecret, headerSecret].filter(Boolean);
  if (allowed.length && !allowed.includes(qsSecret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return NextResponse.json({ ok: false, error: "TELEGRAM_CHAT_ID not set" }, { status: 500 });

  const body = [
    "🌅 *Good morning — Daily Digest*",
    "",
    await todaySummary(),
    "",
    await dutyManagerToday(),
    "",
    await ordersPendingText(),
    "",
    lowStockSummary(await listProducts())
  ].join("\n");

  const ok = await sendBotMessage(token, chatId, body);
  return NextResponse.json({ ok, delivered: ok });
}