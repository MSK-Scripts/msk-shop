#!/usr/bin/env bash
# Auto-deploy for msk-shop.
#
# Called as root over SSH by the GitHub Actions workflow
# .github/workflows/deploy.yml. Run locally for a rollback:  ./scripts/deploy.sh <sha>
#
# Properties:
#   - Server-side build: fetches the code with git and builds with npm on the
#     server itself (so the COMPLETE repo, scripts/ included, is versioned there).
#   - Idempotent (running again with the same commit is harmless).
#   - Self-updating: before every run deploy.sh is fetched from origin/main and,
#     if it changed, re-exec'd. That keeps the deploy logic stable, including a
#     rollback onto a commit that carries an older version of the script.
#   - Aborts hard when the build or the health check fails.
#   - Audit log in /var/log/msk-shop-deploy.log.
#
# Build env: `next build` loads /opt/msk-shop/.env.local on its own. The
# NEXT_PUBLIC_* and TEBEX_PRIVATE_KEY values MUST be in there (server-side
# build, no longer taken from GitHub secrets).
#
# npm steps run as the app user (musiker15) via `sudo -u ... bash -lc`, so that
# node_modules belong to the app user and an NVM node from the login shell is
# picked up. Root-only steps (git, systemctl, chown) run directly.

set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/msk-shop}"
APP_USER="${APP_USER:-musiker15}"
SERVICE="${SERVICE:-msk-shop}"
APP_PORT="${APP_PORT:-3005}"
LOG_FILE="${LOG_FILE:-/var/log/msk-shop-deploy.log}"

# Commit SHA: first positional argument or $SSH_ORIGINAL_COMMAND (with a
# ForceCommand in authorized_keys, GitHub passes the SHA through there).
COMMIT="${1:-${SSH_ORIGINAL_COMMAND:-}}"
COMMIT="${COMMIT##* }"   # in case SSH_ORIGINAL_COMMAND arrived with a path prefix

# Tee into the log file if it is writable, otherwise stdout only.
#
# Only in the first process. When step 1a finds a newer deploy.sh it re-execs
# with DEPLOY_REEXEC=1, and the new process inherits stdout that already runs
# through this tee. Setting up a second tee on the same file wrote every line
# after the re-exec twice (seen on 2026-09-12, the first deploy that changed
# the script itself).
if [[ "${DEPLOY_REEXEC:-0}" == "0" ]] && [[ -w "$(dirname "$LOG_FILE")" || -w "$LOG_FILE" ]]; then
  exec > >(tee -a "$LOG_FILE") 2>&1
fi
echo "=== Deploy $(date -Iseconds) commit=${COMMIT:-HEAD} ==="

cd "$REPO_DIR"

# Helper: run a command as the app user with a login shell (loads NVM if present, sets HOME).
run_as_app_user() {
  sudo -u "$APP_USER" -H bash -lc "cd '$REPO_DIR' && $*"
}

# 1. Fetch the code.
git fetch --prune origin main

# 1a. Self-update: fetch deploy.sh from origin/main and re-exec if it differs from
#     the script currently running. Keeps the deploy logic stable, including a
#     rollback onto a commit that brings older or broken logic along.
if [[ "${DEPLOY_REEXEC:-0}" == "0" ]]; then
  tmp_script="$(mktemp)"
  if git show origin/main:scripts/deploy.sh > "$tmp_script" 2>/dev/null; then
    self_hash="$(sha256sum "$0" | awk '{print $1}')"
    latest_hash="$(sha256sum "$tmp_script" | awk '{print $1}')"
    if [[ "$self_hash" != "$latest_hash" ]]; then
      echo "deploy.sh updated from origin/main, re-exec."
      install -m 755 -o root -g root "$tmp_script" "$REPO_DIR/scripts/deploy.sh"
      rm -f "$tmp_script"
      # Refresh the index, otherwise the following checkout sees a phantom conflict.
      git update-index --add scripts/deploy.sh || true
      export DEPLOY_REEXEC=1
      exec "$REPO_DIR/scripts/deploy.sh" "$@"
    fi
  fi
  rm -f "$tmp_script"
