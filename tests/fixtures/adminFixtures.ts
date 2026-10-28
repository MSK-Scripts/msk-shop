/**
 * Raw admin data as Tebex and the database hand it over, for the masking
 * tests, the render tests of the admin areas and the screenshots of Phase 10.
 * Every field that can hold an email or IP address holds a real-looking one,
 * so a test that finds none of `PERSONAL` in a response has checked
 * something.
 *
 * Dates are relative to the moment the module loads, so the overview of the
 * last 30 days has something to count whenever it runs.
 */

const DAY = 86_400_000
const NOW = Date.now()
const ago = (days: number, hours = 0) => new Date(NOW - days * DAY - hours * 3_600_000).toISOString().replace(/\.\d{3}Z$/, '+00:00')

export const EMAILS = [
  'maximilian.mustermann@gmail.com',
  'mia.schneider@gmail.com',
  'roleplay.atlas@outlook.de',
  'chargeback.buyer@example.org',
  'owner@unique-family.net',
] as const

export const IPS = ['203.0.113.42', '198.51.100.7', '2001:db8:85a3::8a2e:370:7334'] as const

/** Every full address in the fixtures. None of them may reach the browser masked-off. */
export const PERSONAL: readonly string[] = [...EMAILS, ...IPS, '8a2e:370:7334']

const EUR = { iso_4217: 'EUR', symbol: '€' }
const pay = (id: number, days: number, amount: number, status: string, email: string, player: string, pkg: string) => ({
  id, amount, date: ago(days, id % 7), currency: EUR, gateway: { id: '1', name: amount > 0 ? 'PayPal' : 'Manual' },
  status, email, player: { id: String(1000 + id), name: player, uuid: '' }, packages: [{ id: 6000 + (id % 4), name: pkg }],
  notes: status === 'Chargeback' ? [{ note: `Dispute opened by ${email}` }] : [], creator_code: null,
})

const payments = [
  pay(51240, 1, 24.99, 'Complete', EMAILS[0], 'Atlas_RP', 'MSK Garage | Encrypted'),
  pay(51239, 2, 0, 'Complete', EMAILS[2], 'UniqueFamily', 'MSK VehicleKeys | Source'),
  pay(51238, 3, 39.99, 'Complete', EMAILS[1], 'mia_s', 'MSK Garage | Source'),
  pay(51237, 5, 24.99, 'Refund', EMAILS[0], 'Atlas_RP', 'MSK Handcuffs | Encrypted'),
  pay(51236, 8, 14.99, 'Complete', EMAILS[4], 'UniqueFamily', 'MSK Fuel | Encrypted'),
  pay(51235, 12, 24.99, 'Chargeback', EMAILS[3], 'quick_buyer', 'MSK Garage | Encrypted'),
  pay(51234, 16, 39.99, 'Complete', EMAILS[1], 'mia_s', 'MSK VehicleKeys | Source'),
  pay(51233, 21, 9.99, 'Complete', EMAILS[0], 'Atlas_RP', 'MSK Core Addons'),
  pay(51232, 27, 0, 'Complete', EMAILS[4], 'UniqueFamily', 'MSK Garage | Encrypted'),
  pay(51231, 34, 24.99, 'Complete', EMAILS[2], 'Atlas_RP', 'MSK Garage | Encrypted'),
  pay(51230, 41, 39.99, 'Complete', EMAILS[1], 'mia_s', 'MSK Handcuffs | Source'),
  pay(51229, 48, 14.99, 'Complete', EMAILS[0], 'Atlas_RP', 'MSK Fuel | Encrypted'),
  pay(51228, 55, 24.99, 'Complete', EMAILS[4], 'UniqueFamily', 'MSK VehicleKeys | Encrypted'),
  pay(51227, 66, 39.99, 'Complete', EMAILS[3], 'quick_buyer', 'MSK Garage | Source'),
]

const bans = [
  { id: 77, time: ago(4), ip: IPS[0], payment_email: EMAILS[3], reason: `Chargeback fraud, second account ${EMAILS[3]}`, user: { ign: 'quick_buyer', uuid: '' } },
  { id: 76, time: ago(19), ip: IPS[2], payment_email: '', reason: 'Resold the source version', user: { ign: 'leaky_dev', uuid: '' } },
  { id: 75, time: ago(60), ip: IPS[1], payment_email: EMAILS[2], reason: `Shared key from ${IPS[1]}`, user: { ign: null, uuid: '6f7c1e3a-9d4b-4a59-8f2e-1b0d5c3a7e91' } },
]

