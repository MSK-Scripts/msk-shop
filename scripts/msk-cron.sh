#!/bin/bash
#
# Wrapper für die Cron-Jobs von msk-shop.
#
# ── Warum es das gibt ───────────────────────────────────────────────────────
#
# Bis zum 02.09.2026 stand jeder Job als Kette in der Crontab:
#
#   set -a; . /opt/msk-shop/.env.local; set +a; NODE_PATH=… node …/cleanup.js \
#     >> /var/log/msk-cleanup.log 2>&1
#
# Die Umleitung hängt in einer solchen Kette **nur am letzten Kommando**. Als am
# 29.08.2026 eine unquotierte Zeile in die `.env.local` kam (`MAIL_FROM=MSK
# Scripts <info@…>`, und `sh` liest `<` als Umleitung), starb das Sourcen — also
# der Teil VOR der Umleitung. Der Fehler ging in die Cron-Mail, die es nicht gab,
# und die Logdatei sah unverändert aus statt kaputt. Drei Crons lagen drei Tage
# still, ohne dass irgendwo etwas Auffälliges stand.
#
# Hier passiert die Umleitung deshalb **vor allem anderen** (`exec` unten). Alles,
# was danach schiefgeht, steht im Log, auch ein Fehler beim Laden der Umgebung.
#
# ── Wie der Alarm funktioniert ──────────────────────────────────────────────
#
# Die ursprünglichen Kanäle von Cron werden auf 3 und 4 gerettet, bevor stdout
# ins Log umgebogen wird. Läuft der Job durch, schreibt der Wrapper **nichts**
# auf Kanal 3, Cron sieht keine Ausgabe und verschickt keine Mail. Erst bei einem
# Fehlschlag geht eine Zusammenfassung dorthin, und die wird zur Mail an das
# `MAILTO` der Crontab.
#
# Damit ist die Mail ein Ereignis und keine Gewohnheit: eine Mail bedeutet, dass
# etwas kaputt ist. Ein täglicher Bericht, den niemand liest, hätte den Ausfall
# vom 29.08. genauso wenig aufgedeckt wie gar keine Mail.
#
# ── Aufruf ──────────────────────────────────────────────────────────────────
#
#   /opt/msk-shop/scripts/msk-cron.sh cleanup
#   /opt/msk-shop/scripts/msk-cron.sh stripe-reconcile
#   /opt/msk-shop/scripts/msk-cron.sh tebex-stats
#
# Läuft als root aus der Crontab. Die Datei liegt im Repo und wird mit jedem
# Deploy aktualisiert; `deploy.sh` lässt `scripts/` root-owned.

set -uo pipefail

BASE=/opt/msk-shop
ENV_FILE="$BASE/.env.local"
NODE_BIN=/usr/bin/node

# Allow-list statt freier Skriptname. Der Wrapper läuft als root aus der
# Crontab; ein durchgereichter Pfad wäre eine Einladung, und ein Tippfehler
# würde sonst als „node: kann Datei nicht finden" enden statt als klarer Fehler.
case "${1:-}" in
  cleanup|stripe-reconcile|tebex-stats) JOB="$1" ;;
  *)
    echo "Aufruf: $0 {cleanup|stripe-reconcile|tebex-stats}" >&2
    exit 64   # EX_USAGE
    ;;
esac

LOG="/var/log/msk-${JOB}.log"

# Originale Kanäle sichern, BEVOR umgeleitet wird. Auf 3 landet später nur der
# Fehlerfall, und genau daraus macht Cron die Mail.
exec 3>&1 4>&2
exec >> "$LOG" 2>&1

started=$(date -Is)
echo "=== $started  start $JOB (pid $$)"

fail() {
  local rc="$1" msg="$2"
  echo "=== $(date -Is)  ENDE $JOB FEHLGESCHLAGEN rc=$rc: $msg"
  {
    echo "Cron-Job '$JOB' auf $(hostname -f) fehlgeschlagen."
    echo "Beginn:    $started"
    echo "Ende:      $(date -Is)"
    echo "Exit-Code: $rc"
    echo "Grund:     $msg"
    echo "Log:       $LOG"
    echo
    echo "--- letzte 40 Zeilen ---"
    tail -n 40 "$LOG"
  } >&3
  exit "$rc"
}

# ── Umgebung laden ──────────────────────────────────────────────────────────
#
# `set -a` exportiert alles Folgende. Das Sourcen steht bewusst hier unten und
# nicht in der Crontab: sein Scheitern ist genau der Fall, der am 29.08. keine
# Spur hinterlassen hat, und jetzt landet er im Log und in der Mail.
if [ ! -r "$ENV_FILE" ]; then
  fail 78 "$ENV_FILE ist nicht lesbar"   # EX_CONFIG
fi

set -a
# shellcheck disable=SC1090
if ! . "$ENV_FILE"; then
  set +a
  fail 78 "$ENV_FILE liess sich nicht laden (Syntaxfehler? Wert mit < oder > ohne Anfuehrungszeichen?)"
fi
set +a

SCRIPT="$BASE/scripts/${JOB}.js"
if [ ! -f "$SCRIPT" ]; then
  fail 72 "$SCRIPT fehlt"                # EX_OSFILE
fi

# ── Job ausführen ───────────────────────────────────────────────────────────
NODE_PATH="$BASE/node_modules" "$NODE_BIN" "$SCRIPT"
rc=$?

if [ "$rc" -ne 0 ]; then
  fail "$rc" "das Skript endete mit einem Fehler"
fi

echo "=== $(date -Is)  ende $JOB rc=0"
exit 0