fi

# 2. Check out the requested commit (or the latest main). --force as a safety
#    net against working-tree drift; apart from the scripts the repo holds no
#    deliberately maintained local changes.
if [[ -n "$COMMIT" ]]; then
  git checkout --force --detach "$COMMIT"
else
  git checkout --force main
  git pull --ff-only origin main
fi

# 3. Database migrations.
#
# Until 2026-09-12 there were none: every schema change sat as a COMMENT in
# database/schema.sql and had to be applied by hand. That held only as long as
# somebody remembered. On 2026-09-12 the assumption was "the migration runs
# with the deploy", it did not, and pushing without checking would have served
# code querying two non-existent columns - HTTP 500 on the whole dashboard for
# every customer.
#
# Runs BEFORE npm ci and the build, so a broken migration fails the deploy in
# seconds instead of after minutes of npm work. The same ordering means a
# migration is applied while the OLD version is still serving requests, so
# every migration must be ADDITIVE and invisible to the running code. Dropping
# a column is a two-release job: stop using it first, drop it next time. A
# deploy onto an older commit does NOT roll migrations back, which is the same
# rule seen from the other side. Conventions: database/migrations/README.md.
#
# Applied as root over the unix socket. The script already runs as root, which
# avoids both putting a database password in here and having to grant DDL
# rights to the app user. --defaults-file=/dev/null is NOT optional:
# /root/.my.cnf on this machine sets user=srh_checklisten, so a bare `mariadb`
# connects as the wrong user and fails with a permission error that looks like
# a database problem.
#
# The database name is READ OUT of .env.local instead of sourcing it. On
# 2026-09-02 an unquoted `MAIL_FROM=MSK Scripts <info@…>` killed three crons
# that sourced that file, because sh reads < and > as redirections. Nothing in
# a deploy should depend on every other line of that file being shell-safe.
ENV_FILE="$REPO_DIR/.env.local"
MIGRATIONS_DIR="$REPO_DIR/database/migrations"

# Read a single key out of .env.local. Last occurrence wins (same as dotenv),
# surrounding quotes and stray CR are stripped.
env_value() {
  [[ -f "$ENV_FILE" ]] || return 0
  sed -n "s/^[[:space:]]*${1}[[:space:]]*=//p" "$ENV_FILE" \
    | tail -n 1 | tr -d '\r' \
    | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' \
          -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'\$/\1/"
}

