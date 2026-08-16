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
# ACME http-01 webroot. MUST be /var/www/html — that is where this server's default
# vhost (000-default) and the forms wildcard vhost (ServerAlias *) already serve
# /.well-known/acme-challenge/ from. Any other path means the wildcard catch-all
# answers the challenge from /var/www/html, 404s, and the certificate never issues.
WEBROOT="/var/www/html"

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

# ── Ensure the ACME challenge dir exists ──────────────────────────────────────
# certbot --webroot creates it too; this is just insurance. NOTE: never chown
# /var/www/html itself — only make sure the challenge subdir is present.
mkdir -p "$WEBROOT/.well-known/acme-challenge"

# ── Step 1: Temporary HTTP-only VHost for certbot challenge ───────────────────
# Exact-ServerName vhost so the domain resolves predictably during provisioning.
# Serves ONLY the ACME challenge from the shared web root (same convention as
# 000-default) and denies everything else. Even if the forms wildcard vhost
# (ServerAlias *) handles the request instead, it serves the challenge from the
# same /var/www/html — so issuance works either way.

cat > "$VHOST_FILE" << APACHE
<VirtualHost *:80>
    ServerName $DOMAIN
    DocumentRoot $WEBROOT

    <Location />
        Require all denied
    </Location>
    <Location /.well-known/acme-challenge/>
        Require all granted
    </Location>
</VirtualHost>
APACHE

a2ensite "$DOMAIN.conf" >/dev/null
CREATED_VHOST=1

# Exit code convention (read by the /api/domain routes to show a precise message):
#   10 = Apache / vhost setup failed
#   20 = SSL certificate issuance failed (certbot)
apache2ctl configtest || { echo "ERROR: apache config test failed for $DOMAIN" >&2; exit 10; }
apache2ctl graceful   || { echo "ERROR: apache reload failed for $DOMAIN"      >&2; exit 10; }

# ── Step 2: Obtain SSL certificate ────────────────────────────────────────────

if ! certbot certonly \
    --webroot \
    --webroot-path "$WEBROOT" \
    --domain "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --keep-until-expiring; then
    echo "ERROR: SSL certificate issuance failed for $DOMAIN (certbot)." >&2
    exit 20
fi

# Sanity check — make sure certbot actually produced the files
if [[ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
    echo "ERROR: Certbot did not produce a certificate for $DOMAIN" >&2
    exit 20
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

        # The transcript page itself — the only file served as HTML. Matched by
        # exact name, so an uploaded "x.html" could never be rendered even if the
        # upload route's extension allow-list were ever widened by mistake.
        <Files "transcript.html">
            Require all granted
        </Files>

        # Media the browser may render inline, served with its real Content-Type.
        # Images must stay inline: the transcript references them via <img>.
        <FilesMatch "\.(png|jpe?g|jfif|gif|webp|bmp|avif|tiff?|ico|heic|heif|pdf|mp4|webm|mov|mp3|wav|ogg|m4a|flac|opus)$">
            Require all granted
        </FilesMatch>

        # Everything else: user-authored content (FiveM resources, configs,
        # scripts, logs, archives). Downloadable, but never interpreted by the
        # browser — a .lua whose first line is "<html>" must not become a rendered
        # page on this origin. ForceType + Content-Disposition + nosniff together
        # guarantee that, which is also why widening THIS list stays cheap.
        <FilesMatch "\.(zip|rar|7z|tar|gz|tgz|bz2|xz|zst|txt|log|md|csv|conf|properties|patch|diff|lua|js|ts|css|json|xml|sql|cfg|ini|toml|ya?ml|meta|ymap|ytyp|ytd|yft|ydr|ydd|ybn|ycd|ynv|rpf|fxap|db|sqlite|mkv|avi|wmv|mpe?g|m4v|docx|xlsx|pptx|odt|ods)$">
            Require all granted
            ForceType application/octet-stream
            Header always set Content-Disposition "attachment"
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

apache2ctl configtest || { echo "ERROR: apache config test failed for $DOMAIN" >&2; exit 10; }
apache2ctl graceful   || { echo "ERROR: apache reload failed for $DOMAIN"      >&2; exit 10; }

# Disarm the rollback trap on success
CREATED_VHOST=0
trap - EXIT

echo "SUCCESS: $DOMAIN is now active for guild $GUILD_ID"
