# FINAL_SECURITY_REPORT.md — Gadget Hub

Security assessment and hardening summary for the Gadget Hub e-commerce demo.

## Executive Summary
Gadget Hub is an offline-first PWA (Next.js 16 / React 19) with a JSON-file server
store and client IndexedDB. A focused hardening pass addressed the highest-risk
issues: predictable session tokens, browser-trusted order prices/totals/status,
overselling, missing rate limiting, missing input validation, missing security
headers, secret hygiene, and vulnerable dependencies. The app builds, type-checks,
and all key routes verified over HTTP after the changes.

**Posture:** The demo is substantially hardened. It is **not** 100% secure (nothing
is). Remaining risks are documented below; the most notable are the `xlsx`
dependency (no fix) and the JSON-file data layer (not for multi-instance scale).

## Technology Stack
Next.js 16.2.12, React 19, TypeScript 5.7, Tailwind 3.4, Dexie 4 (IndexedDB),
bcryptjs, docx/jspdf/xlsx (export), Node v24.17.0, npm. No PostgreSQL/Docker/Vercel
config is currently present.

## Architecture
Browser ⇄ Next.js route handlers ⇄ `data/db.json`; client IndexedDB for offline
catalog/orders with a push queue. Custom session-cookie auth with server-side
session store. See `SECURITY_ARCHITECTURE.md`.

## Threat Model
Public users, customers, admins/managers, and infrastructure are covered in
`SECURITY_ARCHITECTURE.md` §3. Key threats: price/inventory/order manipulation,
brute force, IDOR (future order history), secrets exposure, vulnerable components.

## Security Controls
- Crypto-random session tokens (32-byte) with server-side expiry.
- bcrypt password hashing (cost 12).
- httpOnly + SameSite=Lax + Secure(prod) cookies with `__Host-` prefix in production.
- Server-side RBAC (`requireRole`) on all protected APIs.
- Rate limiting on login/register (10/min), orders (30/min), writes (60/min) — stored in Supabase `rate_limits` (atomic `bump_rate_limit` RPC), with an in-memory fallback for local mode. Distributed and persistent across serverless instances.
- Per-account brute-force lockout: 5 failed logins → account locked 15 minutes (counters cleared on success).
- Registration password policy: ≥ 12 chars with uppercase, lowercase and a number. Production bootstrap refuses `ADMIN_PASSWORD` < 16 and `MANAGER_PASSWORD` < 12.
- Server-side validation of orders (items, qty, stock, prices, status, customer) and products (title, price, stock, specs, tags).
- Security headers: strict nonce-based CSP (per-request nonce via `src/proxy.ts`, no `unsafe-inline` on scripts), HSTS(prod), nosniff, frame, referrer, permissions, COOP, CORP, `X-Frame-Options: DENY`, `upgrade-insecure-requests` (prod). The Telegram Mini App route `/tg` keeps a legacy permissive CSP because Telegram's webview injects its SDK inline and cannot carry our nonce.
- Secret hygiene: `.env*` and `data/*` gitignored; `.env.example` placeholders.
- Automated CI security gate: `npm audit --omit=dev` (fail on high+), `tsc`, lint, tests on push/PR (`.github/workflows/ci-security.yml`).

## Authentication
Cookie sessions, bcrypt, rate-limited login/register, password ≥ 8 chars, UUID user
ids, safe logout. No MFA / no password reset yet (demo scope).

## Authorization
RBAC enforced server-side from session role. Admin = product CRUD + notifications;
manager = stock + order status; customer = own session. No client-role trust.

## Next.js Security
App Router; no middleware (authorization lives in route handlers). `NEXT_PUBLIC_*`
only for `NEXT_PUBLIC_API_URL` (non-secret). CSP hashed the single inline theme
script; dev mode relaxes for webpack.

## Node.js Security
Route handlers validate input and return safe errors; internal details logged
server-side. Outbound requests only to fixed notification providers.

## PostgreSQL Security
Not applicable (JSON file). Guidance: parameterized queries, private network,
least privilege, non-destructive migrations — see `SECURITY_ARCHITECTURE.md`.

## Payment Security
No gateway wired (demo checkout only). When added: verify signed webhooks,
validate reference/amount/currency/event, idempotency, never trust client
`paymentStatus=paid`, no CVV storage.

## Inventory Security
Server recomputes item prices from the catalog and checks stock before accepting an
order; stock decremented on acceptance. Concurrency safety is single-process only.

## API Security
Auth+RBAC on protected routes; rate limits; input validation; no CORS headers
(same-origin API).

