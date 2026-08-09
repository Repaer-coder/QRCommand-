import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';
import { hasEntitlement, hasReachedLimit, plans } from '@/lib/plans';

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().max(500).optional().transform((value) => value || null),
});

export async function GET() {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  const { data, error } = await supabase
    .from('locations')
    .select('id,name,address,created_at,updated_at')
    .eq('organization_id', context.organization.id)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  if (!hasWorkspaceRole(context.organization.role, 'manager')) {
    return NextResponse.json({ error: 'Manager access is required to add locations.' }, { status: 403 });
  }
  if (!hasEntitlement(context.organization.plan, 'locations.basic')) {
    return NextResponse.json({ error: 'Locations require an Essentials or higher plan.' }, { status: 403 });
  }
  const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Check the location name and address.' }, { status: 400 });

  const countResult = await supabase
    .from('locations')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', context.organization.id);
  if (countResult.error) return NextResponse.json({ error: countResult.error.message }, { status: 400 });
  if (hasReachedLimit(countResult.count ?? 0, plans[context.organization.plan].limits.locations)) {
    return NextResponse.json({ error: 'Your plan has reached its location limit.' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('locations')
    .insert({ organization_id: context.organization.id, ...parsed.data })
    .select('id,name,address')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
