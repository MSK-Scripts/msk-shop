import { NextResponse } from 'next/server';
import { adminRoute }   from '@/lib/adminApi';
import { getPackages, getCategories } from '@/lib/tebex';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

// Lightweight catalog (id + name) for the package/category pickers in the Give-
// package and Coupon forms. Accessible to anyone who can create payments,
// manage coupons or edit packages.
export const GET = adminRoute(['payments.create', 'coupons.manage', 'packages.edit'], async () => {
  const [pkgs, cats] = await Promise.all([getPackages(), getCategories()]);
  return NextResponse.json({
    packages:   pkgs.map(p => ({ id: p.id, name: p.name })),
    categories: cats.map(c => ({ id: c.id, name: c.name })),
  });
});
