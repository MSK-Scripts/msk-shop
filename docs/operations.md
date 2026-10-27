# Operations

CI/CD, manual installation, environment variables, updating and troubleshooting. The server-side deploy runbook is [DEPLOYMENT.md](DEPLOYMENT.md). Back to the [README](../README.md).

## CI/CD, auto deploy

The deploy is done on the server, not by shipping build artifacts. The repo lives as a full git clone at `/opt/msk-shop`, and `scripts/deploy.sh` builds and restarts the app there. The full setup and runbook is in **[docs/DEPLOYMENT.md](DEPLOYMENT.md)**.

```
Push → CI (lint · typecheck · test · audit · build) ── green ──▶ Deploy (workflow_run)
                                                                └─ SSH (ForceCommand) ─▶ deploy.sh <sha>
```

1. **CI** (`.github/workflows/ci.yml`, name `CI`) runs `lint`, `typecheck` (`tsc --noEmit`), `test`, an audit of the production dependency tree (`npm audit --omit=dev --audit-level=high`) and `build` on every push and PR to `main`.
2. **Deploy** (`.github/workflows/deploy.yml`) fires via `workflow_run` only once CI is green on `main`. You can also run it manually with an optional `commit_sha`, which is how rollbacks work.
3. The Action SSHes in and runs `deploy.sh`, which does the following on the server:
   `git checkout <sha>` → database migrations → `npm ci` → `npm run build` (loading `/opt/msk-shop/.env.local`) →
   `systemctl restart msk-shop` → a health check (`curl :3005`, aborts on failure) → deploy tag.
   The script pulls the latest `deploy.sh` from `main` before every run, so it updates itself.

A note on security: the Action's SSH key is pinned with `ForceCommand`, so it can only ever run `deploy.sh`, and known-hosts checking is strict. Because the build happens on the server, the `NEXT_PUBLIC_*` and `TEBEX_PRIVATE_KEY` values have to be present in `/opt/msk-shop/.env.local` (Next.js reads `.env.local` at build time). Every other server-side secret lives there too.

### Required GitHub Secrets

| Secret | Value |
|--------|-------|
| `DEPLOY_SSH_KEY` | Private key of the Action deploy key (ed25519) |
| `DEPLOY_HOST` | Server IP or hostname |
| `DEPLOY_HOST_FINGERPRINT` | `ssh-keyscan -t ed25519 [-p <port>] <host>` output |
| `DEPLOY_USER` *(optional, default `root`)* | SSH user |
| `DEPLOY_PORT` *(optional, default `22`)* | SSH port |
| `NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN` | Tebex public token (CI build) |
| `NEXT_PUBLIC_TEBEX_PROJECT_ID` | Tebex project ID (CI build) |
| `NEXT_PUBLIC_BASE_URL` | `https://www.msk-scripts.de` (CI build) |
| `TEBEX_PRIVATE_KEY` | Tebex private key (CI build) |

There are a few more workflows in the repo: `codeql.yml` (code scanning), `code-coverage.yml` (Vitest coverage upload), `mirror.yml` (mirrors the repo to Codeberg), `dependency-review.yml` and `secret-scan.yml`. Dependabot (`.github/dependabot.yml`) groups minor and patch updates into one weekly PR and keeps `vitest` with `@vitest/*` in a group of their own, because they only install together.

---

## Manual Installation

### Requirements

- Node.js 24.x
- npm
- MariaDB or MySQL
- Apache2 with `mod_proxy`, `mod_ssl`, `mod_rewrite`, `mod_headers`
- A Let's Encrypt SSL certificate (Certbot)
- Debian / Ubuntu with systemd
- PM2 (only if you use hosted bot management)

### Steps

