import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { encryptSecret } from '@/lib/encryption';
import { hasEntitlement } from '@/lib/plans';
import { validatePublicHttpsUrl } from '@/lib/security';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';
const schema = z.object({ name: z.string().trim().min(2).max(100), endpointUrl: z.string().trim().max(2048) });
export async function POST(request: Request) {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  if (!hasWorkspaceRole(context.organization.role, 'admin')) return NextResponse.json({ error: 'Admin access is required.' }, { status: 403 });
  if (!hasEntitlement(context.organization.plan, 'integrations.advanced')) return NextResponse.json({ error: 'Integrations require Pro or higher.' }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Check the integration name and endpoint.' }, { status: 400 });
  const endpoint = await validatePublicHttpsUrl(parsed.data.endpointUrl).catch(() => null);
  if (!endpoint) return NextResponse.json({ error: 'Endpoint must be a resolvable public HTTPS URL.' }, { status: 400 });
  const signingSecret = randomBytes(32).toString('base64url');
  let encrypted: string;
  try { encrypted = encryptSecret(signingSecret); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Encryption is unavailable.' }, { status: 503 }); }
  const { data, error } = await supabase.from('integrations').insert({ organization_id: context.organization.id, provider: 'webhook', name: parsed.data.name, config: { endpoint_url: endpoint }, encrypted_secret: encrypted, created_by: context.userId }).select('id,name,status,provider,config,created_at').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ integration: data, signingSecret }, { status: 201 });
}
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  if (!hasWorkspaceRole(context.organization.role, 'admin')) return NextResponse.json({ error: 'Admin access is required.' }, { status: 403 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing integration.' }, { status: 400 });
  const { error } = await supabase.from('integrations').delete().eq('id', id).eq('organization_id', context.organization.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
