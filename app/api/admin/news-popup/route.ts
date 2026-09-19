import { NextResponse } from 'next/server';
import { adminRoute }   from '@/lib/adminApi';
import { writeAudit }   from '@/lib/adminAudit';
import { loadNewsPopup, saveNewsPopup } from '@/lib/siteSettings';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

/**
 * The site-wide announcement popup, previously a constant in `lib/config.ts`.
 *
 * Read and write share one permission: there is nothing sensitive to see here,
 * the content is shown to every visitor anyway, and a "may look but not touch"
 * split would only add a second permission for a single form.
 */
export const GET = adminRoute('news_popup.manage', async () => {
  const settings = await loadNewsPopup();
  return NextResponse.json({ settings }, { headers: { 'Cache-Control': 'no-store' } });
});

export const PUT = adminRoute('news_popup.manage', async ({ req, member }) => {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // `saveNewsPopup` validates and normalises, and returns what was stored.
  // Returning that rather than the request body means the form redraws from
  // what the public page will actually show: a button whose href was rejected
  // disappears in front of the admin instead of looking saved.
  const settings = await saveNewsPopup(body.settings ?? body, member.discordUserId);

  await writeAudit(member.discordUserId, 'news_popup.save', null, {
    enabled:   settings.enabled,
    title:     settings.title,
    hasButton: settings.button !== null || settings.secondButton !== null,
    hasCoupon: settings.coupon !== null,
  });

  return NextResponse.json({ settings }, { headers: { 'Cache-Control': 'no-store' } });
});
