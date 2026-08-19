import { rateLimitKey, clearRateLimitKey, rateLimitState } from "./rateLimit";

const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;

export const LOGIN_LOCK_LIMIT = MAX_FAILURES;
export const LOGIN_LOCK_MS = LOCK_MS;

const loginKey = (email: string) => `login:${email.toLowerCase()}`;

/**
 * Account lockout for brute-force protection. Uses the shared rate_limits
 * store: after MAX_FAILURES consecutive failures the account's key is blocked
 * for 15 minutes. Counters are cleared on successful authentication.
 */
export async function getLoginLock(email: string): Promise<{ locked: boolean; retryAfter?: number }> {
  const { blocked, retryAfter } = await rateLimitState(loginKey(email), MAX_FAILURES);
  return { locked: blocked, retryAfter };
}

export async function registerLoginFailure(email: string): Promise<void> {
  await rateLimitKey(loginKey(email), MAX_FAILURES, LOCK_MS);
}

export async function clearLoginFailures(email: string): Promise<void> {
  await clearRateLimitKey(loginKey(email));
}