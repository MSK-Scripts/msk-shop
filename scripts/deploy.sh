#!/usr/bin/env bash
# Auto-Deploy für msk-shop.
#
# Wird vom GitHub-Actions-Workflow .github/workflows/deploy.yml per SSH als
# root aufgerufen. Lokal aufrufbar für Rollback:  ./scripts/deploy.sh <sha>
#
# Eigenschaften:
#   - Server-side Build: holt den Code per git, baut mit npm direkt auf dem
#     Server (so liegt das KOMPLETTE Repo inkl. scripts/ versioniert vor).
#   - Idempotent (erneuter Lauf mit gleichem Commit unschädlich).
#   - Self-updating: vor jedem Lauf wird deploy.sh aus origin/main geholt und,
#     falls geändert, re-exec. So bleibt die Deploy-Logik stabil — auch beim
#     Rollback auf einen Commit mit älterer Skript-Version.
#   - Bricht hart ab, wenn Build oder Health-Check fehlschlägt.
#   - Audit-Log nach /var/log/msk-shop-deploy.log.
#
# Build-Env: `next build` lädt automatisch /opt/msk-shop/.env.local — die
# NEXT_PUBLIC_*- und TEBEX_PRIVATE_KEY-Werte MÜSSEN dort stehen (server-side
# Build, nicht mehr aus GitHub-Secrets).
#
# npm-Schritte laufen als App-User (musiker15) via `sudo -u … bash -lc`, damit
# node_modules dem App-User gehören und eine evtl. NVM-Node aus der Login-Shell
# geladen wird. root-only-Schritte (git, systemctl, chown) laufen direkt.

set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/msk-shop}"
APP_USER="${APP_USER:-musiker15}"
SERVICE="${SERVICE:-msk-shop}"
APP_PORT="${APP_PORT:-3005}"
LOG_FILE="${LOG_FILE:-/var/log/msk-shop-deploy.log}"

# Commit-SHA: 1. Positionsargument oder $SSH_ORIGINAL_COMMAND (bei ForceCommand
# in authorized_keys reicht GitHub den SHA hier durch).
COMMIT="${1:-${SSH_ORIGINAL_COMMAND:-}}"
COMMIT="${COMMIT##* }"   # falls SSH_ORIGINAL_COMMAND mit Pfad-Präfix kam

# tee in Log-Datei, falls schreibbar — sonst nur stdout.
if [[ -w "$(dirname "$LOG_FILE")" || -w "$LOG_FILE" ]]; then
  exec > >(tee -a "$LOG_FILE") 2>&1
fi
echo "=== Deploy $(date -Iseconds) commit=${COMMIT:-HEAD} ==="

cd "$REPO_DIR"

# Helper: Befehl als App-User mit Login-Shell ausführen (lädt ggf. NVM, setzt HOME).
run_as_app_user() {
  sudo -u "$APP_USER" -H bash -lc "cd '$REPO_DIR' && $*"
}

# 1. Code holen.
git fetch --prune origin main

# 1a. Self-Update: deploy.sh aus origin/main holen und re-exec, falls anders als
#     das gerade laufende Skript. So bleibt die Deploy-Logik stabil — auch beim
#     Rollback auf einen Commit, der eine ältere/fehlerhafte Logik mitbringt.
if [[ "${DEPLOY_REEXEC:-0}" == "0" ]]; then
  tmp_script="$(mktemp)"
  if git show origin/main:scripts/deploy.sh > "$tmp_script" 2>/dev/null; then
    self_hash="$(sha256sum "$0" | awk '{print $1}')"
    latest_hash="$(sha256sum "$tmp_script" | awk '{print $1}')"
    if [[ "$self_hash" != "$latest_hash" ]]; then
      echo "Deploy-Skript aus origin/main aktualisiert — re-exec."
      install -m 755 -o root -g root "$tmp_script" "$REPO_DIR/scripts/deploy.sh"
      rm -f "$tmp_script"
      # Index nachziehen, sonst sieht der folgende checkout einen Phantom-Konflikt.
      git update-index --add scripts/deploy.sh || true
      export DEPLOY_REEXEC=1
      exec "$REPO_DIR/scripts/deploy.sh" "$@"
    fi
  fi
  rm -f "$tmp_script"
fi

