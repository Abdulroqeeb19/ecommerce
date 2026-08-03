import { NextResponse } from "next/server";
import { channelStatus } from "@/lib/server/notify";
import { currentUser, requireRole } from "@/lib/server/auth";

export async function GET() {
  const user = await currentUser();
  const denied = requireRole(user, ["admin", "manager"]);
  if (denied) return denied;
  return NextResponse.json(channelStatus());
}
