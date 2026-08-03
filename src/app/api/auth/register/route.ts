import { NextResponse } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { getDb, saveDb, createSession, findUserByEmail, SESSION_TTL_MS } from "@/lib/server/store";
import { cookies } from "next/headers";
import { authCookieName } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";

export async function POST(req: Request) {
  const rl = rateLimit(req, 10);
  if (!rl.ok) return NextResponse.json({ error: "Too many registration attempts. Try again later." }, { status: 429 });

  let body: { name?: string; email?: string; password?: string; grade?: string; school?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, password, grade, school } = body ?? {};
  if (!name || !email || !password) return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  if (typeof name !== "string" || name.length > 120) return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  if (password.length > 128) return NextResponse.json({ error: "Password is too long" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ error: "Invalid email address" }, { status: 400 });

  if (findUserByEmail(email)) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

  const db = getDb();
  const user = {
    id: `usr_${crypto.randomUUID()}`,
    name: String(name).slice(0, 120),
    email: String(email).toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 12),
    role: "customer" as const,
    grade,
    school,
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  saveDb(db);

  const token = createSession(user.id);
  (await cookies()).set(authCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000)
  });

  const { passwordHash, ...safe } = user;
  return NextResponse.json({ user: safe }, { status: 201 });
}
