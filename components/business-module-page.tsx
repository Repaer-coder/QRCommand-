import Link from 'next/link';
import { redirect } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard-sidebar';
import { hasEntitlement } from '@/lib/plans';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/workspace';

const moduleCopy = {
  restaurant: { active: 'restaurant', eyebrow: 'Restaurant Revenue Loop', title: 'Restaurant command center', description: 'Connect menu discovery, ordering destinations, review prompts, and return-visit campaigns without claiming unverified revenue.', stages: ['Menu discovery', 'Order destination', 'Review prompt', 'Return visit'] },
  reviews: { active: 'reviews', eyebrow: 'Local Reputation Engine', title: 'Reviews and reputation', description: 'Move customers from a physical moment to a trusted review path, while keeping private feedback distinct from public reputation.', stages: ['Customer moment', 'Review destination', 'Private feedback', 'Referral follow-up'] },
  social: { active: 'social', eyebrow: 'Social Conversion Hub', title: 'Social conversion', description: 'Connect physical placement to social destinations and measure engagement without treating scans as purchases.', stages: ['Placement', 'Social destination', 'Offer or content', 'Measured engagement'] },
} as const;

export default async function BusinessModulePage({ type }: { type: keyof typeof moduleCopy }) {
  const config = moduleCopy[type];
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return null;
  if (!hasEntitlement(context.organization.plan, 'restaurant.hub')) redirect('/dashboard/billing');
  const { data: campaigns } = await supabase.from('qr_codes').select('id,name,status,scan_count,destination_url').eq('organization_id', context.organization.id).eq('qr_type', type).neq('status', 'archived').order('scan_count', { ascending: false });
  return <div className="shell"><DashboardSidebar active={config.active} userLabel={context.email} role={context.organization.role} workspaceName={context.organization.name} plan={context.organization.plan} /><main className="main"><div className="toprow"><div><div className="eyebrow">{config.eyebrow}</div><h1>{config.title}</h1><p className="muted">{config.description}</p></div><Link className="btn" href={`/dashboard/new?type=${type}`}>Create {type} campaign</Link></div><section className="journey">{config.stages.map((stage, index) => <article className="card journey-step" key={stage}><span>0{index + 1}</span><h2>{stage}</h2></article>)}</section><section className="card table-card"><div className="sectionhead"><div><h2>Live module campaigns</h2><p className="muted">Real workspace campaigns tagged for this business goal.</p></div></div>{campaigns?.length ? <div className="data-table"><div className="data-row data-head"><span>Campaign</span><span>Destination</span><span>Scans</span><span>Status</span></div>{campaigns.map((campaign) => <div className="data-row" key={campaign.id}><Link href={`/dashboard/qr-codes/${campaign.id}`}><b>{campaign.name}</b></Link><span className="truncate">{campaign.destination_url}</span><span>{campaign.scan_count ?? 0}</span><span className={`status ${campaign.status}`}>{campaign.status}</span></div>)}</div> : <div className="empty-inline"><p>No {type} campaigns yet.</p><Link className="btn" href={`/dashboard/new?type=${type}`}>Create first campaign</Link></div>}</section></main></div>;
}
