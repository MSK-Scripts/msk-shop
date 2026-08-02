#!/usr/bin/env node
/**
 * tebex-stats.js — nightly snapshot of the shop's own sales figures.
 *
 * Walks the Tebex Plugin API's paginated /payments endpoint once and stores the
 * aggregate in `msk_shop_stats`, so the homepage can render measured numbers
 * without doing 90+ upstream requests per visitor.
 *
 * Why a cron and not a cached route: unique buyers can only be derived by
 * deduplicating every payment ever made. That is ~93 sequential requests today
 * and grows. Behind an ISR revalidate the first visitor after expiry would pay
 * for all of it.
 *
 * Deployed with the repo at /opt/msk-shop/scripts/tebex-stats.js. Like the other
 * crons it reads its config from the environment, does NOT load dotenv, and
 * needs mysql2 from the app's node_modules:
 *
 *   30 4 * * * set -a; . /opt/msk-shop/.env.local; set +a; \
 *     NODE_PATH=/opt/msk-shop/node_modules /usr/bin/node /opt/msk-shop/scripts/tebex-stats.js \
 *     >> /var/log/msk-tebex-stats.log 2>&1
 *
 * Requires TEBEX_PLUGIN_SECRET in addition to the DB_* variables.
 */

const mysql = require('mysql2/promise');

const API = 'https://plugin.tebex.io/payments';
/** Guard against an upstream that never stops handing out a next page. */
const MAX_PAGES = 400;
const DRY_RUN = process.argv.includes('--dry-run');

function log(...args) {
  console.log(`[${new Date().toISOString()}] [tebex-stats]`, ...args);
}

/**
 * Pulls every payment by following `next_page_url`.
 *
 * Note for anyone extending this: the `paged` query parameter only switches the
 * response into its paginated shape, it does NOT select the page. Passing
 * `paged=2` returns page 1 again. Following `next_page_url` is the only way
 * forward, and getting this wrong silently yields the first page N times.
 */
async function fetchAllPayments(secret) {
  const payments = [];
  let url = `${API}?paged=1`;
  let pages = 0;

  while (url && pages < MAX_PAGES) {
    const res = await fetch(url, { headers: { 'X-Tebex-Secret': secret } });
    if (!res.ok) {
      throw new Error(`Tebex antwortete mit ${res.status} auf Seite ${pages + 1}`);
    }
    const body = await res.json();
    const data = Array.isArray(body.data) ? body.data : [];
    payments.push(...data);
    pages += 1;
    url = body.next_page_url || null;
  }

  if (pages >= MAX_PAGES) {
    throw new Error(`Abbruch nach ${MAX_PAGES} Seiten, das sieht nach einer Endlosschleife aus`);
  }
  return { payments, pages };
}

function aggregate(payments) {
  const buyers = new Set();
  let complete = 0;
  let refunded = 0;
  let chargeback = 0;
  let earliest = null;

  for (const p of payments) {
    const status = String(p.status || '').toLowerCase();
    if (status === 'refund') refunded += 1;
    if (status === 'chargeback') chargeback += 1;
    if (status !== 'complete') continue;

    complete += 1;
    // player.uuid ist der CFX.re-Account. E-Mail liefert dieselbe Zahl, taugt
    // aber als Fallback, falls ein Kauf ohne Spielerbindung durchläuft.
    const key = p.player?.uuid || p.email;
    if (key) buyers.add(String(key).toLowerCase());

    if (p.date && (!earliest || p.date < earliest)) earliest = p.date;
  }

  const settled = complete + refunded + chargeback;
  return {
    unique_buyers: buyers.size,
    total_payments: payments.length,
    completed_payments: complete,
    refunds: refunded,
    chargebacks: chargeback,
    // Anteil rückabgewickelter an allen zustande gekommenen Zahlungen.
    reversal_rate: settled > 0 ? (refunded + chargeback) / settled : 0,
    first_payment_at: earliest ? new Date(earliest) : null,
  };
}

async function main() {
  const secret = process.env.TEBEX_PLUGIN_SECRET;
  if (!secret) {
    log('TEBEX_PLUGIN_SECRET fehlt, nichts zu tun.');
    process.exit(1);
  }

  log('Lade Zahlungen …');
  const { payments, pages } = await fetchAllPayments(secret);
  log(`${payments.length} Zahlungen über ${pages} Seiten geladen.`);

  const stats = aggregate(payments);
  log(
    `Eindeutige Käufer: ${stats.unique_buyers}, abgeschlossen: ${stats.completed_payments}, ` +
    `Erstattungen: ${stats.refunds}, Rückbuchungen: ${stats.chargebacks}, ` +
    `Quote: ${(stats.reversal_rate * 100).toFixed(2)} %`
  );

  // Eine leere Antwort darf den vorhandenen Wert nicht überschreiben. Lieber
  // eine Nacht alte Zahl als plötzlich null Käufer auf der Startseite.
  if (stats.unique_buyers === 0) {
    log('Keine Käufer ermittelt, Schreiben übersprungen.');
    process.exit(1);
  }

  if (DRY_RUN) {
    log('--dry-run: nichts geschrieben.');
    return;
  }

  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 2,
    timezone: '+00:00',
  });

  try {
    await pool.query(
      `INSERT INTO msk_shop_stats
         (id, unique_buyers, total_payments, completed_payments, refunds, chargebacks,
          reversal_rate, first_payment_at, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         unique_buyers      = VALUES(unique_buyers),
         total_payments     = VALUES(total_payments),
         completed_payments = VALUES(completed_payments),
         refunds            = VALUES(refunds),
         chargebacks        = VALUES(chargebacks),
         reversal_rate      = VALUES(reversal_rate),
         first_payment_at   = VALUES(first_payment_at),
         updated_at         = NOW()`,
      [
        stats.unique_buyers, stats.total_payments, stats.completed_payments,
        stats.refunds, stats.chargebacks, stats.reversal_rate, stats.first_payment_at,
      ]
    );
    log('Gespeichert.');
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  log('Fehlgeschlagen:', err.message);
  process.exit(1);
});
