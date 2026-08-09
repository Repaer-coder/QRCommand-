import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().max(500).nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  if (!hasWorkspaceRole(context.organization.role, 'manager')) {
    return NextResponse.json({ error: 'Manager access is required.' }, { status: 403 });
  }
  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid location details.' }, { status: 400 });
  const { id } = await params;
  const { data, error } = await supabase
    .from('locations')
    .update({ name: parsed.data.name, address: parsed.data.address || null })
    .eq('id', id)
    .eq('organization_id', context.organization.id)
    .select('id,name,address')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: 'Location not found.' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  if (!hasWorkspaceRole(context.organization.role, 'admin')) {
    return NextResponse.json({ error: 'Admin access is required to delete locations.' }, { status: 403 });
  }
  const { id } = await params;
  const { error, count } = await supabase
    .from('locations')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('organization_id', context.organization.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!count) return NextResponse.json({ error: 'Location not found.' }, { status: 404 });
  return NextResponse.json({ success: true });
}
