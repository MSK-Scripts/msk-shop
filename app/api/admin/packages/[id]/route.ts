import { NextResponse } from 'next/server';
import { adminRoute }   from '@/lib/adminApi';
import { writeAudit }   from '@/lib/adminAudit';
import { tebexPlugin }  from '@/lib/tebexPlugin';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

// Update a package: only name / price / disabled are editable via the Plugin API.
export const PUT = adminRoute<{ id: string }>('packages.edit', async ({ req, member, params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid package id.' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const fields: { name?: string; price?: number; disabled?: boolean } = {};

  if (typeof body?.name === 'string' && body.name.trim()) fields.name = body.name.trim();
  if (typeof body?.price === 'number' && Number.isFinite(body.price) && body.price >= 0) fields.price = body.price;
  if (typeof body?.disabled === 'boolean') fields.disabled = body.disabled;

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  await tebexPlugin.packages.update(id, fields);
  await writeAudit(member.discordUserId, 'package.update', String(id), fields);
  return NextResponse.json({ success: true });
});
