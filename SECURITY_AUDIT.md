# SECURITY_AUDIT.md — Gadget Hub

Audit log of the security hardening pass. Findings, actions, and verification.

## Vulnerabilities Found & Resolved

| # | Finding | Severity | Status | Verification |
| - | ------- | -------- | ------ | ------------ |
| 1 | Session tokens generated with `Math.random()` (predictable) | High | **Fixed** | `createSession` now uses `crypto.randomBytes(32)` |
| 2 | Session cookie lacked `Secure` flag | Medium | **Fixed** | `secure: true` when `NODE_ENV=production` in login/register |
| 3 | `POST /api/orders` trusted browser prices/totals → price manipulation | High | **Fixed** | Server recomputes price from catalog; test: client sent $0.01, order stored at $1199 |
| 4 | `POST /api/orders` accepted arbitrary `status` | High | **Fixed** | Status forced to `pending`; `[id]` PUT validates against allowed set |
| 5 | No stock validation → overselling | High | **Fixed** | qty checked against `product.stock`; over-stock rejected (400/409) |
| 6 | No rate limiting on auth/orders/writes → brute force & API abuse | High | **Fixed** | In-memory limiter: login/register 10/min, orders 30/min, writes 60/min; login returns 429 after limit |
| 7 | No input validation on product creation/editing | High | **Fixed** | `validateProductInput` enforces title/price/stock/category/specs |
| 8 | Error responses leaked internal error messages | Medium | **Fixed** | Generic messages returned; details logged server-side |
| 9 | No security headers / CSP | High | **Fixed** | CSP + HSTS(prod) + nosniff + frame + referrer + permissions + COOP in `next.config.mjs`; verified over HTTP |
| 10 | Known default admin/manager/customer credentials | High | **Partially fixed** | Prod build refuses to boot without `ADMIN_PASSWORD`; demo defaults retained for local demo only |
| 11 | `data/db.json` and `.env.local` tracked risk | Medium | **Fixed** | `.gitignore` updated (`.env*`, `data/*`); `.env.example` placeholders added |
| 12 | `sharp@0.34.5` (CVE-2026-33327 etc.) | High | **Fixed** | Override to `^0.35.0` |
| 13 | Bundled `postcss@8.4.31` (GHSA-qx2v…, GHSA-6g55…) | High | **Fixed** | Override to `^8.5.18` |
| 14 | `xlsx@0.18.5` prototype pollution + ReDoS | High | **No fix (accepted risk)** | No patched npm release; admin-only export path. Replace before production. |
| 15 | User IDs were timestamp-derived (`usr_${Date.now().toString(36)}`) | Low | **Fixed** | `crypto.randomUUID()` in registration |
| 16 | Registration accepted password of only 6 chars | Medium | **Fixed** | Server requires ≥ 8 chars |
| 17 | Fractional stock silently truncated by `Math.floor` | Medium | **Fixed** | `Number.isInteger` check added; caught by new unit test |
| 18 | `xlsx` advisory (prototype pollution + ReDoS) | High | **Fixed (replaced)** | Removed `xlsx`; `.xlsx` export now uses `exceljs`; added native CSV export. `npm audit` = 0 |
| 19 | `uuid` advisory via exceljs (moderate) | Moderate | **Fixed** | Override `uuid@^11.1.1`; audit = 0 |

## Verification Performed
- `npx tsc --noEmit` — clean.
- `npx next build` — succeeds, all 21 routes compiled.
- `npm test` (Vitest) — **12/12 security tests pass** (product validation, order
  status allow-list, rate limiter). Found & fixed fractional-stock bug.
- Live E2E on `http://localhost:3100` — **13/13 checks pass**:
  registration, weak-password rejection, public browse, unauth orders blocked (401),
  admin-only product write, valid order (201), price tamper neutralized (server price
  stored), oversell rejected, SQLi probe blocked, CSP/nosniff/frame/referrer headers.
- `npm audit --omit=dev` — **0 vulnerabilities** (was 4 high + 1 moderate).
