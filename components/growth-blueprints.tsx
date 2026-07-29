const blueprints = [
  {name:'Restaurant Revenue Loop', audience:'Restaurants', outcome:'Menu → order → review → loyalty', items:['Table-specific menu','Featured-item campaign','Google review follow-up','Return-visit reward']},
  {name:'Local Reputation Engine', audience:'Local businesses', outcome:'Visit → review → referral', items:['Review smart link','Negative-feedback intercept','Referral reward','Location analytics']},
  {name:'Social Conversion Hub', audience:'Creators & brands', outcome:'Scan → follow → purchase', items:['Smart social page','Product spotlight','Retargeting campaign','Conversion tracking']},
];
export default function GrowthBlueprints(){return <section><div className="sectionhead"><div><div className="eyebrow">Differentiated layer</div><h2>Growth Blueprints</h2></div><span className="pill">QR + BUSINESS OUTCOMES</span></div><div className="blueprints">{blueprints.map(b=><article className="card blueprint" key={b.name}><span className="pill">{b.audience}</span><h3>{b.name}</h3><strong>{b.outcome}</strong><ul>{b.items.map(i=><li key={i}>{i}</li>)}</ul><button className="btn secondary">Use blueprint</button></article>)}</div></section>}
