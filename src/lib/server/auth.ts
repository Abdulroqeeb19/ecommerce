import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/server/store";

export function authCookieName() {
  return "gh_session";
}

export async function currentUser() {
  const token = (await cookies()).get(authCookieName())?.value;
  return getSessionUser(token);
}

export function requireRole(user: Awaited<ReturnType<typeof currentUser>>, roles: string[]) {
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!roles.includes(user.role)) return NextResponse.json({ error: "Forbidden — insufficient role" }, { status: 403 });
  return null;
}
