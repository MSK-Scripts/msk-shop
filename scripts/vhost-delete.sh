#!/bin/bash
# =============================================================================
# vhost-delete.sh  DOMAIN
# Removes an Apache2 VirtualHost for a custom domain.
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

# ── Disable and remove VHost ─────────────────────────────────────────────────

if [ -f "$VHOST_FILE" ]; then
    a2dissite "$DOMAIN.conf" || true
    rm -f "$VHOST_FILE"
    echo "Removed VHost config: $VHOST_FILE"
else
    echo "VHost config not found (already removed?): $VHOST_FILE"
fi

# ── Reload Apache ────────────────────────────────────────────────────────────

apache2ctl graceful

echo "SUCCESS: $DOMAIN has been removed"
