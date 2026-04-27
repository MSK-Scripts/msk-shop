# MSK Scripts Shop — Installation Guide

## Requirements
- Node.js 20.x
- Apache2 with mod_proxy, mod_ssl, mod_rewrite, mod_headers
- Let's Encrypt SSL certificate
- Debian with systemd

---

## 1. Upload the project

```bash
# Upload the msk-shop folder to your server
scp -r msk-shop/ user@yourserver:/opt/msk-shop
```

Or clone via git:
```bash
cd /opt
git clone YOUR_REPO msk-shop
```

---

## 2. Configure environment variables

```bash
cd /opt/msk-shop
nano .env.local
```

Fill in your private key:
```
TEBEX_PRIVATE_KEY=your_actual_private_key_here
```

The public token is already pre-filled in the file.

---

## 3. Install dependencies & build

```bash
cd /opt/msk-shop
npm install
npm run build
```

---

## 4. Set correct permissions

```bash
chown -R www-data:www-data /opt/msk-shop
chmod -R 755 /opt/msk-shop
```

---

## 5. Install systemd service

```bash
# Copy service file
cp /opt/msk-shop/msk-shop.service /etc/systemd/system/

# Edit the ExecStart line if needed:
# nano /etc/systemd/system/msk-shop.service

# Enable and start
systemctl daemon-reload
systemctl enable msk-shop
systemctl start msk-shop

# Check status
systemctl status msk-shop
```

---

## 6. Configure Apache2

```bash
# Enable required modules
a2enmod proxy proxy_http rewrite ssl headers

# Copy and enable vhost config
cp /opt/msk-shop/msk-shop.apache.conf /etc/apache2/sites-available/msk-shop.conf
a2ensite msk-shop.conf

# If you don't have SSL yet, get Let's Encrypt cert first:
apt install certbot python3-certbot-apache
certbot --apache -d msk-scripts.de -d www.msk-scripts.de

# Then reload Apache
systemctl reload apache2
```

---

## 7. Test

Visit https://www.msk-scripts.de — the shop should be live!

---

## Updating the shop

After making changes:
```bash
cd /opt/msk-shop
npm run build
systemctl restart msk-shop
```

---

## Troubleshooting

**Check Next.js logs:**
```bash
journalctl -u msk-shop -f
```

**Check Apache logs:**
```bash
tail -f /var/log/apache2/msk-shop-error.log
```

**Restart everything:**
```bash
systemctl restart msk-shop
systemctl reload apache2
```
