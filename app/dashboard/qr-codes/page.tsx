import Link from 'next/link';
import DashboardSidebar from '@/components/dashboard-sidebar';
import QRLibraryActions from '@/components/qr-library-actions';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';

export default async function QRLibrary({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; status?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return null;
  let query = supabase.from('qr_codes').select('id,name,slug,qr_type,destination_url,status,scan_count,style,created_at').eq('organization_id', context.organization.id).neq('status', 'archived').order('created_at', { ascending: false });
  if (params.q) query = query.ilike('name', `%${params.q.slice(0, 80)}%`);
  if (params.type && params.type !== 'all') query = query.eq('qr_type', params.type);
  if (params.status && params.status !== 'all') query = query.eq('status', params.status);
  const { data: codes, error } = await query;
  if (error) throw new Error(error.message);
  const scans = (codes ?? []).reduce((sum, code) => sum + (code.scan_count ?? 0), 0);

  return <div className="shell"><DashboardSidebar active="library" userLabel={context.email} role={context.organization.role} workspaceName={context.organization.name} plan={context.organization.plan} /><main className="main"><div className="toprow"><div><div className="eyebrow">Campaign control center</div><h1>QR library</h1><p className="muted">Search, pause, edit, download, and retire permanent campaigns.</p></div><Link className="btn" href="/dashboard/new">New QR campaign</Link></div><div className="stats compactstats"><article className="card stat"><span>Campaigns</span><b>{codes?.length ?? 0}</b></article><article className="card stat"><span>Total scans</span><b>{scans}</b></article><article className="card stat"><span>Active</span><b>{(codes ?? []).filter((code) => code.status === 'active').length}</b></article><article className="card stat"><span>Paused</span><b>{(codes ?? []).filter((code) => code.status === 'paused').length}</b></article></div><form className="libraryfilters"><input className="input" name="q" defaultValue={params.q} placeholder="Search campaign names" /><select className="input" name="type" defaultValue={params.type ?? 'all'}><option value="all">All goals</option><option value="restaurant">Restaurant</option><option value="reviews">Reviews</option><option value="social">Social</option><option value="website">Website</option><option value="lead">Lead capture</option><option value="coupon">Coupon</option><option value="event">Event</option><option value="wifi">Wi-Fi</option></select><select className="input" name="status" defaultValue={params.status ?? 'all'}><option value="all">All statuses</option><option value="active">Active</option><option value="paused">Paused</option></select><button className="btn secondary">Filter</button></form>{!codes?.length ? <section className="card empty"><div className="emptyicon">QR</div><h2>Your library is ready</h2><p className="muted">Create a permanent campaign link. You can change its destination later without reprinting.</p><Link className="btn" href="/dashboard/new">Create first campaign</Link></section> : <section className="librarygrid">{codes.map((code) => <article className="card librarycard" key={code.id}><div className="librarytop"><div><span className="pill">{code.qr_type}</span><h3>{code.name}</h3></div><span className={`status ${code.status}`}>{code.status}</span></div><p className="destination">{code.destination_url}</p><div className="codeurl">/r/{code.slug}</div><div className="librarymetrics"><span><b>{code.scan_count ?? 0}</b> scans</span><span>Created {new Date(code.created_at).toLocaleDateString()}</span></div><QRLibraryActions {...code} canDelete={hasWorkspaceRole(context.organization.role, 'admin')} /></article>)}</section>}</main></div>;
}
