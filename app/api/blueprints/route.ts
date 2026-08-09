import { NextResponse } from 'next/server';
import { z } from 'zod';
import { blueprintTemplates } from '@/components/growth-blueprints';
import { hasEntitlement } from '@/lib/plans';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';

const schema = z.object({ templateKey: z.string(), name: z.string().trim().min(2).max(120).optional() });
export async function POST(request: Request) {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  if (!hasWorkspaceRole(context.organization.role, 'manager')) return NextResponse.json({ error: 'Manager access is required.' }, { status: 403 });
  if (!hasEntitlement(context.organization.plan, 'blueprints.growth')) return NextResponse.json({ error: 'Growth blueprints require Premium or higher.' }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  const template = parsed.success ? blueprintTemplates.find((item) => item.key === parsed.data.templateKey) : null;
  if (!parsed.success || !template) return NextResponse.json({ error: 'Unknown blueprint template.' }, { status: 400 });
  const { data, error } = await supabase.from('blueprint_instances').insert({ organization_id: context.organization.id, template_key: template.key, name: parsed.data.name || template.name, configuration: { outcome: template.outcome, checklist: template.items }, created_by: context.userId }).select('id,name,status').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  if (!hasWorkspaceRole(context.organization.role, 'manager')) return NextResponse.json({ error: 'Manager access is required.' }, { status: 403 });
  const parsed = z.object({ id: z.string().uuid(), status: z.enum(['draft', 'active', 'paused', 'completed']) }).safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid blueprint update.' }, { status: 400 });
  const { data, error } = await supabase.from('blueprint_instances').update({ status: parsed.data.status }).eq('id', parsed.data.id).eq('organization_id', context.organization.id).select('id,status').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: 'Blueprint not found.' }, { status: 404 });
  return NextResponse.json(data);
}
