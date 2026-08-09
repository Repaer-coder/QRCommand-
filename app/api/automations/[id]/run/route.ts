import { NextResponse } from 'next/server';
import { executeAutomationRule, isRuleDue, type AutomationRule } from '@/lib/automation';
import { hasEntitlement } from '@/lib/plans';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  if (!hasWorkspaceRole(context.organization.role, 'manager')) return NextResponse.json({ error: 'Manager access is required.' }, { status: 403 });
  if (!hasEntitlement(context.organization.plan, 'automation.engine')) return NextResponse.json({ error: 'Automation requires Pro or higher.' }, { status: 403 });
  const { data } = await supabase.from('automation_rules').select('*').eq('id', id).eq('organization_id', context.organization.id).maybeSingle();
  if (!data) return NextResponse.json({ error: 'Automation not found.' }, { status: 404 });
  const rule = { ...data, enabled: true } as AutomationRule;
  if (!(await isRuleDue(supabase, rule))) return NextResponse.json({ error: 'This rule is inside its cooldown or hourly run limit.' }, { status: 429 });
  try { return NextResponse.json(await executeAutomationRule(supabase, rule, context.userId, 'manual')); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Automation failed.' }, { status: 400 }); }
}
