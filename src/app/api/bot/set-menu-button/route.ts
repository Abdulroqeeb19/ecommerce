import { NextResponse } from "next/server";
import { currentUser, requireRole } from "@/lib/server/auth";

const TELEGRAM_API = "https://api.telegram.org";

function getBaseUrl(req: Request): string {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  return host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_APP_URL || "";
}

export async function GET(req: Request) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });

  const action = new URL(req.url).searchParams.get("action");

  if (action === "clear") {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/setChatMenuButton`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menu_button: { type: "default" } })
    });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: res.ok, ...json });
  }

  const info = await fetch(`https://api.telegram.org/bot${token}/getChatMenuButton`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}"
  }).catch(() => null);

  return NextResponse.json({
    baseUrl: getBaseUrl(req),
    current: info ? await info.json().catch(() => null) : null,
    hint: "Open /api/bot/set-menu-button?action=set in the browser to install the persistent Portal button."
  });
}

export async function POST(req: Request) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });

  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const base = getBaseUrl(req);

  if (body?.action === "clear") {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/setChatMenuButton`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menu_button: { type: "default" } })
    });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: res.ok, ...json });
  }

  if (!base) return NextResponse.json({ error: "Could not determine the app URL. Set NEXT_PUBLIC_APP_URL." }, { status: 400 });

  const payload = {
    menu_button: {
      type: "web_app",
      text: "Open Portal",
      web_app: { url: `${base}/tg` }
    }
  };

  const res = await fetch(`${TELEGRAM_API}/bot${token}/setChatMenuButton`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json({ ok: res.ok, ...json });
}

export async function DELETE() {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });

  const res = await fetch(`${TELEGRAM_API}/bot${token}/setChatMenuButton`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ menu_button: { type: "default" } })
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json({ ok: res.ok, ...json });
}