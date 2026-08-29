#!/bin/bash
# =============================================================================
# bot-vhost-create.sh  HOST  PORT  [MODE]  [EMAIL]
#
# Creates the Apache2 VirtualHost that publishes a hosted bot's own dashboard.
# The dashboard binds to 127.0.0.1:<PORT> and is never reachable directly; this
# vhost is the only way in, and it forwards straight to that loopback port.
#
#   MODE=wildcard  (default)  HOST must be <label>.msk-scripts.de. Served with
#                             the existing wildcard certificate — NO certbot run.
#   MODE=certbot              HOST is a customer's own domain. Issues a
#                             certificate via the http-01 webroot first.
#
# Must be run as root (via sudo).
#
# Exit codes (read by the API routes so they can show a precise message):
#   10 = Apache / vhost setup failed
#   20 = SSL certificate issuance failed (certbot, MODE=certbot only)
# =============================================================================

set -euo pipefail

HOST="${1:-}"
PORT="${2:-}"
MODE="${3:-wildcard}"
EMAIL="${4:-info@msk-scripts.de}"

# The zone whose wildcard certificate covers MODE=wildcard hosts.
ZONE="msk-scripts.de"
WILDCARD_DIR="/etc/apache2/ssl/$ZONE"

# ACME http-01 webroot — same server convention as vhost-create.sh: 000-default
# grants /.well-known/acme-challenge/ from here and both blocks below point at it
# for that path. See the long note in vhost-create.sh; nothing outside these
# files backs the challenge up since the forms wildcard vhost was removed.
WEBROOT="/var/www/html"

# ── Input validation ──────────────────────────────────────────────────────────

if [[ -z "$HOST" || -z "$PORT" ]]; then
    echo "Usage: $0 <host> <port> [wildcard|certbot] [email]" >&2
    exit 1
fi

if ! [[ "$HOST" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
    echo "ERROR: Invalid host format: $HOST" >&2
    exit 1
fi

if ! [[ "$PORT" =~ ^[0-9]{2,5}$ ]] || (( PORT < 1024 || PORT > 65535 )); then
    echo "ERROR: Invalid port: $PORT" >&2
    exit 1
fi

case "$MODE" in
    wildcard|certbot) ;;
    *) echo "ERROR: Invalid mode: $MODE (expected wildcard or certbot)" >&2; exit 1 ;;
esac

