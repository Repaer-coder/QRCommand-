import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getBlueprintTemplate } from '@/lib/blueprints';
import { hasEntitlement } from '@/lib/plans';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';

type BlueprintInstanceStatus = 'draft' | 'active' | 'paused' | 'completed';

const createSchema = z.object({
  templateKey: z.string(),
  name: z.string().trim().min(2).max(120).optional(),
});

const updateSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(2).max(120).optional(),
    status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
    checklist: z.array(z.string()).optional(),
  })
  .refine((payload) => payload.name !== undefined || payload.status !== undefined || payload.checklist !== undefined, {
    message: 'Invalid blueprint update.',
  });

const deleteSchema = z.object({ id: z.string().uuid() });

const NO_ADMIN_ERROR = 'SUPABASE_SERVICE_ROLE_KEY is required for blueprint writes.';

async function getAuthorizedBlueprintContext() {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) {
    return { response: NextResponse.json({ error: context.error }, { status: 401 }) as Response };
  }

  if (!hasWorkspaceRole(context.organization.role, 'manager')) {
    return {
      response: NextResponse.json({ error: 'Manager access is required.' }, { status: 403 }),
    };
  }

  if (!hasEntitlement(context.organization.plan, 'blueprints.growth')) {
    return {
      response: NextResponse.json({ error: 'Growth blueprints require Premium or higher.' }, { status: 403 }),
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      response: NextResponse.json({ error: NO_ADMIN_ERROR }, { status: 503 }),
    };
  }

  return {
    response: null,
    context,
    admin,
  };
}

function normalizeChecklist(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
}

function ensureConfigurationRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function blueprintServerError(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  const authorize = await getAuthorizedBlueprintContext();
  if (authorize.response) {
    return authorize.response;
  }
  const { context, admin } = authorize;

  if (!context || !admin) {
    return NextResponse.json({ error: 'Unable to initialize workspace context.' }, { status: 500 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
  const template = parsed.success ? getBlueprintTemplate(parsed.data.templateKey) : null;
  if (!parsed.success || !template) return NextResponse.json({ error: 'Unknown blueprint template.' }, { status: 400 });

  const { data, error } = await admin
    .from('blueprint_instances')
    .insert({
      organization_id: context.organization.id,
      template_key: template.key,
      name: parsed.data.name || template.name,
      configuration: { outcome: template.outcome, checklist: template.items },
      created_by: context.userId,
    })
    .select('id,name,status')
    .single();

  if (error) return blueprintServerError(error.message);
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  const authorize = await getAuthorizedBlueprintContext();
  if (authorize.response) {
    return authorize.response;
  }
  const { context, admin } = authorize;

  if (!context || !admin) {
    return NextResponse.json({ error: 'Unable to initialize workspace context.' }, { status: 500 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid blueprint update.' }, { status: 400 });

  const updates: {
    name?: string;
    status?: BlueprintInstanceStatus;
    configuration?: Record<string, unknown>;
  } = {};

  if (parsed.data.name) {
    updates.name = parsed.data.name;
  }

  if (parsed.data.status) {
    updates.status = parsed.data.status;
  }

  if (parsed.data.checklist !== undefined) {
    const { data: current, error: readError } = await admin
      .from('blueprint_instances')
      .select('configuration')
      .eq('id', parsed.data.id)
      .eq('organization_id', context.organization.id)
      .maybeSingle();

    if (readError) return blueprintServerError(readError.message);
    if (!current) return NextResponse.json({ error: 'Blueprint not found.' }, { status: 404 });

    const baseConfiguration = ensureConfigurationRecord((current as { configuration?: unknown }).configuration);
    updates.configuration = {
      ...baseConfiguration,
      checklist: normalizeChecklist(parsed.data.checklist),
    };
  }

  const { data, error } = await admin
    .from('blueprint_instances')
    .update(updates)
    .eq('id', parsed.data.id)
    .eq('organization_id', context.organization.id)
    .select('id,name,status')
    .maybeSingle();

  if (error) return blueprintServerError(error.message);
  if (!data) return NextResponse.json({ error: 'Blueprint not found.' }, { status: 404 });

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const authorize = await getAuthorizedBlueprintContext();
  if (authorize.response) {
    return authorize.response;
  }
  const { context, admin } = authorize;

  if (!context || !admin) {
    return NextResponse.json({ error: 'Unable to initialize workspace context.' }, { status: 500 });
  }

  const parsed = deleteSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid blueprint delete request.' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('blueprint_instances')
    .delete()
    .eq('id', parsed.data.id)
    .eq('organization_id', context.organization.id)
    .select('id')
    .maybeSingle();

  if (error) return blueprintServerError(error.message);
  if (!data) return NextResponse.json({ error: 'Blueprint not found.' }, { status: 404 });

  return NextResponse.json(data);
}
