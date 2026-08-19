/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

// NOTE: we intentionally avoid a script hash + nonce here. Next.js streams
// inline RSC bootstrap scripts in varied form, so a fixed hash would force
// 'unsafe-inline' to be ignored (per CSP rules) and break hydration.
// Keeping script-src as 'self' + 'unsafe-inline' is required for the app to run.
const telegramSrc = "https://telegram.org https://*.telegram.org";
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
      "connect-src 'self' " + telegramSrc,
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
      "connect-src 'self'",
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

export default nextConfig;
