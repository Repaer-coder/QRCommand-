import Link from 'next/link';
import { blueprintTemplates } from '@/lib/blueprints';

export default function GrowthBlueprints() {
  return (
    <section className="module-section">
      <div className="sectionhead">
        <div>
          <div className="eyebrow">Premium growth systems</div>
          <h2>Blueprints built around business outcomes</h2>
        </div>
        <Link className="textlink" href="/dashboard/blueprints">
          View all blueprints
        </Link>
      </div>
      <div className="blueprints">
        {blueprintTemplates.map((blueprint) => (
          <article className="card blueprint" key={blueprint.key}>
            <span className="pill">{blueprint.industry}</span>
            <h3>{blueprint.name}</h3>
            <strong>{blueprint.outcome}</strong>
            <p className="muted">{blueprint.description}</p>
            <ul>{blueprint.items.map((item) => <li key={item}>{item}</li>)}</ul>
            <Link className="btn secondary" href="/dashboard/blueprints">
              Configure blueprint
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
