import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSession, findUserByEmail, SESSION_TTL_MS } from "@/lib/server/store";
import { authCookieName, publicUser } from "@/lib/server/auth";
import { validateTelegramInitData } from "@/lib/server/telegramAuth";
import { rateLimit } from "@/lib/server/rateLimit";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@gadgetstore.com";
const MANAGER_EMAILS = (process.env.MANAGER_EMAILS || "manager1@gadgetstore.com,manager2@gadgetstore.com,manager3@gadgetstore.com")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function telegramIds(raw?: string): Set<number> {
  const out = new Set<number>();
  for (const part of (raw || "").split(",")) {
    const n = Number(part.trim());
    if (Number.isInteger(n)) out.add(n);
  }
  return out;
}

export async function POST(req: Request) {
  const rl = rateLimit(req, 20);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: "Telegram is not configured on the server" }, { status: 500 });
  }

  let body: { initData?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const initData = body?.initData;
  if (!initData) return NextResponse.json({ error: "Missing Telegram initData" }, { status: 400 });

  const tg = validateTelegramInitData(initData, botToken);
  if (!tg || !tg.user) return NextResponse.json({ error: "Telegram signature invalid" }, { status: 401 });

  const adminIds = telegramIds(process.env.TELEGRAM_ADMIN_IDS);
  const managerIds = telegramIds(process.env.TELEGRAM_MANAGER_IDS);

  let email: string | null = null;
  if (adminIds.has(tg.user.id)) email = ADMIN_EMAIL;
  else if (managerIds.has(tg.user.id)) email = MANAGER_EMAILS[0] || null;
  if (!email) {
    return NextResponse.json({ error: "This Telegram account is not authorized to use the admin portal" }, { status: 403 });
  }

  const user = await findUserByEmail(email);
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 500 });

  const token = await createSession(user.id);
  (await cookies()).set(authCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000)
  });

  return NextResponse.json({ ok: true, user: publicUser(user) });
}