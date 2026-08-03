# OWASP_SECURITY_REVIEW.md — Gadget Hub

Review against the OWASP Top 10 (2021) for the current state of the demo.

## A01 Broken Access Control
- **Status: Mitigated.**
- All protected route handlers call `requireRole()` server-side; the role is derived
  from the server-side session, never from the browser.
- `GET /api/orders` and order-status writes are admin/manager only.
- Product writes and stock updates are role-gated.
- **Residual:** When customer-facing order history is added, enforce ownership
  (customer may only read their own orders) to prevent IDOR. Documented in
  SECURITY_ARCHITECTURE.md.

## A02 Cryptographic Failures
- **Status: Mostly mitigated.**
- Passwords hashed with bcryptjs (cost 10–12), never plaintext.
- Session tokens use `crypto.randomBytes(32)`.
- `Secure` cookie flag enabled in production.
- **Residual:** Traffic in local dev is HTTP (fine for localhost). In production the
  reverse proxy MUST terminate TLS with HSTS (see SSL_DEPLOYMENT.md). No card data is
  stored or transmitted; when a real gateway is added, keep it tokenized/iframe-based.

## A03 Injection
- **Status: Not applicable / mitigated.**
- No SQL: the store uses a JSON file. No raw query concatenation exists.
- XSS: React auto-escapes; a CSP restricts script sources; the single inline theme
  script is explicitly hashed in the CSP.
- Order/product inputs are length-checked and type-checked server-side.

## A04 Insecure Design
- **Status: Partially addressed.**
- Server recomputes order totals/prices from the catalog instead of trusting the
  client (defence against price manipulation).
- Stock is validated against inventory server-side before accepting an order.
- **Residual:** JSON file DB is not concurrency-safe across instances; acceptable for
  the demo, documented in SECURITY_ARCHITECTURE.md.

## A05 Security Misconfiguration
- **Status: Substantially improved.**
- Security headers added (CSP, HSTS prod, nosniff, frame, referrer, permissions,
  COOP); `X-Powered-By` disabled.
- `.env.example` contains placeholders only; `.env*` is gitignored.
- Default admin password still ships for demo convenience — **must** be changed in
  any shared deployment (production build refuses to seed without `ADMIN_PASSWORD`).
- **Residual:** dev-mode CSP allows `unsafe-inline`/`unsafe-eval` (required by Next dev).

## A06 Vulnerable and Outdated Components
- **Status: Partially fixed.**
- `npm audit` reduced 4 high → 1 high.
- Fixed: bundled `postcss` and `sharp` via `overrides` (patched versions).
- **Residual (no npm fix):** `xlsx@0.18.5` — prototype pollution + ReDoS advisories.
  Only reachable through admin report export. Replace with a maintained library or
  SheetJS CE CDN build before production.

## A07 Identification and Authentication Failures
- **Status: Improved.**
- Rate limiting on login/register (10/min/IP).
- Password policy min 8 chars (server-enforced).
- httpOnly + SameSite=Lax + Secure cookies.
- **Residual:** No MFA, no account lockout, no password reset flow. Demo scope;
  add before production for real users.

## A08 Software and Data Integrity Failures
- **Status: Not applicable in demo.**
- No CI/CD pipeline, no package-signing concerns beyond standard npm.
- No payment webhook yet (no gateway). When adding one, verify webhook signatures
  and implement idempotency (see FINAL_SECURITY_REPORT.md guidance).

## A09 Security Logging and Monitoring Failures
- **Status: Limited.**
- Server console logs errors without secrets (order/product save failures).
- No structured logging, alerting, or audit trail. Add structured logging
  (pino/winston) and an audit trail for admin actions before production.

## A10 Server-Side Request Forgery (SSRF)
- **Status: Not applicable / low risk.**
- Outbound fetches only go to fixed, hardcoded notification providers
  (Telegram/WhatsApp/SendGrid/Twilio) using env-configured recipients — no
  user-supplied URLs are fetched.
