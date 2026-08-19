import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

// NOTE: the strict per-request CSP (with a nonce) is served from src/proxy.ts,
// which overrides this header on HTML requests so Next.js can apply the nonce
// to its inline RSC bootstrap scripts. The policy below is a static fallback
// for any request the proxy matcher does not cover.
const telegramSrc = "https://telegram.org https://*.telegram.org https://api.telegram.org";
const sentrySrc = "https://*.ingest.sentry.io https://sentry.io";
// Supabase project host used by the AI Image Importer to serve stored product images.
const supabaseImg = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).host : "";
const csp = isProd
  ? [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'self' https://t.me https://telegram.org https://*.telegram.org",
      "object-src 'none'",
      "form-action 'self'",
      "upgrade-insecure-requests",
      "img-src 'self' data: blob:" + (supabaseImg ? ` https://${supabaseImg}` : ""),
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' " + telegramSrc,
      "connect-src 'self' " + telegramSrc + " " + sentrySrc,
      "worker-src 'self' blob:",
      "manifest-src 'self'"
    ].join("; ")
  : [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'self' https://t.me https://telegram.org https://*.telegram.org",
      "object-src 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob:" + (supabaseImg ? ` https://${supabaseImg}` : ""),
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' " + telegramSrc,
      "connect-src 'self' " + sentrySrc,
      "worker-src 'self' blob:",
      "manifest-src 'self'"
    ].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Content-Security-Policy", value: csp }
];

if (isProd) {
  securityHeaders.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    unoptimized: true
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders
      }
    ];
  }
};

export default withSentryConfig(nextConfig, {
  silent: true,
  telemetry: false
});