if ! [[ "$EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    echo "ERROR: Invalid email format: $EMAIL" >&2
    exit 1
fi

# In wildcard mode the host MUST be a single label under the zone. `*.zone` does
# not cover `a.b.zone`, so a deeper name would be served with a certificate error
# that looks like a browser problem rather than a provisioning bug.
if [[ "$MODE" == "wildcard" ]]; then
    if ! [[ "$HOST" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.${ZONE//./\\.}$ ]]; then
        echo "ERROR: wildcard mode requires <label>.$ZONE, got: $HOST" >&2
        exit 1
    fi
    if [[ ! -f "$WILDCARD_DIR/fullchain.cer" || ! -f "$WILDCARD_DIR/$ZONE.key" ]]; then
        echo "ERROR: wildcard certificate missing in $WILDCARD_DIR" >&2
        exit 10
    fi
    CERT_FILE="$WILDCARD_DIR/fullchain.cer"
    KEY_FILE="$WILDCARD_DIR/$ZONE.key"
fi

VHOST_FILE="/etc/apache2/sites-available/$HOST.conf"

# ── Rollback trap ─────────────────────────────────────────────────────────────

CREATED_VHOST=0

cleanup_on_error() {
    local exit_code=$?
    if (( exit_code != 0 )) && (( CREATED_VHOST == 1 )); then
        echo "ERROR: aborting and rolling back vhost for $HOST" >&2
        a2dissite "$HOST.conf" 2>/dev/null || true
        rm -f "$VHOST_FILE" "/etc/apache2/sites-enabled/$HOST.conf"
        apache2ctl configtest >/dev/null 2>&1 && apache2ctl graceful || true
    fi
    exit $exit_code
}
trap cleanup_on_error EXIT

mkdir -p "$WEBROOT/.well-known/acme-challenge"

# ── certbot mode: temporary HTTP vhost, then issue the certificate ────────────

if [[ "$MODE" == "certbot" ]]; then
    cat > "$VHOST_FILE" << APACHE
<VirtualHost *:80>
    ServerName $HOST
    DocumentRoot $WEBROOT

    <Location />
        Require all denied
    </Location>
    <Location /.well-known/acme-challenge/>
        Require all granted
    </Location>
</VirtualHost>
APACHE

    a2ensite "$HOST.conf" >/dev/null
    CREATED_VHOST=1

    apache2ctl configtest || { echo "ERROR: apache config test failed for $HOST" >&2; exit 10; }
    apache2ctl graceful   || { echo "ERROR: apache reload failed for $HOST"      >&2; exit 10; }

    if ! certbot certonly \
        --webroot \
        --webroot-path "$WEBROOT" \
        --domain "$HOST" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive \
        --keep-until-expiring; then
        echo "ERROR: SSL certificate issuance failed for $HOST (certbot)." >&2
        exit 20
    fi

    if [[ ! -f "/etc/letsencrypt/live/$HOST/fullchain.pem" ]]; then
        echo "ERROR: certbot did not produce a certificate for $HOST" >&2
        exit 20
    fi

    CERT_FILE="/etc/letsencrypt/live/$HOST/fullchain.pem"
    KEY_FILE="/etc/letsencrypt/live/$HOST/privkey.pem"
fi

# ── Final vhost ───────────────────────────────────────────────────────────────
#
# The :80 block keeps the ACME exception in BOTH modes. In certbot mode it is
# what makes renewal work at all (the redirect would otherwise send Let's
# Encrypt to :443, which proxies to the bot and never serves the token). In
# wildcard mode the cert comes from a DNS-01 run for the whole zone, so nothing
# needs the path today — it stays because a host can later be switched to its
# own certificate, and a silently missing exception only shows up 90 days later
# as an expired certificate.

cat > "$VHOST_FILE" << APACHE
<VirtualHost *:80>
    ServerName $HOST
    DocumentRoot $WEBROOT

    <Location /.well-known/acme-challenge/>
        Require all granted
    </Location>

    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/\.well-known/acme-challenge/
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName $HOST

    SSLEngine on
    SSLCertificateFile    $CERT_FILE
    SSLCertificateKeyFile $KEY_FILE

    # The bot's dashboard sets its own security headers (helmet). Drop the global
    # ones from conf-enabled/security.conf so they do not arrive twice — same
    # reasoning as bot-dashboard.msk-scripts.de.conf.
    Header always unset X-Content-Type-Options
    Header always unset X-Frame-Options
    Header always unset Referrer-Policy
    Header always unset Strict-Transport-Security
    Header always unset Permissions-Policy
    Header always unset Content-Security-Policy

    # Straight to the bot's own dashboard on loopback. Unlike
    # bot-dashboard.msk-scripts.de this does NOT go through msk-shop: the bot
    # runs its own Discord OAuth here, which is the entire point — the customer's
    # staff have no msk-shop account and could never mint a handoff token.
    ProxyPreserveHost On
    ProxyPass         / http://127.0.0.1:$PORT/
    ProxyPassReverse  / http://127.0.0.1:$PORT/

    # The dashboard streams its live log over SSE. Without this the response sits
    # in Apache's buffer and the console looks frozen.
    SetEnv proxy-sendchunked 1

    ErrorLog  \${APACHE_LOG_DIR}/botdash-$HOST-error.log
    CustomLog \${APACHE_LOG_DIR}/botdash-$HOST-access.log combined
</VirtualHost>
APACHE

a2ensite "$HOST.conf" >/dev/null
CREATED_VHOST=1

apache2ctl configtest || { echo "ERROR: apache config test failed for $HOST" >&2; exit 10; }
apache2ctl graceful   || { echo "ERROR: apache reload failed for $HOST"      >&2; exit 10; }

CREATED_VHOST=0
trap - EXIT

echo "SUCCESS: $HOST now proxies to 127.0.0.1:$PORT ($MODE)"
