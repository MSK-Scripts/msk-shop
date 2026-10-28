import { NextResponse }  from 'next/server';
import { adminRoute }    from '@/lib/adminApi';
import { groupProducts } from '@/lib/products';
import { getPackages }   from '@/lib/tebex';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

// List packages from the catalog (Headless API). Only enabled packages are
// returned by Tebex here; editing is done via the Plugin API (PUT below).
//
// Each package carries the product it belongs to and its variant, grouped
// the way the catalog groups them (lib/products.ts), so the admin shows
// Encrypted and Source of one script as a pair (plan 6.6).
export const GET = adminRoute('packages.edit', async () => {
  const pkgs = await getPackages();
  const products = groupProducts(pkgs);
  const packages = products.flatMap(product => product.variants.map(({ variant, pkg }) => ({
    id:       pkg.id,
    name:     pkg.name,
    price:    pkg.base_price,
    currency: pkg.currency,
    product:  product.name || pkg.name,
    productSlug: product.slug,
    variant,
  })));
  return NextResponse.json({ packages });
});
