import { NextResponse } from "next/server";
import { getOrderingSchedule, setOrderingSchedule } from "@/lib/server/store";
import { currentUser, requireRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";
import { GRADE_LABELS, WEEKDAYS } from "@/lib/types";

export async function GET() {
  const schedule = await getOrderingSchedule();
  return NextResponse.json({ schedule, weekdays: WEEKDAYS, grades: GRADE_LABELS });
}

export async function PUT(req: Request) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;

  const rl = await rateLimit(req, 20);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

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

  const schedule: Record<string, number> = {};
  for (const grade of GRADE_LABELS) {
    const value = (raw as Record<string, unknown>)[grade];
    const day = Number(value);
    if (Number.isInteger(day) && day >= 0 && day <= 6) schedule[grade] = day;
  }
  if (GRADE_LABELS.some((g) => !(g in schedule))) {
    return NextResponse.json({ error: "Every grade needs a valid day (0-6)" }, { status: 400 });
  }

  await setOrderingSchedule(schedule);
  return NextResponse.json({ schedule });
}