# 2. Checkout auf den gewünschten Commit (oder neuestes main). --force als
#    Sicherheitsnetz gegen Working-Tree-Drift; das Repo enthält außer den
#    Skripten keine bewusst gepflegten lokalen Änderungen.
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
    echo "Migrationen vorhanden, aber DB_NAME steht nicht in $ENV_FILE — Abbruch."
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
      echo "Migrationsname passt nicht zu NNN-name.sql: $migration_name — Abbruch."
      exit 1
    fi

    if [[ -n "$(db -N -B -e "SELECT 1 FROM schema_migrations WHERE filename = '$migration_name' LIMIT 1;")" ]]; then
      continue
    fi

    echo "Migration wird eingespielt: $migration_name"
    if ! db < "$migration"; then
      echo "Migration $migration_name fehlgeschlagen — Deploy abgebrochen."
      exit 1
    fi
    # Only recorded AFTER the file ran through. A failed migration is retried
    # on the next deploy, which is why they should be written idempotently.
    db -e "INSERT INTO schema_migrations (filename) VALUES ('$migration_name');"
    migrations_applied=$((migrations_applied + 1))
  done

  if [[ "$migrations_applied" -eq 0 ]]; then
    echo "Migrationen: nichts zu tun."
  else
    echo "Migrationen: $migrations_applied eingespielt."
  fi
fi

# 4. Dependencies (inkl. devDependencies — der Next-Build braucht sie).
#    --no-audit: Der Audit-Report am Ende von `npm ci` betrifft ausschliesslich
#    devDependencies (siehe unten), waere im Deploy-Log aber nicht davon zu
#    unterscheiden und wuerde jeden Deploy nach einem echten Problem aussehen
#    lassen. Der Audit gehoert in die CI und auf die Werkbank, nicht ins
#    Deploy-Log. Produktionsstand pruefen mit `npm audit --omit=dev` (0).
run_as_app_user 'npm ci --no-audit'

# 5. Production-Build. `next build` lädt .env.local automatisch (NEXT_PUBLIC_*,
#    TEBEX_PRIVATE_KEY müssen dort stehen).
run_as_app_user 'npm run build'

# 6. Berechtigungen.
#    App-Files → App-User. .git/ und scripts/ bleiben ROOT-OWNED.
#    scripts/ MUSS root-owned + nicht app-user-beschreibbar sein: vhost-*.sh
#    werden vom App-User per NOPASSWD-sudo als root ausgeführt — lägen sie in
#    einem vom App-User beschreibbaren Verzeichnis, könnte er sie (bzw. via
#    Verzeichnis-Schreibrecht die ganze Datei) austauschen → Privilege
#    Escalation. deploy.sh läuft als root und aktualisiert scripts/ via git
#    trotzdem problemlos.
find "$REPO_DIR" -mindepth 1 -maxdepth 1 \
  ! -name '.git' ! -name 'scripts' \
  -exec chown -R "$APP_USER:$APP_USER" {} +
chown -R root:root "$REPO_DIR/scripts"
chmod 755 "$REPO_DIR/scripts"
find "$REPO_DIR/scripts" -name '*.sh' -exec chmod 755 {} +

# .env.local gehört dem App-User und sonst niemandem. Am 03.09.2026 stand sie
# auf 644, und auf dieser Maschine gibt es elf weitere Login-Nutzer (ts3,
# sinusbot, fivem, minecraft, steam, …). Jeder davon konnte damit den
# Live-Stripe-Key, SESSION_SECRET, das DB-Passwort, den IONOS-API-Key und
# BOT_DASHBOARD_PROXY_SECRET mitlesen. Die Datei ist gitignored und wird vom
# Deploy nicht neu angelegt; die Zeile steht hier, damit eine von Hand neu
# geschriebene Datei nicht wieder offen liegen bleibt.
if [ -f "$REPO_DIR/.env.local" ]; then
  chmod 600 "$REPO_DIR/.env.local"
fi

# 7. systemd-Unit aktualisieren, falls geändert.
if ! cmp -s "$REPO_DIR/msk-shop.service" /etc/systemd/system/msk-shop.service 2>/dev/null; then
  echo "msk-shop.service geändert — übernehme + daemon-reload."
  cp "$REPO_DIR/msk-shop.service" /etc/systemd/system/msk-shop.service
  systemctl daemon-reload
fi

# 8. Service neu starten.
systemctl restart "$SERVICE"

# 9. Health-Check — bis zu ~20 s auf eine 200-Antwort warten, sonst abbrechen.
ok=0
for _ in $(seq 1 10); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${APP_PORT}/"; then ok=1; break; fi
  sleep 2
done
if [[ "$ok" -ne 1 ]]; then
  echo "Health-Check fehlgeschlagen — letzte 50 Log-Zeilen:"
  journalctl -u "$SERVICE" -n 50 --no-pager || true
  exit 1
fi

# 10. Deploy-Tag setzen, damit sich der zuletzt funktionierende Stand schnell
#    wiederfinden lässt (Rollback).
TAG="deploy-$(date -u +%Y%m%d-%H%M%S)"
git tag -f "$TAG" >/dev/null 2>&1 || true

echo "Deploy erfolgreich (${COMMIT:-HEAD}) — Tag: $TAG"
