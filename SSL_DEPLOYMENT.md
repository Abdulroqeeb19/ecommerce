# SSL_DEPLOYMENT.md — Gadget Hub

How to put the app behind HTTPS with automatic, trusted certificates.

> This demo runs on `http://localhost:3100` locally. HTTPS is required for any real
> deployment. The Next.js app itself does not terminate TLS; a reverse proxy does.

## Recommended: Caddy (simplest, automatic certs)

Caddy obtains and renews Let's Encrypt certificates automatically and redirects
HTTP → HTTPS for you.

```
# Caddyfile
gadgetstore.example.com {
    reverse_proxy 127.0.0.1:3100
    encode zstd gzip
    header {
        Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    }
}
```

Start: `caddy run` (installs cert, serves HTTPS on :443, redirects :80).

## Alternative: Nginx + certbot

```
server {
    listen 80;
    server_name gadgetstore.example.com;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl http2;
    server_name gadgetstore.example.com;
    ssl_certificate     /etc/letsencrypt/live/gadgetstore.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gadgetstore.example.com/privkey.pem;
    location / { proxy_pass http://127.0.0.1:3100; }
}
```
`certbot --nginx -d gadgetstore.example.com` handles issuance + renewal.

## Alternative: Vercel (managed)
Vercel terminates TLS at the platform edge. You do **not** install certificates;
just configure your domain (see DNS below) and Vercel provisions the cert.

## Certificate renewal
- Caddy / certbot auto-renew. Verify with `caddy list-modules` / `certbot renew --dry-run`.
- Do **not** use self-signed certs for public production traffic.

## Verification checklist
- [ ] `https://gadgetstore.example.com` loads with a valid cert
- [ ] `http://` redirects to `https://`
- [ ] HSTS header present (prod build) — `curl -I https://… | grep -i strict`
- [ ] No mixed content (all subresources HTTPS)
- [ ] Session cookies show `Secure` flag
- [ ] TLS ≥ 1.2, preferably 1.3

## DNS checklist (do not change live DNS without confirmation)
- [ ] A record `gadgetstore.example.com` → VPS IPv4
- [ ] AAAA record → IPv6 if the host supports it
- [ ] CNAME for `www.gadgetstore.example.com` → apex (or separate A record)
- [ ] Vercel: add domain in project settings and verify ownership (CNAME/verification record)
- [ ] Wait for propagation (`dig +short gadgetstore.example.com`) before cert issuance
