import { notFound } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard-sidebar';
import QREditor from '@/components/qr-editor';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/workspace';

export default async function EditQR({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return null;
  const [{ data: code, error }, { data: locations }] = await Promise.all([
    supabase.from('qr_codes').select('id,name,destination_url,status,slug,location_id,style').eq('id', id).eq('organization_id', context.organization.id).maybeSingle(),
    supabase.from('locations').select('id,name').eq('organization_id', context.organization.id).order('name'),
  ]);
  if (error) throw new Error(error.message);
  if (!code) notFound();
  return <div className="shell"><DashboardSidebar active="library" userLabel={context.email} role={context.organization.role} workspaceName={context.organization.name} plan={context.organization.plan} /><main className="main"><div className="toprow"><div><div className="eyebrow">Campaign editor</div><h1>Edit live campaign</h1><p className="muted">Destination updates take effect immediately while the permanent QR link stays unchanged.</p></div></div><QREditor code={code} locations={locations ?? []} /></main></div>;
}
