import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schema = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
describe('database security contract', () => {
  it('enables RLS on every tenant-owned table', () => {
    for (const table of ['organizations', 'organization_members', 'locations', 'qr_codes', 'scan_events', 'subscriptions', 'automation_rules', 'integrations', 'ai_insights', 'ai_action_runs', 'audit_log']) {
      expect(schema).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it('keeps public scan writes behind the restricted RPC', () => {
    expect(schema).toContain('create or replace function public.record_qr_scan');
    expect(schema).toContain('revoke insert, update, delete on public.scan_events from anon, authenticated');
    expect(schema).not.toContain('create policy "public insert scans"');
  });
});
