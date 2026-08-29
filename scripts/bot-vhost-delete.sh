#!/bin/bash
# =============================================================================
# bot-vhost-delete.sh  HOST
#
# Removes the VirtualHost created by bot-vhost-create.sh, and the Let's Encrypt
# certificate if the host had its own (MODE=certbot). A wildcard-served host has
# no certificate of its own — the zone certificate stays, obviously.
#
# Must be run as root (via sudo).
# =============================================================================

set -euo pipefail

HOST="${1:-}"
ZONE="msk-scripts.de"

if [[ -z "$HOST" ]]; then
    echo "Usage: $0 <host>" >&2
    exit 1
fi

if ! [[ "$HOST" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
    echo "ERROR: Invalid host format: $HOST" >&2
    exit 1
fi

VHOST_FILE="/etc/apache2/sites-available/$HOST.conf"
ENABLED_LINK="/etc/apache2/sites-enabled/$HOST.conf"

# Always clean up BOTH locations even when sites-available is already gone: a
# dangling sites-enabled symlink makes `apache2ctl configtest` fail for the WHOLE
# server, which then blocks every later reload and deploy — not just this host.
# That is the bug guarding a2dissite behind `[ -f "$VHOST_FILE" ]` once caused in
# vhost-delete.sh.
a2dissite "$HOST.conf" >/dev/null 2>&1 || true
rm -f "$VHOST_FILE" "$ENABLED_LINK"
echo "Removed vhost config for $HOST (sites-available + sites-enabled)."

if apache2ctl configtest >/dev/null 2>&1; then
    apache2ctl graceful
else
    echo "WARNING: Apache config test failed — reload skipped." >&2
fi

# Only a customer domain has its own certificate. Never run certbot delete for a
# name under the zone: those are served by the wildcard, and there is no
# per-host certificate to remove.
if [[ "$HOST" != *".$ZONE" ]] \
   && command -v certbot >/dev/null 2>&1 \
   && certbot certificates 2>/dev/null | grep -q "Certificate Name: $HOST"; then
    certbot delete --cert-name "$HOST" --non-interactive >/dev/null 2>&1 || true
    echo "Removed Let's Encrypt certificate for $HOST"
fi

echo "SUCCESS: $HOST has been removed"
