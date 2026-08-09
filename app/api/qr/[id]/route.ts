import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';
import { normalizeHttpUrl } from '@/lib/security';

const patchSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    destination_url: z.string().trim().max(2048).optional(),
    status: z.enum(['active', 'paused', 'archived']).optional(),
    location_id: z.string().uuid().nullable().optional(),
    style: z.object({ fg: z.string().regex(/^#[0-9a-f]{6}$/i), bg: z.string().regex(/^#[0-9a-f]{6}$/i) }).optional(),
  })
  .refine((value) => Object.keys(value).length > 0);

async function resolveCode(supabase: SupabaseClient, workspaceId: string, id: string) {
  const { data } = await supabase
    .from('qr_codes')
    .select('id,status')
    .eq('id', id)
    .eq('organization_id', workspaceId)
    .maybeSingle();
  return data;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  const { id } = await params;
  const code = await resolveCode(supabase, context.organization.id, id);
  if (!code) return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid campaign update.' }, { status: 400 });
  if (parsed.data.status === 'archived' && !hasWorkspaceRole(context.organization.role, 'manager')) {
    return NextResponse.json({ error: 'Manager access is required to archive campaigns.' }, { status: 403 });
  }

  const update: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.destination_url) {
    const destination = normalizeHttpUrl(parsed.data.destination_url);
    if (!destination) return NextResponse.json({ error: 'Destination must be HTTP or HTTPS.' }, { status: 400 });
    update.destination_url = destination;
  }
  if (parsed.data.location_id) {
    const { data: location } = await supabase
      .from('locations')
      .select('id')
      .eq('id', parsed.data.location_id)
      .eq('organization_id', context.organization.id)
      .maybeSingle();
    if (!location) return NextResponse.json({ error: 'Location not found.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('qr_codes')
    .update(update)
    .eq('id', id)
    .eq('organization_id', context.organization.id)
    .select('id,name,destination_url,status,slug,location_id,style')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  if (!hasWorkspaceRole(context.organization.role, 'admin')) {
    return NextResponse.json({ error: 'Admin access is required to permanently delete campaigns.' }, { status: 403 });
  }
  const { id } = await params;
  const code = await resolveCode(supabase, context.organization.id, id);
  if (!code) return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
  const { error } = await supabase.from('qr_codes').delete().eq('id', id).eq('organization_id', context.organization.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
