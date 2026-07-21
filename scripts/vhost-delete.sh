#!/bin/bash
# =============================================================================
# vhost-delete.sh  DOMAIN
# Removes an Apache2 VirtualHost for a custom domain and the associated
# Let's Encrypt certificate (so the renewal cron doesn't keep retrying).
# Must be run as root (via sudo).
# =============================================================================

set -euo pipefail

DOMAIN="${1:-}"

# ── Input validation ──────────────────────────────────────────────────────────

if [[ -z "$DOMAIN" ]]; then
    echo "Usage: $0 <domain>" >&2
    exit 1
fi

if ! [[ "$DOMAIN" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
    echo "ERROR: Invalid domain format: $DOMAIN" >&2
    exit 1
fi

VHOST_FILE="/etc/apache2/sites-available/$DOMAIN.conf"
ENABLED_LINK="/etc/apache2/sites-enabled/$DOMAIN.conf"

# ── Disable and remove VHost ──────────────────────────────────────────────────
# Always disable and clean up BOTH locations, even if the sites-available file is
# already gone. A domain replacement (set → delete-old + create-new) or a prior
# partial run can leave a dangling sites-enabled symlink behind, and a dangling
# symlink makes `apache2ctl configtest` fail for the WHOLE server — which then
# blocks every future reload/deploy, not just this one domain. Guarding a2dissite
# behind `[ -f "$VHOST_FILE" ]` is exactly what let that orphan survive.

a2dissite "$DOMAIN.conf" >/dev/null 2>&1 || true
rm -f "$VHOST_FILE" "$ENABLED_LINK"
echo "Removed VHost config for $DOMAIN (sites-available + sites-enabled)."

# ── Reload Apache safely ──────────────────────────────────────────────────────

if apache2ctl configtest >/dev/null 2>&1; then
    apache2ctl graceful
else
    echo "WARNING: Apache config test failed — reload skipped." >&2
fi

# ── Remove Certbot certificate ────────────────────────────────────────────────
# Otherwise the daily renewal cron will keep failing for a domain that no
# longer points at this server.

if command -v certbot >/dev/null 2>&1 \
   && certbot certificates 2>/dev/null | grep -q "Certificate Name: $DOMAIN"; then
    certbot delete --cert-name "$DOMAIN" --non-interactive >/dev/null 2>&1 || true
    echo "Removed Let's Encrypt certificate for $DOMAIN"
fi

echo "SUCCESS: $DOMAIN has been removed"
