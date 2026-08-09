import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/workspace';
import { hasEntitlement, hasReachedLimit, plans } from '@/lib/plans';
import { normalizeHttpUrl } from '@/lib/security';

const styleSchema = z.object({
  fg: z.string().regex(/^#[0-9a-f]{6}$/i),
  bg: z.string().regex(/^#[0-9a-f]{6}$/i),
});
const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  type: z.enum(['restaurant', 'reviews', 'social', 'website', 'lead', 'coupon', 'event', 'wifi']),
  destinationUrl: z.string().trim().max(2048),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(3).max(50),
  style: styleSchema,
  locationId: z.string().uuid().nullable().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  const { data, error } = await supabase
    .from('qr_codes')
    .select('id,name,qr_type,destination_url,status,slug,scan_count,style,location_id,created_at')
    .eq('organization_id', context.organization.id)
    .neq('status', 'archived')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Check the name, URL, short link, and colors.' }, { status: 400 });
  if (!hasEntitlement(context.organization.plan, 'qr.core')) {
    return NextResponse.json({ error: 'QR creation is unavailable on this plan.' }, { status: 403 });
  }
  const destinationUrl = normalizeHttpUrl(parsed.data.destinationUrl);
  if (!destinationUrl) return NextResponse.json({ error: 'Destination must be a valid HTTP or HTTPS URL.' }, { status: 400 });

  const countResult = await supabase
    .from('qr_codes')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', context.organization.id)
    .neq('status', 'archived');
  if (countResult.error) return NextResponse.json({ error: countResult.error.message }, { status: 400 });
  if (hasReachedLimit(countResult.count ?? 0, plans[context.organization.plan].limits.qrCodes)) {
    return NextResponse.json({ error: 'Your plan has reached its QR campaign limit.' }, { status: 403 });
  }

  if (parsed.data.locationId) {
    const location = await supabase
      .from('locations')
      .select('id')
      .eq('id', parsed.data.locationId)
      .eq('organization_id', context.organization.id)
      .maybeSingle();
    if (!location.data) return NextResponse.json({ error: 'Location not found in this workspace.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('qr_codes')
    .insert({
      organization_id: context.organization.id,
      location_id: parsed.data.locationId ?? null,
      name: parsed.data.name,
      slug: parsed.data.slug,
      destination_url: destinationUrl,
      qr_type: parsed.data.type,
      style: parsed.data.style,
      created_by: context.userId,
    })
    .select('id,slug')
    .single();
  if (error) {
    return NextResponse.json(
      { error: error.code === '23505' ? 'That permanent short link is already in use.' : error.message },
      { status: 400 }
    );
  }
  return NextResponse.json(data, { status: 201 });
}
