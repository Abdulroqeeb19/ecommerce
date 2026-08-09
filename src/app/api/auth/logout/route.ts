import { NextResponse } from "next/server";
import { deleteSessionCookie } from "@/lib/server/auth";

export async function POST() {
  await deleteSessionCookie();
  return NextResponse.json({ ok: true });
}