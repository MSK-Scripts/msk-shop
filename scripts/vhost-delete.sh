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

# ── Disable and remove VHost ──────────────────────────────────────────────────

if [ -f "$VHOST_FILE" ]; then
    a2dissite "$DOMAIN.conf" >/dev/null || true
    rm -f "$VHOST_FILE"
    echo "Removed VHost config: $VHOST_FILE"
else
    echo "VHost config not found (already removed?): $VHOST_FILE"
fi

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
