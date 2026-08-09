import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';
import { getAppUrl } from '@/lib/stripe';
import { hasEntitlement, hasReachedLimit, plans } from '@/lib/plans';

const inviteSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  role: z.enum(['admin', 'manager', 'member']),
});
const roleSchema = z.object({
  memberId: z.string().uuid().optional(),
  invitationId: z.string().uuid().optional(),
  role: z.enum(['admin', 'manager', 'member']),
}).refine((value) => Boolean(value.memberId || value.invitationId));

async function requireTeamAdmin() {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return { error: NextResponse.json({ error: context.error }, { status: 401 }) };
  if (!hasWorkspaceRole(context.organization.role, 'admin')) {
    return { error: NextResponse.json({ error: 'Owner or admin access is required.' }, { status: 403 }) };
  }
  if (!hasEntitlement(context.organization.plan, 'team.manager')) {
    return { error: NextResponse.json({ error: 'Team management requires Premium or higher.' }, { status: 403 }) };
  }
  return { supabase, context };
}

export async function POST(request: Request) {
  const auth = await requireTeamAdmin();
  if ('error' in auth) return auth.error;
  const parsed = inviteSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid email and role.' }, { status: 400 });
  if (parsed.data.email === auth.context.email.toLowerCase()) {
    return NextResponse.json({ error: 'You are already the workspace owner.' }, { status: 400 });
  }

  const [{ count: memberCount }, { count: inviteCount }] = await Promise.all([
    auth.supabase.from('organization_members').select('user_id', { count: 'exact', head: true }).eq('organization_id', auth.context.organization.id),
    auth.supabase.from('team_invitations').select('id', { count: 'exact', head: true }).eq('organization_id', auth.context.organization.id).is('accepted_at', null),
  ]);
  const total = (memberCount ?? 0) + (inviteCount ?? 0);
  if (hasReachedLimit(total, plans[auth.context.organization.plan].limits.members)) {
    return NextResponse.json({ error: 'Your plan has reached its team member limit.' }, { status: 403 });
  }

  const { data: invitation, error } = await auth.supabase
    .from('team_invitations')
    .upsert(
      {
        organization_id: auth.context.organization.id,
        email: parsed.data.email,
        role: parsed.data.role,
        invited_by: auth.context.userId,
        accepted_at: null,
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      },
      { onConflict: 'organization_id,email' }
    )
    .select('id,email,role,expires_at')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  let emailSent = false;
  const admin = createAdminClient();
  if (admin) {
    const invite = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
      redirectTo: `${getAppUrl(request)}/auth/callback?next=${encodeURIComponent('/dashboard')}`,
      data: { organization_id: auth.context.organization.id, role: parsed.data.role },
    });
    emailSent = !invite.error;
  }
  return NextResponse.json({ ...invitation, emailSent }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireTeamAdmin();
  if ('error' in auth) return auth.error;
  const parsed = roleSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid role update.' }, { status: 400 });

  if (parsed.data.memberId) {
    const { data: target } = await auth.supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', auth.context.organization.id)
      .eq('user_id', parsed.data.memberId)
      .maybeSingle();
    if (!target) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    if (target.role === 'owner') return NextResponse.json({ error: 'The owner role cannot be changed.' }, { status: 400 });
    const update = await auth.supabase
      .from('organization_members')
      .update({ role: parsed.data.role })
      .eq('organization_id', auth.context.organization.id)
      .eq('user_id', parsed.data.memberId);
    if (update.error) return NextResponse.json({ error: update.error.message }, { status: 400 });
  } else {
    const update = await auth.supabase
      .from('team_invitations')
      .update({ role: parsed.data.role })
      .eq('organization_id', auth.context.organization.id)
      .eq('id', parsed.data.invitationId!);
    if (update.error) return NextResponse.json({ error: update.error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const auth = await requireTeamAdmin();
  if ('error' in auth) return auth.error;
  const url = new URL(request.url);
  const memberId = url.searchParams.get('memberId');
  const invitationId = url.searchParams.get('invitationId');
  if (!memberId && !invitationId) return NextResponse.json({ error: 'Missing team record.' }, { status: 400 });

  if (memberId) {
    const { data: target } = await auth.supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', auth.context.organization.id)
      .eq('user_id', memberId)
      .maybeSingle();
    if (!target) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    if (target.role === 'owner') return NextResponse.json({ error: 'The workspace owner cannot be removed.' }, { status: 400 });
    const removal = await auth.supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', auth.context.organization.id)
      .eq('user_id', memberId);
    if (removal.error) return NextResponse.json({ error: removal.error.message }, { status: 400 });
  } else {
    const removal = await auth.supabase
      .from('team_invitations')
      .delete()
      .eq('organization_id', auth.context.organization.id)
      .eq('id', invitationId!);
    if (removal.error) return NextResponse.json({ error: removal.error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
