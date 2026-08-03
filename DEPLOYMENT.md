# DEPLOYMENT.md — Gadget Hub

Deployment options and steps for the Gadget Hub Next.js app.

## Build
```bash
npm ci
npx tsc --noEmit   # type check
npx next build     # production build (output: .next)
```

## Option A — Vercel (recommended for Next.js)
1. Push the repo (or connect via git) to Vercel.
2. In Project Settings → Environment Variables, add **all** values from `.env.local`
   (`ADMIN_PASSWORD` required; notification tokens optional). Mark secret values as
   **secret** so they are not exposed.
3. Set `NODE_ENV=production` (Vercel sets it automatically).
4. Add your domain (see SSL_DEPLOYMENT.md DNS checklist). Vercel provisions the cert.
5. Deploy. Note: the JSON-file DB writes to the ephemeral filesystem — use the
   platform's file storage, a persistent volume, or migrate to PostgreSQL before
   relying on Vercel for data persistence.

## Option B — Docker + VPS
```
Internet → HTTPS (Caddy/Nginx) → Next.js (:3100) → data/db.json (volume)
```
1. Use a minimal Node LTS image; multi-stage build (deps → build → runtime).
2. Run as a non-root user; copy only `.next`, `public`, `package.json`, and `data/`.
3. Mount `data/` as a persistent volume for `db.json`.
4. Reverse proxy: Caddy for automatic TLS (see SSL_DEPLOYMENT.md).
5. Expose only :80/:443 on the firewall; keep SSH restricted.
6. Set restart policy `unless-stopped`; configure logs and monitoring.

### Example Dockerfile
```dockerfile
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx next build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
RUN mkdir -p /app/data && chown -R app:app /app/data
USER app
EXPOSE 3100
VOLUME ["/app/data"]
CMD ["npm", "start"]
```

## Environment variables
See `.env.example`. Never commit real values.

## Post-deploy verification
Run the `PRODUCTION_SECURITY_CHECKLIST.md` and the SSL verification steps.
