import { NextResponse } from "next/server";
import { currentUser, requireRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";

export async function GET(req: Request) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) {
    return NextResponse.json({
      ok: false,
      hint: "Pass ?url=https://yourdomain.com/api/bot/webhook to register the webhook"
    });
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
  const body: Record<string, unknown> = { url, allowed_updates: ["message"] };
  if (secret) body.secret_token = secret;

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json({ ok: res.ok, ...json });
}

export async function POST(req: Request) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;

  const rl = rateLimit(req, 5);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const url = body?.url?.trim();
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
  if (!/^https:\/\//.test(url)) {
    return NextResponse.json({ error: "Webhook URL must be https" }, { status: 400 });
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
  const payload: Record<string, unknown> = { url, allowed_updates: ["message", "callback_query"] };
  if (secret) payload.secret_token = secret;

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json({ ok: res.ok, ...json });
}