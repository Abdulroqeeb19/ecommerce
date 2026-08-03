# BACKUP_AND_RECOVERY.md — Gadget Hub

Backup strategy for the Gadget Hub data layer.

## What to back up

| Path | Contents | Priority |
| ---- | -------- | -------- |
| `data/db.json` | Products, users (bcrypt hashes), orders, sessions | **Critical** |
| `.env.local` | Config/secrets (store in secret manager too) | Critical (access-controlled) |
| `public/images/products/*` | Product images | High |
| `public/manifest.json`, app source | Reproducible from git | Low |

## Strategy (current JSON-file DB)

**Frequency:** Daily full backup of `data/db.json`; real-time not needed at demo scale.

**Retention:** 14 daily + 4 weekly + 6 monthly snapshots.

**Encryption:** Encrypt backups at rest (e.g. `age` or `openssl aes-256-cbc`) and
store outside the server (S3/GCS/Backblaze or an offsite folder).

**Script example (PowerShell / cron):**
```powershell
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
Copy-Item "data/db.json" "backups/db-$ts.json"
& openssl aes-256-cbc -a -salt -in "backups/db-$ts.json" -out "backups/db-$ts.json.enc" -pass pass:$env:BACKUP_KEY
```
Prune old backups by retention policy.

## Restoration

**Restore steps:**
1. Decrypt the chosen snapshot: `openssl aes-256-cbc -d -a -in db-….json.enc -out db.json`.
2. Stop the app; place the file at `data/db.json`.
3. Start the app; verify product/user/order counts on `/admin`.
4. Client caches: IndexedDB will re-sync from the catalog on next `pullCatalog()`.

**Verification:** Restore monthly into a scratch copy and confirm integrity
(`node -e "require('fs').readFileSync('data/db.json','utf8') && JSON.parse(...)"`).

## When PostgreSQL is introduced
- Use `pg_dump` logical backups nightly + `pg_basebackup` (or managed snapshots).
- Use the provider's pooled connection for serverless (see SECURITY_ARCHITECTURE.md).
- Never run destructive migrations automatically against production.
- Test restoration quarterly in a non-production database.
