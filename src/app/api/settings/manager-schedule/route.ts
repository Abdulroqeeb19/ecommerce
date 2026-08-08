import { NextResponse } from "next/server";
import { getManagerSchedule, setManagerSchedule, listManagers } from "@/lib/server/store";
import { currentUser, requireRole } from "@/lib/server/auth";
import { WEEKDAYS } from "@/lib/types";

export async function GET() {
  const user = await currentUser();
  const denied = requireRole(user, ["admin", "manager"]);
  if (denied) return denied;
  const [schedule, managers] = await Promise.all([getManagerSchedule(), listManagers()]);
  return NextResponse.json({ schedule, managers });
}

export async function PUT(req: Request) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const raw = (body as Record<string, unknown>)?.schedule;
  if (!raw || typeof raw !== "object") {
    return NextResponse.json({ error: "schedule object required" }, { status: 400 });
  }

  const managers = await listManagers();
  const validIds = new Set(managers.map((m) => m.id));

  const schedule: Record<string, string> = {};
  for (const day of WEEKDAYS) {
    const key = String(WEEKDAYS.indexOf(day));
    const rawValue = (raw as Record<string, unknown>)[key];
    const value = typeof rawValue === "string" ? rawValue.trim() : "";
    if (value && validIds.has(value)) schedule[key] = value;
  }

  await setManagerSchedule(schedule);
  return NextResponse.json({ schedule });
}