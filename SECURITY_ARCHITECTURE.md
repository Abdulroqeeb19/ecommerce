# SECURITY_ARCHITECTURE.md — Gadget Hub

*Security architecture and threat model for the Gadget Hub e-commerce demo.*

## 1. Technology Stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | Next.js 16.2.12 (App Router), React 19, TypeScript 5.7 |
| Styling | Tailwind CSS 3.4 |
| Server data | JSON file database (`data/db.json`) via Node `fs` sync I/O |
| Client data | IndexedDB via Dexie 4 (offline-first PWA) |
| Auth | Custom opaque session tokens (server-side), bcryptjs hashing |
| Notifications | Telegram, WhatsApp Cloud API, SendGrid, Twilio (server-side) |
| Report export | docx, jspdf, xlsx (admin-side) |
| Node.js | v24.17.0 |
| Package manager | npm |
| Deployment targets | Vercel and/or Docker with reverse proxy (planned, not yet configured) |

> Note: This demo does **not** use PostgreSQL. It uses a JSON file for server state
> plus client-side IndexedDB for offline-first operation. All PostgreSQL-specific
> phases in the hardening prompt are documented as forward-looking guidance.

## 2. Architecture

```
Browser (React SPA + IndexedDB offline cache)
        │  HTTPS / same-origin fetch
        ▼
Next.js (App Router)
 ├── Route Handlers (/api/*) ──► JSON file DB (data/db.json)
 ├── Auth (session cookie → server-side session store)
 ├── Notify (Telegram/WhatsApp/Email/SMS webhooks)
 └── Pages (public + admin + school mini-store)
```

### 2.1 Authentication flow
- Login/register POST to `/api/auth/*`.
- On success the server creates an opaque random session token (32-byte crypto
  random), stores `{ userId, expires }` server-side, and sets an `httpOnly`,
  `SameSite=Lax`, `Secure` (prod) cookie.
- `currentUser()` reads the cookie, looks up the session, expires stale sessions.
- `requireRole()` is the RBAC gate used by every protected route handler.

### 2.2 Data flow
- Public catalog: `GET /api/products` → JSON file → client IndexedDB.
- Orders: `POST /api/orders` validates items against the catalog server-side,
  recomputes totals, decrements stock atomically on a single process.
- Offline: orders queued in IndexedDB (`syncQueue`) and pushed via `pushQueue()`.

## 3. Threat Model

### 3.1 Public users (anonymous)
| Attack | Exposure | Status |
| ------ | -------- | ------ |
| Account takeover | Session token brute force | **Fixed** — 256-bit random tokens |
| Credential stuffing / brute force | `/api/auth/login`, `/api/auth/register` | **Fixed** — rate limited (10/min/IP) |
| XSS | React auto-escaping; CSP enforced | **Mitigated** — CSP + React |
| CSRF | SameSite=Lax cookies; JSON API | **Mitigated** — no state-changing GETs |
| Price manipulation | `POST /api/orders` trusted browser prices | **Fixed** — server recomputes from catalog |
| Inventory manipulation | Overselling via arbitrary qty | **Fixed** — qty validated vs stock server-side |
| Order manipulation | Client-set status/total | **Fixed** — status forced to `pending`, total recomputed |
| API abuse | Unbounded API calls | **Fixed** — rate limits on auth/orders/writes |

### 3.2 Customers
| Attack | Exposure | Status |
| ------ | -------- | ------ |
| Accessing another customer's order | IDOR on order APIs | **Mitigated** — order lists are admin/manager-only; no public order-by-id GET. Add ownership checks when public order history is added. |
| Modifying another customer's profile | Profile APIs | Not applicable — no profile edit API exists. |
| Cart price manipulation | Client cart | **Mitigated** — final price recomputed server-side at order time. |

### 3.3 Admins / Managers
| Attack | Exposure | Status |
| ------ | -------- | ------ |
| Admin account takeover | Session theft | **Mitigated** — httpOnly cookie, rate-limited login. |
| Privilege escalation | Trusting browser role | **Fixed** — role read from server-side session, never from client. |
| Unauthorized product modification | Admin APIs | **Fixed** — `requireRole(["admin"])` on all product writes + input validation. |
| Unauthorized inventory manipulation | Stock API | **Fixed** — `requireRole(["admin","manager"])` + integer validation. |
| Malicious file upload | Image upload | Not applicable — no upload endpoint; images are static SVG assets. |

### 3.4 Infrastructure
| Attack | Exposure | Status |
| ------ | -------- | ------ |
| Exposed PostgreSQL | N/A | No PostgreSQL in this demo. See Phase 24/25 guidance. |
| Leaked secrets | `.env.local` | **Fixed** — gitignored; `.env.example` placeholders only; no real keys committed. |
| Vulnerable dependencies | npm audit | **Fixed (4→1)** — sharp/postcss patched via overrides; `xlsx` has no npm fix (documented). |
| Insecure API / CORS | Same-origin API | **Mitigated** — same-origin only; no CORS headers issued. |
| Weak TLS / insecure headers | Response headers | **Fixed** — CSP, HSTS (prod), nosniff, frame, referrer, permissions policies. |
| Server compromise | N/A local demo | See DEPLOYMENT.md for VPS guidance. |

## 4. Security Controls (implemented)

- **Session tokens:** `crypto.randomBytes(32)` hex, stored server-side, 7-day TTL,
  lazy expiration.
- **Password hashing:** bcrypt with cost 10 (seeded) / 12 (registration).
- **Cookies:** `HttpOnly`, `SameSite=Lax`, `Secure` in production.
- **RBAC:** server-side `requireRole` on every protected route.
- **Rate limiting:** in-memory sliding window per IP+route (login/register 10/min,
  orders 30/min, writes 60/min, notify-test 5/min).
- **Input validation:** orders (items, qty, stock, prices, status, customer fields)
  and products (title, price, stock, specs, tags) validated server-side.
- **Security headers:** CSP, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `X-Frame-Options`, `COOP`, HSTS (prod) via `next.config.mjs`.
- **Secret hygiene:** no `NEXT_PUBLIC_` secrets; all provider tokens server-side only.

## 5. Known Limitations

- **JSON file DB** is single-writer and not suitable for multi-instance/high-traffic
  production; it is fine for this demo. Migrate to PostgreSQL + connection pooling
  before scaling.
- **In-memory rate limiting** resets on restart and is per-process; use a shared
  store (Redis) for serverless/multi-instance.
- **`xlsx` dependency** carries a high-severity advisory with no npm fix. It is used
  only in the admin report export path. Replace with SheetJS CE from the official CDN
  or switch to a maintained library (e.g. `exceljs`) before production.
- **No payment gateway** is wired; the checkout is a demo. When adding a gateway,
  verify payments server-side via signed webhooks and never trust `paymentStatus=paid`
  from the browser (see SSL_DEPLOYMENT / FINAL_SECURITY_REPORT guidance).
