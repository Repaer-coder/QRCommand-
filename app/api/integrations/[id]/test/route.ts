import { createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import { decryptSecret } from '@/lib/encryption';
import { hasEntitlement } from '@/lib/plans';
import { validatePublicHttpsUrl } from '@/lib/security';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  if (!hasEntitlement(context.organization.plan, 'integrations.advanced')) return NextResponse.json({ error: 'Integrations require Pro or higher.' }, { status: 403 });
  if (!hasWorkspaceRole(context.organization.role, 'admin')) return NextResponse.json({ error: 'Admin access is required.' }, { status: 403 });
  const { data: integration } = await supabase.from('integrations').select('config,encrypted_secret').eq('id', id).eq('organization_id', context.organization.id).maybeSingle();
  if (!integration?.encrypted_secret) return NextResponse.json({ error: 'Integration not found.' }, { status: 404 });
  try {
    const endpoint = await validatePublicHttpsUrl(String(integration.config?.endpoint_url || ''));
    if (!endpoint) throw new Error('Endpoint is not a safe public HTTPS URL.');
    const payload = JSON.stringify({ event: 'qr_command.integration_test', organizationId: context.organization.id, occurredAt: new Date().toISOString() });
    const signature = createHmac('sha256', decryptSecret(integration.encrypted_secret)).update(payload).digest('hex');
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', 'x-qr-command-signature': `sha256=${signature}` }, body: payload, signal: AbortSignal.timeout(10000), redirect: 'error' });
    await supabase.from('integrations').update({ last_tested_at: new Date().toISOString(), last_error: response.ok ? null : `HTTP ${response.status}` }).eq('id', id);
    if (!response.ok) throw new Error(`Webhook returned HTTP ${response.status}.`);
    return NextResponse.json({ success: true, status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Integration test failed.';
    await supabase.from('integrations').update({ last_tested_at: new Date().toISOString(), last_error: message }).eq('id', id);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
