import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/workspace';

const schema = z.object({
  workspaceName: z.string().trim().min(2).max(100),
  businessType: z.enum(['restaurant', 'retail', 'services', 'agency', 'creator', 'other']),
  locationName: z.string().trim().max(120).optional(),
  locationAddress: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  if (context.organization.role !== 'owner') {
    return NextResponse.json({ error: 'Only the workspace owner can complete onboarding.' }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Check your business details.' }, { status: 400 });

  const update = await supabase
    .from('organizations')
    .update({
      name: parsed.data.workspaceName,
      business_type: parsed.data.businessType,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', context.organization.id);
  if (update.error) return NextResponse.json({ error: update.error.message }, { status: 400 });

  if (parsed.data.locationName) {
    const location = await supabase.from('locations').insert({
      organization_id: context.organization.id,
      name: parsed.data.locationName,
      address: parsed.data.locationAddress || null,
    });
    if (location.error) return NextResponse.json({ error: location.error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
