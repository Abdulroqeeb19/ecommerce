# PRODUCTION_SECURITY_CHECKLIST.md — Gadget Hub

Run every item before any production deployment. Check each box or document why N/A.

## Environment & Secrets
- [ ] `NODE_ENV=production` set on the host
- [ ] `ADMIN_PASSWORD` set to a strong random value (prod build refuses to boot without it)
- [ ] Demo manager/customer accounts removed or passwords rotated (`MANAGER_EMAILS`, demo seeds)
- [ ] All notification tokens real: `TELEGRAM_BOT_TOKEN`, `WHATSAPP_TOKEN`, `SENDGRID_API_KEY`, `TWILIO_AUTH_TOKEN`
- [ ] No real secrets in `.env.example`, `.gitignore` covers `.env*` and `data/*`
- [ ] Secrets stored in the platform's secret store (Vercel env vars / Docker secrets), never in the image or repo

## Transport & TLS
- [ ] HTTPS active with a trusted cert (Let's Encrypt / managed platform cert)
- [ ] HTTP :80 redirects to HTTPS :443
- [ ] HSTS header present and valid (`next.config.mjs` enables it in production)
- [ ] No mixed content (all resources HTTPS)
- [ ] Secure cookies verified (`Secure` flag) — see `SSL_DEPLOYMENT.md`

## Headers & CSP
- [ ] CSP served and page still functions (test every route)
- [ ] `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` present
- [ ] Remove dev-mode `unsafe-eval`/`unsafe-inline` from CSP if a production profile is feasible

## Authentication & Authorization
- [ ] Login/registration rate limited
- [ ] Passwords hashed (bcrypt, cost ≥ 10) — no plaintext anywhere
- [ ] Sessions: httpOnly + SameSite + Secure, server-side store, expiration enforced
- [ ] Admin and school-mini-store pages enforce RBAC server-side (no client-role trust)
- [ ] Default credentials removed from `data/db.json`

## API & Data
- [ ] Orders validate server-side: items exist, stock sufficient, totals recomputed, status server-controlled
- [ ] Products validate input server-side (title, price, stock, category)
- [ ] Error responses do not leak stack traces / internals
- [ ] If PostgreSQL is introduced: parameterized queries, private network, least-privilege user, migrations non-destructive

## Payments (when a gateway is added)
- [ ] Server verifies payment via signed webhook (never trust `paymentStatus=paid`)
- [ ] Webhook validates reference, amount, currency, event; idempotent; no double fulfillment
- [ ] No CVV/raw card storage

## Dependencies & Build
- [ ] `npm audit` — zero critical/high (except documented `xlsx`; replace it)
- [ ] `npx tsc --noEmit` clean
- [ ] `npx next build` succeeds
- [ ] Pin versions in `package.json` / lockfile committed

## Infrastructure (VPS/Docker)
- [ ] Reverse proxy only exposes :80/:443; PostgreSQL (if used) private
- [ ] Non-root container user, minimal image, `.dockerignore` in place
- [ ] Firewall restricted; SSH hardened (key-only, non-default port or limited)
- [ ] Backups configured and restoration tested (see `BACKUP_AND_RECOVERY.md`)

## Operations
- [ ] Structured logging without secrets
- [ ] Monitoring + alerting in place
- [ ] Incident response runbook accessible (see `INCIDENT_RESPONSE.md`)
- [ ] DNS records verified (see `SSL_DEPLOYMENT.md` DNS checklist)
