import Link from 'next/link';
import QRCreator from '@/components/qr-creator';
import DashboardSidebar from '@/components/dashboard-sidebar';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/workspace';

export default async function NewQR({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return null;
  const { data: locations } = await supabase.from('locations').select('id,name').eq('organization_id', context.organization.id).order('name');
  return <div className="shell"><DashboardSidebar active="library" userLabel={context.email} role={context.organization.role} workspaceName={context.organization.name} plan={context.organization.plan} /><main className="main"><div className="toprow"><div><div className="eyebrow">New permanent channel</div><h1>Create a QR campaign</h1><p className="muted">Define the business goal, destination, location, and visual treatment.</p></div><Link href="/dashboard/qr-codes" className="btn secondary">Back to library</Link></div><QRCreator locations={locations ?? []} initialType={params.type} /></main></div>;
}
