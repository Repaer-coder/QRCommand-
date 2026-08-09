import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  businessType: z.enum(['restaurant', 'retail', 'services', 'agency', 'creator', 'other']),
});

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  if (!hasWorkspaceRole(context.organization.role, 'admin')) {
    return NextResponse.json({ error: 'Admin access is required to change workspace settings.' }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid workspace settings.' }, { status: 400 });
  const { error } = await supabase
    .from('organizations')
    .update({ name: parsed.data.name, business_type: parsed.data.businessType })
    .eq('id', context.organization.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