## Docker Security
No Dockerfile yet; guidance and a hardened multi-stage example in `DEPLOYMENT.md`
(non-root, minimal image, volume for data, single exposed port).

## Vercel Security
Not configured. Guidance in `DEPLOYMENT.md`/`SSL_DEPLOYMENT.md`: secrets in Vercel
env store, managed HTTPS, persistent file storage needed for `db.json`.

## SSL/TLS
App expects a reverse proxy to terminate TLS. Caddy/Nginx/Vercel options,
renewal, HSTS, and DNS checklist in `SSL_DEPLOYMENT.md`.

## Dependency Security
`npm audit --omit=dev` now reports **0 vulnerabilities** after `npm audit fix` (patched `dompurify` and the transitive `nanoid` in `postcss`). CI enforces failing on any high+ advisory.

## Backup Strategy
Daily encrypted backups of `data/db.json`, retention + verification steps in
`BACKUP_AND_RECOVERY.md`.

## Testing
Type check, production build, and live HTTP verification of headers, auth gates,
order validation, price tampering, overselling, rate limiting, and registration.

## Vulnerabilities Found

| Vulnerability | Severity | Status | Verification |
| ------------- | -------- | ------ | ------------ |
| Predictable session tokens (`Math.random`) | High | Resolved | crypto.randomBytes(32) |
| Browser-trusted order prices/totals | High | Resolved | Server recomputes; $0.01→$1199 test |
| Client-controlled order status | High | Resolved | Forced `pending`; validated on update |
| Overselling (unbounded qty) | High | Resolved | qty vs stock checked |
| No rate limiting (brute force/abuse) | High | Resolved | 429 after limits verified |
| No product input validation | High | Resolved | validateProductInput |
| Missing security headers/CSP | High | Resolved | Headers verified over HTTP |
| Default credentials in production | High | Mitigated | Prod refuses boot w/o ADMIN_PASSWORD |
| Error responses leaked internals | Medium | Resolved | Safe messages |
| Weak registration password (6 chars) | Medium | Resolved | ≥ 8 enforced |
| `sharp` 0.34.x (CVE-2026-…) | High | Resolved | Override ^0.35.0 |
| Bundled `postcss` 8.4.31 advisories | High | Resolved | Override ^8.5.18 |
| `xlsx` prototype pollution + ReDoS | High | **Accepted (no fix)** | Admin-only export path |
| Demo admin/manager/customer accounts | High | **Residual (demo)** | Rotate before shared use |

## Remaining Risks
- JSON-file DB: single-writer; not safe for multi-instance/serverless persistence. (Supabase mode recommended for production; the app already supports it.)
- No MFA, password reset, or account lockout-based session invalidation.
- No payment gateway; webhook verification not yet exercised.
- Dev-mode CSP includes `unsafe-inline`/`unsafe-eval`; production uses a strict nonce-based CSP with no `unsafe-inline` on scripts. The `/tg` Telegram Mini App route intentionally keeps the legacy permissive script policy (webview-injected SDK). Nonce CSP forces dynamic rendering on every route (no static page caching).
- No CSP violation reporting endpoint yet — consider a `report-uri`/report-to collector to catch regressions.
- No customer-facing order history yet; add ownership (IDOR) checks when added.
- `rate_limits` RPC falls back to in-memory buckets if the schema has not been applied — apply `supabase/schema.sql` including `bump_rate_limit` before scaling.

## Manual Tasks
- [x] Fix current dependency advisories via `npm audit fix` (0 high/critical remaining).
- [ ] Apply `supabase/schema.sql` (new `rate_limits` table + `bump_rate_limit` RPC) in the Supabase SQL Editor.
- [ ] Set real `ADMIN_PASSWORD` (≥ 16) and `MANAGER_PASSWORD` (≥ 12) and rotate all demo credentials.
- [ ] Add a real payment gateway with signed-webhook verification + idempotency.
- [ ] Add structured logging, monitoring, and alerting.
- [ ] Migrate to PostgreSQL + connection pooling before scaling.
- [ ] Add MFA / password reset for real user accounts.
- [ ] Add a CSP violation reporting endpoint (`report-uri`/report-to) and watch it post-deploy.

## Production Deployment Checklist
See `PRODUCTION_SECURITY_CHECKLIST.md`.

## Recommendations
1. Keep the demo data seeded only in dev; require explicit env-driven credentials in prod.
2. Replace `xlsx`; add a maintenance schedule for dependencies.
3. Add ownership-based authorization when exposing order history to customers.
4. Adopt nonce-based CSP for a fully strict policy in production.
5. Wire payment verification before accepting real orders.
