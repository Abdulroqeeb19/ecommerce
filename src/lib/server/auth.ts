import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser, SESSION_TTL_MS } from "@/lib/server/store";
import type { User } from "@/lib/types";

export function authCookieName() {
  // The __Host- prefix (Secure-only cookies) is used in production to bind the
  // cookie to the origin host and block cross-site cookies.
  return process.env.NODE_ENV === "production" ? "__Host-gh_session" : "gh_session";
}

export function sessionCookieOptions() {
  const production = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    // Lax (not None): the app is same-origin; None would widen the CSRF surface.
    sameSite: "lax" as const,
    secure: production,
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000)
  };
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(authCookieName(), token, sessionCookieOptions());
}

export async function deleteSessionCookie() {
  (await cookies()).set(authCookieName(), "", {
    ...sessionCookieOptions(),
    maxAge: 0
  });
}

export function publicUser(user: User): Omit<User, "passwordHash"> {
  const { passwordHash, ...safe } = user;
  void passwordHash;
  return safe;
}

export async function currentUser() {
  const token = (await cookies()).get(authCookieName())?.value;
  return await getSessionUser(token);
}

export function requireRole(user: Awaited<ReturnType<typeof currentUser>>, roles: string[]) {
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!roles.includes(user.role)) return NextResponse.json({ error: "Forbidden — insufficient role" }, { status: 403 });
  return null;
}
