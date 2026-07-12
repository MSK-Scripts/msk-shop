import { NextResponse } from 'next/server';
import { adminRoute }   from '@/lib/adminApi';
import { getPackages }  from '@/lib/tebex';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

// List packages from the catalog (Headless API). Only enabled packages are
// returned by Tebex here; editing is done via the Plugin API (PUT below).
export const GET = adminRoute('packages.edit', async () => {
  const pkgs = await getPackages();
  const packages = pkgs.map(p => ({ id: p.id, name: p.name, price: p.base_price, currency: p.currency }));
  return NextResponse.json({ packages });
});