```bash
# 1. Clone
cd /opt
git clone https://github.com/MSK-Scripts/msk-shop.git msk-shop
cd msk-shop

# 2. Environment variables
cp .env.example .env.local
nano .env.local

# 3. Database
mysql -u root -p -e "CREATE DATABASE your_db_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p your_db_name < database/schema.sql

# 4. Install & build
npm ci
npm run build

# 5. Permissions (the service runs as user "musiker15" on port 3005)
chown -R musiker15:musiker15 /opt/msk-shop
chmod -R u+w /opt/msk-shop/.next

# 6. systemd service
cp msk-shop.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable msk-shop
systemctl start msk-shop

# 7. Apache2
a2enmod proxy proxy_http rewrite ssl headers
# Copy the Apache config, see msk-shop.conf and msk-shop_ssl.conf
systemctl reload apache2
```

The most important `.env.local` values. `.env.example` has the complete list with a comment for every variable (giveaway bot, bot hosting, IONOS DNS, admin dashboard, image CDN and more):

```env
# Tebex
NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN=your_public_token
NEXT_PUBLIC_TEBEX_PROJECT_ID=your_project_id
TEBEX_PRIVATE_KEY=your_private_key
NEXT_PUBLIC_BASE_URL=https://www.msk-scripts.de

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD='your_db_password'
DB_NAME=your_db_name

# Session
SESSION_SECRET=<openssl rand -hex 32>

# Discord OAuth (verify flow, scopes: identify, guilds)
DISCORD_VERIFY_CLIENT_ID=your_client_id
DISCORD_VERIFY_CLIENT_SECRET=your_client_secret

# Stripe (Ticket Bot subscriptions)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_PREMIUM=price_xxx
STRIPE_PRICE_PREMIUM_PLUS=price_xxx
STRIPE_PRICE_BUSINESS=price_xxx

# Mail (skipped with a log line when unset). Quote values containing < or >
SMTP_HOST=mail.example.com
SMTP_PORT=465
SMTP_USER=noreply@msk-scripts.de
SMTP_PASS=your_smtp_password
MAIL_FROM="MSK Scripts <noreply@msk-scripts.de>"

# Transcripts (served by Apache under /transcripts)
TRANSCRIPT_BASE_PATH=/var/www/html/transcripts

# DNS validation & SSL
SERVER_PUBLIC_IP=your.server.ip
ADMIN_EMAIL=info@msk-scripts.de

# Hosted bot management, one subfolder per guild: {BOT_CONFIG_BASE_PATH}/{guild_id}/
BOT_CONFIG_BASE_PATH=/opt/customer_ticketbots

# Public stats, comma-separated API keys to keep out of /en/discord/ticket-bot/stats
STATS_IGNORED_API_KEYS=key1,key2,key3

# Resource statistics (the /en/stats page)
FIVESTATS_API_KEY=your_fivestats_api_key
```

> Never commit `.env.local`. It is listed in `.gitignore`.

For local development without a server database there is `docker-compose.dev.yml`, see the last section of [docs/DEPLOYMENT.md](DEPLOYMENT.md).

---

## Updating (manual)

On the production server this is fully automated: a push to `main` runs CI and then `scripts/deploy.sh` (see [docs/DEPLOYMENT.md](DEPLOYMENT.md)). Prefer running that script by hand over the steps below, because it also applies pending database migrations. The steps are the fallback for a server without the migration step.

```bash
cd /opt/msk-shop
git pull
npm ci
npm run build
chown -R musiker15:musiker15 /opt/msk-shop
chmod -R u+w /opt/msk-shop/.next
systemctl restart msk-shop
# preferred: /opt/msk-shop/scripts/deploy.sh
```

---

## Troubleshooting

```bash
# Next.js service logs
journalctl -u msk-shop -f

# Deploy log
tail -f /var/log/msk-shop-deploy.log

# Apache error log
tail -f /var/log/apache2/msk-shop-error.log

# Restart
systemctl restart msk-shop
systemctl reload apache2

# Fix permission errors (EACCES on .next/)
chown -R musiker15:musiker15 /opt/msk-shop
chmod -R u+w /opt/msk-shop/.next
systemctl restart msk-shop

# Test the database connection
mysql -u your_db_user -p your_db_name -e "SHOW TABLES;"

# Hosted bot PM2 status
systemctl status pm2-musiker15
sudo -u musiker15 pm2 list
```
