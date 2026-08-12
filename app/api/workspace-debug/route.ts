import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/workspace';

export async function GET() {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);

  if ('error' in context) {
    return NextResponse.json({
      authenticated: context.authenticated,
      hasWorkspace: false,
      workspaceError: context.workspaceError,
      stage: context.stage,
    });
  }

  return NextResponse.json({
    authenticated: true,
    hasWorkspace: true,
    workspaceError: null,
    stage: null,
  });
}
