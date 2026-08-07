import { NextResponse } from "next/server";
import { getSettings, setSettings } from "@/lib/server/store";
import { currentUser, requireRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";
import type { NotificationSettings } from "@/lib/types";

const MAX_LEN = 500;

function sanitize(raw: unknown): NotificationSettings {
  const b = (raw ?? {}) as Record<string, unknown>;
  const out: NotificationSettings = {};
  for (const key of [
    "telegramBotToken",
    "telegramChatId",
    "whatsappPhoneId",
    "whatsappToken",
    "whatsappTo",
    "sendgridApiKey",
    "notifyEmailTo",
    "notifyEmailFrom",
    "twilioAccountSid",
    "twilioAuthToken",
    "twilioFrom",
    "twilioTo"
  ] as const) {
    if (typeof b[key] === "string") {
      const v = b[key].trim();
      if (v) out[key] = v.slice(0, MAX_LEN);
    }
  }
  return out;
}

export async function GET() {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;
  const settings = (await getSettings<NotificationSettings>("notifications")) || {};
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;

  const rl = rateLimit(req, 30);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const existing = (await getSettings<NotificationSettings>("notifications")) || {};
  const saved = await setSettings<NotificationSettings>("notifications", { ...existing, ...sanitize(body) });
  return NextResponse.json(saved);
}
