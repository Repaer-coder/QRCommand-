import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/workspace';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) redirect('/login?next=/dashboard');
  if (!context.organization.onboarding_completed_at) redirect('/onboarding');
  return children;
}
