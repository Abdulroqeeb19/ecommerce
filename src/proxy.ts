import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";

const isProd = process.env.NODE_ENV === "production";
const supabaseImg = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).host : "";

const TELEGRAM = "https://telegram.org https://*.telegram.org https://api.telegram.org";

const shared = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'self' https://t.me https://telegram.org https://*.telegram.org",
  "object-src 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:" + (supabaseImg ? ` https://${supabaseImg}` : ""),
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'self' blob:",
  "manifest-src 'self'"
];

function buildCsp(nonce: string, telegramClient: boolean): string {
  if (telegramClient) {
    // The Telegram webview injects its Mini App SDK inline; it cannot carry our
    // per-request nonce, so this route keeps the legacy permissive script policy.
    return [
      ...shared,
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' " + TELEGRAM,
      "connect-src 'self' " + TELEGRAM
    ].join("; ");
  }

  if (isProd) {
    return [
      ...shared,
      `script-src 'self' 'nonce-${nonce}' ${TELEGRAM}`,
      "connect-src 'self' " + TELEGRAM,
      "upgrade-insecure-requests"
    ].join("; ");
  }

  return [
    ...shared,
    `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' ${TELEGRAM}`,
    "connect-src 'self' ws: " + TELEGRAM
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const nonce = randomBytes(16).toString("base64url");
  const telegramClient = request.nextUrl.pathname.startsWith("/tg");
  const csp = buildCsp(nonce, telegramClient);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*\\.png$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" }
      ]
    }
  ]
};
