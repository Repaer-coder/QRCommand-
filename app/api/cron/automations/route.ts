import { NextResponse } from 'next/server';
import { executeAutomationRule, isRuleDue, type AutomationRule } from '@/lib/automation';
import { hasEntitlement, normalizePlan } from '@/lib/plans';
import { createAdminClient } from '@/lib/supabase/admin';
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get('authorization') !== `Bearer ${expected}`) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase admin client unavailable.' }, { status: 503 });
  const { data: rows, error } = await supabase.from('automation_rules').select('*, organizations!inner(plan)').eq('enabled', true).in('trigger_type', ['schedule', 'scan_threshold']).limit(25);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const results: Array<Record<string, unknown>> = [];
  for (const row of rows ?? []) {
    const rowWithPlan = row as AutomationRule & { organizations: { plan?: string } | null };
    if (!hasEntitlement(normalizePlan(rowWithPlan.organizations?.plan), 'automation.engine')) continue;
    const rule = rowWithPlan as AutomationRule;
    if (!(await isRuleDue(supabase, rule))) continue;
    try { results.push({ ruleId: rule.id, ...(await executeAutomationRule(supabase, rule, null, 'cron')) }); }
    catch (runError) { results.push({ ruleId: rule.id, status: 'failed', error: runError instanceof Error ? runError.message : 'Unknown error' }); }
  }
  return NextResponse.json({ processed: results.length, results });
}
