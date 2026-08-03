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
- bcrypt password hashing (cost 10–12).
- httpOnly + SameSite=Lax + Secure(prod) cookies.
- Server-side RBAC (`requireRole`) on all protected APIs.
- Rate limiting on login/register (10/min), orders (30/min), writes (60/min).
- Server-side validation of orders (items, qty, stock, prices, status, customer)
  and products (title, price, stock, specs, tags).
- Security headers: CSP, HSTS(prod), nosniff, frame, referrer, permissions, COOP.
- Secret hygiene: `.env*` and `data/*` gitignored; `.env.example` placeholders.

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
`npm audit --omit=dev` reduced 4 high → 1 high. Patched bundled `postcss` and
`sharp` via overrides. `xlsx` has no fix (see below).

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
- `xlsx@0.18.5` — no patched npm release; replace with SheetJS CE CDN build or
  `exceljs` before production.
- JSON-file DB: single-writer; not safe for multi-instance/serverless persistence.
- In-memory rate limiting resets on restart and is per-process.
- No MFA, password reset, or account lockout.
- No payment gateway; webhook verification not yet exercised.
- Dev-mode CSP includes `unsafe-inline`/`unsafe-eval`.
- No customer-facing order history yet; add ownership (IDOR) checks when added.

## Manual Tasks
- [ ] Set a real `ADMIN_PASSWORD` and rotate all demo credentials.
- [ ] Replace the `xlsx` dependency or accept the documented risk.
- [ ] Add a real payment gateway with signed-webhook verification + idempotency.
- [ ] Add structured logging, monitoring, and alerting.
- [ ] Migrate to PostgreSQL + connection pooling before scaling.
- [ ] Add MFA / password reset for real user accounts.
- [ ] Configure CI: `npm audit`, `tsc --noEmit`, `next build`, secret scanning.

## Production Deployment Checklist
See `PRODUCTION_SECURITY_CHECKLIST.md`.

## Recommendations
1. Keep the demo data seeded only in dev; require explicit env-driven credentials in prod.
2. Replace `xlsx`; add a maintenance schedule for dependencies.
3. Add ownership-based authorization when exposing order history to customers.
4. Adopt nonce-based CSP for a fully strict policy in production.
5. Wire payment verification before accepting real orders.