const lookup = {
  player: { id: '1240', username: 'Atlas_RP', meta: { last_ip: IPS[1], contact: EMAILS[0] }, plugin_username_id: 0 },
  banCount: 0,
  chargebackRate: 0,
  payments: [
    { txn_id: '51240', time: Math.floor((NOW - DAY) / 1000), price: 24.99, currency: 'EUR', status: 'Complete' },
    { txn_id: '51237', time: Math.floor((NOW - 5 * DAY) / 1000), price: 24.99, currency: 'EUR', status: 'Refund' },
  ],
  purchaseTotals: {},
}

const giftCards = [
  { id: 301, code: 'GC-7Q4M-2KXP', balance: { starting: '25.00', remaining: '12.50', currency: 'EUR' }, note: `Goodwill for ${EMAILS[1]}`, void: false },
  { id: 300, code: 'GC-9TRA-81LD', balance: { starting: '50.00', remaining: '50.00', currency: 'EUR' }, note: 'Partner package', void: false },
  { id: 299, code: 'GC-3HHB-0PZE', balance: { starting: '10.00', remaining: '0.00', currency: 'EUR' }, note: null, void: true },
]

const coupon = (id: number, code: string, extra: Record<string, unknown>) => ({
  id, code, effective: { type: 'cart', packages: [], categories: [] },
  discount: { type: 'percentage', percentage: 20, value: 0 },
  expire: { redeem_unlimited: 'true', expire_never: 'true', limit: 0, date: '1970-01-01' },
  start_date: ago(30), basket_type: 'both', user_limit: 0, minimum: 0, username: '', note: '', ...extra,
})

const coupons = [
  coupon(901, 'AUTUMN20', { note: 'Autumn sale' }),
  coupon(902, 'GIVEAWAY-7Y2K', { discount: { type: 'value', percentage: 0, value: 10 }, note: `Winner ${EMAILS[2]}`, expire: { redeem_unlimited: 'false', expire_never: 'false', limit: 1, date: ago(-20) } }),
  coupon(903, 'POST-51231', { username: 'Atlas_RP', expire: { redeem_unlimited: 'false', expire_never: 'false', limit: 1, date: ago(33) } }),
  coupon(904, 'USED-UP-1', { expire: { redeem_unlimited: 'false', expire_never: 'true', limit: 0, date: '1970-01-01' } }),
]

const auditRows = [
  { id: 12, discord_user_id: '111111111111111111', display_name: 'Musiker15', action: 'image_upload.approve', target: '0b8c5f0e-3c1b-4d55-9a0e-6c2b1f4d9e10', detail: JSON.stringify({ category: 'brand', name: 'opengewerk-logo', submittedBy: '222222222222222222' }), created_at: ago(0, 2) },
  { id: 11, discord_user_id: '111111111111111111', display_name: 'Musiker15', action: 'ban.create', target: 'quick_buyer', detail: JSON.stringify({ reason: `Chargeback fraud, second account ${EMAILS[3]}` }), created_at: ago(4) },
  { id: 10, discord_user_id: '333333333333333333', display_name: 'Lena', action: 'payment.create_free', target: 'UniqueFamily', detail: JSON.stringify({ packages: [{ id: 6001 }], price: 0 }), created_at: ago(2) },
  { id: 9, discord_user_id: '333333333333333333', display_name: 'Lena', action: 'data.reveal', target: 'payment:51235', detail: JSON.stringify({ field: 'email' }), created_at: ago(6) },
  { id: 8, discord_user_id: '444444444444444444', display_name: null, action: 'coupon.delete', target: '899', detail: null, created_at: ago(9) },
  { id: 7, discord_user_id: '111111111111111111', display_name: 'Musiker15', action: 'api_key.change_tier', target: '900394679634370640', detail: JSON.stringify({ from: 'basic', to: 'premium' }), created_at: ago(12) },
  { id: 6, discord_user_id: '111111111111111111', display_name: 'Musiker15', action: 'news_popup.save', target: null, detail: JSON.stringify({ enabled: true, title: 'Support limited', hasButton: true, hasCoupon: false }), created_at: ago(15) },
  { id: 5, discord_user_id: '333333333333333333', display_name: 'Lena', action: 'giftcard.topup', target: '301', detail: JSON.stringify({ amount: 5 }), created_at: ago(20) },
]

