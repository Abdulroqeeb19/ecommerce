import { NextResponse } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { createUser, createSession, findUserByEmail } from "@/lib/server/store";
import { publicUser, setSessionCookie } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";
import { GRADE_LABELS } from "@/lib/types";

export async function POST(req: Request) {
  const rl = await rateLimit(req, 10);
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
  if (password.length < 12) return NextResponse.json({ error: "Password must be at least 12 characters" }, { status: 400 });
  if (password.length > 128) return NextResponse.json({ error: "Password is too long" }, { status: 400 });
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return NextResponse.json({ error: "Password must include uppercase, lowercase and a number" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ error: "Invalid email address" }, { status: 400 });

  if (await findUserByEmail(email)) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

  const user = {
    id: `usr_${crypto.randomUUID()}`,
    name: String(name).slice(0, 120),
    email: String(email).toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 12),
    role: "customer" as const,
    grade:
      typeof grade === "string" && grade && (GRADE_LABELS as readonly string[]).includes(grade)
        ? grade.slice(0, 40)
        : undefined,
    school: typeof school === "string" ? school.slice(0, 120) : undefined,
    createdAt: new Date().toISOString()
  };
  await createUser(user);

  const token = await createSession(user.id);
  await setSessionCookie(token);

  return NextResponse.json({ user: publicUser(user) }, { status: 201 });
}
