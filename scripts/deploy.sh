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

# 3. Dependencies (inkl. devDependencies — der Next-Build braucht sie).
run_as_app_user 'npm ci'

# 4. Production-Build. `next build` lädt .env.local automatisch (NEXT_PUBLIC_*,
#    TEBEX_PRIVATE_KEY müssen dort stehen).
run_as_app_user 'npm run build'

# 5. Berechtigungen: App-Files dem App-User, .git/ bleibt root (git läuft als
#    root), scripts/deploy.sh bleibt root-owned + 755 (wird als root aufgerufen;
#    chmod ist auch ein Sicherheitsnetz, falls Git das x-Bit verliert).
find "$REPO_DIR" -mindepth 1 -maxdepth 1 \
  ! -name '.git' ! -name 'scripts' \
  -exec chown -R "$APP_USER:$APP_USER" {} +
chown -R "$APP_USER:$APP_USER" "$REPO_DIR/scripts"
if [[ -f "$REPO_DIR/scripts/deploy.sh" ]]; then
  chown root:root "$REPO_DIR/scripts/deploy.sh"
  chmod 755 "$REPO_DIR/scripts/deploy.sh"
fi

# 6. systemd-Unit aktualisieren, falls geändert.
if ! cmp -s "$REPO_DIR/msk-shop.service" /etc/systemd/system/msk-shop.service 2>/dev/null; then
  echo "msk-shop.service geändert — übernehme + daemon-reload."
  cp "$REPO_DIR/msk-shop.service" /etc/systemd/system/msk-shop.service
  systemctl daemon-reload
fi

# 7. Service neu starten.
systemctl restart "$SERVICE"

# 8. Health-Check — bis zu ~20 s auf eine 200-Antwort warten, sonst abbrechen.
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

# 9. Deploy-Tag setzen, damit sich der zuletzt funktionierende Stand schnell
#    wiederfinden lässt (Rollback).
TAG="deploy-$(date -u +%Y%m%d-%H%M%S)"
git tag -f "$TAG" >/dev/null 2>&1 || true

echo "Deploy erfolgreich (${COMMIT:-HEAD}) — Tag: $TAG"