const guildRows = [
  { guild_id: '900394679634370640', guild_name: 'Atlas Roleplay', api_key: 'mskt_live_abcdefghijklmnopqrstuvwxyz012345', tier: 'premium', custom_domain: 'tickets.atlas-rp.de', domain_status: 'active', is_hosted: 0, active: 1, created_at: ago(3), expires_at: null, stats_excluded: 0, key_origin: 'normal' },
  { guild_id: '811122233344455566', guild_name: 'Unique Family', api_key: 'mskt_live_zyxwvutsrqponmlkjihgfedcba987654', tier: 'premium_plus', custom_domain: null, domain_status: 'pending_dns', is_hosted: 1, active: 1, created_at: ago(40), expires_at: null, stats_excluded: 0, key_origin: 'giveaway' },
  { guild_id: '722233344455566677', guild_name: null, api_key: 'mskt_live_00000000001111111111222222223333', tier: 'basic', custom_domain: null, domain_status: 'none', is_hosted: 0, active: 0, created_at: ago(200), expires_at: null, stats_excluded: 1, key_origin: 'sponsored' },
]

const uploads = [
  { id: '0b8c5f0e-3c1b-4d55-9a0e-6c2b1f4d9e11', category: 'vehicles', name: 'pegassi_zentorno_custom', label: 'Pegassi Zentorno (custom)', tags: ['supercar', 'pegassi'], originalFilename: 'zentorno.png', width: 1024, height: 576, bytes: 412_331, sha256: 'a'.repeat(64), submittedBy: '555555555555555555', submittedName: 'carfan', note: `Made it myself, contact ${EMAILS[0]} for the source`, status: 'pending', rejectReason: null, reviewedBy: null, reviewedAt: null, createdAt: ago(0, 5), hasFile: true },
  { id: '0b8c5f0e-3c1b-4d55-9a0e-6c2b1f4d9e12', category: 'items', name: 'water_bottle', label: null, tags: [], originalFilename: null, width: 256, height: 256, bytes: 18_220, sha256: 'b'.repeat(64), submittedBy: '666666666666666666', submittedName: null, note: null, status: 'rejected', rejectReason: 'Watermark of another server', reviewedBy: '111111111111111111', reviewedAt: ago(3), createdAt: ago(4), hasFile: false },
]

const images = [
  { category: 'vehicles', name: 'adder', label: 'Truffade Adder', tags: ['supercar'], ext: 'png', width: 1920, height: 1080, bytes: 812_000, version: 2, status: 'published', source: 'GTA V screenshot', licenseNote: null, submittedBy: null, updatedAt: ago(10), thumb: 'https://cdn.msk-scripts.de/vehicles/adder.thumb.webp', url: 'https://cdn.msk-scripts.de/vehicles/adder.png' },
  { category: 'items', name: 'phone', label: null, tags: [], ext: 'png', width: 256, height: 256, bytes: 22_000, version: 1, status: 'hidden', source: null, licenseNote: `Licensed from ${EMAILS[4]}`, submittedBy: '555555555555555555', updatedAt: ago(30), thumb: 'https://cdn.msk-scripts.de/items/phone.thumb.webp', url: 'https://cdn.msk-scripts.de/items/phone.png' },
]

const imageStats = [
  { slug: 'vehicles', name: 'Vehicles', isPublic: true, total: 1240, published: 1230, pending: 0, hidden: 10, noLabel: 1702, noTags: 410 },
  { slug: 'items', name: 'Items', isPublic: true, total: 620, published: 600, pending: 0, hidden: 20, noLabel: 292, noTags: 88 },
  { slug: 'brand', name: 'Brand', isPublic: false, total: 12, published: 12, pending: 0, hidden: 0, noLabel: 0, noTags: 3 },
]

export const ADMIN_FIXTURE = {
  now: NOW,
  payments, bans, lookup, giftCards, coupons, auditRows, guildRows, uploads, images, imageStats,
}
