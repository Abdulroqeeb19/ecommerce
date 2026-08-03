# SECURITY.md — Gadget Hub

Security policy and reporting guidance for the project.

## Scope
This document describes the security posture of the Gadget Hub e-commerce demo
(Next.js 16 / React 19, JSON-file + IndexedDB data layer). It is a demo/PWA; it is
**not** a hardened public production service yet.

## Reporting a Vulnerability
For this demo, report issues by opening an issue in the project's repository or
contacting the maintainer directly. Do **not** publish exploit details publicly.
Include:
- Affected endpoint/page and how to reproduce
- Impact (what an attacker could do)
- Suggested fix, if known

## Supported Security Posture
- Authentication: session-cookie based, bcrypt-hashed passwords, rate-limited login.
- Authorization: server-side RBAC (`admin`, `manager`, `customer`).
- Transport: TLS in production via reverse proxy; HSTS enabled in production builds.
- Headers: CSP, nosniff, frame, referrer, permissions, COOP.
- Data: no card data stored; orders validated server-side.

## Out of Scope / Known Limitations
See `SECURITY_ARCHITECTURE.md` §5. Notable:
- `xlsx` dependency has an unfixed high advisory (admin export only).
- JSON-file DB is single-writer; not for multi-instance scale.
- In-memory rate limiting resets on restart.
- No payment gateway wired yet.
