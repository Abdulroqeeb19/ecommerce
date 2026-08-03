# INCIDENT_RESPONSE.md — Gadget Hub

Runbook for responding to security incidents in the Gadget Hub application.

## Severity levels
- **SEV-1 (Critical):** data breach, admin/root compromise, mass account takeover, ransomware.
- **SEV-2 (High):** payment fraud, privilege escalation, exposed secrets, DoS.
- **SEV-3 (Medium):** XSS, rate-limit bypass, failed scans.
- **SEV-4 (Low):** cosmetic/defense-in-depth gaps.

## Response phases

### 1. Detect
Signs to watch: failed-login bursts, unexpected orders, stock changes not matching
orders, admin account activity at odd hours, uptime/error-rate spikes.

### 2. Contain (stop the bleeding)
- Disable affected accounts / revoke sessions (`data/db.json` → `sessions`).
- Rotate exposed credentials immediately (notification tokens, `ADMIN_PASSWORD`).
- If SEV-1/2: take the service offline or block IPs at the reverse proxy/firewall.
- Snapshot the current `data/db.json` and logs **before** changes.

### 3. Eradicate
- Remove injected files / rogue products / orders placed by the attacker.
- Reset passwords for all users if credential stuffing is suspected.
- Patch the root cause (see SECURITY_AUDIT.md for known issue classes).

### 4. Recover
- Restore from the last clean backup (see BACKUP_AND_RECOVERY.md).
- Verify integrity: product/user/order counts, stock consistency, session table.

### 5. Lessons learned
- Update SECURITY_AUDIT.md and the PRODUCTION_SECURITY_CHECKLIST.md with the gap.
- Add monitoring/alerting for the detection gap that allowed the incident.

## Communication
- For this demo, notify the maintainer. Public disclosure after remediation.
- Never share secrets or full exploit details in the report.

## Contact
Maintainer / operator contact list goes here (email, phone, escalation path).
