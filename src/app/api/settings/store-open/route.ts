import { NextResponse } from "next/server";
import { getSettings, setSettings } from "@/lib/server/store";
import { currentUser, requireRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";

export interface EmergencyOpen {
  grade: string; // "JSS1" | "JSS2" | "JSS3" | "ALL"
  until: string; // ISO datetime — the window closes at this point
  note?: string;
  openedBy?: string;
  createdAt: string;
}

export const STORE_OPEN_KEY = "storeOpen";

function sanitizeWindow(raw: unknown): EmergencyOpen | null {
  const b = (raw ?? {}) as Record<string, unknown>;
  const grade = typeof b.grade === "string" ? b.grade.trim() : "";
  const until = typeof b.until === "string" ? b.until.trim() : "";
  if (!["JSS1", "JSS2", "JSS3", "ALL"].includes(grade) || !until) return null;
  if (new Date(until).getTime() <= Date.now()) return null;
  const note = typeof b.note === "string" && b.note.trim() ? b.note.trim().slice(0, 300) : "";
  const openedBy = typeof b.openedBy === "string" && b.openedBy.trim() ? b.openedBy.trim().slice(0, 120) : "";
  return { grade, until, note, openedBy, createdAt: new Date().toISOString() };
}

export async function GET() {
  const windows = (await getSettings<EmergencyOpen[]>(STORE_OPEN_KEY)) || [];
  const active = windows.filter((w) => new Date(w.until).getTime() > Date.now());
  return NextResponse.json(active);
}

export async function PUT(req: Request) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin", "manager"]);
  if (denied) return denied;

  const rl = rateLimit(req, 30);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const existing = ((await getSettings<EmergencyOpen[]>(STORE_OPEN_KEY)) || []).filter(
    (w) => new Date(w.until).getTime() > Date.now()
  );

  const action = (body as Record<string, unknown>)?.action;
  if (action === "clear") {
    const grade = typeof (body as Record<string, unknown>).grade === "string" ? String((body as Record<string, unknown>).grade) : "";
    const next = grade ? existing.filter((w) => w.grade !== grade) : [];
    await setSettings(STORE_OPEN_KEY, next);
    return NextResponse.json(next);
  }

  const window = sanitizeWindow(body);
  if (!window) return NextResponse.json({ error: "Invalid or expired window" }, { status: 400 });

  const next = [...existing.filter((w) => w.grade !== window.grade), window];
  await setSettings(STORE_OPEN_KEY, next);
  return NextResponse.json(next);
}

export async function DELETE(req: Request) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin", "manager"]);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const grade = searchParams.get("grade") || "";
  const existing = ((await getSettings<EmergencyOpen[]>(STORE_OPEN_KEY)) || []).filter(
    (w) => new Date(w.until).getTime() > Date.now()
  );
  const next = grade ? existing.filter((w) => w.grade !== grade) : [];
  await setSettings(STORE_OPEN_KEY, next);
  return NextResponse.json(next);
}