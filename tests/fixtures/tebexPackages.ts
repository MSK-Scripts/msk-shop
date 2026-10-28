import type { TebexPackage } from '@/types/tebex'

/**
 * The packages of the Tebex Headless API as fetched on 28.10.2026, trimmed to
 * the fields the product model reads (media: the first three of each).
 * Descriptions are left out on purpose; the product model never reads them
 * to decide anything.
 */
export const TEBEX_PACKAGES = [
  {
    id: 7569109,
    name: 'MSK Scripts - Encrypted Version',
    slug: null,
    type: 'subscription',
    category: {
      id: 3392436,
      name: 'Subscriptions'
    },
    base_price: 4.99,
    total_price: 4.99,
    currency: 'EUR',
    disable_gifting: true,
    updated_at: '2026-08-29T11:50:14+00:00',
    media: [
      {
        type: 'image',
        primary: true,
        url: 'https://dunb17ur4ymx4.cloudfront.net/packages/images/93c477db181568a1dbd880291e7ac9e3594b3015.png'
      }
    ]
  },
  {
    id: 7569121,
    name: 'MSK Scripts - Source Version',
    slug: null,
    type: 'subscription',
    category: {
      id: 3392436,
      name: 'Subscriptions'
    },
    base_price: 9.99,
    total_price: 9.99,
    currency: 'EUR',
    disable_gifting: true,
    updated_at: '2026-08-29T11:50:14+00:00',
    media: [
      {
        type: 'image',
        primary: true,
        url: 'https://dunb17ur4ymx4.cloudfront.net/packages/images/93c477db181568a1dbd880291e7ac9e3594b3015.png'
      }
    ]
  },
  {
    id: 5732587,
    name: 'MSK Garage & Impound - In-Game Admin Dashboard | Encrypted',
    slug: 'garage-e',
    type: 'single',
    category: {
      id: 2105296,
      name: 'Encrypted Version'
    },
    base_price: 19.99,
    total_price: 19.99,
    currency: 'EUR',
    disable_gifting: false,
    updated_at: '2026-09-10T06:15:12+00:00',
    media: [
      {
        type: 'image',
        primary: true,
        url: 'https://dunb17ur4ymx4.cloudfront.net/packages/images/89464a9171bf43ea3c79069dfbd84553c00f2996.png'
      },
      {
        type: 'image',
        primary: false,
        url: 'https://dunb17ur4ymx4.cloudfront.net/packages/images/57981a40593b7a29d3ea2a6df6e3e637d5cc7c3e.png'
      },
      {
        type: 'image',
        primary: false,
        url: 'https://dunb17ur4ymx4.cloudfront.net/packages/images/4d231757d358faeedc75054b07293a3a85c2ebda.png'
      }
    ]
  },
  {
    id: 5732588,
    name: 'MSK Garage & Impound - In-Game Admin Dashboard | Source',
    slug: 'garage-s',
    type: 'single',
    category: {
      id: 2228937,
      name: 'Source Version'
    },
    base_price: 39.99,
    total_price: 39.99,
    currency: 'EUR',
    disable_gifting: false,
    updated_at: '2026-09-10T06:17:03+00:00',
    media: [
      {
        type: 'image',
        primary: true,
        url: 'https://dunb17ur4ymx4.cloudfront.net/packages/images/431f146320d1ea8b2fd642d9f5930a473f532c28.png'
      },
      {
        type: 'image',
        primary: false,
        url: 'https://dunb17ur4ymx4.cloudfront.net/packages/images/a2a2dae344a11311e8a4a43c728b048c94819192.png'
      },
      {
        type: 'image',
        primary: false,
        url: 'https://dunb17ur4ymx4.cloudfront.net/packages/images/8b5b21f2f4b7c1404b7aa75406003a54202143c4.png'
      }
    ]
  },
  {
    id: 5159927,
    name: 'MSK Handcuffs - Realistic Handcuffs | Encrypted',
    slug: 'handcuffs-e',
    type: 'single',
    category: {
      id: 2105296,
      name: 'Encrypted Version'
    },
    base_price: 14.99,
    total_price: 14.99,
    currency: 'EUR',
    disable_gifting: false,
    updated_at: '2026-09-10T06:16:01+00:00',
    media: [
      {
        type: 'image',
        primary: true,
        url: 'https://dunb17ur4ymx4.cloudfront.net/packages/images/c3023ceeeaa30f4ad3ae8220cdc3a73c07fc583b.png'
      }
    ]
  },
  {
    id: 5301828,
    name: 'MSK Handcuffs - Realistic Handcuffs | Source',
    slug: 'handcuffs-s',
    type: 'single',
    category: {
      id: 2228937,
      name: 'Source Version'
    },
    base_price: 29.99,
    total_price: 29.99,
    currency: 'EUR',
    disable_gifting: false,
    updated_at: '2026-09-10T06:17:21+00:00',
    media: [
      {
        type: 'image',
        primary: true,
        url: 'https://dunb17ur4ymx4.cloudfront.net/packages/images/af64768f584dc9bdf71364df4ae763e6ba94afdc.png'
      }
    ]
  },
  {
    id: 6446936,
    name: 'MSK VehicleKeys - Unique Items & In-Game Admin Dashboard | Encrypted',
    slug: 'vehiclekeys-e',
    type: 'single',
    category: {
      id: 2105296,
      name: 'Encrypted Version'
    },
    base_price: 19.99,
    total_price: 19.99,
    currency: 'EUR',
    disable_gifting: false,
    updated_at: '2026-09-10T06:16:36+00:00',
    media: [
      {
        type: 'image',
        primary: true,
        url: 'https://dunb17ur4ymx4.cloudfront.net/packages/images/4faabe5a3c76d49149b8f1b15b886f24f3ea7a29.png'
      },
      {
        type: 'image',
        primary: false,
        url: 'https://dunb17ur4ymx4.cloudfront.net/packages/images/6a4da504a9a23987b5d7af3e2af443c181b409de.png'
      },
      {
        type: 'image',
        primary: false,
        url: 'https://dunb17ur4ymx4.cloudfront.net/packages/images/4b49628ac49fd34fc06cd90150103857d5816095.png'
      }
    ]
  },
  {
    id: 6446947,
    name: 'MSK VehicleKeys - Unique Items & In-Game Admin Dashboard | Source',
    slug: 'vehiclekeys-s',
    type: 'single',
    category: {
      id: 2228937,
      name: 'Source Version'
    },
    base_price: 39.99,
    total_price: 39.99,
    currency: 'EUR',
    disable_gifting: false,
    updated_at: '2026-09-10T06:17:37+00:00',
    media: [
      {
        type: 'image',
        primary: true,
        url: 'https://dunb17ur4ymx4.cloudfront.net/packages/images/8118f354a093b3d46e087baec3464aefc0e25dac.png'
      },
      {
        type: 'image',
        primary: false,
        url: 'https://dunb17ur4ymx4.cloudfront.net/packages/images/7b56f6e375e4345c82fccde489b7b908c0dda572.png'
      },
      {
        type: 'image',
        primary: false,
        url: 'https://dunb17ur4ymx4.cloudfront.net/packages/images/07e213db4b0c5246c7f40647ef3858fdb1bae565.png'
      }
    ]
  }
].map(p => ({ description: '', image: p.media.find(m => m.primary)?.url, ...p })) as unknown as TebexPackage[]
