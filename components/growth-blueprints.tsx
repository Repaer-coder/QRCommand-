import Link from 'next/link';

export const blueprintTemplates = [
  { key: 'restaurant-revenue-loop', name: 'Restaurant Revenue Loop', audience: 'Restaurants', outcome: 'Menu to order to review to loyalty', items: ['Table-specific menus', 'Featured-item campaign', 'Review follow-up', 'Return-visit reward'] },
  { key: 'local-reputation-engine', name: 'Local Reputation Engine', audience: 'Local business', outcome: 'Visit to review to referral', items: ['Review smart link', 'Private feedback path', 'Referral prompt', 'Location comparison'] },
  { key: 'social-conversion-hub', name: 'Social Conversion Hub', audience: 'Brands and creators', outcome: 'Scan to follow to action', items: ['Social destination', 'Product spotlight', 'Offer campaign', 'Engagement tracking'] },
] as const;

export default function GrowthBlueprints() {
  return <section className="module-section"><div className="sectionhead"><div><div className="eyebrow">Premium growth systems</div><h2>Blueprints built around business outcomes</h2></div><Link className="textlink" href="/dashboard/blueprints">View all blueprints</Link></div><div className="blueprints">{blueprintTemplates.map((blueprint) => <article className="card blueprint" key={blueprint.key}><span className="pill">{blueprint.audience}</span><h3>{blueprint.name}</h3><strong>{blueprint.outcome}</strong><ul>{blueprint.items.map((item) => <li key={item}>{item}</li>)}</ul><Link className="btn secondary" href="/dashboard/blueprints">Configure blueprint</Link></article>)}</div></section>;
}
