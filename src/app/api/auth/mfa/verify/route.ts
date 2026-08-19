import { NextResponse } from "next/server";
import { getMfaToken, setSessionCookie, clearMfaCookie } from "@/lib/server/auth";
import { getSessionUser, activatePendingSession, destroySession } from "@/lib/server/store";
import { verifyTotp } from "@/lib/server/totp";
import { rateLimit, rateLimitKey, rateLimitState } from "@/lib/server/rateLimit";

const MFA_BUDGET_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  const rl = await rateLimit(req, 10);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });

  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const code = body?.code;
  if (typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
    return NextResponse.json({ error: "Enter the 6-digit code from your authenticator app" }, { status: 400 });
  }

  const mfaToken = await getMfaToken();
  if (!mfaToken) {
    return NextResponse.json({ error: "Your sign-in session expired. Please log in again." }, { status: 401 });
  }

  const locked = await rateLimitState(`mfa:${mfaToken}`, MAX_ATTEMPTS);
  if (locked.blocked) {
    await destroySession(mfaToken);
    await clearMfaCookie();
    return NextResponse.json(
      { error: "Too many incorrect codes. Please log in again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(locked.retryAfter ?? 900) } }
    );
  }

  const user = await getSessionUser(mfaToken, { pendingMfa: true });
  if (!user || !user.mfaSecret) return NextResponse.json({ error: "Session expired. Log in again." }, { status: 401 });

  if (!verifyTotp(user.mfaSecret, code)) {
    const after = await rateLimitKey(`mfa:${mfaToken}`, MAX_ATTEMPTS, LOCK_MS);
    if (!after.ok) {
      await destroySession(mfaToken);
      await clearMfaCookie();
    }
    return NextResponse.json({ error: "Incorrect code. Try again." }, { status: 401 });
  }

  const activated = await activatePendingSession(mfaToken, MFA_BUDGET_MS);
  if (!activated) return NextResponse.json({ error: "Session expired. Log in again." }, { status: 401 });

  await setSessionCookie(mfaToken);
  await clearMfaCookie();

  return NextResponse.json({ user: { id: activated.id, name: activated.name, email: activated.email, role: activated.role, mfaEnabled: activated.mfaEnabled } });
}