#!/bin/bash
# =============================================================================
# vhost-create.sh  DOMAIN  GUILD_ID  EMAIL
# Creates an Apache2 VirtualHost for a custom domain, obtains SSL via Certbot.
# Must be run as root (via sudo).
# =============================================================================

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
# User that runs msk-shop (Next.js). Must own the transcripts dir so the
# service can write new transcript files into it.
SERVICE_USER="musiker15"

DOMAIN="${1:-}"
GUILD_ID="${2:-}"
EMAIL="${3:-info@msk-scripts.de}"

# ── Input validation ──────────────────────────────────────────────────────────

if [[ -z "$DOMAIN" || -z "$GUILD_ID" ]]; then
    echo "Usage: $0 <domain> <guild_id> [email]" >&2
    exit 1
fi

# Only allow safe domain characters — prevents shell injection
if ! [[ "$DOMAIN" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
    echo "ERROR: Invalid domain format: $DOMAIN" >&2
    exit 1
fi

# Only allow numeric guild IDs
if ! [[ "$GUILD_ID" =~ ^[0-9]{17,20}$ ]]; then
    echo "ERROR: Invalid guild_id: $GUILD_ID" >&2
    exit 1
fi

# Rough email validation
if ! [[ "$EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    echo "ERROR: Invalid email format: $EMAIL" >&2
    exit 1
fi

# ── Paths ─────────────────────────────────────────────────────────────────────

TRANSCRIPT_DIR="/var/www/html/transcripts/$GUILD_ID"
VHOST_FILE="/etc/apache2/sites-available/$DOMAIN.conf"
WEBROOT="/var/www/html/acme-challenge"

# ── Rollback trap ─────────────────────────────────────────────────────────────
# If anything goes wrong after we've created the VHost but before we finish,
# clean up so we don't leave a half-configured site enabled.
CREATED_VHOST=0

cleanup_on_error() {
    local exit_code=$?
    if (( exit_code != 0 )) && (( CREATED_VHOST == 1 )); then
        echo "ERROR: aborting and rolling back VHost for $DOMAIN" >&2
        a2dissite "$DOMAIN.conf" 2>/dev/null || true
        rm -f "$VHOST_FILE"
        apache2ctl configtest >/dev/null 2>&1 && apache2ctl graceful || true
    fi
    exit $exit_code
}
trap cleanup_on_error EXIT

# ── Prepare transcript directory ──────────────────────────────────────────────
# Owner: service user (msk-shop writes new transcript files here).
# Group: www-data (Apache reads to serve the transcripts).
# 2775 with setgid so new subdirs inherit the www-data group automatically.

mkdir -p "$TRANSCRIPT_DIR"
chown "$SERVICE_USER:www-data" "$TRANSCRIPT_DIR"
chmod 2775 "$TRANSCRIPT_DIR"

# ── Create webroot for certbot challenge ──────────────────────────────────────

mkdir -p "$WEBROOT"
chown www-data:www-data "$WEBROOT"

# ── Step 1: Temporary HTTP-only VHost for certbot challenge ───────────────────

cat > "$VHOST_FILE" << APACHE
<VirtualHost *:80>
    ServerName $DOMAIN
    DocumentRoot $WEBROOT

    <Directory $WEBROOT>
        AllowOverride None
        Require all granted
    </Directory>
</VirtualHost>
APACHE

a2ensite "$DOMAIN.conf" >/dev/null
CREATED_VHOST=1

apache2ctl configtest
apache2ctl graceful

# ── Step 2: Obtain SSL certificate ────────────────────────────────────────────

certbot certonly \
    --webroot \
    --webroot-path "$WEBROOT" \
    --domain "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --keep-until-expiring

# Sanity check — make sure certbot actually produced the files
if [[ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
    echo "ERROR: Certbot did not produce a certificate for $DOMAIN" >&2
    exit 1
fi

# ── Step 3: Replace with full HTTPS VHost ─────────────────────────────────────

cat > "$VHOST_FILE" << APACHE
<VirtualHost *:80>
    ServerName $DOMAIN
    RewriteEngine On
    RewriteRule ^(.*)$ https://$DOMAIN\$1 [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName $DOMAIN

    SSLEngine on
    SSLCertificateFile    /etc/letsencrypt/live/$DOMAIN/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/$DOMAIN/privkey.pem

    DocumentRoot $TRANSCRIPT_DIR

    <Directory $TRANSCRIPT_DIR>
        Options -Indexes
        AllowOverride None
        Require all denied

        # Only allow safe file types
        <FilesMatch "\.(html|pdf|png|jpg|jpeg|gif|webp|mp4|mp3|zip|txt)$">
            Require all granted
        </FilesMatch>
    </Directory>

    ErrorLog  \${APACHE_LOG_DIR}/custom-$GUILD_ID-error.log
    CustomLog \${APACHE_LOG_DIR}/custom-$GUILD_ID-access.log combined

    # Security Headers
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</VirtualHost>
APACHE

# ── Step 4: Final config check + reload ───────────────────────────────────────

apache2ctl configtest
apache2ctl graceful

# Disarm the rollback trap on success
CREATED_VHOST=0
trap - EXIT

echo "SUCCESS: $DOMAIN is now active for guild $GUILD_ID"
