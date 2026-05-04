#!/bin/bash
# =============================================================================
# vhost-create.sh  DOMAIN  GUILD_ID  EMAIL
# Creates an Apache2 VirtualHost for a custom domain, obtains SSL via Certbot.
# Must be run as root (via sudo).
# =============================================================================

set -euo pipefail

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

# ── Paths ─────────────────────────────────────────────────────────────────────

TRANSCRIPT_DIR="/var/www/html/transcripts/$GUILD_ID"
VHOST_FILE="/etc/apache2/sites-available/$DOMAIN.conf"
WEBROOT="/var/www/html/acme-challenge"

# ── Prepare transcript directory ──────────────────────────────────────────────

mkdir -p "$TRANSCRIPT_DIR"
chown www-data:www-data "$TRANSCRIPT_DIR"
chmod 755 "$TRANSCRIPT_DIR"

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

a2ensite "$DOMAIN.conf"
apache2ctl graceful

# ── Step 2: Obtain SSL certificate ───────────────────────────────────────────

certbot certonly \
    --webroot \
    --webroot-path "$WEBROOT" \
    --domain "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --keep-until-expiring

# ── Step 3: Replace with full HTTPS VHost ────────────────────────────────────

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

# ── Step 4: Final reload ──────────────────────────────────────────────────────

apache2ctl graceful

echo "SUCCESS: $DOMAIN is now active for guild $GUILD_ID"