if [[ -d "$MIGRATIONS_DIR" ]] && compgen -G "$MIGRATIONS_DIR/*.sql" >/dev/null; then
  DB_NAME="$(env_value DB_NAME)"
  if [[ -z "$DB_NAME" ]]; then
    echo "Migrations present, but DB_NAME is not set in $ENV_FILE. Aborting."
    exit 1
  fi

  db() { mariadb --defaults-file=/dev/null -u root "$DB_NAME" "$@"; }

  db -e "CREATE TABLE IF NOT EXISTS schema_migrations (
           filename   VARCHAR(190) NOT NULL PRIMARY KEY,
           applied_at DATETIME     NOT NULL DEFAULT NOW()
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"

  migrations_applied=0
  for migration in "$MIGRATIONS_DIR"/*.sql; do
    migration_name="$(basename "$migration")"

    # Enforce the naming convention instead of escaping the name for SQL: the
    # filename ends up in a query, and a restricted alphabet is a better answer
    # than quoting. Abort rather than skip - a migration that silently does not
    # run is worse than a loud stop.
    if [[ ! "$migration_name" =~ ^[0-9]{3,}-[A-Za-z0-9._-]+\.sql$ ]]; then
      echo "Migration name does not match NNN-name.sql: $migration_name. Aborting."
      exit 1
    fi

    if [[ -n "$(db -N -B -e "SELECT 1 FROM schema_migrations WHERE filename = '$migration_name' LIMIT 1;")" ]]; then
      continue
    fi

    echo "Applying migration: $migration_name"
    if ! db < "$migration"; then
      echo "Migration $migration_name failed. Deploy aborted."
      exit 1
    fi
    # Only recorded AFTER the file ran through. A failed migration is retried
    # on the next deploy, which is why they should be written idempotently.
    db -e "INSERT INTO schema_migrations (filename) VALUES ('$migration_name');"
    migrations_applied=$((migrations_applied + 1))
  done

  if [[ "$migrations_applied" -eq 0 ]]; then
    echo "Migrations: nothing to apply."
  else
    echo "Migrations: $migrations_applied applied."
  fi
fi

# 4. Dependencies (devDependencies included, the Next build needs them).
#    --no-audit: the audit report at the end of `npm ci` concerns devDependencies
#    only (see below), but in the deploy log it cannot be told apart from a real
#    finding and would make every deploy look like a problem. The audit belongs
#    in CI and on the workbench, not in the deploy log. Check the production
#    tree with `npm audit --omit=dev` (0).
run_as_app_user 'npm ci --no-audit'

# 5. Production build. `next build` loads .env.local on its own (NEXT_PUBLIC_*
#    and TEBEX_PRIVATE_KEY must be in there).
run_as_app_user 'npm run build'

# 6. Permissions.
#    App files go to the app user. .git/ and scripts/ stay ROOT-OWNED.
#    scripts/ MUST be root-owned and not writable by the app user: vhost-*.sh
#    are run by the app user as root through NOPASSWD sudo. If they sat in a
#    directory the app user can write to, it could swap them out (or, through
#    write access to the directory, replace the whole file), which is privilege
#    escalation. deploy.sh runs as root and still updates scripts/ through git
#    without trouble.
find "$REPO_DIR" -mindepth 1 -maxdepth 1 \
  ! -name '.git' ! -name 'scripts' \
  -exec chown -R "$APP_USER:$APP_USER" {} +
chown -R root:root "$REPO_DIR/scripts"
chmod 755 "$REPO_DIR/scripts"
find "$REPO_DIR/scripts" -name '*.sh' -exec chmod 755 {} +

# .env.local belongs to the app user and nobody else. On 2026-09-03 it was 644,
# and this machine has eleven other login users (ts3, sinusbot, fivem,
# minecraft, steam, ...). Any of them could read the live Stripe key,
# SESSION_SECRET, the database password, the IONOS API key and
# BOT_DASHBOARD_PROXY_SECRET. The file is gitignored and not recreated by the
# deploy; the line is here so a file rewritten by hand does not end up
# world-readable again.
if [ -f "$REPO_DIR/.env.local" ]; then
  chmod 600 "$REPO_DIR/.env.local"
fi

# 7. Update the systemd unit if it changed.
if ! cmp -s "$REPO_DIR/msk-shop.service" /etc/systemd/system/msk-shop.service 2>/dev/null; then
  echo "msk-shop.service changed, installing it and running daemon-reload."
  cp "$REPO_DIR/msk-shop.service" /etc/systemd/system/msk-shop.service
  systemctl daemon-reload
fi

# 8. Restart the service.
systemctl restart "$SERVICE"

# 9. Health check: wait up to ~20 s for a 200 response, otherwise abort.
#    The first attempt right after the restart almost always fails because
#    Next.js has not opened the port yet. curl's error is kept in a variable
#    instead of going to the log, so a normal retry does not look like a
#    failure; only when every attempt fails is the last error printed.
ok=0
health_error=""
for _ in $(seq 1 10); do
  if health_error="$(curl -fsS -o /dev/null "http://127.0.0.1:${APP_PORT}/" 2>&1)"; then ok=1; break; fi
  sleep 2
done
if [[ "$ok" -ne 1 ]]; then
  echo "Health check failed: ${health_error:-no response}"
  echo "Last 50 log lines:"
  journalctl -u "$SERVICE" -n 50 --no-pager || true
  exit 1
fi

# 10. Set a deploy tag so the last working state is quick to find again
#     (rollback).
TAG="deploy-$(date -u +%Y%m%d-%H%M%S)"
git tag -f "$TAG" >/dev/null 2>&1 || true

echo "Deploy succeeded (${COMMIT:-HEAD}), tag: $TAG"
