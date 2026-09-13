#!/bin/bash
#
# Wrapper for the msk-shop cron jobs.
#
# ── Why this exists ─────────────────────────────────────────────────────────
#
# Until 02.09.2026 every job was a chain in the crontab:
#
#   set -a; . /opt/msk-shop/.env.local; set +a; NODE_PATH=… node …/cleanup.js \
#     >> /var/log/msk-cleanup.log 2>&1
#
# In a chain like that the redirect is attached **only to the last command**.
# When an unquoted line landed in `.env.local` on 29.08.2026 (`MAIL_FROM=MSK
# Scripts <info@…>`, and `sh` reads `<` as a redirect), the sourcing died, that
# is, the part BEFORE the redirect. The error went into the cron mail, which did
# not exist, and the log file looked unchanged instead of broken. Three crons sat
# idle for three days without anything suspicious showing up anywhere.
#
# That is why the redirect happens here **before anything else** (`exec` below).
# Anything that goes wrong after that ends up in the log, including a failure to
# load the environment.
#
# ── How the alert works ─────────────────────────────────────────────────────
#
# Cron's original channels are saved to 3 and 4 before stdout is bent into the
# log. If the job succeeds, the wrapper writes **nothing** to channel 3, cron
# sees no output and sends no mail. Only on a failure does a summary go there,
# and that becomes the mail to the crontab's `MAILTO`.
#
# That makes the mail an event and not a habit: a mail means something is
# broken. A daily report nobody reads would have uncovered the outage of 29.08.
# no better than no mail at all.
#
# ── Usage ───────────────────────────────────────────────────────────────────
#
#   /opt/msk-shop/scripts/msk-cron.sh cleanup
#   /opt/msk-shop/scripts/msk-cron.sh stripe-reconcile
#   /opt/msk-shop/scripts/msk-cron.sh tebex-stats
#
# Runs as root from the crontab. The file lives in the repo and is updated with
# every deploy; `deploy.sh` leaves `scripts/` root-owned.

set -uo pipefail

BASE=/opt/msk-shop
ENV_FILE="$BASE/.env.local"
NODE_BIN=/usr/bin/node

# Allow-list instead of a free script name. The wrapper runs as root from the
# crontab; a passed-through path would be an invitation, and a typo would
# otherwise end as "node: cannot find file" instead of a clear error.
case "${1:-}" in
  cleanup|stripe-reconcile|tebex-stats) JOB="$1" ;;
  *)
    echo "Aufruf: $0 {cleanup|stripe-reconcile|tebex-stats}" >&2
    exit 64   # EX_USAGE
    ;;
esac

LOG="/var/log/msk-${JOB}.log"

# Save the original channels BEFORE redirecting. Only the failure case ends up
# on 3 later, and that is exactly what cron turns into the mail.
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

# ── Load the environment ────────────────────────────────────────────────────
#
# `set -a` exports everything that follows. The sourcing sits down here on
# purpose and not in the crontab: its failure is exactly the case that left no
# trace on 29.08., and now it ends up in the log and in the mail.
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

# ── Run the job ─────────────────────────────────────────────────────────────
NODE_PATH="$BASE/node_modules" "$NODE_BIN" "$SCRIPT"
rc=$?

if [ "$rc" -ne 0 ]; then
  fail "$rc" "das Skript endete mit einem Fehler"
fi

echo "=== $(date -Is)  ende $JOB rc=0"
exit 0
