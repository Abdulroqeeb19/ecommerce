import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Bucket = { count: number; resetAt: number };

export interface RateLimitResult {
  ok: boolean;
  retryAfter?: number;
}

const WINDOW_MS = 60 * 1000;

// In-memory fallback used when Supabase is not configured (local JSON mode).
// Production / Vercel deployments use the persistent rate_limits table so the
// counters survive restarts and are shared across serverless instances.
const memBuckets = new Map<string, Bucket>();

setInterval(() => {
  const now = Date.now();
  for (const [key, b] of memBuckets) {
    if (b.resetAt < now) memBuckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

/** Optional Supabase client — returns null when the backend is not configured. */
export function optionalSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || process.env.STORE_BACKEND === "json") return null;
  return createClient(url, key);
}

/**
 * Resolve the client identifier for a request. `x-forwarded-for` is used when
 * present (set by Vercel / reverse proxies). An empty/unknown value deliberately
 * resolves to a shared "unknown" bucket so unadorned requests cannot bypass by
 * alternating headers — mirroring how proxies must be trusted in production.
 */
function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "unknown";
  return ip;
}

/** In-memory token bucket (synchronous; JSON/local mode). */
function memRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const b = memBuckets.get(key);
  if (!b || b.resetAt < now) {
    memBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  b.count += 1;
  if (b.count > limit) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  return { ok: true };
}

/**
 * Enforce a per-client rate limit over a sliding window. Uses the atomic
 * `bump_rate_limit` RPC on the Supabase `rate_limits` table when configured
 * (correct across instances and restarts), otherwise falls back to memory.
 */
export async function rateLimit(req: Request, limit: number, windowMs: number = WINDOW_MS): Promise<RateLimitResult> {
  const key = `rl:${clientKey(req)}|${req.url}`;

  const sb = optionalSupabaseClient();
  if (sb) {
    try {
      const { data, error } = await sb.rpc("bump_rate_limit", { p_key: key, p_window_ms: windowMs, p_limit: limit });
      if (!error && Array.isArray(data) && data.length) {
        const row = data[0] as { ok: boolean; retry_after: number | null };
        return { ok: row.ok, retryAfter: row.retry_after ?? undefined };
      }
    } catch {
      // Fall through to the memory bucket if the RPC is unavailable.
    }
  }

  return memRateLimit(key, limit, windowMs);
}

export async function rateLimitKey(key: string, limit: number, windowMs: number = WINDOW_MS): Promise<RateLimitResult> {
  const sb = optionalSupabaseClient();
  if (sb) {
    try {
      const { data, error } = await sb.rpc("bump_rate_limit", { p_key: key, p_window_ms: windowMs, p_limit: limit });
      if (!error && Array.isArray(data) && data.length) {
        const row = data[0] as { ok: boolean; retry_after: number | null };
        return { ok: row.ok, retryAfter: row.retry_after ?? undefined };
      }
    } catch {
      // Fall through to the memory bucket if the RPC is unavailable.
    }
  }
  return memRateLimit(key, limit, windowMs);
}

/** Removes a rate-limit key (used to clear per-account counters on success). */
export async function clearRateLimitKey(key: string): Promise<void> {
  const sb = optionalSupabaseClient();
  if (sb) {
    try {
      await sb.from("rate_limits").delete().eq("key", key);
      return;
    } catch {
      // fall through
    }
  }
  memBuckets.delete(key);
}

/** Reads the blocked state for a rate-limit key (blocked iff count > limit and the window is still open). */
export async function rateLimitState(key: string, limit: number): Promise<{ blocked: boolean; retryAfter?: number }> {
  const now = Date.now();
  const sb = optionalSupabaseClient();
  if (sb) {
    try {
      const { data } = await sb.from("rate_limits").select("count, reset_at").eq("key", key).maybeSingle();
      if (data && typeof data.count === "number" && typeof data.reset_at === "number" && data.count > limit && data.reset_at > now) {
        return { blocked: true, retryAfter: Math.ceil((data.reset_at - now) / 1000) };
      }
      return { blocked: false };
    } catch {
      // fall through
    }
  }
  const b = memBuckets.get(key);
  if (b && b.count > limit && b.resetAt > now) return { blocked: true, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  return { blocked: false };
}