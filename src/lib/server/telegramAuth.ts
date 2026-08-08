import { createHmac } from "node:crypto";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramInitData {
  user?: TelegramUser;
  auth_date: number;
  hash: string;
}

function parseQuery(qs: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of qs.split("&")) {
    if (!part) continue;
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = decodeURIComponent(part.slice(0, eq));
    const value = decodeURIComponent(part.slice(eq + 1));
    out[key] = value;
  }
  return out;
}

/**
 * Validates a Telegram Mini App `initData` payload (HMAC-SHA256, RFC 2104).
 * See: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramInitData(initData: string, botToken: string): TelegramInitData | null {
  const params = parseQuery(initData);
  const hash = params.hash;
  if (!hash || !botToken) return null;

  const rows = Object.keys(params)
    .filter((k) => k !== "hash")
    .sort()
    .map((k) => `${k}=${params[k]}`);

  const dataCheck = rows.join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const calcHash = createHmac("sha256", secretKey).update(dataCheck).digest("hex");

  if (calcHash !== hash) return null;

  let user: TelegramUser | undefined;
  try {
    if (params.user) user = JSON.parse(params.user) as TelegramUser;
  } catch {
    user = undefined;
  }

  return { user, auth_date: Number(params.auth_date) || 0, hash };
}